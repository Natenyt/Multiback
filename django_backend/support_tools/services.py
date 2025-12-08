from django.core.cache import cache
from django.conf import settings
import random

class OTPService:
    @staticmethod
    def generate_otp(phone_number: str) -> str:
        """Generates a 4-digit OTP."""
        return str(random.randint(1000, 9999))

    @staticmethod
    def store_otp(phone_number: str, code: str, ttl: int = 300):
        """Stores OTP in Redis with a TTL (default 5 minutes)."""
        cache_key = f"otp:{phone_number}"
        cache.set(cache_key, code, timeout=ttl)

    @staticmethod
    def validate_otp(phone_number: str, code: str) -> bool:
        """
        Validates the OTP.
        If DEBUG is True, accepts '1111' as a universal magic code.
        """
        if settings.DEBUG and code == "1111":
            return True
            
        cache_key = f"otp:{phone_number}"
        stored_code = cache.get(cache_key)
        
        if stored_code and str(stored_code) == str(code):
            cache.delete(cache_key) # Consume OTP
            return True
        return False
