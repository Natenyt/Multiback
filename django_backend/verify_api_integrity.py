import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "graveyard.settings")  # adjust if needed
django.setup()


import json
from users.models import User
from message_app.models import Session
from message_app.serializers import SessionListSerializer
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

def verify():
    print("--- 1. Verifying User Model Fields ---")
    user_fields = [f.name for f in User._meta.get_fields()]
    print(f"User Fields: {user_fields}")
    
    if 'location' not in user_fields:
        print("CRITICAL FAIL: 'location' field missing on User model!")
        return
    if 'neighborhood' not in user_fields:
        print("CRITICAL FAIL: 'neighborhood' field missing on User model!")
        return
    print("PASS: User model has required fields.")

    print("\n--- 2. Creating Test Data ---")
    # Create or Get User
    user, created = User.objects.get_or_create(phone_number="+998991112233")
    user.full_name = "Verification User"
    user.location = "41.311081, 69.240562" # Tashkent Coords
    user.neighborhood = "Yunusabad"
    user.save()
    print(f"User: {user} | Location: {user.location} | Neighborhood: {user.neighborhood}")

    # Create Session linked to User
    session = Session.objects.create(user=user, status='open')
    print(f"Session Created: {session.session_uuid}")

    print("\n--- 3. Verifying Serializer Output ---")
    # Mock Request context
    factory = APIRequestFactory()
    request = factory.get('/')
    
    serializer = SessionListSerializer(session, context={'request': Request(request)})
    data = serializer.data
    
    print("Serialized Data Keys:", data.keys())
    print(f"Neighborhood Name (API): '{data.get('neighborhood_name')}'")
    print(f"Location (API): '{data.get('location')}'")
    
    if data.get('neighborhood_name') == "Yunusabad" and data.get('location') == "41.311081, 69.240562":
        print("\n>>> VERIFICATION SUCCESSFUL <<<")
        print("The API is correctly pulling data from the User model.")
    else:
        print("\n>>> VERIFICATION FAILED <<<")
        print("Data mismatch.")

if __name__ == "__main__":
    verify()
