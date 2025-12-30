# message_app/views_actions.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
import logging

from .models import Session
from .serializers import SessionSerializer
from departments.models import StaffDailyPerformance
from django.db.models import F
from websockets.utils import (
    broadcast_session_assigned, 
    broadcast_session_hold,
    broadcast_session_escalated_to_superuser,
    broadcast_session_escalated_to_citizen,
    broadcast_session_closed_to_department,
    broadcast_session_closed_to_citizen
)

logger = logging.getLogger(__name__)


class TicketAssignAPIView(APIView):
    """
    POST /api/tickets/{session_uuid}/assign/
    
    Assigns a ticket to the current authenticated staff user.
    Changes status to 'assigned' and sets assigned_staff to current_user.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, session_uuid):
        user = request.user

        # 1. Verify user is staff
        if not hasattr(user, 'staff_profile') or not user.staff_profile:
            return Response(
                {"detail": "Only staff members can assign tickets"},
                status=status.HTTP_403_FORBIDDEN
            )

        staff_profile = user.staff_profile
        staff_dept = getattr(staff_profile, 'department', None)

        # 2. Load session with related fields
        session = get_object_or_404(
            Session.objects.select_related('citizen', 'assigned_staff', 'assigned_department'),
            session_uuid=session_uuid
        )

        # 3. Check if session is already assigned to the current user
        if session.assigned_staff == user and session.status == 'assigned':
            return Response(
                {"detail": "This ticket is already assigned to you"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Check if session is already assigned to someone else
        if session.assigned_staff is not None and session.assigned_staff != user:
            return Response(
                {"detail": "This ticket is already assigned to another staff member"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 5. Check if session is closed
        if session.status == 'closed':
            return Response(
                {"detail": "Cannot assign a closed ticket"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 6. Verify department access (if session has assigned_department)
        if session.assigned_department:
            if staff_dept is None or session.assigned_department != staff_dept:
                return Response(
                    {"detail": "You can only assign tickets from your department"},
                    status=status.HTTP_403_FORBIDDEN
                )
        # If session is unassigned (no department), allow any staff to assign
        # (This might need adjustment based on your business logic)

        # 7. Assign the ticket
        try:
            with transaction.atomic():
                session.assigned_staff = user
                session.status = 'assigned'
                session.assigned_at = timezone.now()
                
                # Initialize SLA deadline ONLY when staff assigns themselves (HARD RULE)
                if session.sla_deadline is None:
                    session.sla_deadline = timezone.now() + timedelta(days=settings.SLA_THRESHOLD_DAYS)
                
                session.save()

                # 8. Remove keyboard from Telegram if session originated from Telegram
                if session.origin == 'telegram':
                    try:
                        telegram_profile = getattr(session.citizen, 'telegram_profile', None)
                        if telegram_profile and telegram_profile.telegram_chat_id:
                            from message_app.utils_telegram import send_text_to_telegram
                            staff_full_name = user.full_name or "Xodim"
                            notification_text = (
                                f"<b>✅ Javobgar xodim {staff_full_name} siz bilan bog'landi!</b>\n\n"
                                "<b>Xodim sizning murojaatingizga javob berishni boshladi. Endi siz bevosita xabar yuborishingiz mumkin, qo'shimcha tugmalarni bosmang!</b>"
                            )
                            send_text_to_telegram(
                                telegram_profile.telegram_chat_id,
                                notification_text,
                                remove_keyboard=True
                            )
                    except Exception as e:
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.error(f"Failed to remove keyboard when session assigned: {e}")

                # 9. Broadcast update to department dashboard
                if session.assigned_department:
                    broadcast_session_assigned(session.assigned_department.id, session, request=request)

                # 10. Return updated session data
                serializer = SessionSerializer(session, context={'request': request})
                return Response({
                    "status": "assigned",
                    "session": serializer.data,
                    "message": f"Ticket assigned to {user.full_name}"
                }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"detail": "Failed to assign ticket", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TicketHoldAPIView(APIView):
    """
    POST /api/tickets/{session_uuid}/hold/
    
    Puts a session on hold by extending the SLA deadline.
    Does NOT change session status - only extends sla_deadline and sets is_hold = True.
    Only one hold per session is allowed.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, session_uuid):
        user = request.user

        # 1. Verify user is staff
        if not hasattr(user, 'staff_profile') or not user.staff_profile:
            return Response(
                {"detail": "Only staff members can put tickets on hold"},
                status=status.HTTP_403_FORBIDDEN
            )

        staff_profile = user.staff_profile
        staff_dept = getattr(staff_profile, 'department', None)

        # 2. Load session with row-level lock for concurrency protection
        try:
            with transaction.atomic():
                session = Session.objects.select_for_update().select_related(
                    'citizen', 'assigned_staff', 'assigned_department'
                ).get(session_uuid=session_uuid)

                # 3. Check if hold has already been used
                if session.is_hold:
                    return Response(
                        {"detail": "Hold has already been used for this session. You have reached your hold limit."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # 4. Check if session is closed
                if session.status == 'closed':
                    return Response(
                        {"detail": "Cannot put a closed ticket on hold"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # 5. Verify staff has access to session
                if session.assigned_department:
                    if staff_dept is None or session.assigned_department != staff_dept:
                        return Response(
                            {"detail": "You can only put tickets from your department on hold"},
                            status=status.HTTP_403_FORBIDDEN
                        )

                # 6. Check if session has SLA deadline (must be assigned to staff first)
                if session.sla_deadline is None:
                    return Response(
                        {"detail": "Session must be assigned to staff before it can be put on hold"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # 7. Extend SLA deadline and set hold flag
                # IMPORTANT: Do NOT change session status - only update hold-related fields
                session.sla_deadline = session.sla_deadline + timedelta(days=settings.HOLD_EXTENSION_DAYS)
                session.is_hold = True
                # Explicitly update only the fields we want to change
                # Using update_fields prevents any accidental status changes
                session.save(update_fields=['sla_deadline', 'is_hold'])

                # 8. Optional: Broadcast hold event to department dashboard
                if session.assigned_department:
                    broadcast_session_hold(session.assigned_department.id, session, request=request)

                # 9. Return updated session data
                serializer = SessionSerializer(session, context={'request': request})
                return Response({
                    "status": "hold_applied",
                    "session": serializer.data,
                    "message": f"SLA deadline extended by {settings.HOLD_EXTENSION_DAYS} day(s)"
                }, status=status.HTTP_200_OK)

        except Session.DoesNotExist:
            return Response(
                {"detail": "Session not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": "Failed to put ticket on hold", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TicketEscalateAPIView(APIView):
    """
    POST /api/tickets/{session_uuid}/escalate/
    
    Escalates a session to superuser review.
    Changes status to 'escalated', removes assigned_staff, deactivates SLA deadline.
    Broadcasts to superuser dashboard and citizen chat.
    Can be called even when assigned_staff is None (pre-assignment escalation).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, session_uuid):
        user = request.user

        # 1. Verify user is staff
        if not hasattr(user, 'staff_profile') or not user.staff_profile:
            return Response(
                {"detail": "Only staff members can escalate tickets"},
                status=status.HTTP_403_FORBIDDEN
            )

        staff_profile = user.staff_profile
        staff_dept = getattr(staff_profile, 'department', None)

        # 2. Load session with related fields
        session = get_object_or_404(
            Session.objects.select_related('citizen', 'assigned_staff', 'assigned_department'),
            session_uuid=session_uuid
        )

        # 3. Check if session is closed
        if session.status == 'closed':
            return Response(
                {"detail": "Cannot escalate a closed ticket"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Verify staff has access to session
        # Staff can escalate if:
        # - They are assigned to the session, OR
        # - The session belongs to their department
        has_access = False
        
        if session.assigned_staff == user:
            has_access = True
        elif session.assigned_department and staff_dept and session.assigned_department == staff_dept:
            has_access = True
        
        if not has_access:
            return Response(
                {"detail": "You can only escalate tickets from your department or tickets assigned to you"},
                status=status.HTTP_403_FORBIDDEN
            )

        # 5. Escalate the session
        try:
            with transaction.atomic():
                # Set status to escalated
                session.status = 'escalated'
                
                # Remove assigned staff (even if it was already None)
                session.assigned_staff = None
                
                # Remove assigned department when escalating
                session.assigned_department = None
                
                # Deactivate SLA deadline
                session.sla_deadline = None
                
                session.save()

                # 6. Broadcast to superuser dashboard
                broadcast_session_escalated_to_superuser(session, request=request)

                # 7. Broadcast to citizen chat
                broadcast_session_escalated_to_citizen(session.session_uuid, session_obj=session, request=request)

                # 8. Send notification to citizen via Telegram (system message, not in chat)
                if session.origin == 'telegram':
                    try:
                        telegram_profile = getattr(session.citizen, 'telegram_profile', None)
                        if telegram_profile and telegram_profile.telegram_chat_id:
                            from message_app.utils_telegram import send_text_to_telegram
                            notification_text = (
                                "<b>ℹ️ Murojaatingiz qayta ko'rib chiqilmoqda</b>\n\n"
                                "Sizning murojaatingiz to'g'ri bo'limga yo'naltirilmoqda. "
                                "Iltimos, kuting. Tez orada sizga javob beriladi."
                            )
                            send_text_to_telegram(
                                telegram_profile.telegram_chat_id,
                                notification_text,
                                remove_keyboard=False
                            )
                    except Exception as e:
                        logger.error(f"Failed to send escalation notification to Telegram: {e}")

                # 9. Return updated session data
                serializer = SessionSerializer(session, context={'request': request})
                return Response({
                    "status": "escalated",
                    "session": serializer.data,
                    "message": "Ticket escalated to supervisor for review"
                }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"detail": "Failed to escalate ticket", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TicketCloseAPIView(APIView):
    """
    POST /api/tickets/{session_uuid}/close/
    
    Closes a session.
    Changes status to 'closed', sets closed_at timestamp.
    Updates StaffDailyPerformance.tickets_solved counter.
    Updates personal_best_record if new daily count exceeds it.
    Only assigned staff can close their assigned sessions.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, session_uuid):
        user = request.user

        # 1. Verify user is staff
        if not hasattr(user, 'staff_profile') or not user.staff_profile:
            return Response(
                {"detail": "Only staff members can close tickets"},
                status=status.HTTP_403_FORBIDDEN
            )

        staff_profile = user.staff_profile

        # 2. Load session with related fields
        session = get_object_or_404(
            Session.objects.select_related('citizen', 'assigned_staff', 'assigned_department'),
            session_uuid=session_uuid
        )

        # 3. Check if session is already closed
        if session.status == 'closed':
            return Response(
                {"detail": "This ticket is already closed"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Only assigned staff can close (HARD RULE)
        if session.assigned_staff != user:
            return Response(
                {"detail": "Only the assigned staff member can close this ticket"},
                status=status.HTTP_403_FORBIDDEN
            )

        # 5. Close the session and update performance metrics
        try:
            with transaction.atomic():
                # Set status to closed and closed_at timestamp
                session.status = 'closed'
                session.closed_at = timezone.now()
                session.save()

                # 6. Update StaffDailyPerformance
                today = timezone.now().date()
                daily_perf, created = StaffDailyPerformance.objects.get_or_create(
                    staff=user,
                    date=today,
                    defaults={'tickets_solved': 0}
                )

                # Increment tickets_solved atomically using update()
                StaffDailyPerformance.objects.filter(
                    id=daily_perf.id
                ).update(tickets_solved=F('tickets_solved') + 1)

                # Refresh to get updated value
                daily_perf.refresh_from_db()

                # 7. Update personal_best_record if needed
                if daily_perf.tickets_solved > staff_profile.personal_best_record:
                    staff_profile.personal_best_record = daily_perf.tickets_solved
                    staff_profile.save(update_fields=['personal_best_record'])

                # 8. Broadcast to department dashboard
                if session.assigned_department:
                    broadcast_session_closed_to_department(
                        session.assigned_department.id, 
                        session, 
                        request=request
                    )

                # 9. Broadcast to citizen chat
                broadcast_session_closed_to_citizen(
                    session.session_uuid, 
                    session_obj=session, 
                    request=request
                )

                # 10. Restore keyboard in Telegram if session originated from Telegram
                if session.origin == 'telegram':
                    try:
                        telegram_profile = getattr(session.citizen, 'telegram_profile', None)
                        if telegram_profile and telegram_profile.telegram_chat_id:
                            from message_app.utils_telegram import send_text_to_telegram, get_main_menu_keyboard_json
                            lang = telegram_profile.language_preference or 'uz'
                            keyboard = get_main_menu_keyboard_json(lang)
                            notification_text = (
                                "<b>✅ Murojaatingiz yakunlandi.</b>\n\n"
                                "Xodim sizning murojaatingizni yopdi. Yangi murojaat yuborish uchun 'Yangi xabar yuborish' tugmasini bosing.\n\n"
                                "Agar tugmalar ko'rinmasa, /start buyrug'ini yuboring."
                            )
                            send_text_to_telegram(
                                telegram_profile.telegram_chat_id,
                                notification_text,
                                keyboard_markup=keyboard
                            )
                    except Exception as e:
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.error(f"Failed to restore keyboard when session closed: {e}")

                # 11. Return updated session data
                serializer = SessionSerializer(session, context={'request': request})
                return Response({
                    "status": "closed",
                    "session": serializer.data,
                    "message": "Ticket closed successfully"
                }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"detail": "Failed to close ticket", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TicketDescriptionUpdateAPIView(APIView):
    """
    PATCH /api/tickets/{session_uuid}/description/
    
    Updates the description field of a session.
    Only assigned staff can update description.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, session_uuid):
        user = request.user

        # 1. Verify user is staff
        if not hasattr(user, 'staff_profile') or not user.staff_profile:
            return Response(
                {"detail": "Only staff members can update description"},
                status=status.HTTP_403_FORBIDDEN
            )

        # 2. Load session
        session = get_object_or_404(
            Session.objects.select_related('citizen', 'assigned_staff', 'assigned_department'),
            session_uuid=session_uuid
        )

        # 3. Verify staff has access (assigned staff or department member)
        has_access = False
        if session.assigned_staff == user:
            has_access = True
        elif session.assigned_department:
            staff_dept = getattr(user.staff_profile, 'department', None)
            if staff_dept and session.assigned_department == staff_dept:
                has_access = True
        
        if not has_access:
            return Response(
                {"detail": "You can only update description for tickets from your department or tickets assigned to you"},
                status=status.HTTP_403_FORBIDDEN
            )

        # 4. Update description
        description = request.data.get('description', '')
        try:
            session.description = description
            session.save(update_fields=['description'])

            # 5. Return updated session data
            serializer = SessionSerializer(session, context={'request': request})
            return Response({
                "status": "updated",
                "session": serializer.data,
                "message": "Description updated successfully"
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"detail": "Failed to update description", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

