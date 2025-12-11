# message_app/views_send.py
import traceback
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Session, Message, MessageContent
from .serializers_send import MessageCreateSerializer
from .serializers import MessageSerializer
from .tasks import analyze_message_task, upload_message_to_telegram
from .utils_telegram import send_text_to_telegram  # still used for text-only sync

from websockets.utils import broadcast_message_created

class SendMessageAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, session_uuid):
        user = request.user
        serializer = MessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        text = data.get('text', '').strip()
        client_message_id = data.get('client_message_id', None)
        assign_self = data.get('assign_self', False)

        session = get_object_or_404(
            Session.objects.select_related('citizen', 'assigned_staff', 'assigned_department'),
            session_uuid=session_uuid
        )

        is_citizen = (session.citizen == user)
        is_staff = hasattr(user, 'staff_profile') and user.staff_profile is not None

        if not (is_citizen or is_staff):
            return Response({"detail": "Not authorized to send messages for this session"}, status=status.HTTP_403_FORBIDDEN)

        if is_citizen:
            if session.origin != 'web':
                return Response({"detail": f"Session started on {session.origin}. Use that channel."}, status=status.HTTP_403_FORBIDDEN)
            sender_platform = 'web'
            is_staff_message = False
        else:
            sender_platform = 'web'
            is_staff_message = True

        if is_staff and assign_self and session.assigned_staff is None:
            staff_dept = getattr(user.staff_profile, 'department', None)
            if session.assigned_department is None or (staff_dept and session.assigned_department == staff_dept):
                session.assigned_staff = user
                session.save()

        if client_message_id:
            existing_msg = Message.objects.filter(session=session, client_message_id=client_message_id).first()
            if existing_msg:
                out = MessageSerializer(existing_msg, context={'request': request}).data
                return Response({
                    "message": out,
                    "queued_for_analysis": False,
                    "broadcasted": False,
                    "telegram_delivery": None,
                    "note": "Duplicate message skipped"
                }, status=status.HTTP_200_OK)

        try:
            with transaction.atomic():
                msg = Message.objects.create(
                    session=session,
                    sender=user,
                    is_staff_message=is_staff_message,
                    sender_platform=sender_platform,
                    client_message_id=client_message_id
                )

                if text:
                    MessageContent.objects.create(message=msg, content_type='text', text=text)

                files = request.FILES.getlist('files') or request.FILES.getlist('file') or [file for _, file in request.FILES.items()]
                for uploaded in files:
                    ctype = 'file'
                    mime = getattr(uploaded, 'content_type', '')
                    if mime.startswith('image/'): ctype = 'image'
                    elif mime.startswith('video/'): ctype = 'video'
                    elif mime.startswith('audio/'): ctype = 'voice'
                    MessageContent.objects.create(message=msg, content_type=ctype, file=uploaded)

                # Update last_messaged and check SLA breach when staff sends a message
                if is_staff_message:
                    from django.utils import timezone
                    session.last_messaged = timezone.now()
                    session.check_sla_breach()
                    session.save()

        except Exception as exc:
            traceback.print_exc()
            return Response({"detail": "Failed to save message", "error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        queued_for_analysis = False
        broadcasted = False
        telegram_delivery = None

        if not session.assigned_department:
            queued_for_analysis = True
            try:
                analyze_message_task.delay(str(session.session_uuid), str(msg.message_uuid))
            except Exception:
                pass
        else:
            try:
                broadcast_message_created(str(session.session_uuid), msg, request=request)
                broadcasted = True
            except Exception:
                broadcasted = False

        # Offload Telegram uploads to background worker
        if session.origin == 'telegram' and is_staff:
            telegram_profile = getattr(session.citizen, 'telegram_profile', None)
            if telegram_profile and telegram_profile.telegram_chat_id:
                chat_id = telegram_profile.telegram_chat_id
                upload_message_to_telegram.delay(msg.id, chat_id)

        out = MessageSerializer(msg, context={'request': request}).data
        return Response({
            "message": out,
            "queued_for_analysis": queued_for_analysis,
            "broadcasted": broadcasted,
            "telegram_delivery": telegram_delivery
        }, status=status.HTTP_201_CREATED)
