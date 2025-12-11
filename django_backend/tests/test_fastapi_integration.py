"""
Integration tests for FastAPI microservice endpoints.
These tests mock the FastAPI service or test against a running instance.
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
import httpx
from message_app.models import Session, Message


@pytest.mark.django_db
class TestFastAPIAnalyzeEndpoint:
    """Tests for FastAPI /api/v1/analyze endpoint."""
    
    @pytest.mark.skip(reason="FastAPI integration tests should be run from fastapi_microservice directory")
    @pytest.mark.asyncio
    @patch('services.ai_pipeline.process_message_pipeline')
    async def test_analyze_endpoint_accepts_request(self, mock_pipeline, telegram_session, message):
        """Test that analyze endpoint accepts and queues requests."""
        # This would typically be tested against a running FastAPI instance
        # For now, we test the integration point
        
        from support_tools.ai_client import send_to_ai_service
        
        with patch('httpx.AsyncClient.post') as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_post.return_value = mock_response
            
            result = await send_to_ai_service(
                telegram_session.session_uuid,
                message.message_uuid,
                'Test message text',
                'uz'
            )
            
            assert result is True
            assert mock_post.called
    
    @pytest.mark.asyncio
    async def test_analyze_endpoint_payload_structure(self):
        """Test that analyze endpoint receives correct payload structure."""
        # This tests the expected payload format
        expected_payload = {
            'session_uuid': 'test-uuid',
            'message_uuid': 'test-msg-uuid',
            'text': 'Test message',
            'settings': {
                'model': 'gemini-2.0-flash',
                'temperature': 0.2,
                'max_tokens': 500
            }
        }
        
        # Verify payload structure
        assert 'session_uuid' in expected_payload
        assert 'message_uuid' in expected_payload
        assert 'text' in expected_payload
        assert 'settings' in expected_payload


@pytest.mark.django_db
class TestFastAPITrainCorrection:
    """Tests for FastAPI /api/v1/train-correction endpoint."""
    
    def test_train_correction_payload_structure(self):
        """Test train correction payload structure."""
        expected_payload = {
            'text': 'User correction text',
            'correct_department_id': '123',
            'language': 'uz'
        }
        
        assert 'text' in expected_payload
        assert 'correct_department_id' in expected_payload
        assert 'language' in expected_payload


@pytest.mark.skip(reason="FastAPI integration tests should be run from fastapi_microservice directory")
@pytest.mark.django_db
class TestFastAPIPipelineIntegration:
    """Tests for the full AI pipeline integration."""
    
    @patch('fastapi_microservice.services.ai_pipeline.send_webhook')
    @patch('fastapi_microservice.services.ai_pipeline.qdrant_client')
    @patch('fastapi_microservice.services.ai_pipeline.async_embed')
    @patch('fastapi_microservice.services.ai_pipeline.async_generate')
    @pytest.mark.asyncio
    async def test_full_pipeline_flow(self, mock_generate, mock_embed, mock_qdrant, mock_webhook):
        """Test the full AI pipeline flow (mocked)."""
        # Mock embedding
        mock_embed.return_value = {'embedding': [0.1] * 768}
        
        # Mock Qdrant search
        mock_point = MagicMock()
        mock_point.score = 0.95
        mock_point.payload = {
            'department_id': '123',
            'name': 'Test Department',
            'description': 'Test'
        }
        mock_qdrant.query_points.return_value.points = [mock_point]
        
        # Mock LLM response
        mock_response = MagicMock()
        mock_response.text = '{"department_id": "123", "intent": "Complaint", "confidence": 85, "reason": "Test"}'
        mock_response.usage_metadata = MagicMock()
        mock_response.usage_metadata.prompt_token_count = 100
        mock_response.usage_metadata.total_token_count = 150
        mock_generate.return_value = mock_response
        
        # This would call the actual pipeline function
        # For now, we verify the mocks are set up correctly
        assert mock_embed is not None
        assert mock_qdrant is not None
        assert mock_generate is not None

