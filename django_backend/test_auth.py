import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def test_auth_flow():
    print("--- Testing Auth Flow ---")
    
    # 1. Send OTP
    phone = "+998901634567"
    print(f"\n1. Sending OTP to {phone}...")
    resp = requests.post(f"{BASE_URL}/auth/send-otp/", json={"phone_number": phone})
    print(f"Status: {resp.status_code}, Body: {resp.json()}")
    
    if resp.status_code != 200:
        print("FAILED: Send OTP")
        return

    # 2. Verify OTP (using magic 1111)
    print(f"\n2. Verifying OTP for {phone} using code 1111...")
    resp = requests.post(f"{BASE_URL}/auth/verify-otp/", json={"phone_number": phone, "code": "1111"})
    print(f"Status: {resp.status_code}, Body: {resp.json()}")
    
    if resp.status_code != 200:
        print("FAILED: Verify OTP")
        return
        
    data = resp.json()
    token = data['access']
    print(f"Got Access Token: {token[:10]}...")

    # 3. Get Me
    print("\n3. Getting User Profile...")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/users/me/", headers=headers)
    print(f"Status: {resp.status_code}, Body: {resp.json()}")
    
    if resp.status_code != 200:
        print("FAILED: Get Me")
        return

    # 4. Update Profile
    print("\n4. Updating Profile...")
    update_data = {"full_name": "Test Citizen", "neighborhood": "Downtown"}
    resp = requests.patch(f"{BASE_URL}/users/profile-save/", json=update_data, headers=headers)
    print(f"Status: {resp.status_code}, Body: {resp.json()}")
    
    # 5. Verify Update
    resp = requests.get(f"{BASE_URL}/users/me/", headers=headers)
    print(f"Updated Profile: {resp.json()['full_name']}")

    print("\n--- TEST COMPLETE ---")

if __name__ == "__main__":
    try:
        test_auth_flow()
    except Exception as e:
        print(f"Test Failed: {e}")
