from django.urls import path
from . import views
from departments.views import (
    dashboard_stats, 
    dashboard_leaderboard,
    staff_profile,
    dashboard_sessions_chart,
    dashboard_demographics,
    dashboard_top_neighborhoods,
    departments_list
)
from broadcast.views import dashboard_broadcast, broadcast_seen, broadcast_ack
from users.views import StaffLoginView
from rest_framework_simplejwt.views import TokenRefreshView

from message_app.views import TicketListAPIView, NeighborhoodSearchAPIView
from message_app.views_history import TicketHistoryAPIView, MarkReadAPIView
from message_app.views_media import telegram_media_proxy, thumbnail_proxy
from message_app.views_send import SendMessageAPIView
from message_app.views_ai_webhook import AIWebhookView
from message_app.views_actions import TicketAssignAPIView, TicketHoldAPIView, TicketEscalateAPIView, TicketCloseAPIView, TicketDescriptionUpdateAPIView
from support_tools.views import QuickReplyListAPIView

urlpatterns = [
    path('internal/injection-alert/', views.injection_alert, name='injection_alert'),
    path('internal/routing-result/', views.routing_result, name='routing_result'),
    path('internal/train-correction/', views.train_correction_webhook, name='train_correction_webhook'),
    path('ai/route_message/', AIWebhookView.as_view(), name='ai_webhook'),
    

    path('auth/staff-login/', StaffLoginView.as_view(), name='staff_login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Dashboard
    path('dashboard/stats/', dashboard_stats, name='dashboard_stats'),
    path('dashboard/leaderboard/', dashboard_leaderboard, name='dashboard_leaderboard'),
    path('dashboard/staff-profile/', staff_profile, name='staff_profile'),
    path('dashboard/sessions-chart/', dashboard_sessions_chart, name='dashboard_sessions_chart'),
    path('dashboard/demographics/', dashboard_demographics, name='dashboard_demographics'),
    path('dashboard/top-neighborhoods/', dashboard_top_neighborhoods, name='dashboard_top_neighborhoods'),
    
    # Broadcast
    path('dashboard/broadcast/', dashboard_broadcast, name='dashboard_broadcast'),
    path('dashboard/broadcast/<int:id>/seen/', broadcast_seen, name='broadcast_seen'),
    path('dashboard/broadcast/<int:id>/ack/', broadcast_ack, name='broadcast_ack'),
    
    # Tickets List
    path('tickets/', TicketListAPIView.as_view(), name='ticket-list'),
    path('neighborhoods/', NeighborhoodSearchAPIView.as_view(), name='neighborhood-search'),
    path('departments/', departments_list, name='departments-list'),

    # Tickets Chat
    path('tickets/<uuid:session_uuid>/history/', TicketHistoryAPIView.as_view(), name='ticket-history'),
    path('tickets/<uuid:session_uuid>/mark-read/', MarkReadAPIView.as_view(), name='ticket-mark-read'),
    path('media/telegram/<int:content_id>/', telegram_media_proxy, name='telegram-proxy'),
    path('media/thumbnail/<int:content_id>/', thumbnail_proxy, name='thumbnail-proxy'),

    path('tickets/<uuid:session_uuid>/send/', SendMessageAPIView.as_view(), name='ticket-send'),
    
    # Ticket Actions
    path('tickets/<uuid:session_uuid>/assign/', TicketAssignAPIView.as_view(), name='ticket-assign'),
    path('tickets/<uuid:session_uuid>/hold/', TicketHoldAPIView.as_view(), name='ticket-hold'),
    path('tickets/<uuid:session_uuid>/escalate/', TicketEscalateAPIView.as_view(), name='ticket-escalate'),
    path('tickets/<uuid:session_uuid>/close/', TicketCloseAPIView.as_view(), name='ticket-close'),
    path('tickets/<uuid:session_uuid>/description/', TicketDescriptionUpdateAPIView.as_view(), name='ticket-description'),
    
    # Quick Replies
    path('quick-replies/', QuickReplyListAPIView.as_view(), name='quick-replies'),
]
