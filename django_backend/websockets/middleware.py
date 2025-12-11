# websocket/middleware.py
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from channels.db import database_sync_to_async
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

@database_sync_to_async
def get_user_from_token(token):
    """
    Validate JWT token and return the associated user.
    Uses rest_framework_simplejwt for proper token validation.
    """
    # Ensure token is a non-empty string
    if not token:
        return AnonymousUser()
    
    # Convert to string if needed
    if not isinstance(token, str):
        try:
            token = str(token).strip()
        except Exception:
            return AnonymousUser()
    
    # Check if token is empty after conversion
    if not token or len(token) == 0:
        return AnonymousUser()
    
    try:
        # Validate token using SimpleJWT - ensure it's a string first
        if not isinstance(token, str):
            logger.warning(f"Token is not a string: {type(token)}")
            return AnonymousUser()
        
        # Strip whitespace
        token = token.strip()
        if not token:
            return AnonymousUser()
        
        # Validate token using SimpleJWT - use AccessToken directly
        from rest_framework_simplejwt.tokens import AccessToken
        try:
            access_token = AccessToken(token)
            user_id = access_token.get('user_id')
        except (TokenError, InvalidToken) as e:
            # Fallback to UntypedToken if AccessToken fails
            logger.debug(f"AccessToken failed, trying UntypedToken: {e}")
            UntypedToken(token)
            from rest_framework_simplejwt.backends import TokenBackend
            from django.conf import settings
            algorithm = settings.SIMPLE_JWT.get('ALGORITHM', 'HS256')
            token_backend = TokenBackend(algorithm=algorithm)
            validated_token = token_backend.decode(token, verify=True)
            user_id = validated_token.get('user_id')
        
        if user_id:
            try:
                user = User.objects.get(pk=user_id)
                return user
            except User.DoesNotExist:
                logger.warning(f"User {user_id} from token does not exist in database")
                return AnonymousUser()
        return AnonymousUser()
    except (TokenError, InvalidToken, User.DoesNotExist) as e:
        logger.warning(f"Token validation failed: {e}")
        return AnonymousUser()
    except (TypeError, ValueError) as e:
        # Handle type errors (e.g., "Expected a string value")
        logger.warning(f"Token type error: {e}, token type: {type(token)}")
        return AnonymousUser()
    except Exception as e:
        logger.error(f"Unexpected error in token validation: {e}")
        return AnonymousUser()

class JWTAuthMiddleware:
    """
    Custom middleware for token-based auth over websockets:
    Client must pass ?token=JWT in websocket URL
    
    This middleware follows Channels' ASGI middleware pattern.
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        """
        ASGI application entry point.
        Channels will call this with (scope, receive, send).
        """
        # Only process websocket connections
        if scope.get('type') != 'websocket':
            return await self.inner(scope, receive, send)
        
        # Extract token from query string
        query_string = scope.get('query_string', b'')
        if isinstance(query_string, bytes):
            query_string = query_string.decode('utf-8')
        
        params = parse_qs(query_string)
        token_list = params.get('token', [])
        token = token_list[0] if token_list else None
        
        # Ensure token is a string and not empty
        if token:
            if isinstance(token, bytes):
                token = token.decode('utf-8')
            elif not isinstance(token, str):
                token = str(token)
            token = token.strip()
        
        # Set user in scope
        scope['user'] = await get_user_from_token(token) if token else AnonymousUser()
        
        # Call inner application
        return await self.inner(scope, receive, send)
