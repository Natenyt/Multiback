"""
Celery configuration for Django project.
"""
import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'graveyard.settings')

app = Celery('graveyard')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Celery Beat schedule for periodic tasks
app.conf.beat_schedule = {
    'check-sla-breaches-daily': {
        'task': 'check_sla_breaches',
        'schedule': crontab(hour=0, minute=0),  # Run daily at midnight UTC
        # Alternative: crontab(hour=2, minute=0) for 2 AM UTC
        # Or use: crontab(minute=0, hour='*/6') for every 6 hours
    },
}

app.conf.timezone = 'UTC'

