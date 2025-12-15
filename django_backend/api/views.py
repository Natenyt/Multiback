from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.urls import reverse
import requests

from ai_endpoints.models import InjectionLog, AIAnalysis # Keep imports from ai_endpoints models as they are defined there
from message_app.models import Session, Message
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])  # TODO: Add IP whitelist or shared secret for production
def injection_alert(request):
    data = request.data
    logger.warning(f"Injection Detected: {data}")
    
    try:
        # Fetch related message. If not found, we can't link it strictly, 
        # but we should handle it. For now, strict link.
        message_ref = Message.objects.filter(message_uuid=data.get('message_uuid')).first()
        
        if message_ref:
            InjectionLog.objects.create(
                message=message_ref,
                risk_score=data.get('risk_score', 0.0),
                is_injection=True
            )
            logger.warning(f"!!! INJECTION ALERT !!! {data}")
        else:
            logger.error(f"Injection Alert: Message {data.get('message_uuid')} not found.")
            
    except Exception as e:
        logger.error(f"Error saving injection log: {e}")
        
    return Response({"status": "received"}, status=status.HTTP_200_OK)

from departments.models import Department

@api_view(['POST'])
@permission_classes([AllowAny])  # TODO: Add IP whitelist or shared secret for production
def routing_result(request):
    data = request.data
    logger.info(f"Routing Result Received: {data}")
    
    try:
        session_uuid = data.get('session_uuid')
        message_uuid = data.get('message_uuid')
        
        session_obj = Session.objects.filter(session_uuid=session_uuid).first()
        message_obj = Message.objects.filter(message_uuid=message_uuid).first()
        
        if not session_obj or not message_obj:
            logger.error(f"Routing Result Error: Session {session_uuid} or Message {message_uuid} not found.")
            return Response({"status": "error", "detail": "Session or Message not found"}, status=status.HTTP_404_NOT_FOUND)

        # Fetch Department Name dynamically
        dept_id = data.get('suggested_department_id')
        lang = data.get('language_detected', 'uz')
        dept_name = data.get('suggested_department_name') # Default to what AI sent, or override
        
        if dept_id:
            try:
                dept = Department.objects.get(id=dept_id)
                if lang == 'ru':
                    dept_name = dept.name_ru or dept.name_uz
                else:
                    dept_name = dept.name_uz or dept.name_ru
            except Department.DoesNotExist:
                logger.warning(f"Department ID {dept_id} not found in DB.")

        AIAnalysis.objects.create(
            session=session_obj,
            message=message_obj,
            intent_label=data.get('intent_label'),
            suggested_department_id=dept_id,
            suggested_department_name=dept_name,
            confidence_score=data.get('confidence_score'),
            reason=data.get('reason'),
            vector_search_results=data.get('vector_search_results'),
            language_detected=data.get('language_detected'),
            embedding_tokens=data.get('embedding_tokens', 0), # safely get tokens
            prompt_tokens=data.get('prompt_tokens', 0), # safely get tokens
            total_tokens=data.get('total_tokens', 0),
            processing_time_ms=data.get('processing_time_ms', 0)
        )
        
        # Save intent_label to session
        intent_label = data.get('intent_label')
        if intent_label and session_obj:
            session_obj.intent_label = intent_label
            session_obj.save(update_fields=['intent_label'])
            logger.info(f"Saved intent_label '{intent_label}' to session {session_uuid}")
        
        # Call routing function to assign session to department
        if dept_id:
            route_payload = {
                "department_id": dept_id,
                "session_uuid": str(session_uuid),
                "message_uuid": str(message_uuid),
                "intent_label": intent_label,  # Pass intent_label to webhook
            }
            webhook_url = request.build_absolute_uri(reverse('ai_webhook'))
            try:
                logger.info(f"Calling routing webhook: {webhook_url} with payload: {route_payload}")
                response = requests.post(webhook_url, json=route_payload, timeout=5)
                if response.status_code == 200:
                    logger.info(f"Successfully routed session {session_uuid} to department {dept_id}")
                else:
                    logger.error(f"Routing webhook returned error {response.status_code}: {response.text}")
            except requests.RequestException as req_err:
                logger.error(f"Failed to call AI webhook: {req_err}")
        
    except Exception as e:
        logger.error(f"Error processing routing result: {e}")
        return Response(
            {"status": "error", "error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response({"status": "processed"}, status=status.HTTP_200_OK)
