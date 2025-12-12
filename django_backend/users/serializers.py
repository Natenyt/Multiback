from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User
from departments.models import StaffProfile

class StaffLoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()  # New field to accept username or email
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        identifier = data.get('identifier')
        password = data.get('password')

        if not identifier or not password:
            raise serializers.ValidationError("Must include 'identifier' and 'password'")

        # Try to find staff profile by username or email
        staff_profile = None
        if '@' in identifier:  # Assume it's an email
            try:
                user = User.objects.get(email=identifier)
                staff_profile = StaffProfile.objects.get(user=user)
            except (User.DoesNotExist, StaffProfile.DoesNotExist):
                pass
        
        if not staff_profile:  # If not found by email, try by username
            try:
                staff_profile = StaffProfile.objects.get(username=identifier)
            except StaffProfile.DoesNotExist:
                raise serializers.ValidationError("Invalid credentials")

        user = staff_profile.user
        if not user.check_password(password):
            raise serializers.ValidationError("Invalid credentials")
        
        # Check if active
        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")

        # Attach to data for the View to use
        data['user'] = user
        data['staff_profile'] = staff_profile

        return data
