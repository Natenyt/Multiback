import os
import django
import sys

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'graveyard.settings')
django.setup()

from message_app.models import Session
from users.models import User
from django.db.models import ForeignKey

def check_relationships():
    print("--- Checking Session Model ---")
    field = Session._meta.get_field('assigned_staff')
    print(f"assigned_staff Type: {type(field)}")
    print(f"assigned_staff Related Model: {field.related_model}")
    print(f"Is ForeignKey? {isinstance(field, ForeignKey)}")

    print("\n--- Checking User Model ---")
    has_full_name = hasattr(User, 'full_name') or 'full_name' in [f.name for f in User._meta.get_fields()]
    print(f"User has 'full_name' field? {has_full_name}")
    
    has_avatar = hasattr(User, 'avatar') or 'avatar' in [f.name for f in User._meta.get_fields()]
    print(f"User has 'avatar' field? {has_avatar}")

    print("\n--- Testing ORM Access ---")
    # Try to create dummy data in memory/transaction to test access
    try:
        user = User.objects.first()
        if not user:
             print("No users found to test.")
             return

        print(f"Found User: {user} (UUID: {user.user_uuid})")
        print(f"User Full Name: {user.full_name}")

        session = Session(user=user, assigned_staff=user) # Assign self as staff for test
        print(f"Session Assigned Staff: {session.assigned_staff}")
        print(f"Session Assigned Staff Full Name: {session.assigned_staff.full_name}")
        print("ORM Access Successful!")
    except Exception as e:
        print(f"ORM Access FAILED: {e}")

if __name__ == "__main__":
    check_relationships()
