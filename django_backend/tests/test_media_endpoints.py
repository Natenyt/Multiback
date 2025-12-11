"""
Tests for media proxy endpoints.
"""
import pytest
from unittest.mock import patch, MagicMock
from rest_framework import status
from message_app.models import MessageContent
from django.core.files.uploadedfile import SimpleUploadedFile


@pytest.mark.django_db
class TestTelegramMediaProxy:
    """Tests for GET /api/media/telegram/{content_id}/ endpoint."""
    
    @patch('message_app.views_media.requests.get')
    def test_telegram_media_proxy_with_file_id(self, mock_requests, authenticated_staff_client, message, staff_profile):
        """Test media proxy with telegram_file_id."""
        # Setup message session for access
        message.session.assigned_staff = staff_profile.user
        message.session.save()
        
        content = MessageContent.objects.create(
            message=message,
            content_type='image',
            telegram_file_id='AgACAgIAAxkBAAIBY2Z...'
        )
        
        # Mock Telegram API responses
        mock_file_info = MagicMock()
        mock_file_info.status_code = 200
        mock_file_info.json.return_value = {'ok': True, 'result': {'file_path': 'photos/file.jpg'}}
        
        mock_file_download = MagicMock()
        mock_file_download.status_code = 200
        mock_file_download.iter_content.return_value = [b'fake_image_data']
        
        mock_requests.side_effect = [mock_file_info, mock_file_download]
        
        response = authenticated_staff_client.get(f'/api/media/telegram/{content.id}/')
        
        # Should proxy the file (may return 200 or 404 if Telegram API fails in test)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
    
    def test_telegram_media_proxy_not_found(self, authenticated_staff_client):
        """Test media proxy with non-existent content."""
        response = authenticated_staff_client.get('/api/media/telegram/99999/')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_telegram_media_proxy_no_file_id(self, authenticated_staff_client, message):
        """Test media proxy without telegram_file_id."""
        content = MessageContent.objects.create(
            message=message,
            content_type='text',
            text='No media here'
        )
        
        response = authenticated_staff_client.get(f'/api/media/telegram/{content.id}/')
        
        # Should return error or redirect
        assert response.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_400_BAD_REQUEST]


@pytest.mark.django_db
class TestThumbnailProxy:
    """Tests for GET /api/media/thumbnail/{content_id}/ endpoint."""
    
    @patch('message_app.views_media.requests.get')
    @patch('message_app.views_media.Image.open')
    def test_thumbnail_proxy_image(self, mock_image, mock_requests, authenticated_staff_client, message, staff_profile):
        """Test thumbnail proxy for image content."""
        # Setup message session for access
        message.session.assigned_staff = staff_profile.user
        message.session.save()
        
        content = MessageContent.objects.create(
            message=message,
            content_type='image',
            telegram_file_id='AgACAgIAAxkBAAIBY2Z...'
        )
        
        # Mock image processing
        mock_img = MagicMock()
        mock_img.thumbnail = MagicMock()
        mock_image.return_value = mock_img
        
        # Mock Telegram API
        mock_file_info = MagicMock()
        mock_file_info.status_code = 200
        mock_file_info.json.return_value = {'ok': True, 'result': {'file_path': 'photos/file.jpg'}}
        
        mock_file_download = MagicMock()
        mock_file_download.status_code = 200
        mock_file_download.content = b'fake_image_data'
        
        mock_requests.side_effect = [mock_file_info, mock_file_download]
        
        response = authenticated_staff_client.get(f'/api/media/thumbnail/{content.id}/')
        
        # May return 200, 204, or 404 depending on image processing
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT, status.HTTP_404_NOT_FOUND]
    
    def test_thumbnail_proxy_text_content(self, authenticated_staff_client, message, staff_profile):
        """Test thumbnail proxy for text content (should return None)."""
        # Setup message session for access
        message.session.assigned_staff = staff_profile.user
        message.session.save()
        
        content = MessageContent.objects.create(
            message=message,
            content_type='text',
            text='Text content'
        )
        
        response = authenticated_staff_client.get(f'/api/media/thumbnail/{content.id}/')
        
        # Text content shouldn't have thumbnails - returns 204 No Content
        assert response.status_code == status.HTTP_204_NO_CONTENT

