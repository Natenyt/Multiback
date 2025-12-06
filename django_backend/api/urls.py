from django.urls import path
from . import views

urlpatterns = [
    path('internal/injection-alert/', views.injection_alert, name='injection_alert'),
    path('internal/routing-result/', views.routing_result, name='routing_result'),
]
