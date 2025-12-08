from django.urls import path
from . import views
from users.views import (
    SendOTPView, VerifyOTPView, StaffLoginView, 
    UserProfileSaveView, MyDataView
)

urlpatterns = [
    path('internal/injection-alert/', views.injection_alert, name='injection_alert'),
    path('internal/routing-result/', views.routing_result, name='routing_result'),
    
    # Auth
    path('auth/send-otp/', SendOTPView.as_view(), name='send_otp'),
    path('auth/verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('auth/staff-login/', StaffLoginView.as_view(), name='staff_login'),
    
    # User Profile
    path('users/profile-save/', UserProfileSaveView.as_view(), name='user_profile_save'),
    path('users/me/', MyDataView.as_view(), name='user_me'),
]
