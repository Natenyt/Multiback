# websocket/routing.py
from django.urls import re_path
from channels.routing import URLRouter
from .consumers import ChatConsumer, DepartmentConsumer, StaffConsumer, SuperuserConsumer, VIPConsumer
from .middleware import JWTAuthMiddleware

websocket_urlpatterns = [
    # Chat for a specific session
    re_path(r"ws/chat/(?P<session_uuid>[0-9a-f-]{36})/$", ChatConsumer.as_asgi()),

    # Department dashboard channel
    re_path(r"ws/department/(?P<department_id>\d+)/$", DepartmentConsumer.as_asgi()),

    # Optional personal staff notifications
    re_path(r"ws/staff/(?P<user_uuid>[0-9a-f-]{36})/$", StaffConsumer.as_asgi()),

    # Superuser dashboard channel
    re_path(r"ws/superuser/$", SuperuserConsumer.as_asgi()),

    # VIP dashboard channel
    re_path(r"ws/vip/$", VIPConsumer.as_asgi()),
]

# Replace AuthMiddlewareStack with JWTAuthMiddleware
application = JWTAuthMiddleware(
    URLRouter(websocket_urlpatterns)
)
