"""
Database connection middleware to handle stale connections.
Ensures database connections are fresh at the start of each request.
Includes proactive connection pinging to prevent MySQL timeout errors.
"""
import logging
import time
from django.db import connections
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class DatabaseConnectionMiddleware(MiddlewareMixin):
    """
    Enhanced middleware to ensure database connections are fresh and alive.
    Closes stale connections and proactively pings connections to prevent
    MySQL connection timeout errors (4031, 2013, 2006).
    """
    _last_ping = {}  # Track last ping time per connection alias
    _ping_interval = 300  # Ping every 5 minutes (300 seconds)
    
    def process_request(self, request):
        """
        Ensure connections are fresh and ping them proactively if needed.
        This prevents MySQL error 4031 (connection closed due to inactivity).
        """
        current_time = time.time()
        
        for alias, conn_obj in connections.databases.items():
            try:
                conn = connections[alias]
                
                # Check if connection exists
                if conn.connection is not None:
                    # First, check if connection is usable
                    if hasattr(conn, 'is_usable'):
                        try:
                            if not conn.is_usable():
                                logger.debug(f"Closing stale connection: {alias}")
                                conn.close()
                                self._last_ping.pop(alias, None)
                                continue
                        except Exception as e:
                            logger.debug(f"Connection check failed for {alias}: {e}, closing connection")
                            conn.close()
                            self._last_ping.pop(alias, None)
                            continue
                    
                    # Proactive ping to keep connection alive
                    # Only ping if enough time has passed since last ping
                    last_ping = self._last_ping.get(alias, 0)
                    time_since_ping = current_time - last_ping
                    
                    if time_since_ping > self._ping_interval:
                        try:
                            # Execute lightweight query to keep connection alive
                            with conn.cursor() as cursor:
                                cursor.execute("SELECT 1")
                            self._last_ping[alias] = current_time
                            logger.debug(f"Pinged connection to keep alive: {alias}")
                        except Exception as e:
                            logger.warning(f"Ping failed for {alias}: {e}, closing connection")
                            conn.close()
                            self._last_ping.pop(alias, None)
                            
            except Exception as e:
                # If anything goes wrong, close the connection to be safe
                logger.debug(f"Error checking database connection {alias}: {e}, closing connection")
                try:
                    connections[alias].close()
                    self._last_ping.pop(alias, None)
                except Exception:
                    pass
        
        return None

