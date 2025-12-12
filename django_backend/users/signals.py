"""
Signal handlers for User model.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User
from .utils import detect_gender_from_name


@receiver(post_save, sender=User)
def auto_detect_gender(sender, instance, created, **kwargs):
    """
    Automatically detect and set gender when full_name is provided or updated.
    Only updates if gender is not already set or if full_name changed.
    """
    # Skip if this is a raw save or if full_name doesn't exist
    if kwargs.get('raw', False) or not instance.full_name:
        return
    
    # Only update if gender is not set or if this is a new user
    if not instance.gender or created:
        detected_gender = detect_gender_from_name(instance.full_name)
        # Only update if we detected something useful, or if gender was never set
        if detected_gender != 'U' or not instance.gender:
            # Save without triggering signals again to avoid recursion
            User.objects.filter(pk=instance.pk).update(gender=detected_gender)

