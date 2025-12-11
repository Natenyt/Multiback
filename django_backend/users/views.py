from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import update_last_login
from .models import User
from departments.models import StaffProfile
from .serializers import StaffLoginSerializer
import logging

logger = logging.getLogger(__name__)


def get_tokens_for_user(user):
    """
    Generate JWT tokens for a user.
    Returns a dictionary with 'access' and 'refresh' tokens.
    """
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class StaffLoginView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = StaffLoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # The serializer now guarantees these exist
        user = serializer.validated_data['user']
        staff_profile = serializer.validated_data['staff_profile']

        update_last_login(None, user)
        tokens = get_tokens_for_user(user)

        return Response({
            "access": tokens['access'],
            "refresh": tokens['refresh'],
            "role": "staff",
            "staff_role": staff_profile.role,
            "department_id": staff_profile.department.id if staff_profile.department else None,
            "user_uuid": str(user.user_uuid),
            "username": staff_profile.username # Return it for UI display
        }, status=status.HTTP_200_OK)
        