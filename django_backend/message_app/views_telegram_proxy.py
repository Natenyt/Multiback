import os
import requests
from django.http import FileResponse, Http404
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from message_app.models import MessageContent


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def telegram_media_proxy(request, content_id):
    """
    Secure proxy for Telegram media.
    Downloads Telegram files from Bot API once,
    caches locally, and serves to frontend.
    """
    # 1. Fetch the MessageContent
    content = MessageContent.objects.filter(id=content_id).first()
    if not content:
        raise Http404("Media not found")

    if not content.telegram_file_id:
        raise Http404("This media is not from Telegram")

    bot_token = settings.TOKEN_BOT
    cache_dir = os.path.join(settings.MEDIA_ROOT, settings.TELEGRAM_FILE_CACHE_DIR)

    os.makedirs(cache_dir, exist_ok=True)

    # Determine file extension by content type (fallback)
    ext_map = {
        "image": "jpg",
        "video": "mp4",
        "voice": "ogg",
        "file": "bin",
        "sticker": "webp",
    }
    file_ext = ext_map.get(content.content_type, "bin")

    # Cached local path
    local_filename = f"{content.message.message_uuid}_{content.id}.{file_ext}"
    cached_path = os.path.join(cache_dir, local_filename)

    # 2. If cached locally, serve it
    if os.path.exists(cached_path):
        return FileResponse(open(cached_path, "rb"), as_attachment=False)

    # 3. Otherwise, download from Telegram
    # 3.1 Get file path from Telegram bot
    file_info_url = (
        f"https://api.telegram.org/bot{bot_token}/getFile?file_id={content.telegram_file_id}"
    )
    file_info = requests.get(file_info_url).json()

    if not file_info.get("ok"):
        raise Http404("Telegram file not accessible")

    file_path = file_info["result"]["file_path"]

    # 3.2 Download actual file
    file_url = f"https://api.telegram.org/file/bot{bot_token}/{file_path}"
    file_bytes = requests.get(file_url, stream=True)

    if file_bytes.status_code != 200:
        raise Http404("Unable to download Telegram file")

    # 4. Save to local cache
    with open(cached_path, "wb") as f:
        for chunk in file_bytes.iter_content(chunk_size=8192):
            f.write(chunk)

    # 5. Serve the file
    return FileResponse(open(cached_path, "rb"), as_attachment=False)
