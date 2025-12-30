"""
Custom MySQL database backend with automatic reconnection on connection errors.

This backend extends Django's MySQL backend to automatically handle:
- Error 2013: Lost connection to MySQL server during query
- Error 2006: MySQL server has gone away
- Error 4031: Connection closed due to inactivity

When these errors occur, the backend automatically closes the stale connection
and reconnects before retrying the operation. This is the most robust solution
as it handles reconnection at the lowest level, automatically protecting all
database operations without requiring code changes.
"""
import logging
from django.db.backends.mysql.base import DatabaseWrapper as MySQLDatabaseWrapper
from django.db.utils import OperationalError

logger = logging.getLogger(__name__)

# MySQL error codes that indicate connection loss
CONNECTION_ERROR_CODES = (2006, 2013, 4031)


class DatabaseWrapper(MySQLDatabaseWrapper):
    """
    Custom MySQL database backend with automatic reconnection on connection errors.
    
    This wrapper catches connection errors during query execution and automatically
    reconnects before retrying the operation. This prevents "Lost connection" errors
    from causing application failures.
    
    The reconnection logic is handled at the cursor level, so all database operations
    automatically benefit from this protection.
    """
    
    def _cursor(self, name=None):
        """
        Create a cursor with automatic reconnection on connection errors.
        Override _cursor to wrap the cursor with reconnection logic.
        """
        cursor = super()._cursor(name)
        return ReconnectingCursorWrapper(cursor, self)


class ReconnectingCursorWrapper:
    """
    Wraps a database cursor to automatically handle connection errors.
    
    When a connection error occurs, this wrapper:
    1. Closes the stale connection
    2. Forces Django to create a new connection
    3. Retries the operation once
    
    This wrapper properly implements the cursor protocol including context manager support.
    """
    
    def __init__(self, cursor, connection_wrapper):
        self._cursor = cursor
        self._connection_wrapper = connection_wrapper
    
    def __getattr__(self, name):
        """
        Delegate all attribute access to the wrapped cursor.
        """
        return getattr(self._cursor, name)
    
    def __iter__(self):
        """
        Delegate iteration to the wrapped cursor.
        """
        return iter(self._cursor)
    
    def __enter__(self):
        """
        Support context manager protocol.
        """
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        Support context manager protocol.
        """
        return self._cursor.__exit__(exc_type, exc_val, exc_tb)
    
    def close(self):
        """
        Close the cursor.
        """
        return self._cursor.close()
    
    def _execute_with_reconnect(self, operation, sql, params=None):
        """
        Execute a database operation with automatic reconnection on connection errors.
        
        Args:
            operation: The cursor method to call ('execute' or 'executemany')
            sql: SQL query string
            params: Query parameters (single set for execute, list for executemany)
        """
        try:
            # Try the operation first
            if operation == 'execute':
                return self._cursor.execute(sql, params)
            elif operation == 'executemany':
                return self._cursor.executemany(sql, params)
        except OperationalError as e:
            error_code = e.args[0] if e.args else None
            
            # Check if this is a connection error we should retry
            if error_code in CONNECTION_ERROR_CODES:
                logger.warning(
                    f"MySQL connection error {error_code} during {operation}. "
                    f"Reconnecting and retrying..."
                )
                
                # Close the stale connection
                try:
                    self._connection_wrapper.close()
                except Exception as close_error:
                    logger.debug(f"Error closing stale connection: {close_error}")
                
                # Force a new connection - this will create a fresh connection
                self._connection_wrapper.ensure_connection()
                
                # Get a new cursor from the new connection
                # Use the connection's cursor() method to get a fresh cursor
                # This is safe because we've already ensured a new connection
                if self._connection_wrapper.connection:
                    try:
                        new_cursor = self._connection_wrapper.connection.cursor()
                        self._cursor = new_cursor
                    except Exception as cursor_error:
                        logger.error(f"Failed to create new cursor after reconnection: {cursor_error}")
                        raise OperationalError("Failed to reconnect to database")
                
                # Retry the operation with the new cursor
                try:
                    if operation == 'execute':
                        return self._cursor.execute(sql, params)
                    elif operation == 'executemany':
                        return self._cursor.executemany(sql, params)
                except OperationalError as retry_error:
                    # If retry also fails, log and re-raise
                    logger.error(f"Database operation failed after reconnection: {retry_error}")
                    raise
            else:
                # Re-raise if it's not a connection error
                raise
    
    def execute(self, sql, params=None):
        """
        Execute SQL with automatic reconnection on connection errors.
        """
        return self._execute_with_reconnect('execute', sql, params)
    
    def executemany(self, sql, param_list):
        """
        Execute SQL multiple times with automatic reconnection on connection errors.
        """
        return self._execute_with_reconnect('executemany', sql, param_list)

