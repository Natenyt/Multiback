from django.contrib import admin
from .models import QuickReply

@admin.register(QuickReply)
class QuickReplyAdmin(admin.ModelAdmin):
    list_display = ("text", "order", "category")
    list_filter = ("category",)
    search_fields = ("text",)
    ordering = ("order",)
