from django.db import models
from django.utils import timezone
from django.conf import settings

class Broadcast(models.Model):
    """
    System-wide alerts sent by the Hokim or Superadmins.
    """
    PRIORITY_CHOICES = [
        ('normal', 'Normal (Blue)'),
        ('high', 'High (Red)'),
    ]

    title = models.CharField(max_length=200)
    message = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        to_field="user_uuid", 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='authored_broadcasts'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} ({self.created_at.date()})"


class BroadcastAcknowledgment(models.Model):
    """
    Tracks which staff members have clicked "Acknowledge" (read the message).
    """
    broadcast = models.ForeignKey(Broadcast, on_delete=models.CASCADE, related_name='acknowledgments')
    staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        to_field="user_uuid",
        on_delete=models.CASCADE,
        related_name='broadcast_acks'
    )
    
    is_acknowledged = models.BooleanField(default=False)
    acknowledged_at = models.DateTimeField(null=True, blank=True)  # Can be manually updated
    read_at = models.DateTimeField(null=True, blank=True)          # Can be manually updated

    class Meta:
        unique_together = ('broadcast', 'staff')
        verbose_name = "Broadcast Acknowledgment"

    def __str__(self):
        return f"{getattr(self.staff, 'full_name', self.staff.username)} read {self.broadcast.id}"
