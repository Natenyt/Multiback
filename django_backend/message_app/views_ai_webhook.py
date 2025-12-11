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
        # Validate webhook request
        if not validate_webhook_request(request):
            return Response(
                {"error": "Unauthorized"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        data = request.data
        session_uuid = data.get("session_uuid")
        department_id = data.get("department_id")
        message_uuid = data.get("message_uuid")
        
        # Validate required fields
        if not all([session_uuid, department_id, message_uuid]):
            return Response(
                {"error": "Missing required fields: session_uuid, department_id, message_uuid"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            session = Session.objects.get(session_uuid=session_uuid)
            department = Department.objects.get(id=department_id)

            # Update session assignment
            session.assigned_department = department
            session.status = "assigned"
            session.save()

            # Notify department dashboard
            broadcast_session_created(department.id, session)

            # Broadcast the message to citizen/staff if needed
            message = Message.objects.get(message_uuid=message_uuid)
            broadcast_message_created(session_uuid, message)

            return Response({"status": "success"}, status=status.HTTP_200_OK)

        except Session.DoesNotExist:
            return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)
        except Department.DoesNotExist:
            return Response({"error": "Department not found"}, status=status.HTTP_404_NOT_FOUND)
        except Message.DoesNotExist:
            return Response({"error": "Message not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
