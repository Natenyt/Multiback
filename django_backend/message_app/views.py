from rest_framework import generics, permissions, status, parsers
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Session, Message, MessageContent
from support_tools.models import Neighborhood
from django.db.models import Q
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
from departments.models import StaffProfile


class TicketListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        staff = request.user
        
        # Verify staff profile exists.
        if not hasattr(staff, 'staff_profile') or not staff.staff_profile:
            return Response({"error": "User has no staff profile."}, status=400)
        
        staff_profile = staff.staff_profile
        department = staff_profile.department
        
        lang = request.query_params.get('lang', 'uz')
        status = request.query_params.get('status', 'unassigned')
        search = request.query_params.get('search', '')
        neighborhood_id = request.query_params.get('neighborhood_id')
        staff_uuid_param = request.query_params.get('staff_uuid')

        queryset = Session.objects.select_related('citizen', 'citizen__neighborhood', 'assigned_staff', 'assigned_department')

        # Status-based filtering.
        if status == 'escalated':
            # Only VIP members can view escalated sessions.
            if staff_profile.role != StaffProfile.ROLE_VIP:
                return Response({"error": "Only VIP members can view escalated sessions."}, status=403)
            queryset = queryset.filter(status='escalated')
        else:
            # Require department assignment for non-escalated statuses.
            if not department:
                return Response({"error": "Staff member is not assigned to a department."}, status=400)
            # Exclude escalated sessions from regular staff views.
            queryset = queryset.exclude(status='escalated')
        
        if status == 'unassigned':
            # Filter unassigned sessions for the staff's department.
            queryset = queryset.filter(assigned_staff__isnull=True, assigned_department=department, status='unassigned')
        elif status == 'assigned':
            # Require staff_uuid parameter.
            if not staff_uuid_param:
                return Response({"error": "staff_uuid parameter is required when status is 'assigned'."}, status=400)
            
            try:
                # Normalize UUID format.
                uuid_obj = uuid.UUID(staff_uuid_param.replace('-', '') if len(staff_uuid_param) == 32 else staff_uuid_param)
                # Filter by assigned staff and status.
                queryset = queryset.filter(assigned_staff__user_uuid=uuid_obj, status='assigned')
            except (ValueError, Exception) as e:
                # Handle invalid UUID format.
                return Response({"error": f"Invalid staff_uuid format: {str(e)}"}, status=400)
        elif status == 'closed':
            # Require staff_uuid parameter.
            if not staff_uuid_param:
                return Response({"error": "staff_uuid parameter is required when status is 'closed'."}, status=400)
            
            try:
                # Normalize UUID format.
                uuid_obj = uuid.UUID(staff_uuid_param.replace('-', '') if len(staff_uuid_param) == 32 else staff_uuid_param)
                # Filter by assigned staff and status.
                queryset = queryset.filter(assigned_staff__user_uuid=uuid_obj, status='closed')
            except (ValueError, Exception) as e:
                # Handle invalid UUID format.
                return Response({"error": f"Invalid staff_uuid format: {str(e)}"}, status=400)

        # Search by ID or full name.
        if search:
            queryset = queryset.filter(
                Q(session_uuid__icontains=search) |
                Q(citizen__full_name__icontains=search)
            )

        # Neighborhood filter (skip for escalated sessions).
        if status != 'escalated':
            if neighborhood_id:
                queryset = queryset.filter(citizen__neighborhood_id=neighborhood_id, citizen__neighborhood__is_active=True)
            else:
                # Exclude inactive neighborhoods.
                queryset = queryset.filter(
                    Q(citizen__neighborhood__isnull=True) | Q(citizen__neighborhood__is_active=True)
                )

        # Pagination.
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        tickets = queryset.order_by('-created_at')[start:end]

        # Check SLA breach status in real-time.
        for ticket in tickets:
            if ticket.sla_deadline:
                ticket.check_sla_breach()
                # Persist breach status.
                ticket.save(update_fields=['sla_breached'])

        serializer = TicketListSerializer(tickets, many=True, context={'lang': lang})
        return Response(serializer.data)





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
        return queryset[:20]
