import httpx
import os
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

async def send_to_ai_service(session_uuid, message_uuid, text, language='uz'):
    """
    Sends the user message to the FastAPI AI Microservice for analysis.
    """
    url = f"{settings.AI_MICROSERVICE_URL}/analyze"
    
    payload = {
        "session_uuid": str(session_uuid),
        "message_uuid": str(message_uuid),
        "text": text,
        "settings": {
            "model": "gemini-2.0-flash",
            "temperature": 0.2,
            "max_tokens": 500
        }
    }
    
    logger.debug(f"Sending to {url} with payload size {len(str(payload))}")
    
    try:
        async with httpx.AsyncClient() as client:
            logger.debug(f"Initiating httpx post request to {url}")
            response = await client.post(url, json=payload, timeout=10.0)
            
            if response.status_code == 200:
                logger.info(f"Successfully sent message {message_uuid} to AI Service.")
                return True
            else:
                logger.error(f"AI Service returned error: {response.status_code} - {response.text}")
                return False
                
    except Exception as e:
        logger.error(f"Failed to connect to AI Service: {e}")
        return False
