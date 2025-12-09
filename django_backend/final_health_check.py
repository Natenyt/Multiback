import os
import django
from rest_framework.test import APIRequestFactory, force_authenticate
from message_app.views import AppealListView, AppealCreateView
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'graveyard.settings')
django.setup()

from users.models import User
from message_app.models import Session

def run_health_check():
    print("--- STARTING HEALTH CHECK ---")
    
    # 1. Setup Data
    user, created = User.objects.get_or_create(phone_number="+998901234567")
    user.full_name = "Test Citizen"
    user.neighborhood = "Test Mahalla"
    user.location = "41.000, 69.000"
    user.save()
    print(f"User: {user.full_name}, Mahalla: {user.neighborhood}")

    # 2. Check Appeal Create (API View Logic)
    factory = APIRequestFactory()
    view = AppealCreateView.as_view()
    
    create_payload = {'text': 'Health check appeal'}
    request = factory.post('/api/appeals/create/', create_payload, format='json')
    force_authenticate(request, user=user)
    
    print("\nTesting Appeal Create...")
    response = view(request)
    if response.status_code == 201:
        print("Appeal Create: OK")
        # print(response.data)
    else:
        print(f"Appeal Create FAILED: {response.status_code} {response.data}")
        return

    # 3. Check Appeal List (Serialization Logic)
    view_list = AppealListView.as_view()
    request_list = factory.get('/api/appeals/')
    force_authenticate(request_list, user=user)
    
    print("\nTesting Appeal List (Serialization)...")
    response_list = view_list(request_list)
    
    if response_list.status_code == 200:
        results = response_list.data['results']
        if len(results) > 0:
            first_item = results[0]
            print("\n[Audit Item 1]")
            print(f"Neighborhood Name: '{first_item.get('neighborhood_name')}' (Expected: 'Test Mahalla')")
            print(f"Location: '{first_item.get('location')}' (Expected: '41.000, 69.000')")
            
            if first_item.get('neighborhood_name') == "Test Mahalla":
                print(">> DATA INTEGRITY PASS <<")
            else:
                print(">> DATA INTEGRITY FAIL <<")
        else:
            print("List Empty - Cannot verify serialization.")
    else:
        print(f"List View Failed: {response_list.status_code}")

if __name__ == "__main__":
    run_health_check()
