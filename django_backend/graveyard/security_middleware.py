"""
Security middleware to log and block suspicious requests.
"""
import logging
from django.http import HttpResponseForbidden
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('security')

# Suspicious patterns that indicate scanning/attacks
SUSPICIOUS_PATTERNS = [
    '/.env',
    '/.git/',
    '/wp-admin',
    '/wp-login',
    '/phpmyadmin',
    '/adminer',
    '/.well-known/',
    '/etc/passwd',
    '/proc/self/environ',
    '/v1/chat/completions',
    '/v1/messages',
    '/api/v1/chat',
    '/.aws/',
    '/config.json',
    '/package.json',
    '/composer.json',
    '/yarn.lock',
    '/package-lock.json',
]

class SecurityMiddleware(MiddlewareMixin):
    """
    Middleware to detect and log suspicious requests.
    Blocks obviously malicious requests.
    """
    
    def process_request(self, request):
        path = request.path.lower()
        ip_address = self.get_client_ip(request)
        
        # Check for suspicious patterns
        for pattern in SUSPICIOUS_PATTERNS:
            if pattern in path:
                logger.warning(
                    f"🚨 SUSPICIOUS REQUEST BLOCKED: {request.method} {path} "
                    f"from IP: {ip_address} | User-Agent: {request.META.get('HTTP_USER_AGENT', 'Unknown')}"
                )
                return HttpResponseForbidden("Forbidden")
        
        # Log suspicious host headers (host header injection attempts)
        host = request.META.get('HTTP_HOST', '')
        if host and host not in request.get_host():
            logger.warning(
                f"🚨 SUSPICIOUS HOST HEADER: {host} from IP: {ip_address}"
            )
        
        return None
    
    def get_client_ip(self, request):
        """Get the real client IP address, considering proxies."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'Unknown')
        return ip


