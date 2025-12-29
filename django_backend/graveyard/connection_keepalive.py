"""
Background connection keepalive system for MySQL.
Pings database connections periodically to prevent timeout errors.
"""
import threading
import time
import logging
from django.db import connections
from django.core.exceptions import ImproperlyConfigured

logger = logging.getLogger(__name__)


class ConnectionKeepAlive:
    """
    Background thread that periodically pings database connections
    to keep them alive and prevent MySQL timeout errors.
    
    This is especially useful for long-running processes (like ASGI servers)
    that may have idle periods between requests.
    """
    
    def __init__(self, interval=300):
        """
        Initialize the keepalive system.
        
        Args:
            interval: Seconds between pings (default: 300 = 5 minutes)
                     Should be less than MySQL's wait_timeout
        """
        self.interval = interval
        self.running = False
        self.thread = None
        self._lock = threading.Lock()
    
    def ping_connections(self):
        """
        Ping all database connections to keep them alive.
        Closes any connections that fail the ping.
        """
        for alias, conn in connections.databases.items():
            try:
                conn_obj = connections[alias]
                
                # Only ping if connection exists
                if conn_obj.connection is not None:
                    try:
                        # Execute lightweight query to keep connection alive
                        with conn_obj.cursor() as cursor:
                            cursor.execute("SELECT 1")
                        logger.debug(f"Keepalive ping successful: {alias}")
                    except Exception as e:
                        # Connection is bad, close it
                        logger.warning(
                            f"Keepalive ping failed for {alias}: {e}, closing connection"
                        )
                        try:
                            conn_obj.close()
                        except Exception:
                            pass
                else:
                    # Connection doesn't exist, ensure it's ready for next use
                    logger.debug(f"No connection to ping for {alias}")
                    
            except Exception as e:
                logger.error(f"Error in keepalive ping for {alias}: {e}")
    
    def start(self):
        """
        Start the keepalive background thread.
        Safe to call multiple times (idempotent).
        """
        with self._lock:
            if self.running:
                logger.debug("Connection keepalive already running")
                return
            
            self.running = True
            
            def keepalive_loop():
                """Background loop that pings connections periodically."""
                logger.info(f"Connection keepalive started (interval: {self.interval}s)")
                
                while self.running:
                    try:
                        self.ping_connections()
                    except Exception as e:
                        logger.error(f"Connection keepalive error: {e}")
                    
                    # Sleep in small intervals to allow quick shutdown
                    sleep_time = 0
                    while sleep_time < self.interval and self.running:
                        time.sleep(min(1, self.interval - sleep_time))
                        sleep_time += 1
            
            self.thread = threading.Thread(
                target=keepalive_loop,
                daemon=True,
                name="DBConnectionKeepAlive"
            )
            self.thread.start()
            logger.info("Connection keepalive thread started")
    
    def stop(self):
        """
        Stop the keepalive background thread.
        Safe to call multiple times (idempotent).
        """
        with self._lock:
            if not self.running:
                return
            
            self.running = False
            logger.info("Stopping connection keepalive...")
            
            if self.thread:
                self.thread.join(timeout=5)
                if self.thread.is_alive():
                    logger.warning("Keepalive thread did not stop within timeout")
                else:
                    logger.info("Connection keepalive stopped")
    
    def is_running(self):
        """Check if keepalive is currently running."""
        with self._lock:
            return self.running


# Global instance
_keepalive_instance = None


def get_keepalive(interval=300):
    """
    Get or create the global keepalive instance.
    
    Args:
        interval: Seconds between pings (only used on first call)
    
    Returns:
        ConnectionKeepAlive instance
    """
    global _keepalive_instance
    if _keepalive_instance is None:
        _keepalive_instance = ConnectionKeepAlive(interval=interval)
    return _keepalive_instance


def start_keepalive(interval=300):
    """Start the global keepalive instance."""
    keepalive = get_keepalive(interval=interval)
    keepalive.start()
    return keepalive


def stop_keepalive():
    """Stop the global keepalive instance."""
    global _keepalive_instance
    if _keepalive_instance:
        _keepalive_instance.stop()

