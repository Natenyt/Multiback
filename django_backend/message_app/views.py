from rest_framework import generics, permissions, status, parsers
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Session, Message, MessageContent
from support_tools.models import Neighborhood
from django.db.models import Q # Add this import
from asgiref.sync import async_to_sync
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
from .serializers import TicketListSerializer, MessageSerializer, MessageContentSerializer, SessionSerializer


class TicketListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        staff = request.user
        lang = request.query_params.get('lang', 'uz')
        status = request.query_params.get('status', 'unassigned')
        search = request.query_params.get('search', '')
        neighborhood_id = request.query_params.get('neighborhood_id')

        queryset = Session.objects.select_related('citizen', 'citizen__neighborhood')

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
                Q(citizen__full_name__icontains=search)
            )

        # Neighborhood filter
        if neighborhood_id:
            queryset = queryset.filter(citizen__neighborhood_id=neighborhood_id, citizen__neighborhood__is_active=True)
        else:
            # exclude inactive neighborhoods
            queryset = queryset.filter(
                Q(citizen__neighborhood__isnull=True) | Q(citizen__neighborhood__is_active=True)
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
