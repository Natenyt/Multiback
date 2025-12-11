"""
Tests for ticket-related endpoints.
"""
import pytest
from rest_framework import status
from message_app.models import Session, Message, MessageContent


@pytest.mark.django_db
class TestTicketList:
    """Tests for GET /api/tickets/ endpoint."""
    
    def test_ticket_list_unassigned(self, authenticated_staff_client, staff_profile, multiple_sessions):
        """Test listing unassigned tickets."""
        response = authenticated_staff_client.get('/api/tickets/', {
            'status': 'unassigned'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
    
    def test_ticket_list_assigned(self, authenticated_staff_client, staff_user, staff_profile, assigned_session):
        """Test listing assigned tickets."""
        response = authenticated_staff_client.get('/api/tickets/', {
            'status': 'assigned'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
    
    def test_ticket_list_with_search(self, authenticated_staff_client, staff_profile, telegram_session):
        """Test ticket list with search query."""
        response = authenticated_staff_client.get('/api/tickets/', {
            'search': str(telegram_session.session_uuid)[:8]
        })
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_ticket_list_with_neighborhood_filter(self, authenticated_staff_client, staff_profile, neighborhood, telegram_session):
        """Test ticket list filtered by neighborhood."""
        telegram_session.citizen.neighborhood = neighborhood
        telegram_session.citizen.save()
        
        response = authenticated_staff_client.get('/api/tickets/', {
            'neighborhood_id': neighborhood.id
        })
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_ticket_list_pagination(self, authenticated_staff_client, staff_profile, multiple_sessions):
        """Test ticket list pagination."""
        response = authenticated_staff_client.get('/api/tickets/', {
            'page': 1,
            'page_size': 2
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) <= 2
    
    def test_ticket_list_unauthorized(self, api_client):
        """Test that unauthenticated users cannot access ticket list."""
        response = api_client.get('/api/tickets/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestTicketHistory:
    """Tests for GET /api/tickets/{uuid}/history/ endpoint."""
    
    def test_ticket_history_staff_access(self, authenticated_staff_client, staff_profile, assigned_session, message):
        """Test staff can access assigned session history."""
        response = authenticated_staff_client.get(
            f'/api/tickets/{assigned_session.session_uuid}/history/'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert 'session' in response.data
        assert 'messages' in response.data
    
    def test_ticket_history_citizen_access(self, authenticated_citizen_client, web_session, message):
        """Test citizen can access their own session history."""
        response = authenticated_citizen_client.get(
            f'/api/tickets/{web_session.session_uuid}/history/'
        )
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_ticket_history_forbidden(self, authenticated_staff_client, staff_profile, telegram_session):
        """Test staff cannot access sessions from other departments."""
        # Create session with different department
        from departments.models import Department
        other_dept = Department.objects.create(name_uz='Other Dept', is_active=True)
        telegram_session.assigned_department = other_dept
        telegram_session.save()
        
        response = authenticated_staff_client.get(
            f'/api/tickets/{telegram_session.session_uuid}/history/'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_ticket_history_pagination(self, authenticated_staff_client, staff_profile, assigned_session):
        """Test ticket history pagination."""
        # Create multiple messages
        for i in range(5):
            msg = Message.objects.create(
                session=assigned_session,
                sender=assigned_session.citizen,
                is_staff_message=False,
                sender_platform='telegram'
            )
            MessageContent.objects.create(
                message=msg,
                content_type='text',
                text=f'Message {i}'
            )
        
        response = authenticated_staff_client.get(
            f'/api/tickets/{assigned_session.session_uuid}/history/'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert 'next' in response.data
        assert 'has_more' in response.data


@pytest.mark.django_db
class TestSendMessage:
    """Tests for POST /api/tickets/{uuid}/send/ endpoint."""
    
    def test_send_text_message_staff(self, authenticated_staff_client, staff_profile, assigned_session):
        """Test staff can send text message."""
        response = authenticated_staff_client.post(
            f'/api/tickets/{assigned_session.session_uuid}/send/',
            {
                'text': 'Hello from staff',
                'client_message_id': 'test-msg-1'
            },
            format='multipart'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'message' in response.data
        assert response.data['message']['contents'][0]['text'] == 'Hello from staff'
    
    def test_send_message_citizen(self, authenticated_citizen_client, web_session):
        """Test citizen can send message to their web session."""
        response = authenticated_citizen_client.post(
            f'/api/tickets/{web_session.session_uuid}/send/',
            {
                'text': 'Hello from citizen',
                'client_message_id': 'citizen-msg-1'
            },
            format='multipart'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_send_message_duplicate_id(self, authenticated_staff_client, staff_profile, assigned_session):
        """Test duplicate client_message_id is handled."""
        # Send first message
        authenticated_staff_client.post(
            f'/api/tickets/{assigned_session.session_uuid}/send/',
            {
                'text': 'First message',
                'client_message_id': 'duplicate-id'
            },
            format='multipart'
        )
        
        # Send duplicate
        response = authenticated_staff_client.post(
            f'/api/tickets/{assigned_session.session_uuid}/send/',
            {
                'text': 'Duplicate message',
                'client_message_id': 'duplicate-id'
            },
            format='multipart'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data.get('note') == 'Duplicate message skipped'
    
    def test_send_message_assign_self(self, authenticated_staff_client, staff_profile, telegram_session):
        """Test staff can assign themselves when sending message."""
        assert telegram_session.assigned_staff is None
        
        response = authenticated_staff_client.post(
            f'/api/tickets/{telegram_session.session_uuid}/send/',
            {
                'text': 'Assigning myself',
                'assign_self': True
            },
            format='multipart'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        telegram_session.refresh_from_db()
        assert telegram_session.assigned_staff is not None
    
    def test_send_message_forbidden(self, authenticated_citizen_client, telegram_session):
        """Test citizen cannot send to telegram session via web."""
        response = authenticated_citizen_client.post(
            f'/api/tickets/{telegram_session.session_uuid}/send/',
            {
                'text': 'Should fail'
            },
            format='multipart'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestMarkRead:
    """Tests for POST /api/tickets/{uuid}/mark-read/ endpoint."""
    
    def test_mark_all_read(self, authenticated_staff_client, staff_profile, assigned_session, message):
        """Test marking all messages as read."""
        response = authenticated_staff_client.post(
            f'/api/tickets/{assigned_session.session_uuid}/mark-read/',
            {},
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert 'marked_count' in response.data
        assert response.data['status'] == 'ok'
    
    def test_mark_until_message(self, authenticated_staff_client, staff_profile, assigned_session):
        """Test marking messages until a specific message."""
        # Create multiple messages
        messages = []
        for i in range(3):
            msg = Message.objects.create(
                session=assigned_session,
                sender=assigned_session.citizen,
                is_staff_message=False,
                sender_platform='telegram'
            )
            MessageContent.objects.create(
                message=msg,
                content_type='text',
                text=f'Message {i}'
            )
            messages.append(msg)
        
        response = authenticated_staff_client.post(
            f'/api/tickets/{assigned_session.session_uuid}/mark-read/',
            {
                'until_message_uuid': str(messages[1].message_uuid)
            },
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['marked_count'] >= 0

