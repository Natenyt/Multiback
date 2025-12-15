from django.contrib import admin
from .models import Department, StaffProfile, StaffDailyPerformance


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name_uz', 'name_ru', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name_uz', 'name_ru', 'description_uz', 'description_ru')
    ordering = ('name_uz',)


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'department', 'role', 'job_title', 'joined_at')
    list_filter = ('role', 'department', 'joined_at')
    search_fields = ('user__full_name', 'user__phone_number', 'user__email', 'job_title', 'username')
    raw_id_fields = ('user', 'department')
    ordering = ('-joined_at',)


@admin.register(StaffDailyPerformance)
class StaffDailyPerformanceAdmin(admin.ModelAdmin):
    list_display = ('id', 'staff', 'date', 'tickets_solved', 'avg_response_time_seconds')
    list_filter = ('date',)
    search_fields = ('staff__full_name', 'staff__phone_number')
    raw_id_fields = ('staff',)
    ordering = ('-date',)
