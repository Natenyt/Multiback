"""
Tests for WebSocket consumers.
"""
import pytest
import json
from channels.testing import WebsocketCommunicator
from channels.layers import get_channel_layer
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.db import database_sync_to_async, sync_to_async
from django.contrib.auth import get_user_model
from message_app.models import Session
from websockets.consumers import ChatConsumer, DepartmentConsumer, StaffConsumer
from websockets.routing import websocket_urlpatterns
from websockets.middleware import JWTAuthMiddleware

User = get_user_model()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
class TestChatConsumer:
    """Tests for ChatConsumer WebSocket."""
    
    async def test_chat_consumer_connect_staff(self, staff_user, staff_profile, assigned_session):
        """Test staff can connect to assigned session chat."""
        # Ensure user is saved and refresh from DB
        await sync_to_async(staff_user.save)()
        # Generate JWT token
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(staff_user)
        token = str(refresh.access_token)
        
        # Create application with middleware - use ProtocolTypeRouter for proper ASGI setup
        # The middleware wraps the URLRouter
        application = ProtocolTypeRouter({
            "websocket": JWTAuthMiddleware(
                URLRouter(websocket_urlpatterns)
            )
        })
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{assigned_session.session_uuid}/?token={token}"
        )
        
        connected, subprotocol = await communicator.connect()
        assert connected
        
        # Should receive session.joined message
        response = await communicator.receive_json_from()
        assert response['type'] == 'session.joined'
        
        await communicator.disconnect()
    
    async def test_chat_consumer_connect_unauthorized(self, telegram_session):
        """Test unauthorized user cannot connect."""
        application = ProtocolTypeRouter({
            "websocket": JWTAuthMiddleware(URLRouter(websocket_urlpatterns))
        })
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{telegram_session.session_uuid}/"
        )
        
        connected, subprotocol = await communicator.connect()
        # Should close connection
        assert not connected or subprotocol is None
        
        await communicator.disconnect()
    
    async def test_chat_consumer_receive_typing(self, staff_user, staff_profile, assigned_session):
        """Test typing indicator broadcast."""
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(staff_user)
        token = str(refresh.access_token)
        
        application = ProtocolTypeRouter({
            "websocket": JWTAuthMiddleware(URLRouter(websocket_urlpatterns))
        })
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{assigned_session.session_uuid}/?token={token}"
        )
        
        connected, _ = await communicator.connect()
        assert connected
        
        # Skip initial session.joined message
        initial_msg = await communicator.receive_json_from()
        assert initial_msg['type'] == 'session.joined'
        
        # Send typing indicator
        await communicator.send_json_to({
            'type': 'typing',
            'is_typing': True
        })
        
        # Should receive typing event back
        response = await communicator.receive_json_from()
        assert response['type'] == 'typing'
        
        await communicator.disconnect()
    
    async def test_chat_consumer_message_broadcast(self, staff_user, staff_profile, assigned_session):
        """Test message broadcast to chat group."""
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(staff_user)
        token = str(refresh.access_token)
        
        application = ProtocolTypeRouter({
            "websocket": JWTAuthMiddleware(URLRouter(websocket_urlpatterns))
        })
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{assigned_session.session_uuid}/?token={token}"
        )
        
        connected, _ = await communicator.connect()
        assert connected
        
        # Skip initial session.joined message
        initial_msg = await communicator.receive_json_from()
        assert initial_msg['type'] == 'session.joined'
        
        # Simulate message broadcast from server
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            f"chat_{assigned_session.session_uuid}",
            {
                'type': 'chat_message',
                'message': {
                    'message_uuid': 'test-uuid',
                    'text': 'Test message',
                    'created_at': '2024-01-01T00:00:00Z'
                }
            }
        )
        
        # Should receive message
        response = await communicator.receive_json_from()
        assert response['type'] == 'message.created'
        
        await communicator.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
class TestDepartmentConsumer:
    """Tests for DepartmentConsumer WebSocket."""
    
    async def test_department_consumer_connect(self, staff_user, staff_profile):
        """Test staff can connect to department channel."""
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(staff_user)
        token = str(refresh.access_token)
        
        application = ProtocolTypeRouter({
            "websocket": JWTAuthMiddleware(URLRouter(websocket_urlpatterns))
        })
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/department/{staff_profile.department.id}/?token={token}"
        )
        
        connected, _ = await communicator.connect()
        assert connected
        
        # Should receive department.joined message
        response = await communicator.receive_json_from()
        assert response['type'] == 'department.joined'
        
        await communicator.disconnect()
    
    async def test_department_consumer_wrong_department(self, staff_user, staff_profile):
        """Test staff cannot connect to other department."""
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(staff_user)
        token = str(refresh.access_token)
        
        application = ProtocolTypeRouter({
            "websocket": JWTAuthMiddleware(URLRouter(websocket_urlpatterns))
        })
        
        # Try to connect to different department
        communicator = WebsocketCommunicator(
            application,
            f"/ws/department/99999/?token={token}"
        )
        
        connected, _ = await communicator.connect()
        # Should reject connection
        assert not connected
        
        await communicator.disconnect()
    
    async def test_department_consumer_session_created(self, staff_user, staff_profile, telegram_session):
        """Test session.created event broadcast."""
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(staff_user)
        token = str(refresh.access_token)
        
        application = ProtocolTypeRouter({
            "websocket": JWTAuthMiddleware(URLRouter(websocket_urlpatterns))
        })
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/department/{staff_profile.department.id}/?token={token}"
        )
        
        connected, _ = await communicator.connect()
        assert connected
        
        # Skip initial department.joined message
        initial_msg = await communicator.receive_json_from()
        assert initial_msg['type'] == 'department.joined'
        
        # Simulate session created event
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            f"department_{staff_profile.department.id}",
            {
                'type': 'session_created',
                'session': {
                    'session_uuid': str(telegram_session.session_uuid),
                    'status': 'unassigned'
                }
            }
        )
        
        # Should receive session.created
        response = await communicator.receive_json_from()
        assert response['type'] == 'session.created'
        
        await communicator.disconnect()


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
class TestStaffConsumer:
    """Tests for StaffConsumer WebSocket."""
    
    async def test_staff_consumer_connect(self, staff_user):
        """Test staff can connect to personal notifications."""
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(staff_user)
        token = str(refresh.access_token)
        
        application = ProtocolTypeRouter({
            "websocket": JWTAuthMiddleware(URLRouter(websocket_urlpatterns))
        })
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/staff/{staff_user.user_uuid}/?token={token}"
        )
        
        connected, _ = await communicator.connect()
        assert connected
        
        # Should receive staff.joined message
        response = await communicator.receive_json_from()
        assert response['type'] == 'staff.joined'
        
        await communicator.disconnect()
    
    async def test_staff_consumer_wrong_user(self, staff_user, citizen_user):
        """Test user cannot connect to another user's notifications."""
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(staff_user)
        token = str(refresh.access_token)
        
        application = ProtocolTypeRouter({
            "websocket": JWTAuthMiddleware(URLRouter(websocket_urlpatterns))
        })
        
        # Try to connect to different user's channel
        communicator = WebsocketCommunicator(
            application,
            f"/ws/staff/{citizen_user.user_uuid}/?token={token}"
        )
        
        connected, _ = await communicator.connect()
        # Should reject
        assert not connected
        
        await communicator.disconnect()

