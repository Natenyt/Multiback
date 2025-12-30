"""
Django app configuration for graveyard project.
"""
from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class GraveyardConfig(AppConfig):
    """
    Configuration for the graveyard project.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'graveyard'


