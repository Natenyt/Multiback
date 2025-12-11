from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User
from departments.models import StaffProfile

class StaffLoginSerializer(serializers.Serializer):
    username = serializers.CharField() # Changed from phone_number
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if username and password:
            # 1. Find the Staff Profile first
            try:
                staff_profile = StaffProfile.objects.get(username=username)
            except StaffProfile.DoesNotExist:
                raise serializers.ValidationError("Invalid credentials") # Don't reveal username exists

            # 2. Get the linked User account (where the password hash lives)
            user = staff_profile.user

            # 3. Check the password manually
            if not user.check_password(password):
                raise serializers.ValidationError("Invalid credentials")
            
            # 4. Success! Check if active
            if not user.is_active:
                raise serializers.ValidationError("User account is disabled.")

            # Attach to data for the View to use
            data['user'] = user
            data['staff_profile'] = staff_profile
            
        else:
            raise serializers.ValidationError("Must include 'username' and 'password'")

        return data
