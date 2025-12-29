from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import QuickReply
from .serializers import QuickReplySerializer


class QuickReplyListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Model Meta already defines ordering by ['order', 'id']
        replies = QuickReply.objects.all()
        serializer = QuickReplySerializer(replies, many=True)
        return Response(serializer.data)
