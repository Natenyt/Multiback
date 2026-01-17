import uuid
from django.db import models
from django.conf import settings # Always use this for User FKs
from departments.models import Department

class Session(models.Model):
    """Represent a support ticket or conversation thread."""
    id = models.BigAutoField(primary_key=True)
    session_uuid = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)

    # The customer who initiated the session.
    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        to_field="user_uuid",
        db_column="citizen_uuid",
        on_delete=models.CASCADE,
        related_name="sessions",
    )

    # The staff member handling the session.
    assigned_staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        to_field="user_uuid",
        db_column="assigned_staff_uuid",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="assigned_sessions",
    )
    
    assigned_department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="sessions"
    )

    STATUS_CHOICES = [
        ("assigned", "Assigned"),
        ("unassigned", "Unassigned"),
        ("closed", "Closed"),
        ("escalated", "Escalated"),
    ]
    ORIGIN_CHOICES = [
        ("web", "Web"),
        ("telegram", "Telegram"),
    ]

    origin = models.CharField(max_length=16, choices=ORIGIN_CHOICES, default="web")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="unassigned")

    created_at = models.DateTimeField(auto_now_add=True)
    assigned_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when session was assigned to staff")
    closed_at = models.DateTimeField(null=True, blank=True)
    
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    # SLA Tracking Fields
    last_messaged = models.DateTimeField(null=True, blank=True, help_text="Timestamp of last staff message")
    sla_deadline = models.DateTimeField(null=True, blank=True, help_text="Effective SLA deadline (base + hold extension)")
    sla_breached = models.BooleanField(default=False, help_text="Flag indicating SLA breach")
    is_hold = models.BooleanField(default=False, help_text="Flag indicating hold has been used")
    
    # Additional Fields
    intent_label = models.CharField(max_length=255, null=True, blank=True, help_text="AI-detected intent label")
    description = models.TextField(null=True, blank=True, help_text="Staff description/notes for the session")

    def check_sla_breach(self):
        """Check and update the SLA breach status."""
        if not self.sla_deadline:
            self.sla_breached = False
            return
        from django.utils import timezone
        self.sla_breached = timezone.now() > self.sla_deadline

    def __str__(self):
        return f"Session {str(self.session_uuid)[:8]} - {self.citizen}"


class Message(models.Model):
    """Represent a message envelope with metadata."""
    id = models.BigAutoField(primary_key=True)
    message_uuid = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    client_message_id = models.CharField(max_length=64, null=True, blank=True)

    session = models.ForeignKey(
        Session,
        to_field="session_uuid", # Keeps your preference for linking via UUID
        db_column="session_uuid",
        on_delete=models.CASCADE,
        related_name="messages"
    )

    # Single sender field for both citizens and staff.
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        to_field="user_uuid",
        db_column="sender_uuid",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="sent_messages"
    )
    
    # Flag for quick sender type identification.
    is_staff_message = models.BooleanField(default=False) 

    sender_platform = models.CharField(
        max_length=16,
        choices=[
            ('web', 'Web'),
            ('telegram', 'Telegram'),
            ('system', 'System Auto-Message'),
        ],
        default='web'
    )

    # Timestamps & Status
    created_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Safety
    quarantined = models.BooleanField(default=False)
    quarantined_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['session', 'client_message_id'],
                condition=models.Q(client_message_id__isnull=False),
                name='unique_session_client_message_id'
            )
        ]

    def __str__(self):
        return f"Message {str(self.message_uuid)[:8]}"


class MessageContent(models.Model):
    """Store the actual message payload. Supports multiple content items per message."""
    id = models.BigAutoField(primary_key=True)

    message = models.ForeignKey(
        Message,
        to_field="message_uuid",
        db_column="message_uuid",
        on_delete=models.CASCADE,
        related_name="contents"
    )

    CONTENT_TYPE_CHOICES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('video', 'Video'),
        ('file', 'File'),
        ('voice', 'Voice'),
        ('sticker', 'Sticker'), # Added Sticker for Telegram
    ]

    content_type = models.CharField(max_length=32, choices=CONTENT_TYPE_CHOICES, default='text')

    # Content Fields
    text = models.TextField(null=True, blank=True)
    caption = models.TextField(null=True, blank=True) # Used for media captions

    # Local file storage.
    file = models.FileField(upload_to="message_media/%Y/%m/%d/", null=True, blank=True)
    
    # External file references.
    file_url = models.URLField(null=True, blank=True)
    telegram_file_id = models.CharField(max_length=256, null=True, blank=True)
    
    # For grouping multi-media messages.
    media_group_id = models.CharField(max_length=128, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.content_type} for {self.message}"