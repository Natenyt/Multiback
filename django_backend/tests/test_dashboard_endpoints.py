"""
Tests for dashboard endpoints.
"""
import pytest
from rest_framework import status
from django.utils import timezone
from departments.models import StaffDailyPerformance
from message_app.models import Session


@pytest.mark.django_db
class TestDashboardStats:
    """Tests for GET /api/dashboard/stats/ endpoint."""
    
    def test_dashboard_stats_success(self, authenticated_staff_client, staff_profile, department):
        """Test successful retrieval of dashboard stats."""
        # Create some test data
        Session.objects.create(
            citizen=staff_profile.user,  # Using staff as citizen for simplicity
            assigned_department=department,
            status='unassigned',
            origin='telegram'
        )
        Session.objects.create(
            citizen=staff_profile.user,
            assigned_department=department,
            assigned_staff=staff_profile.user,
            status='assigned',
            origin='telegram'
        )
        
        response = authenticated_staff_client.get('/api/dashboard/stats/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'unassigned_count' in response.data
        assert 'active_count' in response.data
        assert 'solved_today' in response.data
        assert 'completion_rate' in response.data
        assert 'personal_best_record' in response.data
        assert 'personal_best_today' in response.data
    
    def test_dashboard_stats_no_profile(self, authenticated_citizen_client):
        """Test that users without staff profile cannot access stats."""
        response = authenticated_citizen_client.get('/api/dashboard/stats/')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_dashboard_stats_with_daily_performance(self, authenticated_staff_client, staff_profile, department):
        """Test stats with existing daily performance record."""
        today = timezone.now().date()
        StaffDailyPerformance.objects.create(
            staff=staff_profile.user,
            date=today,
            tickets_solved=5,
            avg_response_time_seconds=120.5
        )
        
        response = authenticated_staff_client.get('/api/dashboard/stats/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['solved_today'] == 5
        assert response.data['avg_response_time'] == 120.5


@pytest.mark.django_db
class TestDashboardLeaderboard:
    """Tests for GET /api/dashboard/leaderboard/ endpoint."""
    
    def test_leaderboard_success(self, authenticated_staff_client, staff_profile, department):
        """Test successful retrieval of leaderboard."""
        # Create performance data
        today = timezone.now().date()
        StaffDailyPerformance.objects.create(
            staff=staff_profile.user,
            date=today,
            tickets_solved=10
        )
        
        response = authenticated_staff_client.get('/api/dashboard/leaderboard/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'leaderboard' in response.data
        assert 'user_stats' in response.data
        assert isinstance(response.data['leaderboard'], list)
    
    def test_leaderboard_language_preference(self, authenticated_staff_client, staff_profile):
        """Test leaderboard respects language preference."""
        response = authenticated_staff_client.get(
            '/api/dashboard/leaderboard/',
            HTTP_ACCEPT_LANGUAGE='ru'
        )
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_leaderboard_top_10_limit(self, authenticated_staff_client, staff_profile, department):
        """Test leaderboard returns max 10 entries."""
        # Create multiple staff with performance
        from django.contrib.auth import get_user_model
        from departments.models import StaffProfile
        User = get_user_model()
        
        for i in range(15):
            user = User.objects.create_user(
                phone_number=f'+9989012345{i:02d}',
                full_name=f'Staff {i}'
            )
            profile = StaffProfile.objects.create(
                user=user,
                department=department,
                username=f'staff{i}'
            )
            StaffDailyPerformance.objects.create(
                staff=user,
                date=timezone.now().date(),
                tickets_solved=15 - i
            )
        
        response = authenticated_staff_client.get('/api/dashboard/leaderboard/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['leaderboard']) <= 10

