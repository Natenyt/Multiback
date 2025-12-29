"""
Tests for authentication endpoints.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework import status

User = get_user_model()


@pytest.mark.django_db
class TestStaffLogin:
    """Tests for staff login endpoint."""
    
    def test_staff_login_success(self, api_client, staff_user, staff_profile):
        """Test successful staff login."""
        response = api_client.post('/api/auth/staff-login/', {
            'username': staff_profile.username,
            'password': 'testpass123'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert response.data['role'] == 'staff'
        assert response.data['user_uuid'] == str(staff_user.user_uuid)
    
    def test_staff_login_invalid_credentials(self, api_client, staff_user, staff_profile):
        """Test login with invalid credentials."""
        response = api_client.post('/api/auth/staff-login/', {
            'username': staff_profile.username,
            'password': 'wrongpassword'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_staff_login_missing_fields(self, api_client):
        """Test login with missing required fields."""
        response = api_client.post('/api/auth/staff-login/', {
            'username': 'testuser'
            # Missing password
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_staff_login_nonexistent_user(self, api_client):
        """Test login with non-existent username."""
        response = api_client.post('/api/auth/staff-login/', {
            'username': 'nonexistent',
            'password': 'testpass123'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_staff_login_citizen_user(self, api_client, citizen_user):
        """Test that citizen users cannot login as staff."""
        # Create a user without staff profile
        response = api_client.post('/api/auth/staff-login/', {
            'username': citizen_user.phone_number,
            'password': 'testpass123'
        })
        
        # Should fail because citizen has no staff profile
        assert response.status_code == status.HTTP_400_BAD_REQUEST




