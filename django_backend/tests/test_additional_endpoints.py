"""
Tests for additional endpoints (broadcast, neighborhoods, etc.).
"""
import pytest
from rest_framework import status
from support_tools.models import Neighborhood
from broadcast.models import Broadcast, BroadcastAcknowledgment
from django.utils import timezone
from datetime import timedelta


@pytest.mark.django_db
class TestNeighborhoodSearch:
    """Tests for GET /api/neighborhoods/ endpoint."""
    
    def test_neighborhood_search_success(self, authenticated_staff_client):
        """Test successful neighborhood search."""
        # Create test neighborhoods
        Neighborhood.objects.create(name_uz='Tinchlik', name_ru='Тинчлик', is_active=True)
        Neighborhood.objects.create(name_uz='Yunusobod', name_ru='Юнусабад', is_active=True)
        
        response = authenticated_staff_client.get('/api/neighborhoods/', {
            'search': 'Tinch'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0
    
    def test_neighborhood_search_language(self, authenticated_staff_client):
        """Test neighborhood search with language preference."""
        Neighborhood.objects.create(name_uz='Tinchlik', name_ru='Тинчлик', is_active=True)
        
        response = authenticated_staff_client.get('/api/neighborhoods/', {
            'search': 'Тинч',
            'lang': 'ru'
        })
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_neighborhood_search_inactive(self, authenticated_staff_client):
        """Test that inactive neighborhoods are excluded."""
        Neighborhood.objects.create(name_uz='Inactive', name_ru='Неактивный', is_active=False)
        
        response = authenticated_staff_client.get('/api/neighborhoods/')
        
        assert response.status_code == status.HTTP_200_OK
        # Should not include inactive neighborhoods
        assert all(n['name_uz'] != 'Inactive' for n in response.data if 'name_uz' in n)


@pytest.mark.django_db
class TestBroadcastEndpoints:
    """Tests for broadcast-related endpoints."""
    
    def test_broadcast_list(self, authenticated_staff_client, staff_user):
        """Test GET /api/dashboard/broadcast/ endpoint."""
        # Create test broadcast
        Broadcast.objects.create(
            title='Test Broadcast',
            message='Test message',
            created_by=staff_user,
            expires_at=timezone.now() + timedelta(days=1),
            is_active=True
        )
        
        response = authenticated_staff_client.get('/api/dashboard/broadcast/')
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_broadcast_ack(self, authenticated_staff_client, staff_user):
        """Test POST /api/dashboard/broadcast/{id}/ack/ endpoint."""
        broadcast = Broadcast.objects.create(
            title='Test Broadcast',
            message='Test message',
            created_by=staff_user,
            expires_at=timezone.now() + timedelta(days=1),
            is_active=True
        )
        
        response = authenticated_staff_client.post(f'/api/dashboard/broadcast/{broadcast.id}/ack/')
        
        assert response.status_code == status.HTTP_200_OK
        assert BroadcastAcknowledgment.objects.filter(
            broadcast=broadcast,
            staff=staff_user
        ).exists()
    
    def test_broadcast_seen(self, authenticated_staff_client, staff_user):
        """Test POST /api/dashboard/broadcast/{id}/seen/ endpoint."""
        broadcast = Broadcast.objects.create(
            title='Test Broadcast',
            message='Test message',
            created_by=staff_user,
            expires_at=timezone.now() + timedelta(days=1),
            is_active=True
        )
        
        response = authenticated_staff_client.post(f'/api/dashboard/broadcast/{broadcast.id}/seen/')
        
        assert response.status_code == status.HTTP_200_OK

