import time
import json
import requests
import websocket # pip install websocket-client
import threading

BASE_URL = "http://127.0.0.1:8000/api"
WS_URL = "ws://127.0.0.1:8000/ws/chat"

def on_message(ws, message):
    print(f"Received Broadcast: {message}")
    ws.close()

def on_error(ws, error):
    print(f"WS Error: {error}")

def on_close(ws, close_status_code, close_msg):
    print("WS Closed")

def on_open(ws):
    print("WS Connected!")
    # Send Typing
    print("3. Sending Typing Event...")
    ws.send(json.dumps({
        "type": "typing",
        "sender_id": 1,
        "is_typing": True
    }))

def trigger_http_send(session_uuid, token):
    time.sleep(2) # Wait for WS to establish
    print("5. Sending Message via HTTP...")
    headers = {"Authorization": f"Bearer {token}"}
    requests.post(
        f"{BASE_URL}/chat/{session_uuid}/send/", 
        data={"text": "Hello from HTTP"}, 
        headers=headers
    )

def test_websocket():
    # 1. Create a Session first
    print("1. Creating Appeal via HTTP...")
    # Auth
    phone = "+998901634567"
    auth_resp = requests.post(f"{BASE_URL}/auth/verify-otp/", json={"phone_number": phone, "code": "1111"})
    if auth_resp.status_code != 200:
        print("Auth Failed")
        return
        
    token = auth_resp.json()['access']
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create
    resp = requests.post(f"{BASE_URL}/appeals/create/", data={"text": "WS Test Appeal"}, headers=headers)
    if resp.status_code != 201:
        print(f"Failed to create appeal: {resp.text}")
        return
    
    session_uuid = resp.json()['session_uuid']
    print(f"Session Created: {session_uuid}")
    
    # 2. Connect to WebSocket
    uri = f"{WS_URL}/{session_uuid}/"
    print(f"2. Connecting to {uri}...")
    
    # Start HTTP trigger in background
    t = threading.Thread(target=trigger_http_send, args=(session_uuid, token))
    t.start()
    
    # Start WS blocking
    ws = websocket.WebSocketApp(uri,
                                on_open=on_open,
                                on_message=on_message,
                                on_error=on_error,
                                on_close=on_close)
    ws.run_forever()
    
    print("--- WS TEST COMPLETE ---")

if __name__ == "__main__":
    test_websocket()
