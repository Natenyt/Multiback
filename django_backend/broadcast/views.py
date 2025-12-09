from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Broadcast, BroadcastAcknowledgment

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_broadcast(request):
    user = request.user
    now = timezone.now()

    # Active broadcasts only
    broadcast = Broadcast.objects.filter(
        Q(expires_at__gt=now) | Q(expires_at__isnull=True),
        is_active=True
    ).order_by('-created_at').first()

    if not broadcast:
        return Response({"broadcast": None})

    # Check acknowledgment
    ack_record = BroadcastAcknowledgment.objects.filter(
        broadcast=broadcast,
        staff=user
    ).first()

    return Response({
        "id": broadcast.id,
        "title": broadcast.title,
        "message": broadcast.message,
        "priority": broadcast.priority,
        "expires_at": broadcast.expires_at,
        "is_acknowledged": ack_record.is_acknowledged if ack_record else False
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def broadcast_seen(request, id):
    user = request.user
    broadcast = get_object_or_404(Broadcast, id=id)

    ack_record, created = BroadcastAcknowledgment.objects.get_or_create(
        broadcast=broadcast,
        staff=user
    )
    
    # Update read_at every time user views
    ack_record.read_at = timezone.now()
    ack_record.save()

    return Response({"status": "seen", "read_at": ack_record.read_at})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def broadcast_ack(request, id):
    user = request.user
    broadcast = get_object_or_404(Broadcast, id=id)

    ack_record, created = BroadcastAcknowledgment.objects.get_or_create(
        broadcast=broadcast,
        staff=user
    )

    # Update acknowledgment status
    ack_record.is_acknowledged = True
    ack_record.acknowledged_at = timezone.now()
    ack_record.save()

    return Response({
        "status": "acknowledged", 
        "is_acknowledged": True,
        "acknowledged_at": ack_record.acknowledged_at
    })
