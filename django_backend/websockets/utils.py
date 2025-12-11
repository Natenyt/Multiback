# websocket/utils.py
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from message_app.serializers import MessageSerializer, SessionSerializer
from django.conf import settings

channel_layer = get_channel_layer()

def broadcast_message_created(session_uuid, message_obj, request=None):
    """
    message_obj: Django Message instance (not serialized).
    We'll serialize it to dict and send group event to chat_{session_uuid}.
    """
    serializer = MessageSerializer(message_obj, context={'request': request})
    data = serializer.data
    async_to_sync(channel_layer.group_send)(
        f"chat_{session_uuid}",
        {
            "type": "chat.message",
            "message": data
        }
    )

def broadcast_message_update(session_uuid, message_obj, update_payload=None, request=None):
    """
    e.g., telegram delivery update; sends event chat.message_update
    """
    serializer = MessageSerializer(message_obj, context={'request': request})
    data = serializer.data
    async_to_sync(channel_layer.group_send)(
        f"chat_{session_uuid}",
        {
            "type": "chat.message_update",
            "message": data,
            "update": update_payload or {}
        }
    )

def broadcast_session_created(department_id, session_obj, request=None):
    """
    Notify the department group that a new session has been assigned.
    """
    serializer = SessionSerializer(session_obj, context={'request': request})
    data = serializer.data
    async_to_sync(channel_layer.group_send)(
        f"department_{department_id}",
        {
            "type": "session.created",
            "session": data
        }
    )

def notify_staff(user_uuid, payload):
    async_to_sync(channel_layer.group_send)(
        f"staff_{user_uuid}",
        {
            "type": "staff.notification",
            "payload": payload
        }
    )


def broadcast_new_session_to_department(department_id, session_uuid):
    """
    Notifies department dashboard of a new session assignment.
    """
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"department_{department_id}",
        {
            "type": "session.created",
            "session_uuid": str(session_uuid)
        }
    )