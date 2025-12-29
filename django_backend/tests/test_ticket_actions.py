"""
Tests for ticket action endpoints:
- POST /api/tickets/{id}/assign/
- POST /api/tickets/{id}/hold/
- POST /api/tickets/{id}/escalate/
- POST /api/tickets/{id}/close/
- GET /api/quick-replies/
"""
import pytest
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from django.conf import settings

from django.contrib.auth import get_user_model
from message_app.models import Session
from departments.models import Department, StaffProfile, StaffDailyPerformance
from support_tools.models import QuickReply

User = get_user_model()


@pytest.mark.django_db
class TestTicketAssign:
    """Tests for POST /api/tickets/{session_uuid}/assign/ endpoint."""
    
    def test_assign_success(self, authenticated_staff_client, staff_user, staff_profile, telegram_session):
        """Test successful assignment of unassigned session."""
        assert telegram_session.assigned_staff is None
        assert telegram_session.status == 'unassigned'
        
        response = authenticated_staff_client.post(
            f'/api/tickets/{telegram_session.session_uuid}/assign/'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'assigned'
        assert 'session' in response.data
        assert 'message' in response.data
        
        # Verify session was updated
        telegram_session.refresh_from_db()
        assert telegram_session.assigned_staff == staff_user
        assert telegram_session.status == 'assigned'
        assert telegram_session.sla_deadline is not None
        
        # Verify SLA deadline is set correctly
        expected_deadline = timezone.now() + timedelta(days=settings.SLA_THRESHOLD_DAYS)
        assert abs((telegram_session.sla_deadline - expected_deadline).total_seconds()) < 60  # Within 1 minute
    
    def test_assign_already_assigned_to_self(self, authenticated_staff_client, staff_user, staff_profile, assigned_session):
        """Test that reassigning a session already assigned to the same staff member returns an error."""
        assert assigned_session.assigned_staff == staff_user
        assert assigned_session.status == 'assigned'
        
        # Set SLA deadline to ensure it's not reinitialized
        original_sla_deadline = timezone.now() + timedelta(days=2)
        assigned_session.sla_deadline = original_sla_deadline
        assigned_session.save()
        
        response = authenticated_staff_client.post(
            f'/api/tickets/{assigned_session.session_uuid}/assign/'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already assigned to you' in response.data['detail']
        
        # Verify SLA deadline was not reinitialized
        assigned_session.refresh_from_db()
        assert assigned_session.sla_deadline == original_sla_deadline
    
    def test_assign_fails_for_non_staff(self, authenticated_citizen_client, telegram_session):
        """Test that non-staff users cannot assign tickets."""
        response = authenticated_citizen_client.post(
            f'/api/tickets/{telegram_session.session_uuid}/assign/'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'Only staff members' in response.data['detail']
    
    def test_assign_fails_for_different_department(self, api_client, staff_user, staff_profile, department, citizen_user):
        """Test that staff from different department cannot assign."""
        # Create another department
        other_dept = Department.objects.create(
            name_uz='Other Department',
            name_ru='Другой отдел',
            is_active=True
        )
        
        # Create another staff user in different department
        other_staff = User.objects.create_user(
            phone_number='+998901234569',
            full_name='Other Staff',
            is_active=True,
            is_verified=True
        )
        StaffProfile.objects.create(
            user=other_staff,
            department=other_dept,
            role=StaffProfile.ROLE_STAFF
        )
        
        # Create session in original department
        session = Session.objects.create(
            citizen=citizen_user,
            assigned_department=department,
            origin='telegram',
            status='unassigned'
        )
        
        # Authenticate as other staff
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(other_staff)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = api_client.post(f'/api/tickets/{session.session_uuid}/assign/')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'only assign tickets from your department' in response.data['detail']
    
    def test_assign_fails_for_already_assigned_to_other(self, api_client, staff_user, staff_profile, department, citizen_user):
        """Test that staff cannot assign session already assigned to another staff."""
        # Create another staff user
        other_staff = User.objects.create_user(
            phone_number='+998901234569',
            full_name='Other Staff',
            is_active=True,
            is_verified=True
        )
        StaffProfile.objects.create(
            user=other_staff,
            department=department,
            role=StaffProfile.ROLE_STAFF
        )
        
        # Create session assigned to other staff
        session = Session.objects.create(
            citizen=citizen_user,
            assigned_staff=other_staff,
            assigned_department=department,
            origin='telegram',
            status='assigned'
        )
        
        # Authenticate as original staff
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(staff_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = api_client.post(f'/api/tickets/{session.session_uuid}/assign/')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already assigned to another staff member' in response.data['detail']
    
    def test_assign_fails_for_closed_session(self, authenticated_staff_client, staff_user, staff_profile, citizen_user, department):
        """Test that closed sessions cannot be assigned."""
        closed_session = Session.objects.create(
            citizen=citizen_user,
            assigned_department=department,
            origin='telegram',
            status='closed',
            closed_at=timezone.now()
        )
        
        response = authenticated_staff_client.post(
            f'/api/tickets/{closed_session.session_uuid}/assign/'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Cannot assign a closed ticket' in response.data['detail']


@pytest.mark.django_db
class TestTicketHold:
    """Tests for POST /api/tickets/{session_uuid}/hold/ endpoint."""
    
    @pytest.fixture
    def assigned_session_with_sla(self, db, citizen_user, staff_user, department):
        """Creates an assigned session with SLA deadline set."""
        session = Session.objects.create(
            citizen=citizen_user,
            assigned_staff=staff_user,
            assigned_department=department,
            origin='telegram',
            status='assigned',
            sla_deadline=timezone.now() + timedelta(days=settings.SLA_THRESHOLD_DAYS)
        )
        return session
    
    def test_hold_success(self, authenticated_staff_client, staff_user, staff_profile, assigned_session_with_sla):
        """Test successful hold application."""
        original_deadline = assigned_session_with_sla.sla_deadline
        assert assigned_session_with_sla.is_hold is False
        
        response = authenticated_staff_client.post(
            f'/api/tickets/{assigned_session_with_sla.session_uuid}/hold/'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'hold_applied'
        assert 'session' in response.data
        assert 'message' in response.data
        
        # Verify session was updated
        assigned_session_with_sla.refresh_from_db()
        assert assigned_session_with_sla.is_hold is True
        assert assigned_session_with_sla.sla_deadline > original_deadline
        
        # Verify deadline was extended by correct amount
        expected_new_deadline = original_deadline + timedelta(days=settings.HOLD_EXTENSION_DAYS)
        assert abs((assigned_session_with_sla.sla_deadline - expected_new_deadline).total_seconds()) < 60
        
        # Verify status was NOT changed
        assert assigned_session_with_sla.status == 'assigned'
    
    def test_hold_fails_for_non_staff(self, authenticated_citizen_client, assigned_session_with_sla):
        """Test that non-staff users cannot put tickets on hold."""
        response = authenticated_citizen_client.post(
            f'/api/tickets/{assigned_session_with_sla.session_uuid}/hold/'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'Only staff members' in response.data['detail']
    
    def test_hold_fails_when_already_used(self, authenticated_staff_client, staff_user, staff_profile, assigned_session_with_sla):
        """Test that hold cannot be used twice."""
        # First hold
        assigned_session_with_sla.is_hold = True
        assigned_session_with_sla.save()
        
        response = authenticated_staff_client.post(
            f'/api/tickets/{assigned_session_with_sla.session_uuid}/hold/'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Hold has already been used' in response.data['detail']
    
    def test_hold_fails_for_closed_session(self, authenticated_staff_client, staff_user, staff_profile, citizen_user, department):
        """Test that closed sessions cannot be put on hold."""
        closed_session = Session.objects.create(
            citizen=citizen_user,
            assigned_staff=staff_user,
            assigned_department=department,
            origin='telegram',
            status='closed',
            closed_at=timezone.now(),
            sla_deadline=timezone.now() + timedelta(days=1)
        )
        
        response = authenticated_staff_client.post(
            f'/api/tickets/{closed_session.session_uuid}/hold/'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Cannot put a closed ticket on hold' in response.data['detail']
    
    def test_hold_fails_without_sla_deadline(self, authenticated_staff_client, staff_user, staff_profile, assigned_session):
        """Test that session without SLA deadline cannot be put on hold."""
        assert assigned_session.sla_deadline is None
        
        response = authenticated_staff_client.post(
            f'/api/tickets/{assigned_session.session_uuid}/hold/'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'must be assigned to staff before it can be put on hold' in response.data['detail']


@pytest.mark.django_db
class TestTicketEscalate:
    """Tests for POST /api/tickets/{session_uuid}/escalate/ endpoint."""
    
    def test_escalate_success_by_assigned_staff(self, authenticated_staff_client, staff_user, staff_profile, assigned_session):
        """Test successful escalation by assigned staff."""
        assert assigned_session.status == 'assigned'
        assert assigned_session.assigned_staff == staff_user
        
        response = authenticated_staff_client.post(
            f'/api/tickets/{assigned_session.session_uuid}/escalate/'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'escalated'
        assert 'session' in response.data
        assert 'message' in response.data
        
        # Verify session was updated
        assigned_session.refresh_from_db()
        assert assigned_session.status == 'escalated'
        assert assigned_session.assigned_staff is None
        assert assigned_session.sla_deadline is None
        # assigned_department should remain unchanged
        assert assigned_session.assigned_department is not None
    
    def test_escalate_success_by_department_staff(self, authenticated_staff_client, staff_user, staff_profile, telegram_session):
        """Test successful escalation by department staff (unassigned session)."""
        assert telegram_session.status == 'unassigned'
        assert telegram_session.assigned_staff is None
        
        response = authenticated_staff_client.post(
            f'/api/tickets/{telegram_session.session_uuid}/escalate/'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'escalated'
        
        # Verify session was updated
        telegram_session.refresh_from_db()
        assert telegram_session.status == 'escalated'
        assert telegram_session.assigned_staff is None
        assert telegram_session.sla_deadline is None
    
    def test_escalate_fails_for_non_staff(self, authenticated_citizen_client, assigned_session):
        """Test that non-staff users cannot escalate tickets."""
        response = authenticated_citizen_client.post(
            f'/api/tickets/{assigned_session.session_uuid}/escalate/'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'Only staff members' in response.data['detail']
    
    def test_escalate_fails_for_different_department(self, api_client, staff_user, staff_profile, department, citizen_user):
        """Test that staff from different department cannot escalate."""
        # Create another department
        other_dept = Department.objects.create(
            name_uz='Other Department',
            name_ru='Другой отдел',
            is_active=True
        )
        
        # Create another staff user in different department
        other_staff = User.objects.create_user(
            phone_number='+998901234569',
            full_name='Other Staff',
            is_active=True,
            is_verified=True
        )
        StaffProfile.objects.create(
            user=other_staff,
            department=other_dept,
            role=StaffProfile.ROLE_STAFF
        )
        
        # Create session in original department
        session = Session.objects.create(
            citizen=citizen_user,
            assigned_department=department,
            origin='telegram',
            status='unassigned'
        )
        
        # Authenticate as other staff
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(other_staff)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = api_client.post(f'/api/tickets/{session.session_uuid}/escalate/')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'only escalate tickets from your department' in response.data['detail']
    
    def test_escalate_fails_for_closed_session(self, authenticated_staff_client, staff_user, staff_profile, citizen_user, department):
        """Test that closed sessions cannot be escalated."""
        closed_session = Session.objects.create(
            citizen=citizen_user,
            assigned_staff=staff_user,
            assigned_department=department,
            origin='telegram',
            status='closed',
            closed_at=timezone.now()
        )
        
        response = authenticated_staff_client.post(
            f'/api/tickets/{closed_session.session_uuid}/escalate/'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Cannot escalate a closed ticket' in response.data['detail']


@pytest.mark.django_db
class TestTicketClose:
    """Tests for POST /api/tickets/{session_uuid}/close/ endpoint."""
    
    def test_close_success(self, authenticated_staff_client, staff_user, staff_profile, assigned_session):
        """Test successful closure of assigned session."""
        assert assigned_session.status == 'assigned'
        assert assigned_session.closed_at is None
        
        # Get initial performance stats
        today = timezone.now().date()
        initial_perf, _ = StaffDailyPerformance.objects.get_or_create(
            staff=staff_user,
            date=today,
            defaults={'tickets_solved': 0}
        )
        initial_solved = initial_perf.tickets_solved
        initial_personal_best = staff_profile.personal_best_record
        
        response = authenticated_staff_client.post(
            f'/api/tickets/{assigned_session.session_uuid}/close/'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'closed'
        assert 'session' in response.data
        assert 'message' in response.data
        
        # Verify session was updated
        assigned_session.refresh_from_db()
        assert assigned_session.status == 'closed'
        assert assigned_session.closed_at is not None
        
        # Verify performance counter was incremented
        initial_perf.refresh_from_db()
        assert initial_perf.tickets_solved == initial_solved + 1
        
        # Verify personal_best_record was updated if needed
        staff_profile.refresh_from_db()
        if initial_perf.tickets_solved > initial_personal_best:
            assert staff_profile.personal_best_record == initial_perf.tickets_solved
        else:
            assert staff_profile.personal_best_record == initial_personal_best
    
    def test_close_updates_personal_best(self, authenticated_staff_client, staff_user, staff_profile, department, citizen_user):
        """Test that closing updates personal_best_record when exceeded."""
        # Set initial personal best to 0
        staff_profile.personal_best_record = 0
        staff_profile.save()
        
        # Create and close a session
        session = Session.objects.create(
            citizen=citizen_user,
            assigned_staff=staff_user,
            assigned_department=department,
            origin='telegram',
            status='assigned'
        )
        
        response = authenticated_staff_client.post(
            f'/api/tickets/{session.session_uuid}/close/'
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify personal best was updated
        staff_profile.refresh_from_db()
        assert staff_profile.personal_best_record == 1
    
    def test_close_fails_for_non_staff(self, authenticated_citizen_client, assigned_session):
        """Test that non-staff users cannot close tickets."""
        response = authenticated_citizen_client.post(
            f'/api/tickets/{assigned_session.session_uuid}/close/'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'Only staff members' in response.data['detail']
    
    def test_close_fails_for_non_assigned_staff(self, api_client, staff_user, staff_profile, department, citizen_user):
        """Test that only assigned staff can close."""
        # Create another staff user
        other_staff = User.objects.create_user(
            phone_number='+998901234569',
            full_name='Other Staff',
            is_active=True,
            is_verified=True
        )
        StaffProfile.objects.create(
            user=other_staff,
            department=department,
            role=StaffProfile.ROLE_STAFF
        )
        
        # Create session assigned to original staff
        session = Session.objects.create(
            citizen=citizen_user,
            assigned_staff=staff_user,
            assigned_department=department,
            origin='telegram',
            status='assigned'
        )
        
        # Authenticate as other staff
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(other_staff)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = api_client.post(f'/api/tickets/{session.session_uuid}/close/')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'Only the assigned staff member' in response.data['detail']
    
    def test_close_fails_for_already_closed(self, authenticated_staff_client, staff_user, staff_profile, citizen_user, department):
        """Test that already closed sessions cannot be closed again."""
        closed_session = Session.objects.create(
            citizen=citizen_user,
            assigned_staff=staff_user,
            assigned_department=department,
            origin='telegram',
            status='closed',
            closed_at=timezone.now()
        )
        
        response = authenticated_staff_client.post(
            f'/api/tickets/{closed_session.session_uuid}/close/'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already closed' in response.data['detail']


@pytest.mark.django_db
class TestQuickReplies:
    """Tests for GET /api/quick-replies/ endpoint."""
    
    @pytest.fixture
    def quick_replies(self, db):
        """Creates test quick replies."""
        replies = []
        for i, text in enumerate([
            "Assalomu alaykum!",
            "Murojaatingiz qabul qilindi.",
            "Iltimos, batafsil yozing.",
            "Tez orada javob beramiz.",
        ]):
            reply = QuickReply.objects.create(
                text=text,
                order=i,
                category='greeting' if i < 2 else 'response'
            )
            replies.append(reply)
        return replies
    
    def test_quick_replies_list_success(self, authenticated_staff_client, quick_replies):
        """Test successful retrieval of quick replies."""
        response = authenticated_staff_client.get('/api/quick-replies/')
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) == len(quick_replies)
        
        # Verify ordering (by order, then id)
        for i, reply_data in enumerate(response.data):
            assert 'id' in reply_data
            assert 'text' in reply_data
            assert 'order' in reply_data
            assert 'category' in reply_data
        
        # Verify first reply has order 0
        assert response.data[0]['order'] == 0
    
    def test_quick_replies_ordering(self, authenticated_staff_client, db):
        """Test that quick replies are ordered correctly."""
        # Create replies with different orders
        QuickReply.objects.create(text="Third", order=2)
        QuickReply.objects.create(text="First", order=0)
        QuickReply.objects.create(text="Second", order=1)
        
        response = authenticated_staff_client.get('/api/quick-replies/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data[0]['text'] == "First"
        assert response.data[1]['text'] == "Second"
        assert response.data[2]['text'] == "Third"
    
    def test_quick_replies_requires_authentication(self, api_client, quick_replies):
        """Test that unauthenticated users cannot access quick replies."""
        response = api_client.get('/api/quick-replies/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_quick_replies_empty_list(self, authenticated_staff_client):
        """Test that empty list is returned when no quick replies exist."""
        response = authenticated_staff_client.get('/api/quick-replies/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data == []

