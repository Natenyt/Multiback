"""
Comprehensive test suite for the leaderboard API endpoint.
Tests the actual implementation that counts closed sessions.
"""
import pytest
from rest_framework import status
from django.utils import timezone
from django.contrib.auth import get_user_model
from message_app.models import Session
from departments.models import StaffProfile, Department

User = get_user_model()


@pytest.mark.django_db
class TestLeaderboardAPI:
    """Comprehensive tests for GET /api/dashboard/leaderboard/ endpoint."""
    
    def test_leaderboard_with_closed_sessions(self, authenticated_staff_client, staff_profile, department):
        """Test leaderboard returns data when there are closed sessions."""
        # Create a citizen user
        citizen = User.objects.create_user(
            phone_number='+998901234500',
            full_name='Test Citizen'
        )
        
        # Create closed sessions for the staff member
        for i in range(5):
            Session.objects.create(
                citizen=citizen,
                assigned_department=department,
                assigned_staff=staff_profile.user,
                status='closed',
                origin='web'
            )
        
        response = authenticated_staff_client.get('/api/dashboard/leaderboard/')
        
        # Debug: Print the actual response data
        print("\n" + "="*80)
        print("LEADERBOARD API RESPONSE:")
        print("="*80)
        import json
        print(json.dumps(response.data, indent=2, default=str))
        print("="*80 + "\n")
        
        assert response.status_code == status.HTTP_200_OK
        assert 'leaderboard' in response.data
        assert isinstance(response.data['leaderboard'], list)
        assert len(response.data['leaderboard']) > 0
        
        # Check first entry structure
        first_entry = response.data['leaderboard'][0]
        assert 'full_name' in first_entry
        assert 'rank' in first_entry
        assert 'department_name' in first_entry
        assert 'solved_total' in first_entry
        assert 'avatar_url' in first_entry
        assert first_entry['solved_total'] == 5
        assert first_entry['rank'] == 1
    
    def test_leaderboard_returns_top_5(self, authenticated_staff_client, staff_profile, department):
        """Test leaderboard returns exactly top 5 staff members."""
        import uuid
        # Create multiple staff members
        staff_users = []
        for i in range(7):
            user = User.objects.create_user(
                phone_number=f'+9989012345{i:02d}',
                full_name=f'Staff {i}'
            )
            profile = StaffProfile.objects.create(
                user=user,
                department=department,
                username=f'staff{i}'
            )
            staff_users.append(user)
        
        # Create a citizen user with unique phone number
        unique_phone = f'+9989012345{uuid.uuid4().hex[:2]}'
        citizen = User.objects.create_user(
            phone_number=unique_phone,
            full_name='Test Citizen'
        )
        
        # Create closed sessions with different counts for each staff
        for i, staff_user in enumerate(staff_users):
            count = 10 - i  # Decreasing counts: 10, 9, 8, 7, 6, 5, 4
            for _ in range(count):
                Session.objects.create(
                    citizen=citizen,
                    assigned_department=department,
                    assigned_staff=staff_user,
                    status='closed',
                    origin='web'
                )
        
        response = authenticated_staff_client.get('/api/dashboard/leaderboard/')
        
        # Debug: Print the actual response data
        print("\n" + "="*80)
        print("LEADERBOARD API RESPONSE (Top 5):")
        print("="*80)
        import json
        print(json.dumps(response.data, indent=2, default=str))
        print("="*80 + "\n")
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['leaderboard']) == 5  # Should return exactly 5
        
        # Verify scores are in descending order and ranks are correct
        scores = [entry['solved_total'] for entry in response.data['leaderboard']]
        ranks = [entry['rank'] for entry in response.data['leaderboard']]
        assert scores == [10, 9, 8, 7, 6]  # Top 5 scores
        assert ranks == [1, 2, 3, 4, 5]  # Ranks should be 1-5
    
    def test_leaderboard_no_closed_sessions(self, authenticated_staff_client, staff_profile, department):
        """Test leaderboard returns empty list when no closed sessions exist."""
        response = authenticated_staff_client.get('/api/dashboard/leaderboard/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'leaderboard' in response.data
        assert isinstance(response.data['leaderboard'], list)
        assert len(response.data['leaderboard']) == 0
    
    def test_leaderboard_excludes_unassigned_closed(self, authenticated_staff_client, staff_profile, department):
        """Test leaderboard excludes closed sessions without assigned_staff."""
        citizen = User.objects.create_user(
            phone_number='+998901234500',
            full_name='Test Citizen'
        )
        
        # Create closed session without assigned_staff
        Session.objects.create(
            citizen=citizen,
            assigned_department=department,
            assigned_staff=None,  # No assigned staff
            status='closed',
            origin='web'
        )
        
        response = authenticated_staff_client.get('/api/dashboard/leaderboard/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['leaderboard']) == 0  # Should be empty
    
    def test_leaderboard_excludes_non_closed_sessions(self, authenticated_staff_client, staff_profile, department):
        """Test leaderboard only counts closed sessions, not assigned/unassigned."""
        citizen = User.objects.create_user(
            phone_number='+998901234500',
            full_name='Test Citizen'
        )
        
        # Create non-closed sessions
        Session.objects.create(
            citizen=citizen,
            assigned_department=department,
            assigned_staff=staff_profile.user,
            status='assigned',
            origin='web'
        )
        Session.objects.create(
            citizen=citizen,
            assigned_department=department,
            assigned_staff=staff_profile.user,
            status='unassigned',
            origin='web'
        )
        
        response = authenticated_staff_client.get('/api/dashboard/leaderboard/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['leaderboard']) == 0  # Should be empty
    
    def test_leaderboard_response_structure(self, authenticated_staff_client, staff_profile, department):
        """Test leaderboard response has correct structure."""
        citizen = User.objects.create_user(
            phone_number='+998901234500',
            full_name='Test Citizen'
        )
        
        # Create closed session
        Session.objects.create(
            citizen=citizen,
            assigned_department=department,
            assigned_staff=staff_profile.user,
            status='closed',
            origin='web'
        )
        
        response = authenticated_staff_client.get('/api/dashboard/leaderboard/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'leaderboard' in response.data
        
        if len(response.data['leaderboard']) > 0:
            entry = response.data['leaderboard'][0]
            required_fields = ['full_name', 'rank', 'department_name', 'solved_total', 'avatar_url']
            for field in required_fields:
                assert field in entry, f"Missing field: {field}"
            
            # Check field types
            assert isinstance(entry['full_name'], str)
            assert isinstance(entry['rank'], int)
            assert isinstance(entry['department_name'], str)
            assert isinstance(entry['solved_total'], int)
            assert entry['avatar_url'] is None or isinstance(entry['avatar_url'], str)
    
    def test_leaderboard_all_time_count(self, authenticated_staff_client, staff_profile, department):
        """Test leaderboard counts all-time closed sessions, not just recent ones."""
        citizen = User.objects.create_user(
            phone_number='+998901234500',
            full_name='Test Citizen'
        )
        
        # Create closed sessions from different time periods
        from datetime import timedelta
        now = timezone.now()
        
        # Old closed session (30 days ago)
        old_session = Session.objects.create(
            citizen=citizen,
            assigned_department=department,
            assigned_staff=staff_profile.user,
            status='closed',
            origin='web'
        )
        old_session.created_at = now - timedelta(days=30)
        old_session.closed_at = now - timedelta(days=30)
        old_session.save(update_fields=['created_at', 'closed_at'])
        
        # Recent closed session (today)
        Session.objects.create(
            citizen=citizen,
            assigned_department=department,
            assigned_staff=staff_profile.user,
            status='closed',
            origin='web'
        )
        
        response = authenticated_staff_client.get('/api/dashboard/leaderboard/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['leaderboard']) == 1
        assert response.data['leaderboard'][0]['solved_total'] == 2  # Both sessions should be counted
        assert response.data['leaderboard'][0]['rank'] == 1  # Should be rank 1

