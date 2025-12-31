"""
Avatar serving view for user profile pictures.
This ensures avatars are accessible even when DEBUG=False in production.
"""
import os
from django.http import FileResponse, Http404, HttpResponse
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import User


@api_view(['GET', 'OPTIONS'])
@permission_classes([AllowAny])  # Allow public access to avatars
def serve_avatar(request, user_uuid):
    """
    Serve user avatar image.
    URL: /api/users/avatar/<uuid>/
    
    This endpoint allows serving avatar images regardless of DEBUG mode.
    Avatars are public (anyone with the UUID can access), but UUIDs are 
    hard to guess, providing basic security through obscurity.
    
    For stricter security, you could add IsAuthenticated permission
    and check if the requesting user has permission to view the avatar.
    """
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        response = Response()
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    try:
        user = get_object_or_404(User, user_uuid=user_uuid)
    except Exception:
        raise Http404("User not found")
    
    if not user.avatar:
        raise Http404("Avatar not found")
    
    try:
        # Get the file path
        avatar_path = user.avatar.path
        
        # Security check: ensure the file exists and is within MEDIA_ROOT
        if not os.path.exists(avatar_path):
            raise Http404("Avatar file not found on disk")
        
        # Ensure the path is within MEDIA_ROOT (prevent directory traversal)
        media_root = os.path.abspath(settings.MEDIA_ROOT)
        avatar_path_abs = os.path.abspath(avatar_path)
        
        if not avatar_path_abs.startswith(media_root):
            raise Http404("Invalid avatar path")
        
        # Determine content type based on file extension
        content_type = 'image/jpeg'  # default
        ext = os.path.splitext(avatar_path)[1].lower()
        content_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
        }
        content_type = content_types.get(ext, 'image/jpeg')
        
        # Serve the file
        response = FileResponse(
            open(avatar_path, 'rb'),
            content_type=content_type
        )
        
        # Add caching headers (avatars don't change often)
        response['Cache-Control'] = 'public, max-age=3600'  # Cache for 1 hour
        
        # Add CORS headers to allow cross-origin requests
        # This is important when frontend and backend are on different domains
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        
        return response
    
    except Exception as e:
        raise Http404(f"Error serving avatar: {str(e)}")

