# message_app/utils_telegram.py
import requests
from django.conf import settings

TELEGRAM_API_BASE = "https://api.telegram.org"

def send_text_to_telegram(chat_id: int, text: str, remove_keyboard: bool = False):
    bot_token = getattr(settings, "TOKEN_BOT", None) or getattr(settings, "TELEGRAM_BOT_TOKEN", None)
    if not bot_token:
        raise RuntimeError("TELEGRAM BOT TOKEN not configured")
    url = f"{TELEGRAM_API_BASE}/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    if remove_keyboard:
        payload["reply_markup"] = {"remove_keyboard": True}
    resp = requests.post(url, json=payload, timeout=15)
    return resp.json()

def send_file_to_telegram(chat_id: int, file_field, file_type: str):
    """
    file_field: Django InMemoryUploadedFile / File
    file_type: 'photo' | 'document' | 'audio' | 'voice' | 'video'
    Returns telegram API response (dict)
    """
    bot_token = getattr(settings, "TOKEN_BOT", None) or getattr(settings, "TELEGRAM_BOT_TOKEN", None)
    if not bot_token:
        raise RuntimeError("TELEGRAM BOT TOKEN not configured")

    method_map = {
        'image': 'sendPhoto',
        'photo': 'sendPhoto',
        'video': 'sendVideo',
        'voice': 'sendVoice',
        'audio': 'sendAudio',
        'file': 'sendDocument',
        'document': 'sendDocument',
    }
    method = method_map.get(file_type, 'sendDocument')
    url = f"{TELEGRAM_API_BASE}/bot{bot_token}/{method}"

    files = {}
    data = {"chat_id": str(chat_id)}
    # for sendPhoto the field name is 'photo', sendDocument -> 'document'
    fieldname = 'document'
    if method == 'sendPhoto':
        fieldname = 'photo'
    elif method == 'sendVideo':
        fieldname = 'video'
    elif method == 'sendAudio':
        fieldname = 'audio'
    elif method == 'sendVoice':
        fieldname = 'voice'
    files[fieldname] = (file_field.name, file_field.read())

    resp = requests.post(url, data=data, files=files, timeout=60)
    return resp.json()
