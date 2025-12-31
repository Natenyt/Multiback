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
from django.db.backends.utils import CursorWrapper
from django.db.utils import OperationalError

logger = logging.getLogger(__name__)

# MySQL error codes that indicate connection loss
CONNECTION_ERROR_CODES = (2006, 2013, 4031)


class ReconnectingCursorWrapper(CursorWrapper):
    """
    Custom cursor wrapper that automatically reconnects on connection errors.
    
    Extends Django's CursorWrapper to catch connection errors and automatically
    reconnect before retrying the operation.
    """
    
    def execute(self, sql, params=None):
        """
        Execute SQL with automatic reconnection on connection errors.
        
        If a connection error occurs, this method automatically:
        1. Closes the stale connection
        2. Creates a new connection
        3. Retries the query
        4. Returns the result seamlessly
        
        The user code never sees the error - it's completely transparent.
        """
        try:
            return super().execute(sql, params)
        except OperationalError as e:
            error_code = e.args[0] if e.args else None
            
            # Check if this is a connection error we should retry
            if error_code in CONNECTION_ERROR_CODES:
                logger.warning(
                    f"MySQL connection error {error_code} during execute. "
                    f"Automatically reconnecting and retrying query (transparent to user)..."
                )
                
                # Close the stale connection
                try:
                    self.db.close()
                except Exception as close_error:
                    logger.debug(f"Error closing stale connection: {close_error}")
                
                # Force a new connection - this creates a fresh connection to MySQL
                self.db.ensure_connection()
                
                # Verify connection was created successfully
                if self.db.connection is None:
                    logger.error("Failed to establish new connection after error")
                    raise OperationalError("Failed to reconnect to database")
                
                # Create a new raw cursor from the connection
                # self.cursor is the raw database cursor (set by CursorWrapper.__init__)
                try:
                    self.cursor = self.db.connection.cursor()
                except Exception as cursor_error:
                    logger.error(f"Failed to create new cursor after reconnection: {cursor_error}")
                    raise OperationalError("Failed to reconnect to database")
                
                # Retry the operation - this will succeed with the new connection
                # The user code (bot handler) will receive the result as if nothing happened
                try:
                    return super().execute(sql, params)
                except OperationalError as retry_error:
                    # If retry also fails, log and re-raise (shouldn't happen normally)
                    logger.error(f"Query failed even after reconnection: {retry_error}")
                    raise
            else:
                # Re-raise if it's not a connection error (don't retry other errors)
                raise
    
    def executemany(self, sql, param_list):
        """
        Execute SQL multiple times with automatic reconnection on connection errors.
        
        Same transparent reconnection behavior as execute() - user code never sees errors.
        """
        try:
            return super().executemany(sql, param_list)
        except OperationalError as e:
            error_code = e.args[0] if e.args else None
            
            # Check if this is a connection error we should retry
            if error_code in CONNECTION_ERROR_CODES:
                logger.warning(
                    f"MySQL connection error {error_code} during executemany. "
                    f"Automatically reconnecting and retrying (transparent to user)..."
                )
                
                # Close the stale connection
                try:
                    self.db.close()
                except Exception as close_error:
                    logger.debug(f"Error closing stale connection: {close_error}")
                
                # Force a new connection
                self.db.ensure_connection()
                
                # Verify connection was created successfully
                if self.db.connection is None:
                    logger.error("Failed to establish new connection after error")
                    raise OperationalError("Failed to reconnect to database")
                
                # Create a new raw cursor from the connection
                try:
                    self.cursor = self.db.connection.cursor()
                except Exception as cursor_error:
                    logger.error(f"Failed to create new cursor after reconnection: {cursor_error}")
                    raise OperationalError("Failed to reconnect to database")
                
                # Retry the operation
                try:
                    return super().executemany(sql, param_list)
                except OperationalError as retry_error:
                    logger.error(f"Executemany failed even after reconnection: {retry_error}")
                    raise
            else:
                # Re-raise if it's not a connection error
                raise


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
        Override _cursor to use our custom cursor wrapper instead of the default CursorWrapper.
        """
        # Ensure connection exists - this is critical before creating a cursor
        self.ensure_connection()
        
        # Verify connection exists (defensive check)
        if self.connection is None:
            # Force connection if ensure_connection didn't work
            self.connect()
        
        # Get the raw cursor from the parent's create_cursor method
        # This requires self.connection to be set
        cursor = super().create_cursor(name)
        # Wrap it with our reconnecting wrapper instead of the default CursorWrapper
        return ReconnectingCursorWrapper(cursor, self)
