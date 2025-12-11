"""
Pytest configuration and shared fixtures for all tests.
"""
import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from message_app.models import Session, Message, MessageContent
from departments.models import Department, StaffProfile
from support_tools.models import Neighborhood
from users.models import TelegramConnection

User = get_user_model()


@pytest.fixture
def api_client():
    """Returns an API client for making requests."""
    return APIClient()


@pytest.fixture
def django_client():
    """Returns a Django test client."""
    return Client()


@pytest.fixture
def citizen_user(db):
    """Creates a citizen user for testing."""
    user = User.objects.create_user(
        phone_number='+998901234567',
        full_name='Test Citizen',
        is_active=True,
        is_verified=True
    )
    return user


@pytest.fixture
def staff_user(db):
    """Creates a staff user with profile for testing."""
    user = User.objects.create_user(
        phone_number='+998901234568',
        full_name='Test Staff',
        is_active=True,
        is_verified=True,
        password='testpass123'  # Set password for login tests
    )
    return user


@pytest.fixture
def department(db):
    """Creates a test department."""
    dept = Department.objects.create(
        name_uz='Test Department',
        name_ru='Тестовый отдел',
        description_uz='Test description',
        is_active=True
    )
    return dept


@pytest.fixture
def staff_profile(db, staff_user, department):
    """Creates a staff profile linked to a user and department."""
    profile = StaffProfile.objects.create(
        user=staff_user,
        department=department,
        role=StaffProfile.ROLE_STAFF,
        username='teststaff'
    )
    return profile


@pytest.fixture
def neighborhood(db):
    """Creates a test neighborhood."""
    return Neighborhood.objects.create(
        name_uz='Test Neighborhood',
        name_ru='Тестовый район',
        is_active=True
    )


@pytest.fixture
def authenticated_citizen_client(api_client, citizen_user):
    """Returns an authenticated API client for a citizen."""
    refresh = RefreshToken.for_user(citizen_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def authenticated_staff_client(api_client, staff_user):
    """Returns an authenticated API client for staff."""
    refresh = RefreshToken.for_user(staff_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def telegram_session(db, citizen_user, department):
    """Creates a Telegram-origin session."""
    session = Session.objects.create(
        citizen=citizen_user,
        assigned_department=department,
        origin='telegram',
        status='unassigned'
    )
    return session


@pytest.fixture
def web_session(db, citizen_user, department):
    """Creates a web-origin session."""
    session = Session.objects.create(
        citizen=citizen_user,
        assigned_department=department,
        origin='web',
        status='unassigned'
    )
    return session


@pytest.fixture
def assigned_session(db, citizen_user, staff_user, department):
    """Creates an assigned session."""
    session = Session.objects.create(
        citizen=citizen_user,
        assigned_staff=staff_user,
        assigned_department=department,
        origin='telegram',
        status='assigned'
    )
    return session


@pytest.fixture
def message(db, telegram_session, citizen_user):
    """Creates a test message."""
    msg = Message.objects.create(
        session=telegram_session,
        sender=citizen_user,
        is_staff_message=False,
        sender_platform='telegram'
    )
    MessageContent.objects.create(
        message=msg,
        content_type='text',
        text='Test message content'
    )
    return msg


@pytest.fixture
def telegram_connection(db, citizen_user):
    """Creates a Telegram connection for a user."""
    return TelegramConnection.objects.create(
        user=citizen_user,
        telegram_chat_id=123456789,
        telegram_username='testuser',
        language_preference='uz'
    )


@pytest.fixture
def multiple_sessions(db, citizen_user, department):
    """Creates multiple sessions for testing list endpoints."""
    sessions = []
    for i in range(5):
        session = Session.objects.create(
            citizen=citizen_user,
            assigned_department=department,
            origin='telegram',
            status='unassigned' if i % 2 == 0 else 'assigned'
        )
        sessions.append(session)
    return sessions

