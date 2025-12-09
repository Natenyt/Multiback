from django.urls import path
from . import views
from departments.views import dashboard_stats, dashboard_leaderboard
from broadcast.views import dashboard_broadcast, broadcast_seen, broadcast_ack
from users.views import (
    SendOTPView, VerifyOTPView, StaffLoginView, 
    UserProfileSaveView, MyDataView, StaffDetailView
)
from support_tools.views import NeighborhoodListView
from message_app.views import (
    AppealCreateView, AppealListView, AppealDetailView,
    ChatHistoryView, ChatSendView
)
from message_app.views import TicketListAPIView, NeighborhoodSearchAPIView

urlpatterns = [
    path('internal/injection-alert/', views.injection_alert, name='injection_alert'),
    path('internal/routing-result/', views.routing_result, name='routing_result'),
    
    # Common Resources
    path('common/neighborhoods/', NeighborhoodListView.as_view(), name='neighborhood_list'),

    # Auth
    path('auth/send-otp/', SendOTPView.as_view(), name='send_otp'),
    path('auth/verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('auth/staff-login/', StaffLoginView.as_view(), name='staff_login'),
    
    # User Profile & Staff
    path('users/profile-save/', UserProfileSaveView.as_view(), name='user_profile_save'),
    path('users/me/', MyDataView.as_view(), name='user_me'),
    path('users/staff/<int:id>/', StaffDetailView.as_view(), name='staff_detail'),
    
    # Appeals & Chat
    path('appeals/', AppealListView.as_view(), name='appeal_list'),
    path('appeals/create/', AppealCreateView.as_view(), name='appeal_create'),
    path('appeals/<uuid:session_uuid>/', AppealDetailView.as_view(), name='appeal_detail'),
    
    path('chat/<uuid:session_uuid>/history/', ChatHistoryView.as_view(), name='chat_history'),
    path('chat/<uuid:session_uuid>/send/', ChatSendView.as_view(), name='chat_send'),

    # Dashboard
    path('dashboard/stats/', dashboard_stats, name='dashboard_stats'),
    path('dashboard/leaderboard/', dashboard_leaderboard, name='dashboard_leaderboard'),
    
    # Broadcast
    path('dashboard/broadcast/', dashboard_broadcast, name='dashboard_broadcast'),
    path('dashboard/broadcast/<int:id>/seen/', broadcast_seen, name='broadcast_seen'),
    path('dashboard/broadcast/<int:id>/ack/', broadcast_ack, name='broadcast_ack'),
    
    # Tickets
    path('tickets/', TicketListAPIView.as_view(), name='ticket-list'),
    path('neighborhoods/', NeighborhoodSearchAPIView.as_view(), name='neighborhood-search'),
    
]
