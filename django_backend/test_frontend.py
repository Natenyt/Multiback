import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def test_frontend_api():
    print("--- Testing Frontend API Endpoints ---")
    
    # Authenticate first (using previously fixed auth flow)
    phone = "+998901634567"
    otp_resp = requests.post(f"{BASE_URL}/auth/send-otp/", json={"phone_number": phone})
    auth_resp = requests.post(f"{BASE_URL}/auth/verify-otp/", json={"phone_number": phone, "code": "1111"})
    
    if auth_resp.status_code != 200:
        print("FAILED: Auth")
        return
        
    token = auth_resp.json()['access']
    headers = {"Authorization": f"Bearer {token}"}
    print(f"Authenticated as {phone}")

    # 1. Common Resources: Neighborhoods
    print("\n1. Fetching Neighborhoods...")
    resp = requests.get(f"{BASE_URL}/common/neighborhoods/", headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"Found {len(data)} neighborhoods. 1st: {data[0]['name_uz'] if data else 'None'}")
    
    # 2. Appeals: Create
    print("\n2. Creating Appeal...")
    payload = {
        "text": "This is a test appeal from the verification script."
    }
    # Note: Creating simple text appeal for now
    resp = requests.post(f"{BASE_URL}/appeals/create/", data=payload, headers=headers)
    print(f"Status: {resp.status_code}")
    
    session_uuid = None
    if resp.status_code == 201:
        data = resp.json()
        session_uuid = data['session_uuid']
        print(f"Created Session UUID: {session_uuid}")
        print(f"Initial Status: {data.get('status')}")
        print(f"Last Msg Timestamp: {data.get('last_message_timestamp')}")
    else:
        print(f"Create Failed: {resp.text}")
        return

    # 3. Appeals: List
    print("\n3. Listing Appeals...")
    resp = requests.get(f"{BASE_URL}/appeals/", headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        sessions = resp.json()
        print(f"My Appeals Count: {len(sessions)}")
        if sessions:
            print(f"First Appeal Avatar: {sessions[0].get('assigned_staff_avatar')}")
            print(f"First Appeal Staff: {sessions[0].get('assigned_staff_name')}")
    
    # 4. Appeal Detail
    print(f"\n4. Fetching Detail for {session_uuid}...")
    resp = requests.get(f"{BASE_URL}/appeals/{session_uuid}/", headers=headers)
    print(f"Status: {resp.status_code}")

    # 5. Chat: Send Message
    print("\n5. Sending Chat Message...")
    chat_payload = {"text": "Hello, is anyone there?"}
    resp = requests.post(f"{BASE_URL}/chat/{session_uuid}/send/", data=chat_payload, headers=headers)
    print(f"Status: {resp.status_code}")
    
    # 6. Chat: History
    print("\n6. Fetching Chat History...")
    resp = requests.get(f"{BASE_URL}/chat/{session_uuid}/history/", headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        history = resp.json()
        msgs = history.get('messages', [])
        print(f"History Message Count: {len(msgs)}")
        if msgs:
            print(f"Last Message: {msgs[-1]['contents'][0]['text']}")

    print("\n--- TEST COMPLETE ---")

if __name__ == "__main__":
    try:
        test_frontend_api()
    except Exception as e:
        print(f"Test Failed: {e}")
