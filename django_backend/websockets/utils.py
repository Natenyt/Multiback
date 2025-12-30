# websocket/utils.py
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from message_app.serializers import MessageSerializer, SessionSerializer
from django.conf import settings
import logging

logger = logging.getLogger(__name__)
channel_layer = get_channel_layer()

def broadcast_message_created(session_uuid, message_obj, request=None):
    """
    message_obj: Django Message instance (not serialized).
    We'll serialize it to dict and send group event to chat_{session_uuid}.
    """
    try:
        serializer = MessageSerializer(message_obj, context={'request': request})
        data = serializer.data
        group_name = f"chat_{session_uuid}"
        logger.debug(f"Broadcasting message {message_obj.message_uuid} to group {group_name}")
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "chat.message",
                "message": data
            }
        )
        logger.debug(f"Successfully broadcasted message {message_obj.message_uuid} to group {group_name}")
    except Exception as e:
        logger.error(f"Failed to broadcast message {message_obj.message_uuid if message_obj else 'unknown'} to chat_{session_uuid}: {e}", exc_info=True)
        raise

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


def broadcast_session_assigned(department_id, session_obj, request=None):
    """
    Notifies the department group that a session has been assigned to a staff member.
    """
    serializer = SessionSerializer(session_obj, context={'request': request})
    data = serializer.data
    async_to_sync(channel_layer.group_send)(
        f"department_{department_id}",
        {
            "type": "session.assigned",
            "session": data
        }
    )


def broadcast_session_hold(department_id, session_obj, request=None):
    """
    Notifies the department group that a session has been put on hold.
    Optional: Can be used for UI updates when hold is applied.
    """
    serializer = SessionSerializer(session_obj, context={'request': request})
    data = serializer.data
    async_to_sync(channel_layer.group_send)(
        f"department_{department_id}",
        {
            "type": "session.hold",
            "session": data
        }
    )


def broadcast_session_escalated_to_superuser(session_obj, request=None):
    """
    Notifies the superuser and VIP groups that a session has been escalated.
    All superusers and VIP members connected to the dashboard will receive this event.
    """
    serializer = SessionSerializer(session_obj, context={'request': request})
    data = serializer.data
    
    # Broadcast to superuser group
    async_to_sync(channel_layer.group_send)(
        "superuser",
        {
            "type": "session.escalated",
            "session": data
        }
    )
    
    # Also broadcast to VIP group
    async_to_sync(channel_layer.group_send)(
        "vip",
        {
            "type": "session.escalated",
            "session": data
        }
    )


def broadcast_session_escalated_to_citizen(session_uuid, session_obj=None, request=None):
    """
    Notifies the citizen chat that their session has been escalated.
    Frontend can use this to show read-only mode and display message.
    """
    session_data = None
    if session_obj:
        serializer = SessionSerializer(session_obj, context={'request': request})
        session_data = serializer.data
    
    async_to_sync(channel_layer.group_send)(
        f"chat_{session_uuid}",
        {
            "type": "session.escalated",
            "session": session_data,
            "message": "Your appeal is being rerouted to a supervisor for review."
        }
    )


def broadcast_session_closed_to_department(department_id, session_obj, request=None):
    """
    Notifies the department group that a session has been closed.
    Updates department dashboard to remove from active list.
    """
    serializer = SessionSerializer(session_obj, context={'request': request})
    data = serializer.data
    async_to_sync(channel_layer.group_send)(
        f"department_{department_id}",
        {
            "type": "session.closed",
            "session": data
        }
    )


def broadcast_session_closed_to_citizen(session_uuid, session_obj=None, request=None):
    """
    Notifies the citizen chat that their session has been closed.
    Frontend can use this to show read-only mode and display closure message.
    """
    session_data = None
    if session_obj:
        serializer = SessionSerializer(session_obj, context={'request': request})
        session_data = serializer.data
    
    async_to_sync(channel_layer.group_send)(
        f"chat_{session_uuid}",
        {
            "type": "session.closed",
            "session": session_data,
            "message": "This session has been closed."
        }
    )