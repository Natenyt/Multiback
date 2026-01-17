import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from support_tools.models import Neighborhood

class CustomUserManager(BaseUserManager):
    def create_user(self, phone_number, password=None, **extra_fields):
        if not phone_number:
            raise ValueError('The Phone Number field must be set')
        user = self.model(phone_number=phone_number, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, password=None, **extra_fields):
        # Sets standard Django superuser flags.
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        # Grants operator privileges to superusers by default.
        extra_fields.setdefault('is_operator', True) 

        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(phone_number, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    """Represent the core identity for all users in the system."""
    id = models.BigAutoField(primary_key=True)
    user_uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    
    # Identity
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    phone_number = models.CharField(max_length=32, unique=True, db_index=True)
    email = models.EmailField(unique=True, blank=True, null=True)
    full_name = models.CharField(max_length=128, blank=True, null=True)
    
    # Demographics
    neighborhood = models.ForeignKey(Neighborhood, on_delete=models.SET_NULL, null=True, blank=True)
    location = models.CharField(max_length=256, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    gender = models.CharField(
        max_length=10,
        choices=[('M', 'Male'), ('F', 'Female'), ('U', 'Unknown')],
        blank=True,
        null=True,
        help_text="Auto-detected from name"
    )

    # State
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    
    # Special Roles
    # Note: is_superuser is handled by PermissionsMixin (System Owner)
    is_operator = models.BooleanField(default=False) # Modernizators
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()
    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = [] 

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

    @property
    def is_staff(self):
        """Determine admin site access. Only superusers are permitted."""
        return self.is_superuser

    def __str__(self):
        role = "User"
        if self.is_superuser: role = "System Owner"
        elif self.is_operator: role = "Operator"
        return f"[{role}] {self.full_name or self.phone_number}"


class TelegramConnection(models.Model):
    """Link a user account to their Telegram profile."""
    LANGUAGE_CHOICES = [
        ('uz', 'Uzbek'),
        ('ru', 'Russian'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="telegram_profile"
    )

    telegram_chat_id = models.BigIntegerField(unique=True, db_index=True)
    telegram_username = models.CharField(max_length=128, blank=True, null=True)
    is_bot = models.BooleanField(default=False)

    language_preference = models.CharField(
        max_length=2,
        choices=LANGUAGE_CHOICES,
        default='uz'
    )
    
    last_interaction = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"@{self.telegram_username}" if self.telegram_username else str(self.telegram_chat_id)