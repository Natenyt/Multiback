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
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        message = Message.objects.get(id=message_id)
        session = message.session
        
        logger.info(f"Uploading message {message_id} to Telegram for session {session.session_uuid}")
        
        # Determine chat_id if not provided
        if not chat_id:
            telegram_profile = getattr(session.citizen, 'telegram_profile', None)
            if telegram_profile:
                chat_id = telegram_profile.telegram_chat_id
        
        if not chat_id:
            error_msg = "No chat_id provided or found"
            logger.error(f"Failed to upload message {message_id}: {error_msg}")
            return {"status": "failed", "error": error_msg}

        # Get text content (if any) to use as caption
        text_content = message.contents.filter(content_type='text').first()
        text_to_send = text_content.text if text_content else None
        
        # Get all file contents - verify file actually exists
        file_contents = []
        for c in message.contents.all():
            if c.content_type != 'text' and c.file and not c.telegram_file_id:
                # Verify file actually exists
                try:
                    if hasattr(c.file, 'path'):
                        import os
                        if os.path.exists(c.file.path):
                            file_contents.append(c)
                        else:
                            logger.warning(f"File path does not exist: {c.file.path} for content {c.id}")
                    elif hasattr(c.file, 'read'):
                        # File-like object, assume it's valid
                        file_contents.append(c)
                    else:
                        logger.warning(f"Content {c.id} has file but cannot verify: {type(c.file)}")
                except Exception as e:
                    logger.error(f"Error checking file for content {c.id}: {e}")
                    # Try to add it anyway - might work
                    file_contents.append(c)
        
        logger.info(f"Message {message_id} has {len(file_contents)} files to send, text: {bool(text_to_send)}")
        
        if not file_contents:
            logger.warning(f"Message {message_id} has no files to send")
            # If there's text but no files, send text as regular message
            if text_to_send:
                from .utils_telegram import send_text_to_telegram
                try:
                    text_resp = send_text_to_telegram(chat_id, text_to_send)
                    return {"status": "sent", "type": "text_only", "response": text_resp}
                except Exception as e:
                    logger.error(f"Failed to send text message: {e}")
                    return {"status": "failed", "error": str(e)}
            return {"status": "failed", "error": "No files or text to send"}
        
        responses = []
        
        # If there's only one image and text, send text as caption
        # Otherwise, send text as separate message first, then files
        if text_to_send and len(file_contents) > 1:
            # Multiple files - send text as separate message first
            from .utils_telegram import send_text_to_telegram
            try:
                text_resp = send_text_to_telegram(chat_id, text_to_send)
                responses.append({"type": "text", "response": text_resp})
            except Exception as e:
                responses.append({"type": "text", "error": str(e)})
            # Don't use text as caption for multiple files
            text_to_send = None
        
        # Send all files
        for idx, content in enumerate(file_contents):
            # Use text as caption only for the first image if there's only one file
            caption = None
            if text_to_send and idx == 0 and len(file_contents) == 1:
                caption = text_to_send
            
            # Also check if content has its own caption
            if not caption and content.caption:
                caption = content.caption
            
            try:
                # Get the file - Django FileField
                file_obj = content.file
                if not file_obj:
                    logger.error(f"Content {content.id} has no file object")
                    responses.append({"type": content.content_type, "error": "File not found"})
                    continue
                
                # Verify file exists and is readable
                try:
                    if hasattr(file_obj, 'path'):
                        import os
                        if not os.path.exists(file_obj.path):
                            logger.error(f"File path does not exist: {file_obj.path} for content {content.id}")
                            responses.append({"type": content.content_type, "error": "File path does not exist"})
                            continue
                        # Verify file is readable
                        if not os.access(file_obj.path, os.R_OK):
                            logger.error(f"File is not readable: {file_obj.path} for content {content.id}")
                            responses.append({"type": content.content_type, "error": "File is not readable"})
                            continue
                except Exception as path_check_error:
                    logger.warning(f"Could not verify file path for content {content.id}: {path_check_error}")
                    # Continue anyway - might be a file-like object
                
                # Ensure file pointer is at the start before sending
                if hasattr(file_obj, 'seek'):
                    try:
                        file_obj.seek(0)
                    except Exception as seek_error:
                        logger.warning(f"Could not seek file for content {content.id}: {seek_error}")
                
                logger.info(f"Sending {content.content_type} file (id: {content.id}, size: {getattr(file_obj, 'size', 'unknown')}) to Telegram chat {chat_id}")
                resp = send_file_to_telegram(chat_id, file_obj, content.content_type, caption=caption)
                
                if not resp.get('ok'):
                    error_desc = resp.get('description', 'Unknown error')
                    logger.error(f"Telegram API error for content {content.id}: {error_desc}")
                    responses.append({"type": content.content_type, "error": error_desc, "response": resp})
                else:
                    logger.info(f"Successfully sent {content.content_type} file (id: {content.id}) to Telegram")
                    responses.append({"type": content.content_type, "response": resp})
                
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
                import traceback
                error_detail = traceback.format_exc()
                logger.error(f"Error sending {content.content_type} file (id: {content.id}) to Telegram: {inner_e}\n{error_detail}")
                responses.append({"type": content.content_type, "error": str(inner_e), "traceback": error_detail})

        # Broadcast update via websocket
        layer = get_channel_layer()
        serializer = MessageSerializer(message, context={'request': None})
        async_to_sync(layer.group_send)(
            f"chat_{session.session_uuid}",
            {"type": "chat.message_update", "message": serializer.data}
        )

        logger.info(f"Successfully processed message {message_id}, sent {len([r for r in responses if 'response' in r and r.get('response', {}).get('ok')])} files")
        return {"status": "sent", "responses": responses}
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        logger.error(f"Failed to upload message {message_id} to Telegram: {e}\n{error_detail}")
        return {"status": "failed", "error": str(e), "traceback": error_detail}


@shared_task(name="check_sla_breaches")
def check_sla_breaches():
    """
    Periodic task to check and update SLA breach flags for all active sessions.
    Should be scheduled to run daily (or configurable interval).
    """
    from .models import Session
    from django.utils import timezone
    
    # Query all active sessions (not closed) with sla_deadline set
    active_sessions = Session.objects.filter(
        status__in=['assigned', 'unassigned', 'escalated'],
        sla_deadline__isnull=False
    )
    
    checked_count = 0
    updated_count = 0
    for session in active_sessions:
        checked_count += 1
        old_breach_status = session.sla_breached
        session.check_sla_breach()
        # Only save if status changed to avoid unnecessary writes
        if session.sla_breached != old_breach_status:
            session.save(update_fields=['sla_breached'])
            updated_count += 1
    
    return {
        "status": "completed",
        "checked": checked_count,
        "updated": updated_count,
        "timestamp": timezone.now().isoformat()
    }