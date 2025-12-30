from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.urls import reverse
from django.conf import settings
import requests
import os

from ai_endpoints.models import InjectionLog, AIAnalysis # Keep imports from ai_endpoints models as they are defined there
from message_app.models import Session, Message
import logging

logger = logging.getLogger(__name__)

# FastAPI microservice URL - get from settings or environment
# AI_MICROSERVICE_URL might include /api/v1, so we'll handle that
FASTAPI_BASE = getattr(settings, 'AI_MICROSERVICE_URL', os.getenv('AI_MICROSERVICE_URL', 'http://localhost:8001'))
# Remove /api/v1 suffix if present (we'll add it in the endpoint)
if FASTAPI_BASE.endswith('/api/v1'):
    FASTAPI_BASE = FASTAPI_BASE[:-7]
elif FASTAPI_BASE.endswith('/api'):
    FASTAPI_BASE = FASTAPI_BASE[:-4]

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

@api_view(['POST'])
@permission_classes([AllowAny])  # TODO: Add IP whitelist or shared secret for production
def train_correction_webhook(request):
    """
    Webhook endpoint called by FastAPI after training correction.
    Updates AIAnalysis record with correction data.
    """
    data = request.data
    logger.info(f"Train Correction Webhook Received: {data}")
    
    try:
        message_uuid = data.get('message_uuid')
        if not message_uuid:
            logger.error("Train Correction Webhook: Missing message_uuid")
            return Response(
                {"status": "error", "detail": "message_uuid is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find the Message by message_uuid
        message_obj = Message.objects.filter(message_uuid=message_uuid).first()
        if not message_obj:
            logger.error(f"Train Correction Webhook: Message {message_uuid} not found.")
            return Response(
                {"status": "error", "detail": "Message not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Find AIAnalysis by message
        ai_analysis = AIAnalysis.objects.filter(message=message_obj).first()
        if not ai_analysis:
            logger.warning(f"Train Correction Webhook: AIAnalysis not found for message {message_uuid}. Creating new record.")
            # Create new AIAnalysis if it doesn't exist
            ai_analysis = AIAnalysis.objects.create(
                session=message_obj.session,
                message=message_obj,
            )
        
        # Update correction fields
        ai_analysis.is_corrected = True
        ai_analysis.corrected_department_id = data.get('correct_department_id')
        ai_analysis.correction_notes = data.get('correction_notes')
        
        # Update corrected_by if provided
        corrected_by_uuid = data.get('corrected_by')
        if corrected_by_uuid:
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                corrected_by_user = User.objects.filter(user_uuid=corrected_by_uuid).first()
                if corrected_by_user:
                    ai_analysis.corrected_by = corrected_by_user
                else:
                    logger.warning(f"Train Correction Webhook: User {corrected_by_uuid} not found for corrected_by.")
            except Exception as e:
                logger.error(f"Train Correction Webhook: Error setting corrected_by: {e}")
        
        ai_analysis.save()
        logger.info(f"Train Correction Webhook: Updated AIAnalysis {ai_analysis.id} with correction data.")
        
        # Update session status to unassigned and route to corrected department
        session_obj = message_obj.session
        correct_department_id = data.get('correct_department_id')
        
        if session_obj and correct_department_id:
            try:
                from departments.models import Department
                department = Department.objects.get(id=correct_department_id)
                
                # Update session: set status to unassigned and assign to corrected department
                session_obj.status = 'unassigned'
                session_obj.assigned_department = department
                session_obj.assigned_staff = None  # Clear any assigned staff
                session_obj.save(update_fields=['status', 'assigned_department', 'assigned_staff'])
                logger.info(f"Train Correction Webhook: Updated session {session_obj.session_uuid} to unassigned and assigned to department {department.id}")
                
                # Call the routing webhook to properly route the session
                route_payload = {
                    "department_id": correct_department_id,
                    "session_uuid": str(session_obj.session_uuid),
                    "message_uuid": str(message_uuid),
                }
                webhook_url = request.build_absolute_uri(reverse('ai_webhook'))
                try:
                    logger.info(f"Train Correction Webhook: Calling routing webhook: {webhook_url} with payload: {route_payload}")
                    response = requests.post(webhook_url, json=route_payload, timeout=5)
                    if response.status_code == 200:
                        logger.info(f"Train Correction Webhook: Successfully routed session {session_obj.session_uuid} to department {correct_department_id}")
                        
                        # Explicitly broadcast session.created to department so staff get notifications
                        # This is needed because we updated the session before calling ai_webhook,
                        # so ai_webhook doesn't detect it as a department change
                        try:
                            from websockets.utils import broadcast_session_created
                            # Reload session to ensure we have latest data
                            session_obj.refresh_from_db()
                            broadcast_session_created(department.id, session_obj, request=request)
                            logger.info(f"Train Correction Webhook: Broadcasted session.created to department_{department.id}")
                        except Exception as broadcast_err:
                            logger.error(f"Train Correction Webhook: Failed to broadcast session.created: {broadcast_err}")
                        
                        # Send notification to citizen via Telegram (system message, not in chat)
                        if session_obj.origin == 'telegram':
                            try:
                                telegram_profile = getattr(session_obj.citizen, 'telegram_profile', None)
                                if telegram_profile and telegram_profile.telegram_chat_id:
                                    from message_app.utils_telegram import send_text_to_telegram
                                    notification_text = (
                                        "<b>✅ Murojaatingiz qayta yo'naltirildi</b>\n\n"
                                        "Sizning murojaatingiz to'g'ri bo'limga qayta yo'naltirildi. "
                                        "Tez orada xodimlar sizga javob berishadi."
                                    )
                                    send_text_to_telegram(
                                        telegram_profile.telegram_chat_id,
                                        notification_text,
                                        remove_keyboard=False
                                    )
                            except Exception as e:
                                logger.error(f"Failed to send reroute notification to Telegram: {e}")
                    else:
                        logger.error(f"Train Correction Webhook: Routing webhook returned error {response.status_code}: {response.text}")
                except requests.RequestException as req_err:
                    logger.error(f"Train Correction Webhook: Failed to call routing webhook: {req_err}")
            except Department.DoesNotExist:
                logger.error(f"Train Correction Webhook: Department {correct_department_id} not found")
            except Exception as route_err:
                logger.error(f"Train Correction Webhook: Error routing session: {route_err}")
        
    except Exception as e:
        logger.error(f"Error processing train correction webhook: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return Response(
            {"status": "error", "error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response({"status": "processed"}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])  # Require authentication for training
def train_correction(request):
    """
    Django endpoint that proxies training correction requests to FastAPI.
    This keeps FastAPI internal and secure.
    """
    data = request.data
    logger.info(f"Train Correction Request Received: {data}")
    
    try:
        # Validate required fields
        if not all([data.get('text'), data.get('correct_department_id'), data.get('message_uuid')]):
            return Response(
                {"status": "error", "detail": "Missing required fields: text, correct_department_id, message_uuid"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get user UUID for corrected_by if authenticated
        corrected_by_uuid = None
        if request.user and hasattr(request.user, 'user_uuid'):
            corrected_by_uuid = str(request.user.user_uuid)
        
        # Prepare payload for FastAPI
        fastapi_payload = {
            "text": data.get('text'),
            "correct_department_id": data.get('correct_department_id'),
            "message_uuid": data.get('message_uuid'),
            "language": data.get('language'),  # Optional, will be auto-detected
            "correction_notes": data.get('correction_notes'),  # Optional
        }
        
        if corrected_by_uuid:
            fastapi_payload["corrected_by"] = corrected_by_uuid
        
        # Call FastAPI endpoint
        fastapi_url = f"{FASTAPI_BASE}/api/v1/train-correction"
        logger.info(f"Calling FastAPI: {fastapi_url} with payload keys: {list(fastapi_payload.keys())}")
        
        try:
            response = requests.post(
                fastapi_url,
                json=fastapi_payload,
                timeout=30.0  # Training might take longer
            )
            
            if response.status_code == 200:
                logger.info(f"FastAPI train-correction succeeded")
                return Response(
                    {"status": "success"},
                    status=status.HTTP_200_OK
                )
            else:
                logger.error(f"FastAPI returned error {response.status_code}: {response.text}")
                return Response(
                    {"status": "error", "detail": f"FastAPI error: {response.status_code}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except requests.RequestException as e:
            logger.error(f"Failed to connect to FastAPI: {e}")
            return Response(
                {"status": "error", "detail": f"Failed to connect to AI service: {str(e)}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
            
    except Exception as e:
        logger.error(f"Error processing train correction request: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return Response(
            {"status": "error", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
