"""
Django app configuration for graveyard project.
"""
from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class GraveyardConfig(AppConfig):
    """
    Configuration for the graveyard project.
    Starts database connection keepalive system on app ready.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'graveyard'
    
    def ready(self):
        """
        Called when Django starts.
        Initialize database connection keepalive system here.
        """
        # Only start keepalive if not in a management command
        # (to avoid starting it during migrations, etc.)
        import sys
        if 'manage.py' in sys.argv or 'runserver' in sys.argv or 'daphne' in sys.argv[0]:
            try:
                from graveyard.connection_keepalive import start_keepalive
                # Start keepalive with 5-minute interval (300 seconds)
                # This is less than MySQL's default wait_timeout (28800 seconds = 8 hours)
                # The keepalive will ping connections every 5 minutes to keep them alive
                start_keepalive(interval=300)
                logger.info("Database connection keepalive system started")
            except Exception as e:
                logger.warning(f"Failed to start database connection keepalive: {e}")


