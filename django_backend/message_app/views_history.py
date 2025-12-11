# message_app/views_history.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Prefetch, Q
from django.utils import timezone
from .models import Session, Message, MessageContent
from .serializers import SessionSerializer, MessageSerializer
from .pagination import MessageCursorPagination

class TicketHistoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_uuid):
        user = request.user

        # 1) Load session with related fields
        session = get_object_or_404(
            Session.objects.select_related('citizen', 'assigned_staff', 'assigned_department'),
            session_uuid=session_uuid
        )

        # 2) Permission checks:
        # Citizen can only view their session; staff allowed per department/assignment.
        if not self._has_access(user, session):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        # 3) Build base messages queryset (newest first for pagination)
        messages_qs = Message.objects.filter(session=session).select_related('sender').prefetch_related(
            Prefetch('contents', queryset=MessageContent.objects.order_by('created_at'))
        ).order_by('-created_at')

        # 4) If the requester is the citizen, restrict messages to:
        #    - messages that come from the session origin (sender_platform == origin)
        #    - OR staff messages (so citizen will see staff replies)
        if session.citizen == user:
            origin = session.origin
            messages_qs = messages_qs.filter(
                Q(sender_platform=origin) | Q(is_staff_message=True)
            )

        # 5) Paginate (cursor-based)
        paginator = MessageCursorPagination()
        page = paginator.paginate_queryset(messages_qs, request, view=self)
        serializer = MessageSerializer(page, many=True, context={'request': request})

        # 6) Reverse to chronological order (old -> new)
        messages_list = list(reversed(serializer.data))

        # 7) On-demand SLA breach check for real-time accuracy
        if session.sla_deadline:
            session.check_sla_breach()
            session.save(update_fields=['sla_breached'])

        # 8) Session metadata
        session_data = SessionSerializer(session, context={'request': request}).data

        # 9) Build response
        response = {
            "session": session_data,
            "messages": messages_list,
            "next": paginator.get_next_link(),
            "has_more": paginator.get_next_link() is not None
        }

        return Response(response)

    def _has_access(self, user, session):
        # owner
        if session.citizen == user:
            return True

        # Escalated sessions: only accessible to superusers and the citizen
        if session.status == 'escalated':
            if hasattr(user, 'is_superuser') and user.is_superuser:
                return True
            return False

        # staff?
        if hasattr(user, 'staff_profile') and user.staff_profile:
            staff_dept = getattr(user.staff_profile, 'department', None)
            # assigned staff
            if session.assigned_staff == user:
                return True
            # department allowed (covers unassigned + department sessions)
            if session.assigned_department and staff_dept and session.assigned_department == staff_dept:
                return True

        return False



class MarkReadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_uuid):
        user = request.user
        session = get_object_or_404(Session, session_uuid=session_uuid)

        if not TicketHistoryAPIView()._has_access(user, session):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        # Client should provide last_message_uuid or list of uuids to mark
        # We'll accept "until_message_uuid" to mark all messages up to that timestamp as read for this user
        until_uuid = request.data.get('until_message_uuid')
        if until_uuid:
            try:
                until_msg = Message.objects.get(message_uuid=until_uuid, session=session)
            except Message.DoesNotExist:
                return Response({"detail": "Message not found"}, status=status.HTTP_400_BAD_REQUEST)
            # Mark messages newer or equal to oldest? We mark all messages <= until_msg.created_at that are not yet read
            to_update = Message.objects.filter(
                session=session,
                created_at__lte=until_msg.created_at
            ).exclude(read_at__isnull=False)
            now = timezone.now()
            to_update.update(read_at=now)
            return Response({"status": "ok", "marked_count": to_update.count(), "read_at": now})

        # Otherwise, mark all messages in session as read
        now = timezone.now()
        updated = Message.objects.filter(session=session, read_at__isnull=True).update(read_at=now)
        return Response({"status": "ok", "marked_count": updated, "read_at": now})
