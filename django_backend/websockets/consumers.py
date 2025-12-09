import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # The URL route is: ws/chat/<session_uuid>/
        self.session_uuid = self.scope['url_route']['kwargs']['session_uuid']
        self.room_group_name = f'chat_{self.session_uuid}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket (Client -> Server)
    # Note: Currently, messages are sent via HTTP API, but we might support direct WS sending later.
    # For now, this handles "typing" events mainly.
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        event_type = text_data_json.get('type')
        
        if event_type == 'typing':
            # Broadcast "typing" to others in the room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_typing',
                    'sender_id': text_data_json.get('sender_id'),
                    'is_typing': text_data_json.get('is_typing', False)
                }
            )

    # --- Handlers for Group Messages (Server -> Client) ---

    async def chat_message(self, event):
        """
        Called when a new message is sent via HTTP API and broadcasted to this group.
        """
        await self.send(text_data=json.dumps({
            'type': 'chat.message',
            'message': event['message'] # Serialized message data
        }))

    async def chat_typing(self, event):
        """
        Called when someone is typing.
        """
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'sender_id': event['sender_id'],
            'is_typing': event['is_typing']
        }))

    async def status_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'status.update',
            'status': event['status']
        }))

    async def staff_join(self, event):
        await self.send(text_data=json.dumps({
            'type': 'staff.join',
            'staff': event['staff'] # Staff info
        }))
