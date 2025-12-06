import httpx
import asyncio
import os

async def test_connect():
    url = "http://127.0.0.1:8001/api/v1/analyze"
    print(f"Testing connection to: {url}")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://127.0.0.1:8001/docs", timeout=5.0)
            print(f"Docs Endpoint Status: {response.status_code}")
            
            # Now try the actual endpoint (method not allowed is expected for GET, but proves connectivity)
            response = await client.post(url, json={}, timeout=5.0) 
            print(f"Analyze Endpoint Status: {response.status_code}")
            print("Connection Successful!")
    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connect())
