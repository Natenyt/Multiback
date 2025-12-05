from django.db import models
from django.conf import settings
from django.utils import timezone
from message_app.models import Message, Session

class InjectionLog(models.Model):
    """
    Dedicated log for Security/Guardrail failures.
    Separated from AIResult to keep the main logic clean.
    """
    id = models.BigAutoField(primary_key=True)
    
    message = models.ForeignKey(
        Message,
        to_field="message_uuid", # Links to UUID column
        db_column="message_uuid",
        on_delete=models.CASCADE,
        related_name="injection_logs"
    )
    
    # Detection Details
    is_injection = models.BooleanField(default=False, db_index=True)
    risk_score = models.FloatField(help_text="0.0 to 1.0 safety score")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Injection Check #{self.id} - Safe: {not self.is_injection}"


class AIAnalysis(models.Model):
    """
    The 'Brain' Log. 
    Stores how the AI classified, routed, and reasoned about a message.
    """
    id = models.BigAutoField(primary_key=True)

    # --- 1. Context ---
    session = models.ForeignKey(
        Session,
        to_field="session_uuid", # Links to UUID column
        db_column="session_uuid",
        on_delete=models.CASCADE,
        related_name="ai_logs"
    )
    message = models.ForeignKey(
        Message,
        to_field="message_uuid", # Links to UUID column
        db_column="message_uuid",
        on_delete=models.CASCADE,
        related_name="ai_analysis"
    )

    # --- 2. Classification & Routing (The AI's Work) ---
    # e.g., "Inquiry", "Complaint", "Spam"
    intent_label = models.CharField(max_length=64, blank=True, null=True, db_index=True) 
    
    # Confidence Score (0.0 - 1.0)
    confidence_score = models.FloatField(null=True, blank=True)
    
    # We store ID for linking, and Name for historical snapshotting
    suggested_department_id = models.BigIntegerField(null=True, blank=True, db_index=True)
    suggested_department_name = models.CharField(max_length=255, null=True, blank=True)

    # --- 3. Reasoning & Search ---
    # Why did the AI choose this?
    reasoning_text = models.TextField(blank=True, null=True) 
    
    # Vector Search Context (Top K results found in Qdrant)
    # e.g. [{"dept": "Sales", "similarity": 0.92}, ...]
    vector_search_results = models.JSONField(blank=True, null=True) 
    
    # --- 4. Human-in-the-Loop (Corrections) ---
    # If this is True, the Operator overruled the AI
    is_corrected = models.BooleanField(default=False, db_index=True)
    
    # Who corrected it? (Links to your Staff User)
    corrected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        to_field="user_uuid", # Links to UUID column
        db_column="corrected_by_uuid",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="ai_corrections"
    )
    
    # Where did they move it to?
    corrected_department_id = models.BigIntegerField(null=True, blank=True)
    correction_notes = models.TextField(blank=True, null=True) # Optional operator comment

    # --- 5. Performance Metrics ---
    prompt_tokens = models.IntegerField(null=True, blank=True)
    completion_tokens = models.IntegerField(null=True, blank=True)
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
        """Returns False if operator had to correct it."""
        return not self.is_corrected