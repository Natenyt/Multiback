from rest_framework import generics, permissions, status, parsers
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Session, Message, MessageContent
from .serializers import (
    SessionListSerializer, 
    SessionCreateSerializer, 
    MessageSerializer,
    ChatHistorySerializer
)
from support_tools.models import Neighborhood
from message_app.routing import route_message # Reuse existing logic!
from django.db.models import Q # Add this import
from asgiref.sync import async_to_sync
from support_tools.ai_client import send_to_ai_service
from channels.layers import get_channel_layer
import uuid
from rest_framework import generics
from rest_framework.serializers import ModelSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Session
from .serializers import TicketListSerializer

class AppealListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SessionListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Session.objects.filter(user=user).order_by('-created_at')
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            if status_filter == 'active':
                qs = qs.exclude(status='closed')
            elif status_filter == 'closed':
                qs = qs.filter(status='closed')
        
        return qs

class AppealCreateView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser] # Important for files
    serializer_class = SessionCreateSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        user = request.user
        
        # 1. Create Session
        session = Session.objects.create(
            user=user,
            status='open'
        )
        
        # 2. Create Initial Message
        msg = Message.objects.create(
            session=session,
            sender=user,
            sender_platform='web', 
            is_staff_message=False
        )
        
        # 3. Create Content (Text)
        text_content = data.get('text', "")
        if text_content:
            MessageContent.objects.create(
                message=msg,
                content_type='text',
                text=text_content
            )
            
        # 4. Create Content (File/Voice)
        for key in ['file', 'voice', 'image']:
            if key in request.FILES:
                uploaded_file = request.FILES[key]
                ctype = 'file'
                if key == 'voice': ctype = 'voice'
                elif key == 'image': ctype = 'image'
                
                MessageContent.objects.create(
                    message=msg,
                    content_type=ctype,
                    file=uploaded_file
                )

        # 5. Trigger AI Analysis
        if text_content:
            try:
                async_to_sync(send_to_ai_service)(
                    session_uuid=session.session_uuid,
                    message_uuid=msg.message_uuid,
                    text=text_content,
                    language=getattr(user, 'preferred_language', 'uz')
                )
            except Exception as e:
                print(f"Error dispatching to AI Service: {e}")
        
        # Return full session details
        response_serializer = SessionListSerializer(session)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

class AppealDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SessionListSerializer
    lookup_field = 'session_uuid'
    
    def get_queryset(self):
        return Session.objects.filter(user=self.request.user)

class ChatHistoryView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChatHistorySerializer
    lookup_field = 'session_uuid'
    
    def get_queryset(self):
        # Allow if user is owner OR if user is assigned staff
        user = self.request.user
        return Session.objects.filter(
            Q(user=user) | Q(assigned_staff=user)
        )

class ChatSendView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, session_uuid):
        user = request.user
        session = get_object_or_404(Session, session_uuid=session_uuid)
        
        # Security: Can this user post here?
        if session.user != user and session.assigned_staff != user:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
            
        msg = Message.objects.create(
            session=session,
            sender=user,
            sender_platform='web',
            is_staff_message=(session.assigned_staff == user)
        )
        
        # Handle Text
        text = request.data.get('text')
        if text:
            MessageContent.objects.create(message=msg, content_type='text', text=text)
            
        # Handle Media
        if 'file' in request.FILES:
             MessageContent.objects.create(message=msg, content_type='file', file=request.FILES['file'])
        
        # Add 'voice' handling
        if 'voice' in request.FILES:
             MessageContent.objects.create(message=msg, content_type='voice', file=request.FILES['voice'])

        # Add 'image' handling
        if 'image' in request.FILES:
             MessageContent.objects.create(message=msg, content_type='image', file=request.FILES['image'])

        # Broadcast to WebSocket
        try:
            serializer = MessageSerializer(msg, context={'request': request})
            layer = get_channel_layer()
            async_to_sync(layer.group_send)(
                f"chat_{session_uuid}",
                {
                    "type": "chat_message", # Must match handler in Consumer (chat_message)
                    "message": serializer.data
                }
            )
        except Exception as e:
            print(f"WebSocket Broadcast Error: {e}")

        return Response({"status": "sent", "message_uuid": str(msg.message_uuid)}, status=status.HTTP_201_CREATED)




class TicketListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        staff = request.user
        lang = request.query_params.get('lang', 'uz')
        status = request.query_params.get('status', 'unassigned')
        search = request.query_params.get('search', '')
        neighborhood_id = request.query_params.get('neighborhood_id')

        queryset = Session.objects.select_related('user', 'user__neighborhood')

        # Status-based filtering
        if status == 'unassigned':
            queryset = queryset.filter(assigned_staff__isnull=True, assigned_department=staff.staff_profile.department)
        elif status == 'assigned':
            queryset = queryset.filter(assigned_staff=staff)
        elif status == 'closed':
            queryset = queryset.filter(assigned_staff=staff, status='closed')

        # Search by ID or User Full Name (partial match)
        if search:
            queryset = queryset.filter(
                Q(session_uuid__icontains=search) |
                Q(user__full_name__icontains=search)
            )

        # Neighborhood filter
        if neighborhood_id:
            queryset = queryset.filter(user__neighborhood_id=neighborhood_id, user__neighborhood__is_active=True)
        else:
            # exclude inactive neighborhoods
            queryset = queryset.filter(
                Q(user__neighborhood__isnull=True) | Q(user__neighborhood__is_active=True)
            )

        # Pagination (optional: simple)
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        tickets = queryset.order_by('-created_at')[start:end]

        serializer = TicketListSerializer(tickets, many=True, context={'lang': lang})
        return Response(serializer.data)




# tickets/views.py

class NeighborhoodSerializer(ModelSerializer):
    class Meta:
        model = Neighborhood
        fields = ['id', 'name_uz', 'name_ru']

class NeighborhoodSearchAPIView(generics.ListAPIView):
    serializer_class = NeighborhoodSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        query = self.request.query_params.get('search', '')
        lang = self.request.query_params.get('lang', 'uz')

        queryset = Neighborhood.objects.filter(is_active=True)
        if query:
            if lang == 'uz':
                queryset = queryset.filter(name_uz__icontains=query)
            else:
                queryset = queryset.filter(name_ru__icontains=query)
        return queryset[:20]  # Limit top 20
