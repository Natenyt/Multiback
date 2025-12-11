# message_app/tasks.py
from celery import shared_task
from .models import Message, MessageContent
from .websocket.tasks import notify_telegram_delivery
from .utils_telegram import send_file_to_telegram, send_text_to_telegram

@shared_task
def upload_message_to_telegram(message_id, chat_id):
    try:
        msg = Message.objects.get(id=message_id)
        text = None
        contents = msg.contents.all()

        # If only text, send text synchronously
        if contents.count() == 1 and contents.first().content_type == 'text':
            text = contents.first().text
            resp = send_text_to_telegram(chat_id, text)
            notify_telegram_delivery.delay(msg.id, {"status": "sent_text", "response": resp})
            return

        # For files and mixed content, upload asynchronously
        for content in contents:
            if content.content_type == 'text':
                resp = send_text_to_telegram(chat_id, content.text)
            elif content.file:
                resp = send_file_to_telegram(chat_id, content.file, content_type=content.content_type)
                # Save Telegram file_id if available
                try:
                    result = resp.get('result', {})
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
                except Exception:
                    pass

        notify_telegram_delivery.delay(msg.id, {"status": "sent_documents"})

    except Exception as e:
        notify_telegram_delivery.delay(msg.id, {"status": "failed", "error": str(e)})
