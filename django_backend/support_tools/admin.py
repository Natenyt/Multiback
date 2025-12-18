from django.contrib import admin
from .models import QuickReply, Neighborhood


@admin.register(QuickReply)
class QuickReplyAdmin(admin.ModelAdmin):
    list_display = ("text", "order", "category")
    list_filter = ("category",)
    search_fields = ("text",)
    ordering = ("order",)


@admin.register(Neighborhood)
class NeighborhoodAdmin(admin.ModelAdmin):
    list_display = ("name_uz", "name_ru", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name_uz", "name_ru")
    ordering = ("name_uz",)
