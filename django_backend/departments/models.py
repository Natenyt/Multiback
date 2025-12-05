from django.db import models
from django.conf import settings # Best practice to refer to User model

class Department(models.Model):
    """
    Represents a functional unit (e.g., Sales, HR, Support).
    """
    id = models.BigAutoField(primary_key=True)
    description_uz = models.TextField(blank=True, null=True)
    description_ru = models.TextField(blank=True, null=True)
    
    # If you need multi-language support (Uzbek/Russian)
    name_uz = models.CharField(max_length=500, blank=True, null=True)
    name_ru = models.CharField(max_length=500, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class StaffProfile(models.Model):
    """
    The 'Sidecar' Model.
    This turns a regular User into a Department Staff Member or Manager.
    """
    
    # Role Constants
    ROLE_MANAGER = 'MANAGER'
    ROLE_STAFF = 'STAFF'
    
    ROLE_CHOICES = [
        (ROLE_MANAGER, 'Department Manager (Head)'),
        (ROLE_STAFF, 'Staff Member'),
    ]

    id = models.BigAutoField(primary_key=True)
    
    # 1. Link to the Identity (The User Table)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, # Points to your custom User model
        on_delete=models.CASCADE,
        related_name='staff_profile' # user.staff_profile
    )
    
    # 2. Link to the Department
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL, # If dept is deleted, keep the profile but set dept to null
        null=True,
        related_name='staff_members' # department.staff_members.all()
    )

    # 3. The Role (Manager vs Staff)
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default=ROLE_STAFF
    )

    # Optional: Job Title (e.g., "Senior Support Specialist")
    job_title = models.CharField(max_length=100, blank=True, null=True)
    
    joined_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.full_name} [{self.role}] - {self.department.name if self.department else 'No Dept'}"

    @property
    def is_manager(self):
        return self.role == self.ROLE_MANAGER