# message_app/tasks.py
from celery import shared_task
import requests
from django.conf import settings

@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def analyze_message_task(self, session_uuid: str, message_uuid: str):
    """
    Sends the message to AI microservice for analysis and routing.
    """
    try:
        payload = {
            "session_uuid": session_uuid,
            "message_uuid": message_uuid
        }

        # AI Microservice endpoint
        ai_endpoint = settings.AI_MICROSERVICE_URL + "/analyze"

        resp = requests.post(ai_endpoint, json=payload, timeout=10)
        resp.raise_for_status()

        # The AI microservice will call your webhook / route_message after processing
        return resp.json()

    except requests.RequestException as exc:
        # retry automatically if transient network errors
        raise self.retry(exc=exc)







# message_app/tasks.py
from celery import shared_task
from .models import MessageContent
from .serializers import MessageSerializer
from .utils_telegram import send_file_to_telegram
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

@shared_task(bind=True, name="upload_message_to_telegram")
def upload_message_to_telegram(self, message_id, chat_id=None):
    from .models import Message  # Import Message here to avoid circular dependencies if any
    try:
        message = Message.objects.get(id=message_id)
        session = message.session
        
        # Determine chat_id if not provided
        if not chat_id:
            telegram_profile = getattr(session.citizen, 'telegram_profile', None)
            if telegram_profile:
                chat_id = telegram_profile.telegram_chat_id
        
        if not chat_id:
             return {"status": "failed", "error": "No chat_id provided or found"}

        responses = []
        # Iterate over contents
        for content in message.contents.all():
            if content.file and not content.telegram_file_id:
                # Send file
                try:
                    resp = send_file_to_telegram(chat_id, content.file, content.content_type)
                    responses.append(resp)
                    
                    if resp.get('ok') and resp.get('result'):
                        result = resp['result']
                        file_id = None
                        if result.get('photo'):
                            file_id = result['photo'][-1]['file_id']
                        elif result.get('document'):
                            file_id = result.get('document', {}).get('file_id')
                        elif result.get('video'):
                            file_id = result.get('video', {}).get('file_id')
                        elif result.get('voice'):
                            file_id = result.get('voice', {}).get('file_id')

                        if file_id:
                            content.telegram_file_id = file_id
                            content.save(update_fields=['telegram_file_id'])
                except Exception as inner_e:
                    responses.append({"error": str(inner_e)})

        # Broadcast update via websocket
        layer = get_channel_layer()
        serializer = MessageSerializer(message, context={'request': None})
        async_to_sync(layer.group_send)(
            f"chat_{session.session_uuid}",
            {"type": "chat.message_update", "message": serializer.data}
        )

        return {"status": "sent", "responses": responses}
    except Exception as e:
        return {"status": "failed", "error": str(e)}
