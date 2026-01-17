# websocket/consumers.py
import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model
from message_app.models import Session
from departments.models import Department

User = get_user_model()

# Helpers for permission checks (sync wrappers)
@sync_to_async
def get_session(session_uuid):
    try:
        return Session.objects.select_related('citizen', 'assigned_staff', 'assigned_department').get(session_uuid=session_uuid)
    except Session.DoesNotExist:
        return None

@sync_to_async
def get_department(department_id):
    try:
        return Department.objects.get(id=department_id)
    except Department.DoesNotExist:
        return None

class ChatConsumer(AsyncJsonWebsocketConsumer):
    """Handle WebSocket connections for chat sessions."""
    async def connect(self):
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            self.user = self.scope.get("user", None)
            self.session_uuid = self.scope['url_route']['kwargs'].get('session_uuid')
            
            logger.info(f"WebSocket connection attempt for session {self.session_uuid}, user: {self.user}")

            if not self.user or not self.user.is_authenticated:
                logger.warning(f"WebSocket connection rejected: user not authenticated (session: {self.session_uuid})")
                await self.close(code=4401)
                return

            session = await get_session(self.session_uuid)
            if not session:
                logger.warning(f"WebSocket connection rejected: session not found (session: {self.session_uuid})")
                await self.close(code=4404)
                return

            allowed = await sync_to_async(self._has_access_sync)(self.user, session)
            if not allowed:
                logger.warning(f"WebSocket connection rejected: access denied (session: {self.session_uuid}, user: {self.user})")
                await self.close(code=4403)
                return

            self.group_name = f"chat_{self.session_uuid}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()

            # Optionally: send session info on connect
            await self.send_json({
                "type": "session.joined",
                "session_uuid": str(self.session_uuid)
            })
            
            logger.info(f"WebSocket connected successfully for session {self.session_uuid}")
        except Exception as e:
            logger.error(f"Error during WebSocket connection: {e}", exc_info=True)
            try:
                await self.close(code=1011)  # Internal error
            except:
                pass
            raise

    async def disconnect(self, code):
        try:
            if hasattr(self, 'group_name'):
                await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception:
            pass

    # Message creation should go through REST POST /send/ to ensure persistence.
    async def receive_json(self, content, **kwargs):
        # Handle typing indicators or presence signals.
        event_type = content.get("type")
        if event_type == "typing":
            # broadcast typing indicator to group
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "chat.typing",
                    "user_uuid": str(self.user.user_uuid),
                    "is_typing": content.get("is_typing", False)
                }
            )
        # else ignore or handle other small signals

    async def chat_message(self, event):
        """Handle incoming chat message events."""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            message = event.get("message")
            if not message:
                logger.warning(f"Received chat_message event without message data: {event}")
                return
            
            await self.send_json({
                "type": "message.created",
                "message": message
            })
            logger.debug(f"Sent message.created event to WebSocket client for session {self.session_uuid}")
        except Exception as e:
            logger.error(f"Error sending chat message to WebSocket client: {e}", exc_info=True)

    async def chat_typing(self, event):
        await self.send_json({
            "type": "typing",
            "user_uuid": event.get("user_uuid"),
            "is_typing": event.get("is_typing", False)
        })

    async def chat_message_update(self, event):
        """Handle message updates such as delivery status."""
        await self.send_json({
            "type": "message.delivery_update",
            "message": event.get("message"),
            "update": event.get("update", {})
        })

    async def session_escalated(self, event):
        """Notify clients when a session is escalated."""
        await self.send_json({
            "type": "session.escalated",
            "session": event.get("session"),
            "message": event.get("message", "Your appeal is being rerouted to a supervisor for review.")
        })

    async def session_closed(self, event):
        """Notify clients when a session is closed."""
        await self.send_json({
            "type": "session.closed",
            "session": event.get("session"),
            "message": event.get("message", "This session has been closed.")
        })

    def _has_access_sync(self, user, session):
        # Citizen: must be the owner
        if session.citizen == user:
            # For escalated sessions, citizens can always access their own sessions
            if session.status == 'escalated':
                return True
            # For non-escalated sessions, only web origin
            return session.origin == 'web'

        # Escalated sessions: only accessible to superusers and the citizen (handled above)
        if session.status == 'escalated':
            if hasattr(user, 'is_superuser') and user.is_superuser:
                return True
            return False

        # Staff: must have staff_profile
        if hasattr(user, 'staff_profile') and user.staff_profile:
            staff_dept = getattr(user.staff_profile, 'department', None)
            if session.assigned_staff == user:
                return True
            if session.assigned_department and staff_dept and session.assigned_department == staff_dept:
                return True

        return False


class DepartmentConsumer(AsyncJsonWebsocketConsumer):
    """Handle WebSocket connections for department dashboards."""
    async def connect(self):
        self.user = self.scope.get("user", None)
        self.department_id = self.scope['url_route']['kwargs'].get('department_id')

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4401)
            return

        # Only staff members belonging to this department may join
        # Use sync_to_async for database access
        has_profile = await sync_to_async(lambda: hasattr(self.user, 'staff_profile') and self.user.staff_profile is not None)()
        if not has_profile:
            await self.close(code=4403)
            return

        staff_dept = await sync_to_async(lambda: getattr(self.user.staff_profile, 'department', None))()
        if not staff_dept or str(staff_dept.id) != str(self.department_id):
            await self.close(code=4403)
            return

        self.group_name = f"department_{self.department_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send_json({
            "type": "department.joined",
            "department_id": int(self.department_id)
        })

    async def disconnect(self, code):
        try:
            if hasattr(self, 'group_name'):
                await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception:
            pass

    # Handler for session.created events
    async def session_created(self, event):
        await self.send_json({
            "type": "session.created",
            "session": event.get("session")
        })

    async def session_assigned(self, event):
        await self.send_json({
            "type": "session.assigned",
            "session": event.get("session")
        })

    async def session_hold(self, event):
        """Notify department dashboards when a session is put on hold."""
        await self.send_json({
            "type": "session.hold",
            "session": event.get("session")
        })

    async def session_closed(self, event):
        """Notify department dashboards when a session is closed."""
        await self.send_json({
            "type": "session.closed",
            "session": event.get("session")
        })

class StaffConsumer(AsyncJsonWebsocketConsumer):
    """Handle personal staff notification WebSocket connections."""
    async def connect(self):
        self.user = self.scope.get("user", None)
        self.user_uuid = self.scope['url_route']['kwargs'].get('user_uuid')

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4401)
            return

        # ensure this socket belongs to the same logged-in user
        if str(self.user.user_uuid) != str(self.user_uuid):
            await self.close(code=4403)
            return

        self.group_name = f"staff_{self.user_uuid}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send_json({"type": "staff.joined", "user_uuid": self.user_uuid})

    async def disconnect(self, code):
        try:
            if hasattr(self, 'group_name'):
                await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception:
            pass

    async def staff_notification(self, event):
        await self.send_json({
            "type": "staff.notification",
            "payload": event.get("payload")
        })

class SuperuserConsumer(AsyncJsonWebsocketConsumer):
    """Handle WebSocket connections for superuser dashboards."""
    async def connect(self):
        self.user = self.scope.get("user", None)

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4401)
            return

        # Only superusers can connect
        is_superuser = await sync_to_async(lambda: getattr(self.user, 'is_superuser', False))()
        if not is_superuser:
            await self.close(code=4403)
            return

        self.group_name = "superuser"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send_json({
            "type": "superuser.joined",
            "message": "Connected to superuser dashboard"
        })

    async def disconnect(self, code):
        try:
            if hasattr(self, 'group_name'):
                await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception:
            pass

    async def session_escalated(self, event):
        """Send escalated session data to superuser dashboards."""
        await self.send_json({
            "type": "session.escalated",
            "session": event.get("session")
        })

class VIPConsumer(AsyncJsonWebsocketConsumer):
    """Handle WebSocket connections for VIP dashboards."""
    async def connect(self):
        self.user = self.scope.get("user", None)

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4401)
            return

        # Check if user is VIP
        @sync_to_async
        def check_vip():
            if hasattr(self.user, 'staff_profile') and self.user.staff_profile:
                from departments.models import StaffProfile
                return self.user.staff_profile.role == StaffProfile.ROLE_VIP
            return False

        is_vip = await check_vip()
        if not is_vip:
            await self.close(code=4403)
            return

        self.group_name = "vip"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send_json({
            "type": "vip.joined",
            "message": "Connected to VIP dashboard"
        })

    async def disconnect(self, code):
        try:
            if hasattr(self, 'group_name'):
                await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception:
            pass

    async def session_escalated(self, event):
        """Send escalated session data to VIP dashboards."""
        await self.send_json({
            "type": "session.escalated",
            "session": event.get("session")
        })

    async def session_rerouted(self, event):
        """Send rerouted session data to VIP dashboards."""
        await self.send_json({
            "type": "session.rerouted",
            "session": event.get("session"),
            "department_name": event.get("department_name")
        })
