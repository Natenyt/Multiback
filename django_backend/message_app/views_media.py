# message_app/views_media.py
import os
import requests
from django.http import FileResponse, Http404, HttpResponse
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import MessageContent
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile

# Ensure cache dirs exist
TELE_CACHE = os.path.join(settings.MEDIA_ROOT, settings.TELEGRAM_FILE_CACHE_DIR)
THUMB_CACHE = os.path.join(settings.MEDIA_ROOT, getattr(settings, 'THUMBNAIL_CACHE_DIR', 'thumbnails'))
os.makedirs(TELE_CACHE, exist_ok=True)
os.makedirs(THUMB_CACHE, exist_ok=True)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def telegram_media_proxy(request, content_id):
    """
    Given a MessageContent ID with telegram_file_id, download and cache the file, then serve it.
    """
    content = MessageContent.objects.filter(id=content_id).first()
    if not content or not content.telegram_file_id:
        raise Http404("Telegram media not found")

    # Permission: only staff or owner of session can fetch media
    session = content.message.session
    user = request.user
    if not _has_access_to_session(user, session):
        return HttpResponse(status=403)

    bot_token = settings.TELEGRAM_BOT_TOKEN
    # Determine ext
    ext_map = {'image': 'jpg', 'video': 'mp4', 'voice': 'ogg', 'file': 'bin', 'sticker': 'webp'}
    ext = ext_map.get(content.content_type, 'bin')
    filename = f"{content.message.message_uuid}_{content.id}.{ext}"
    cached_path = os.path.join(TELE_CACHE, filename)

    if os.path.exists(cached_path):
        return FileResponse(open(cached_path, 'rb'), as_attachment=False)

    # Fetch file info
    file_info_url = f"https://api.telegram.org/bot{bot_token}/getFile?file_id={content.telegram_file_id}"
    ri = requests.get(file_info_url, timeout=15)
    if ri.status_code != 200:
        raise Http404("Telegram file info fetch failed")
    info = ri.json()
    if not info.get('ok'):
        raise Http404("Telegram reported error for file")

    file_path = info['result']['file_path']
    file_url = f"https://api.telegram.org/file/bot{bot_token}/{file_path}"
    r = requests.get(file_url, stream=True, timeout=30)
    if r.status_code != 200:
        raise Http404("Failed to download Telegram file")

    # Save to cache
    with open(cached_path, 'wb') as f:
        for chunk in r.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)

    return FileResponse(open(cached_path, 'rb'), as_attachment=False)


def _has_access_to_session(user, session):
    # Reuse permission logic: owner or staff with department/assignment
    if session.citizen == user:
        return True
    if hasattr(user, 'staff_profile') and user.staff_profile:
        staff_dept = user.staff_profile.department
        if session.assigned_staff == user:
            return True
        if session.assigned_department and staff_dept and session.assigned_department == staff_dept:
            return True
    return False


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def thumbnail_proxy(request, content_id):
    """
    Generates and returns a thumbnail for images. Caches thumbnails.
    For videos: returns a generic placeholder unless you integrate ffmpeg frame extraction.
    """
    content = MessageContent.objects.filter(id=content_id).first()
    if not content:
        raise Http404("Content not found")

    session = content.message.session
    user = request.user
    if not _has_access_to_session(user, session):
        return HttpResponse(status=403)

    thumb_name = f"{content.message.message_uuid}_{content.id}.jpg"
    thumb_path = os.path.join(THUMB_CACHE, thumb_name)

    # If already cached, serve
    if os.path.exists(thumb_path):
        return FileResponse(open(thumb_path, 'rb'), content_type='image/jpeg')

    # Determine source bytes:
    # Priority: local file -> file_url -> telegram (via proxy fetch)
    source_bytes = None
    if content.file:
        try:
            with open(content.file.path, 'rb') as f:
                source_bytes = f.read()
        except Exception:
            source_bytes = None

    elif content.file_url:
        try:
            r = requests.get(content.file_url, timeout=10)
            if r.status_code == 200:
                source_bytes = r.content
        except Exception:
            source_bytes = None

    elif content.telegram_file_id:
        # Use the telegram download flow (re-use telegram_media_proxy to get file)
        # But avoid double-caching; download directly here
        bot_token = settings.TELEGRAM_BOT_TOKEN
        file_info_url = f"https://api.telegram.org/bot{bot_token}/getFile?file_id={content.telegram_file_id}"
        ri = requests.get(file_info_url, timeout=15)
        if ri.status_code == 200 and ri.json().get('ok'):
            file_path = ri.json()['result']['file_path']
            file_url = f"https://api.telegram.org/file/bot{bot_token}/{file_path}"
            rr = requests.get(file_url, timeout=30)
            if rr.status_code == 200:
                source_bytes = rr.content

    # If we have source bytes and it's an image, generate thumbnail
    if source_bytes and content.content_type == 'image':
        try:
            im = Image.open(BytesIO(source_bytes))
            im.thumbnail(settings.THUMBNAIL_MAX_SIZE, getattr(Image, "Resampling", Image).LANCZOS)
            buf = BytesIO()
            im.save(buf, format='JPEG', quality=75)
            buf.seek(0)
            # Write to cache
            with open(thumb_path, 'wb') as f:
                f.write(buf.read())
            return FileResponse(open(thumb_path, 'rb'), content_type='image/jpeg')
        except Exception:
            # fallback
            pass

    # Video fallback: no thumbnail generation implemented; return 204 or generic image
    # You can add ffmpeg extraction later and cache result
    # For now return 204 No Content to let frontend show a generic icon
    return HttpResponse(status=204)
