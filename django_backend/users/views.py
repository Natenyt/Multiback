from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import update_last_login
from .models import User
from departments.models import StaffProfile
from support_tools.services import OTPService
from .serializers import (
    OTPSendSerializer, 
    OTPVerifySerializer, 
    StaffLoginSerializer, 
    UserProfileSerializer,
    UserProfileSaveSerializer
)
import logging

logger = logging.getLogger(__name__)

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class SendOTPView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = OTPSendSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone_number']

        otp = OTPService.generate_otp(phone)
        OTPService.store_otp(phone, otp)
        
        # MOCK SMS SENDING
        logger.info(f"MOCK SMS to {phone}: Your Code is {otp}")
        print(f"--- OTP for {phone}: {otp} ---")

        return Response({"status": "success", "message": "OTP sent."}, status=status.HTTP_200_OK)

class VerifyOTPView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = OTPVerifySerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone_number']
        code = serializer.validated_data['code']

        if not OTPService.validate_otp(phone, code):
            return Response({"status": "error", "message": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)

        # Get or Create User
        user, created = User.objects.get_or_create(phone_number=phone)
        
        # Always mark as verified since they passed OTP
        user.is_verified = True
        if created:
            user.set_unusable_password()
        
        user.save()

        update_last_login(None, user)
        tokens = get_tokens_for_user(user)
        
        return Response({
            "access": tokens['access'],
            "refresh": tokens['refresh'],
            "is_new_user": created,
            "role": "citizen",
            "user_uuid": str(user.user_uuid)
        }, status=status.HTTP_200_OK)

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
        
class UserProfileSaveView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserProfileSaveSerializer

    def get_object(self):
        return self.request.user

class MyDataView(generics.RetrieveAPIView):
    """
    Returns data based on role (Citizen vs Staff).
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        data = UserProfileSerializer(user).data
        
        staff_profile = getattr(user, 'staff_profile', None)
        if staff_profile:
            data['role'] = 'staff'
            data['staff_details'] = {
                'role': staff_profile.role,
                'department': staff_profile.department.name_uz if staff_profile.department else "Unassigned", # Should ideally use localized getter
                'job_title': staff_profile.job_title
            }
        else:
            data['role'] = 'citizen'
            
        return Response(data)
