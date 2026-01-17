from django.db import models
from django.conf import settings 
from django.contrib.auth.models import User
from django.utils import timezone   

class Department(models.Model):
    """Represent an organizational unit such as Sales, HR, or Support."""
    id = models.BigAutoField(primary_key=True)
    description_uz = models.TextField(blank=True, null=True)
    description_ru = models.TextField(blank=True, null=True)
    
    # Multi-language name fields.
    name_uz = models.CharField(max_length=500, blank=True, null=True)
    name_ru = models.CharField(max_length=500, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name_uz


class StaffProfile(models.Model):
    """Extend a user with department membership and role assignment."""
    
    ROLE_MANAGER = 'MANAGER'
    ROLE_STAFF = 'STAFF'
    ROLE_VIP = 'VIP'
    
    ROLE_CHOICES = [
        (ROLE_MANAGER, 'Department Manager (Head)'),
        (ROLE_STAFF, 'Staff Member'),
        (ROLE_VIP, 'VIP Member'),   
    ]

    id = models.BigAutoField(primary_key=True)
    
    # Link to the user identity.
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        to_field="user_uuid",
        db_column="user_uuid",
        on_delete=models.CASCADE,
        related_name='staff_profile'
    )
    
    # Link to the department. Preserved if department is deleted.
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        related_name='staff_members'
    )
    username = models.CharField(max_length=50, unique=True, db_index=True, null=True) 
    # Staff role within the department.
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default=ROLE_STAFF
    )
    personal_best_record = models.IntegerField(default=0)

    # Optional job title.
    job_title = models.CharField(max_length=100, blank=True, null=True)
    
    joined_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.department:
            dept_name = self.department.name_uz or self.department.name_ru or 'No Name'
            return f"{self.user.full_name} [{self.role}] - {dept_name}"
        return f"{self.user.full_name} [{self.role}] - No Dept"

    @property
    def is_manager(self):
        return self.role == self.ROLE_MANAGER




class StaffDailyPerformance(models.Model):
    """Aggregate daily performance metrics for a staff member."""
    staff = models.ForeignKey(settings.AUTH_USER_MODEL, to_field="user_uuid", on_delete=models.CASCADE, related_name='daily_stats')
    date = models.DateField(default=timezone.now, db_index=True)
    
    # Performance metrics.
    tickets_solved = models.IntegerField(default=0)
    avg_response_time_seconds = models.FloatField(default=0.0) 

    class Meta:
        # One record per staff per day.
        unique_together = ('staff', 'date')
        ordering = ['-date']
        verbose_name = "Staff Daily Performance"

    def __str__(self):
        return f"{self.staff.username} - {self.date} ({self.tickets_solved} solved)"