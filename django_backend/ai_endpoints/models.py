from django.db import models
from django.conf import settings
from django.utils import timezone
from message_app.models import Message, Session

class InjectionLog(models.Model):
    """Log security and guardrail failures separately for clean audit trails."""
    id = models.BigAutoField(primary_key=True)
    
    message = models.ForeignKey(
        Message,
        to_field="message_uuid",
        db_column="message_uuid",
        on_delete=models.CASCADE,
        related_name="injection_logs"
    )
    
    # Detection Details
    is_injection = models.BooleanField(default=False, db_index=True)
    risk_score = models.FloatField(help_text="0.0 to 1.0 safety score")
    tokens_used = models.IntegerField(null=True, blank=True)
    processing_time_ms = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Injection Check #{self.id} - Safe: {not self.is_injection}"


class AIAnalysis(models.Model):
    """Store classification, routing decisions, and reasoning for messages."""
    id = models.BigAutoField(primary_key=True)

    # Context.
    session = models.ForeignKey(
        Session,
        to_field="session_uuid",
        db_column="session_uuid",
        on_delete=models.CASCADE,
        related_name="ai_logs"
    )
    message = models.ForeignKey(
        Message,
        to_field="message_uuid",
        db_column="message_uuid",
        on_delete=models.CASCADE,
        related_name="ai_analysis"
    )

    # Classification and Routing.
    intent_label = models.CharField(max_length=64, blank=True, null=True, db_index=True) 
    confidence_score = models.FloatField(null=True, blank=True)
    
    # Department suggestion with historical snapshot.
    suggested_department_id = models.BigIntegerField(null=True, blank=True, db_index=True)
    suggested_department_name = models.CharField(max_length=255, null=True, blank=True)

    # Reasoning and Search.
    reason = models.TextField(blank=True, null=True) 
    vector_search_results = models.JSONField(blank=True, null=True) 
    
    # Human-in-the-Loop Corrections.
    is_corrected = models.BooleanField(default=False, db_index=True)
    corrected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        to_field="user_uuid",
        db_column="corrected_by_uuid",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="ai_corrections"
    )
    corrected_department_id = models.BigIntegerField(null=True, blank=True)
    correction_notes = models.TextField(blank=True, null=True)

    # Performance Metrics.
    language_detected = models.CharField(max_length=64, blank=True, null=True, db_index=True) 
    embedding_tokens = models.IntegerField(null=True, blank=True)
    prompt_tokens = models.IntegerField(null=True, blank=True)
    total_tokens = models.IntegerField(null=True, blank=True)
    processing_time_ms = models.IntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "AI Analysis Log"
        verbose_name_plural = "AI Analysis Logs"
        ordering = ['-created_at']

    def __str__(self):
        return f"AI Analysis {self.id} | Intent: {self.intent_label}"

    @property
    def was_helpful(self):
        """Indicate whether the analysis required correction."""
        return not self.is_corrected