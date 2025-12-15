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
        
        # Verify user has staff profile
        if not hasattr(staff, 'staff_profile') or not staff.staff_profile:
            return Response({"error": "User has no staff profile."}, status=400)
        
        staff_profile = staff.staff_profile
        department = staff_profile.department
        
        if not department:
            return Response({"error": "Staff member is not assigned to a department."}, status=400)
        
        lang = request.query_params.get('lang', 'uz')
        status = request.query_params.get('status', 'unassigned')
        search = request.query_params.get('search', '')
        neighborhood_id = request.query_params.get('neighborhood_id')
        staff_uuid_param = request.query_params.get('staff_uuid')

        queryset = Session.objects.select_related('citizen', 'citizen__neighborhood', 'assigned_staff', 'assigned_department')

        # Status-based filtering
        # Always exclude escalated sessions from staff views (they go to superuser)
        queryset = queryset.exclude(status='escalated')
        
        if status == 'unassigned':
            # Filter unassigned sessions that belong to the staff's department
            # CRITICAL: Also filter by status='unassigned' to ensure we only get unassigned sessions
            queryset = queryset.filter(assigned_staff__isnull=True, assigned_department=department, status='unassigned')
        elif status == 'assigned':
            # Require staff_uuid parameter for assigned status
            if not staff_uuid_param:
                return Response({"error": "staff_uuid parameter is required when status is 'assigned'."}, status=400)
            
            try:
                # Normalize UUID format: Python's UUID() constructor handles both formats
                # (with and without hyphens). Django ORM will convert to database format.
                # Note: For MySQL raw SQL queries, you may need to remove hyphens,
                # but Django ORM handles the conversion automatically.
                uuid_obj = uuid.UUID(staff_uuid_param.replace('-', '') if len(staff_uuid_param) == 32 else staff_uuid_param)
                # CRITICAL: Filter by both assigned_staff AND status='assigned'
                queryset = queryset.filter(assigned_staff__user_uuid=uuid_obj, status='assigned')
            except (ValueError, Exception) as e:
                # If UUID parsing fails, return error
                return Response({"error": f"Invalid staff_uuid format: {str(e)}"}, status=400)
        elif status == 'closed':
            # Require staff_uuid parameter for closed status
            if not staff_uuid_param:
                return Response({"error": "staff_uuid parameter is required when status is 'closed'."}, status=400)
            
            try:
                # Normalize UUID format: Python's UUID() constructor handles both formats
                # (with and without hyphens). Django ORM will convert to database format.
                uuid_obj = uuid.UUID(staff_uuid_param.replace('-', '') if len(staff_uuid_param) == 32 else staff_uuid_param)
                # CRITICAL: Filter by both assigned_staff AND status='closed'
                queryset = queryset.filter(assigned_staff__user_uuid=uuid_obj, status='closed')
            except (ValueError, Exception) as e:
                # If UUID parsing fails, return error
                return Response({"error": f"Invalid staff_uuid format: {str(e)}"}, status=400)

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

        # On-demand SLA breach check for real-time accuracy
        for ticket in tickets:
            if ticket.sla_deadline:
                ticket.check_sla_breach()
                # Save if breach status changed (optional - can be done in bulk)
                ticket.save(update_fields=['sla_breached'])

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
