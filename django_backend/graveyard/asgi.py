"""
ASGI config for graveyard project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
import logging
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from websockets.middleware import JWTAuthMiddleware
from websockets.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'graveyard.settings')

logger = logging.getLogger(__name__)

# Initialize Django application
django_asgi_app = get_asgi_application()

# Start database connection keepalive system
# This runs in a background thread and pings connections every 5 minutes
# to prevent MySQL timeout errors (4031, 2013, 2006)
# The keepalive system is idempotent - safe to call multiple times
try:
    from graveyard.connection_keepalive import start_keepalive
    # Start keepalive with 5-minute interval (300 seconds)
    # This is less than MySQL's default wait_timeout (28800 seconds = 8 hours)
    # The keepalive will ping connections every 5 minutes to keep them alive
    start_keepalive(interval=300)
    logger.info("Database connection keepalive system started in ASGI")
except Exception as e:
    logger.warning(f"Failed to start database connection keepalive: {e}")

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddleware(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})
