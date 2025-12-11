from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse
from departments.models import Department, StaffProfile
from message_app.models import Session, Message, MessageContent
from support_tools.models import Neighborhood
from broadcast.models import Broadcast

User = get_user_model()

class APITestSuite(APITestCase):
    def setUp(self):
        # 1. Setup Departments & Neighborhoods
        self.dept = Department.objects.create(name_uz="IT Support", name_ru="IT Support RU", is_active=True)
        self.neighborhood = Neighborhood.objects.create(name_uz="Chilanzar", name_ru="Chilanzar RU", is_active=True)

        # 2. Setup Users (Citizen & Staff)
        self.citizen_password = "password123"
        self.citizen = User.objects.create_user(
            phone_number="+998901234567",
            full_name="John Citizen",
            password=self.citizen_password,
            neighborhood=self.neighborhood
        )

        self.staff_password = "staffpassword"
        self.staff_user = User.objects.create_user(
            phone_number="+998998887766", 
            full_name="Alice Staff", 
            password=self.staff_password
        )
        self.staff_profile = StaffProfile.objects.create(
            user=self.staff_user,
            department=self.dept,
            role="agent",
            username="alice_agent"
        )

        # 3. Setup Session
        self.session = Session.objects.create(
            citizen=self.citizen,
            origin="web",
            status="unassigned",
            assigned_department=self.dept # Pre-assign to dept so staff sees it in 'unassigned' list
        )

        # 4. Setup Initial Message
        self.message = Message.objects.create(
            session=self.session,
            sender=self.citizen,
            sender_platform="web",
            is_staff_message=False
        )
        MessageContent.objects.create(
            message=self.message,
            content_type="text",
            text="Hello, I need help!"
        )

        # 5. Setup Broadcast
        self.broadcast = Broadcast.objects.create(
            title="System Update",
            message="Maintenance at midnight",
            priority="high",
            is_active=True
        )

        # Auth Headers Helpers
        self.staff_client = self.client
        # We will force authenticate in tests or login
        
    def test_auth_staff_login(self):
        url = reverse('staff_login')
        data = {
            "username": "alice_agent",
            "password": self.staff_password
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.token = response.data['access']

    def test_dashboard_stats(self):
        self.client.force_authenticate(user=self.staff_user)
        url = reverse('dashboard_stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['unassigned_count'], 1) # Created one in setUp

    def test_dashboard_leaderboard(self):
        self.client.force_authenticate(user=self.staff_user)
        url = reverse('dashboard_leaderboard')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("leaderboard", response.data)

    def test_ticket_list(self):
        self.client.force_authenticate(user=self.staff_user)
        url = reverse('ticket-list')
        response = self.client.get(url, {'status': 'unassigned'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)
        self.assertEqual(str(response.data[0]['session_id']), str(self.session.session_uuid))

    def test_ticket_history(self):
        self.client.force_authenticate(user=self.staff_user)
        url = reverse('ticket-history', kwargs={'session_uuid': self.session.session_uuid})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("messages", response.data)
        self.assertEqual(len(response.data['messages']), 1)

    def test_send_message_staff(self):
        self.client.force_authenticate(user=self.staff_user)
        # First assign staff to session or allow them to reply (logic allows dept staff)
        url = reverse('ticket-send', kwargs={'session_uuid': self.session.session_uuid})
        data = {
            "text": "Hello, staff here.",
            "assign_self": "true" 
        }
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.session.refresh_from_db()
        self.assertEqual(self.session.assigned_staff, self.staff_user)
        self.assertEqual(self.session.messages.count(), 2)

    def test_internal_injection(self):
        url = reverse('injection_alert')
        data = {
            "message_uuid": str(self.message.message_uuid),
            "risk_score": 0.9,
            "reason": "SQL Injection"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_ai_webhook(self):
        # Mocking the AI webhook which normally receives payload from AI microservice
        url = reverse('ai_webhook')
        data = {
            "department_id": self.dept.id,
            "session_uuid": str(self.session.session_uuid),
            "message_uuid": str(self.message.message_uuid)
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.session.refresh_from_db()
        self.assertEqual(self.session.status, 'assigned')
        self.assertEqual(self.session.assigned_department, self.dept)

    def test_dashboard_broadcast(self):
        self.client.force_authenticate(user=self.staff_user)
        url = reverse('dashboard_broadcast')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], "System Update")

        # Ack
        url_ack = reverse('broadcast_ack', kwargs={'id': response.data['id']})
        resp_ack = self.client.post(url_ack)
        self.assertEqual(resp_ack.status_code, status.HTTP_200_OK)
