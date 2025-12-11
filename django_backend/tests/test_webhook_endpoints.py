"""
Tests for webhook endpoints (internal and AI).
"""
import pytest
from unittest.mock import patch, MagicMock
from rest_framework import status
from message_app.models import Session, Message
from ai_endpoints.models import InjectionLog, AIAnalysis
from departments.models import Department


@pytest.mark.django_db
class TestInjectionAlert:
    """Tests for POST /api/internal/injection-alert/ endpoint."""
    
    def test_injection_alert_success(self, api_client, message):
        """Test successful injection alert processing."""
        data = {
            'message_uuid': str(message.message_uuid),
            'risk_score': 0.95,
            'reason': 'Potential injection detected'
        }
        
        response = api_client.post('/api/internal/injection-alert/', data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert InjectionLog.objects.filter(message=message).exists()
    
    def test_injection_alert_missing_message(self, api_client):
        """Test injection alert with non-existent message."""
        data = {
            'message_uuid': '00000000-0000-0000-0000-000000000000',
            'risk_score': 0.95,
            'reason': 'Test'
        }
        
        response = api_client.post('/api/internal/injection-alert/', data, format='json')
        
        # Should still return 200 (graceful handling)
        assert response.status_code == status.HTTP_200_OK
        assert not InjectionLog.objects.exists()


@pytest.mark.django_db
class TestRoutingResult:
    """Tests for POST /api/internal/routing-result/ endpoint."""
    
    @patch('api.views.requests.post')
    def test_routing_result_success(self, mock_post, api_client, telegram_session, message, department):
        """Test successful routing result processing."""
        mock_post.return_value.status_code = 200
        
        data = {
            'session_uuid': str(telegram_session.session_uuid),
            'message_uuid': str(message.message_uuid),
            'suggested_department_id': department.id,
            'intent_label': 'Complaint',
            'confidence_score': 85,
            'reason': 'User complaint about infrastructure',
            'language_detected': 'uz',
            'vector_search_results': [],
            'embedding_tokens': 100,
            'prompt_tokens': 200,
            'total_tokens': 300,
            'processing_time_ms': 1500
        }
        
        response = api_client.post('/api/internal/routing-result/', data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert AIAnalysis.objects.filter(session=telegram_session).exists()
        # Verify webhook was called
        assert mock_post.called
    
    def test_routing_result_missing_session(self, api_client, message):
        """Test routing result with non-existent session."""
        data = {
            'session_uuid': '00000000-0000-0000-0000-000000000000',
            'message_uuid': str(message.message_uuid),
            'suggested_department_id': 1
        }
        
        response = api_client.post('/api/internal/routing-result/', data, format='json')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_routing_result_no_department(self, api_client, telegram_session, message):
        """Test routing result without department ID."""
        data = {
            'session_uuid': str(telegram_session.session_uuid),
            'message_uuid': str(message.message_uuid),
            'intent_label': 'Inquiry',
            'confidence_score': 50
        }
        
        response = api_client.post('/api/internal/routing-result/', data, format='json')
        
        # Should still process but not call webhook
        assert response.status_code == status.HTTP_200_OK
        assert AIAnalysis.objects.filter(session=telegram_session).exists()


@pytest.mark.django_db
class TestAIWebhook:
    """Tests for POST /api/ai/route_message/ endpoint."""
    
    @patch('message_app.views_ai_webhook.validate_webhook_request', return_value=True)
    @patch('message_app.views_ai_webhook.broadcast_session_created')
    @patch('message_app.views_ai_webhook.broadcast_message_created')
    def test_ai_webhook_success(self, mock_broadcast_msg, mock_broadcast_session, 
                                 mock_validate, api_client, telegram_session, message, department):
        """Test successful AI webhook processing."""
        data = {
            'session_uuid': str(telegram_session.session_uuid),
            'message_uuid': str(message.message_uuid),
            'department_id': department.id
        }
        
        response = api_client.post('/api/ai/route_message/', data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        telegram_session.refresh_from_db()
        assert telegram_session.assigned_department == department
        assert telegram_session.status == 'assigned'
        assert mock_broadcast_session.called
        assert mock_broadcast_msg.called
    
    @patch('message_app.views_ai_webhook.validate_webhook_request', return_value=False)
    def test_ai_webhook_unauthorized(self, mock_validate, api_client, telegram_session, message, department):
        """Test AI webhook with unauthorized request."""
        data = {
            'session_uuid': str(telegram_session.session_uuid),
            'message_uuid': str(message.message_uuid),
            'department_id': department.id
        }
        
        response = api_client.post('/api/ai/route_message/', data, format='json')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    @patch('message_app.views_ai_webhook.validate_webhook_request', return_value=True)
    def test_ai_webhook_missing_fields(self, mock_validate, api_client):
        """Test AI webhook with missing required fields."""
        data = {
            'session_uuid': '00000000-0000-0000-0000-000000000000'
            # Missing message_uuid and department_id
        }
        
        response = api_client.post('/api/ai/route_message/', data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    @patch('message_app.views_ai_webhook.validate_webhook_request', return_value=True)
    def test_ai_webhook_invalid_session(self, mock_validate, api_client, message, department):
        """Test AI webhook with non-existent session."""
        data = {
            'session_uuid': '00000000-0000-0000-0000-000000000000',
            'message_uuid': str(message.message_uuid),
            'department_id': department.id
        }
        
        response = api_client.post('/api/ai/route_message/', data, format='json')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND




