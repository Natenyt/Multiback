"""
Database utility functions to handle connection errors gracefully.
"""
import logging
from django.db import connection, connections
from django.db.utils import OperationalError
from functools import wraps

logger = logging.getLogger(__name__)


def close_stale_connections():
    """
    Close all stale database connections.
    Useful when MySQL closes connections due to inactivity.
    """
    for conn in connections.all():
        try:
            if conn.connection and not conn.is_usable():
                conn.close()
                logger.info("Closed stale database connection")
        except Exception as e:
            logger.warning(f"Error closing stale connection: {e}")


def retry_on_connection_error(max_retries=3, delay=0.1):
    """
    Decorator to retry database operations on connection errors.
    
    Handles MySQL errors:
    - 2013: Lost connection to MySQL server during query
    - 2006: MySQL server has gone away
    - 4031: The client was disconnected by the server because of inactivity
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    # Close stale connections before attempting
                    close_stale_connections()
                    return func(*args, **kwargs)
                except OperationalError as e:
                    error_code = e.args[0] if e.args else None
                    # MySQL connection errors that can be retried
                    if error_code in (2013, 2006, 4031):
                        if attempt < max_retries - 1:
                            logger.warning(
                                f"Database connection error {error_code} (attempt {attempt + 1}/{max_retries}). "
                                f"Retrying after closing stale connections..."
                            )
                            # Close all connections to force reconnection
                            connection.close()
                            import time
                            time.sleep(delay * (attempt + 1))  # Exponential backoff
                            continue
                    # Re-raise if not a retryable error or out of retries
                    raise
                except Exception as e:
                    # Re-raise non-OperationalError exceptions immediately
                    raise
            # If we get here, all retries failed
            raise OperationalError("Failed to execute database operation after retries")
        return wrapper
    return decorator


