from rest_framework import serializers
from .models import QuickReply

class QuickReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = QuickReply
        fields = ["id", "text", "order", "category"]
