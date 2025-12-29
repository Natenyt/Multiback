# message_app/serializers_send.py
from rest_framework import serializers

class MessageCreateSerializer(serializers.Serializer):
    text = serializers.CharField(required=False, allow_blank=True)
    client_message_id = serializers.CharField(required=False, allow_blank=True)
    assign_self = serializers.BooleanField(required=False, default=False)
    # Files come in request.FILES; we don't model them here
