from django.db import models


class Neighborhood(models.Model):
    """
    Represents a neighborhood/mahalla in the system.
    """
    id = models.BigAutoField(primary_key=True)
    
    name_uz = models.CharField(max_length=128, db_index=True)  # Uzbek name
    name_ru = models.CharField(max_length=128, blank=True, null=True)  # Russian name
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Neighborhood"
        verbose_name_plural = "Neighborhoods"
        indexes = [
            models.Index(fields=["name_uz"]),
        ]
        ordering = ['name_uz']
    
    def __str__(self):
        return self.name_uz




class QuickReply(models.Model):
    id = models.AutoField(primary_key=True)

    # Text of the quick reply (Uzbek phrases)
    text = models.CharField(max_length=500)

    # Optional: determine ordering in UI
    order = models.PositiveIntegerField(default=0)

    # Optional: to group phrases in categories
    category = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Quick Reply"
        verbose_name_plural = "Quick Replies"

    def __str__(self):
        return self.text[:50]
