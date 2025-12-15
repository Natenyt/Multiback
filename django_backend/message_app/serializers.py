from rest_framework import serializers
from django.urls import reverse
from message_app.models import Session, Message, MessageContent
from support_tools.models import Neighborhood
from django.contrib.auth import get_user_model

User = get_user_model()



class TicketListSerializer(serializers.ModelSerializer):
    session_id = serializers.CharField(source='session_uuid')
    citizen_name = serializers.CharField(source='citizen.full_name')
    phone_number = serializers.CharField(source='citizen.phone_number')
    location = serializers.CharField(source='citizen.location')
    preview_text = serializers.SerializerMethodField()
    neighborhood = serializers.SerializerMethodField()
    intent_label = serializers.CharField(read_only=True)
    assigned_staff = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    origin = serializers.CharField(read_only=True)

    def get_preview_text(self, obj):
        # Take the first MessageContent text if available
        first_message = obj.messages.order_by('created_at').first()
        if first_message:
            content = first_message.contents.filter(content_type='text').first()
            return content.text if content else ''
        return ''

    def get_neighborhood(self, obj):
        lang = self.context.get('lang', 'uz')
        neighborhood = obj.citizen.neighborhood
        if neighborhood and neighborhood.is_active:
            return {
                "id": neighborhood.id,
                "name_uz": neighborhood.name_uz,
                "name_ru": neighborhood.name_ru,
                "name": neighborhood.name_uz if lang == 'uz' else neighborhood.name_ru
            }
        return None

    def get_assigned_staff(self, obj):
        if obj.assigned_staff:
            return {
                "user_uuid": str(obj.assigned_staff.user_uuid),
                "full_name": obj.assigned_staff.full_name,
                "avatar_url": None  # Can be added if needed
            }
        return None

    def get_department_name(self, obj):
        if obj.assigned_department:
            lang = self.context.get('lang', 'uz')
            return obj.assigned_department.name_uz if lang == 'uz' else obj.assigned_department.name_ru
        return None

    class Meta:
        model = Session
        fields = [
            'session_id', 
            'location', 
            'citizen_name', 
            'phone_number', 
            'created_at', 
            'neighborhood', 
            'preview_text',
            'intent_label',
            'assigned_staff',
            'department_name',
            'origin'
        ]




class MessageContentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = MessageContent
        fields = [
            "id",
            "content_type",
            "text",
            "caption",
            "file_url",
            "telegram_file_id",
            "media_group_id",
            "thumbnail_url",
            "created_at",
        ]

    def get_file_url(self, obj):
        request = self.context.get('request')
        # Priority: local file (FileField) -> stored file_url -> telegram proxy
        if obj.file:
            try:
                url = obj.file.url
                return request.build_absolute_uri(url) if request else url
            except Exception:
                pass
        if obj.file_url:
            return obj.file_url
        if obj.telegram_file_id:
            # Proxy endpoint by content id
            path = reverse('telegram-proxy', args=[obj.id])
            return request.build_absolute_uri(path) if request else path
        return None

    def get_thumbnail_url(self, obj):
        request = self.context.get('request')
        # Return thumbnail endpoint for images and videos (backend will handle generation or proxy)
        if obj.content_type in ('image', 'video'):
            path = reverse('thumbnail-proxy', args=[obj.id])
            return request.build_absolute_uri(path) if request else path
        # For other types, no thumbnail
        return None


class MessageSerializer(serializers.ModelSerializer):
    contents = MessageContentSerializer(many=True, read_only=True)
    sender = serializers.SerializerMethodField()
    is_me = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "message_uuid",
            "created_at",
            "delivered_at",
            "read_at",
            "is_staff_message",
            "is_me",
            "sender_platform",
            "sender",
            "contents",
        ]

    def get_sender(self, obj):
        if obj.sender:
            s = obj.sender
            avatar = None
            try:
                avatar = s.avatar.url if getattr(s, 'avatar', None) else None
            except Exception:
                avatar = None
            request = self.context.get('request')
            avatar_url = request.build_absolute_uri(avatar) if (request and avatar) else avatar
            return {
                "user_uuid": str(s.user_uuid),
                "full_name": s.full_name,
                "avatar_url": avatar_url
            }
        # System
        return {"user_uuid": None, "full_name": "System", "avatar_url": None}

    def get_is_me(self, obj):
        request = self.context.get('request')
        if not request or not getattr(request, 'user', None) or not obj.sender:
            return False
        try:
            return str(obj.sender.user_uuid) == str(request.user.user_uuid)
        except Exception:
            return False


class SessionSerializer(serializers.ModelSerializer):
    assigned_staff = serializers.SerializerMethodField()
    citizen = serializers.SerializerMethodField()
    phone_number = serializers.SerializerMethodField()
    neighborhood = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = [
            "session_uuid",
            "status",
            "origin",
            "created_at",
            "assigned_staff",
            "citizen",
            "last_messaged",
            "sla_deadline",
            "sla_breached",
            "is_hold",
            "intent_label",
            "description",
            "phone_number",
            "neighborhood",
            "location",
            "department_name",
        ]

    def get_assigned_staff(self, obj):
        if obj.assigned_staff:
            s = obj.assigned_staff
            avatar = None
            try:
                avatar = s.avatar.url if getattr(s, 'avatar', None) else None
            except Exception:
                avatar = None
            request = self.context.get('request')
            avatar_url = request.build_absolute_uri(avatar) if (request and avatar) else avatar
            return {
                "user_uuid": str(s.user_uuid),
                "full_name": s.full_name,
                "avatar_url": avatar_url
            }
        return None

    def get_citizen(self, obj):
        u = obj.citizen
        avatar = None
        try:
            avatar = u.avatar.url if getattr(u, 'avatar', None) else None
        except Exception:
            avatar = None
        request = self.context.get('request')
        avatar_url = request.build_absolute_uri(avatar) if (request and avatar) else avatar
        return {
            "user_uuid": str(u.user_uuid),
            "full_name": u.full_name,
            "avatar_url": avatar_url,
            "phone_number": getattr(u, 'phone_number', None),
            "location": getattr(u, 'location', None),
            "neighborhood": self._get_neighborhood(u.neighborhood) if hasattr(u, 'neighborhood') and u.neighborhood else None
        }
    
    def _get_neighborhood(self, neighborhood):
        if not neighborhood or not neighborhood.is_active:
            return None
        lang = self.context.get('lang', 'uz')
        return {
            "id": neighborhood.id,
            "name_uz": neighborhood.name_uz,
            "name_ru": neighborhood.name_ru,
            "name": neighborhood.name_uz if lang == 'uz' else neighborhood.name_ru
        }
    
    def get_phone_number(self, obj):
        return getattr(obj.citizen, 'phone_number', None) if obj.citizen else None
    
    def get_neighborhood(self, obj):
        if obj.citizen and hasattr(obj.citizen, 'neighborhood') and obj.citizen.neighborhood:
            return self._get_neighborhood(obj.citizen.neighborhood)
        return None
    
    def get_location(self, obj):
        return getattr(obj.citizen, 'location', None) if obj.citizen else None
    
    def get_department_name(self, obj):
        if obj.assigned_department:
            lang = self.context.get('lang', 'uz')
            return obj.assigned_department.name_uz if lang == 'uz' else obj.assigned_department.name_ru
        return None
