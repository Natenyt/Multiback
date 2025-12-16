# message_app/views_ai_webhook.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.conf import settings
from django.core.exceptions import ValidationError
from .models import Session, Message
from departments.models import Department
from websockets.utils import broadcast_message_created, broadcast_session_created
import logging

logger = logging.getLogger(__name__)


def validate_webhook_request(request):
    """
    Validate webhook request by checking shared secret or IP whitelist.
    For now, allows localhost/internal network. In production, use proper auth.
    """
    # Check for shared secret in header (if configured)
    shared_secret = getattr(settings, 'AI_WEBHOOK_SECRET', None)
    if shared_secret:
        provided_secret = request.headers.get('X-Webhook-Secret', '')
        if provided_secret != shared_secret:
            return False
    
    # Allow localhost/internal network (for development)
    # In production, implement proper IP whitelist
    client_ip = request.META.get('REMOTE_ADDR', '')
    allowed_ips = getattr(settings, 'AI_WEBHOOK_ALLOWED_IPS', ['127.0.0.1', 'localhost'])
    
    if client_ip not in allowed_ips and not settings.DEBUG:
        logger.warning(f"Webhook request from unauthorized IP: {client_ip}")
        return False
    
    return True


class AIWebhookView(APIView):
    """
    Called by AI microservice after selecting the department.
    Payload: { session_uuid, department_id, message_uuid }
    
    Security: Validates request origin via IP whitelist or shared secret.
    """
    permission_classes = [AllowAny]  # Permission checked in post() method
    
    def post(self, request):
        # Validate webhook request - but allow in DEBUG mode or if from internal Django call
        # When called from routing_result view, it's internal, so we should allow it
        client_ip = request.META.get('REMOTE_ADDR', '')
        if not settings.DEBUG:
            if not validate_webhook_request(request):
                logger.warning(f"Webhook request from unauthorized IP: {client_ip}")
                return Response(
                    {"error": "Unauthorized"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        data = request.data
        session_uuid = data.get("session_uuid")
        department_id = data.get("department_id")
        message_uuid = data.get("message_uuid")
        intent_label = data.get("intent_label")
        
        logger.info(f"AI Webhook called: session_uuid={session_uuid}, department_id={department_id}, message_uuid={message_uuid}")
        
        # Validate required fields (intent_label is optional)
        if not all([session_uuid, department_id, message_uuid]):
            logger.error(f"Missing required fields: session_uuid={session_uuid}, department_id={department_id}, message_uuid={message_uuid}")
            return Response(
                {"error": "Missing required fields: session_uuid, department_id, message_uuid"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # intent_label is optional - use None if not provided
        if not intent_label:
            logger.info(f"intent_label not provided, will be ignored")

        try:
            # Get session
            try:
                session = Session.objects.get(session_uuid=session_uuid)
            except Session.DoesNotExist:
                logger.error(f"Session not found: {session_uuid}")
                return Response({"error": f"Session not found: {session_uuid}"}, status=status.HTTP_404_NOT_FOUND)
            
            # Get department - handle both string and integer IDs
            try:
                # Convert to int if it's a string
                if isinstance(department_id, str):
                    try:
                        department_id = int(department_id)
                    except ValueError:
                        # If it's not a number, try UUID lookup
                        pass
                department = Department.objects.get(id=department_id)
                logger.info(f"Found department: {department.id} - {department.name_uz or department.name_ru}")
            except Department.DoesNotExist:
                logger.error(f"Department not found: {department_id}")
                return Response({"error": f"Department not found: {department_id}"}, status=status.HTTP_404_NOT_FOUND)
            except Exception as dept_error:
                logger.error(f"Error getting department {department_id}: {dept_error}")
                return Response({"error": f"Invalid department_id: {department_id}"}, status=status.HTTP_400_BAD_REQUEST)

            # Get message with all relationships for proper serialization
            try:
                message = Message.objects.select_related(
                    'session',
                    'sender',
                    'session__citizen',
                    'session__assigned_staff',
                    'session__assigned_department'
                ).prefetch_related(
                    'contents'
                ).get(message_uuid=message_uuid)
            except Message.DoesNotExist:
                logger.error(f"Message not found: {message_uuid}")
                return Response({"error": f"Message not found: {message_uuid}"}, status=status.HTTP_404_NOT_FOUND)

            # Update session assignment and intent_label (if provided)
            old_department = session.assigned_department
            department_changed = (old_department is None or old_department.id != department.id)
            
            # Only update session if department actually changed (new routing)
            # If department is already assigned (citizen message in active session), don't touch the session at all
            if department_changed:
                # New routing - update department and set status to unassigned
                session.assigned_department = department
                session.status = "unassigned"
                
                # Update intent_label if provided
                if intent_label:
                    session.intent_label = intent_label
                
                # Save only the fields we're updating
                update_fields = ['assigned_department', 'status']
                if intent_label:
                    update_fields.append('intent_label')
                session.save(update_fields=update_fields)
                
                logger.info(f"Session {session_uuid} routed to department {department.id} (was: {old_department.id if old_department else 'None'})")
            else:
                # Department already assigned - this is just routing a message
                # Only update intent_label if provided (and different), but DON'T touch status
                if intent_label and session.intent_label != intent_label:
                    session.intent_label = intent_label
                    session.save(update_fields=['intent_label'])
                    logger.info(f"Updated intent_label for session {session_uuid} to {intent_label}")
                else:
                    # DO NOT update session - just broadcast the message
                    logger.info(f"Session {session_uuid} already has department {department.id} - routing message only, not updating session")
            
            # Reload message with all relationships to ensure proper serialization
            # We need to reload it because session might have been updated
            message = Message.objects.select_related(
                'session',
                'sender',
                'session__citizen',
                'session__assigned_staff',
                'session__assigned_department'
            ).prefetch_related(
                'contents'
            ).get(message_uuid=message_uuid)

            # Notify department dashboard only if department changed
            if department_changed:
                try:
                    broadcast_session_created(department.id, session)
                    logger.info(f"Broadcasted session creation to department_{department.id}")
                except Exception as broadcast_error:
                    logger.warning(f"Failed to broadcast session creation: {broadcast_error}")

            # ALWAYS broadcast the message to chat group (so staff can see citizen messages)
            # This is critical for citizen messages from Telegram to appear in staff dashboard
            try:
                # Broadcast with request=None (we're in a webhook, no request context)
                broadcast_message_created(str(session_uuid), message, request=None)
                logger.info(f"Successfully broadcasted message {message_uuid} to chat_{str(session_uuid)} group")
            except Exception as broadcast_error:
                logger.error(f"Failed to broadcast message: {broadcast_error}", exc_info=True)
                # Don't fail the request, but log the error

            logger.info(f"Successfully routed message {message_uuid} for session {session_uuid} to department {department.id}")
            return Response({
                "status": "success",
                "session_uuid": str(session_uuid),
                "department_id": department.id,
                "department_name": department.name_uz or department.name_ru
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Unexpected error in AI webhook: {e}", exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
