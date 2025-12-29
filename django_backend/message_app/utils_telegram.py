# message_app/utils_telegram.py
import requests
from django.conf import settings

TELEGRAM_API_BASE = "https://api.telegram.org"

def get_main_menu_keyboard_json(lang='uz'):
    """
    Returns the main menu keyboard as JSON dict format for Telegram Bot API.
    This is used when sending messages from Django backend (not from bot handlers).
    """
    # Button texts in Uzbek
    if lang == 'ru':
        keyboard = {
            "keyboard": [
                [{"text": "📝 Отправить новое сообщение"}],
                [{"text": "📰 Новости"}, {"text": "⚙️ Изменить язык"}]
            ],
            "resize_keyboard": True
        }
    else:  # Default to Uzbek
        keyboard = {
            "keyboard": [
                [{"text": "📝 Yangi xabar yuborish"}],
                [{"text": "📰 Yangiliklar"}, {"text": "⚙️ Tilni o'zgartirish"}]
            ],
            "resize_keyboard": True
        }
    return keyboard

def send_text_to_telegram(chat_id: int, text: str, remove_keyboard: bool = False, keyboard_markup: dict = None):
    """
    Send text message to Telegram.
    :param chat_id: Telegram chat ID
    :param text: Message text (HTML supported)
    :param remove_keyboard: If True, removes keyboard
    :param keyboard_markup: If provided, sends this keyboard markup (dict format)
    """
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
    elif keyboard_markup:
        payload["reply_markup"] = keyboard_markup
    resp = requests.post(url, json=payload, timeout=15)
    return resp.json()

def send_file_to_telegram(chat_id: int, file_field, file_type: str, caption: str = None):
    """
    file_field: Django InMemoryUploadedFile / File
    file_type: 'photo' | 'document' | 'audio' | 'voice' | 'video'
    caption: Optional caption text for the file
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
    
    # Add caption if provided (Telegram supports captions for photos, videos, documents, audio)
    if caption:
        data["caption"] = caption
        data["parse_mode"] = "HTML"  # Support HTML formatting in captions
    
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
    
    # Handle different file types - Django FileField can be tricky
    file_name = getattr(file_field, 'name', 'file')
    
    # Try to read the file data
    try:
        # Reset file pointer to beginning in case it was read before
        if hasattr(file_field, 'seek'):
            file_field.seek(0)
        
        # Try to read directly
        if hasattr(file_field, 'read'):
            file_data = file_field.read()
        elif hasattr(file_field, 'path'):
            # Django FileField with path - open and read
            with open(file_field.path, 'rb') as f:
                file_data = f.read()
            file_name = file_field.name
        else:
            raise ValueError(f"Cannot read file: {type(file_field)}")
    except Exception as e:
        # If reading fails, try opening the file by path
        if hasattr(file_field, 'path'):
            with open(file_field.path, 'rb') as f:
                file_data = f.read()
            file_name = file_field.name
        else:
            raise ValueError(f"Failed to read file: {e}")
    
    files[fieldname] = (file_name, file_data)

    resp = requests.post(url, data=data, files=files, timeout=60)
    return resp.json()
