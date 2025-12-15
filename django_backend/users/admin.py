from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, TelegramConnection


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('id', 'phone_number', 'full_name', 'email', 'is_active', 'is_superuser', 'is_operator', 'created_at')
    list_filter = ('is_active', 'is_superuser', 'is_operator', 'is_verified', 'created_at')
    search_fields = ('phone_number', 'full_name', 'email')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('phone_number', 'password')}),
        ('Personal Info', {'fields': ('full_name', 'email', 'avatar')}),
        ('Location', {'fields': ('neighborhood', 'location')}),
        ('Permissions', {'fields': ('is_active', 'is_superuser', 'is_operator', 'is_verified', 'groups', 'user_permissions')}),
        ('Additional Info', {'fields': ('gender', 'notes')}),
        ('Important dates', {'fields': ('created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone_number', 'password1', 'password2', 'is_active', 'is_superuser', 'is_operator'),
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'user_uuid')


@admin.register(TelegramConnection)
class TelegramConnectionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'telegram_chat_id', 'telegram_username', 'language_preference', 'is_bot', 'last_interaction')
    list_filter = ('language_preference', 'is_bot', 'created_at')
    search_fields = ('telegram_username', 'telegram_chat_id', 'user__full_name', 'user__phone_number')
    raw_id_fields = ('user',)
    ordering = ('-created_at',)
