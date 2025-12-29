"""
Database retry utility for handling MySQL connection loss errors.
"""
import asyncio
import logging
from functools import wraps
from django.db import connection, OperationalError
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)

# Maximum number of retry attempts
MAX_RETRIES = 3
# Delay between retries (in seconds)
RETRY_DELAY = 1


def close_db_connection():
    """Close the current database connection to force a reconnect."""
    try:
        connection.close()
        logger.info("Database connection closed for retry")
    except Exception as e:
        logger.warning(f"Error closing database connection: {e}")


async def db_retry_async(func, *args, **kwargs):
    """
    Retry a database operation with automatic reconnection on connection loss.
    
    Usage:
        result = await db_retry_async(sync_to_async(User.objects.get), user_id=123)
    """
    last_exception = None
    
    for attempt in range(MAX_RETRIES):
        try:
            return await func(*args, **kwargs)
        except OperationalError as e:
            error_code = e.args[0] if e.args else None
            # MySQL error 2013: Lost connection to MySQL server during query
            # MySQL error 2006: MySQL server has gone away
            if error_code in (2013, 2006):
                last_exception = e
                logger.warning(
                    f"Database connection lost (attempt {attempt + 1}/{MAX_RETRIES}): {e}"
                )
                
                if attempt < MAX_RETRIES - 1:
                    # Close the connection to force a reconnect
                    await sync_to_async(close_db_connection)()
                    # Wait before retrying
                    await asyncio.sleep(RETRY_DELAY * (attempt + 1))
                    continue
            else:
                # For other OperationalErrors, don't retry
                raise
        except Exception as e:
            # For non-OperationalError exceptions, don't retry
            raise
    
    # If we exhausted all retries, raise the last exception
    logger.error(f"Database operation failed after {MAX_RETRIES} attempts")
    raise last_exception


def db_retry_sync(func, *args, **kwargs):
    """
    Retry a database operation synchronously with automatic reconnection on connection loss.
    
    Usage:
        result = db_retry_sync(User.objects.get, user_id=123)
    """
    last_exception = None
    
    for attempt in range(MAX_RETRIES):
        try:
            return func(*args, **kwargs)
        except OperationalError as e:
            error_code = e.args[0] if e.args else None
            # MySQL error 2013: Lost connection to MySQL server during query
            # MySQL error 2006: MySQL server has gone away
            if error_code in (2013, 2006):
                last_exception = e
                logger.warning(
                    f"Database connection lost (attempt {attempt + 1}/{MAX_RETRIES}): {e}"
                )
                
                if attempt < MAX_RETRIES - 1:
                    # Close the connection to force a reconnect
                    close_db_connection()
                    # Wait before retrying
                    import time
                    time.sleep(RETRY_DELAY * (attempt + 1))
                    continue
            else:
                # For other OperationalErrors, don't retry
                raise
        except Exception as e:
            # For non-OperationalError exceptions, don't retry
            raise
    
    # If we exhausted all retries, raise the last exception
    logger.error(f"Database operation failed after {MAX_RETRIES} attempts")
    raise last_exception


def with_db_retry(func):
    """
    Decorator to automatically retry database operations on connection loss.
    
    Usage:
        @with_db_retry
        @sync_to_async
        def get_user(user_id):
            return User.objects.get(id=user_id)
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        return await db_retry_async(func, *args, **kwargs)
    return wrapper

