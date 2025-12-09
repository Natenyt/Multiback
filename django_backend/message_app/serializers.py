from rest_framework import serializers
from message_app.models import Session, Message, MessageContent
from support_tools.models import Neighborhood
from django.contrib.auth import get_user_model

User = get_user_model()

class MessageContentSerializer(serializers.ModelSerializer):
    file_name = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()

    class Meta:
        model = MessageContent
        fields = ['id', 'content_type', 'text', 'caption', 'file', 'file_name', 'file_size', 'created_at']

    def get_file_name(self, obj):
        if obj.file:
            return obj.file.name.split('/')[-1]
        return None

    def get_file_size(self, obj):
        if obj.file:
            try:
                 return obj.file.size
            except:
                 return None
        return None

class MessageSerializer(serializers.ModelSerializer):
    contents = MessageContentSerializer(many=True, read_only=True)
    sender_name = serializers.SerializerMethodField()
    is_me = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['message_uuid', 'sender_platform', 'is_staff_message', 'created_at', 'contents', 'sender_name', 'is_me']

    def get_sender_name(self, obj):
        if obj.sender:
            return obj.sender.full_name or "Unknown"
        return "System"
    
    def get_is_me(self, obj):
        request = self.context.get('request')
        if request and request.user and obj.sender:
            return obj.sender.user_uuid == request.user.user_uuid
        return False

class SessionListSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    last_message_timestamp = serializers.SerializerMethodField()
    assigned_staff_name = serializers.CharField(source='assigned_staff.full_name', read_only=True)
    assigned_staff_avatar = serializers.ImageField(source='assigned_staff.avatar', read_only=True)
    neighborhood_name = serializers.CharField(source='user.neighborhood', read_only=True)
    location = serializers.CharField(source='user.location', read_only=True)

    class Meta:
        model = Session
        fields = ['session_uuid', 'status', 'created_at', 'last_message', 'last_message_timestamp', 'assigned_staff_name', 'assigned_staff_avatar', 'neighborhood_name', 'location']

    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
             content = last_msg.contents.first()
             if content:
                 if content.content_type == 'text':
                     return content.text[:50] + "..." if len(content.text) > 50 else content.text
                 return f"[{content.content_type}]"
        return "No messages"

    def get_last_message_timestamp(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return last_msg.created_at
        return obj.created_at

class SessionCreateSerializer(serializers.Serializer):
    """
    Handles the creation of a NEW appeal (Session + Initial Message).
    """
    neighborhood_id = serializers.IntegerField(required=False)
    location = serializers.CharField(required=False, max_length=256)
    text = serializers.CharField(required=False)
    # File handling will be done in View (Multipart/Form-data is tricky in nested serializers)

class ChatHistorySerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Session
        fields = ['session_uuid', 'status', 'messages']







# tickets/serializers.py
class TicketListSerializer(serializers.ModelSerializer):
    session_id = serializers.CharField(source='session_uuid')
    citizen_name = serializers.CharField(source='user.full_name')
    location = serializers.CharField(source='user.location')
    preview_text = serializers.SerializerMethodField()
    neighborhood = serializers.SerializerMethodField()

    def get_preview_text(self, obj):
        # Take the first MessageContent text if available
        first_message = obj.messages.order_by('created_at').first()
        if first_message:
            content = first_message.contents.filter(content_type='text').first()
            return content.text if content else ''
        return ''

    def get_neighborhood(self, obj):
        lang = self.context.get('lang', 'uz')
        neighborhood = obj.user.neighborhood
        if neighborhood and neighborhood.is_active:
            return neighborhood.name_uz if lang == 'uz' else neighborhood.name_ru
        return None

    class Meta:
        model = Session
        fields = ['session_id', 'location', 'citizen_name', 'created_at', 'neighborhood', 'preview_text']




