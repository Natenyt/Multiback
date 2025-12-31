/**
 * Environment-based JSON Logger
 * 
 * Logs important application events in JSON format for easy searching during outages.
 * 
 * Console Logging: Only logs to browser console when NEXT_PUBLIC_LOGGING_ENABLED=true
 * File Logging: Always writes logs to server (logs/frontend/) regardless of environment
 * 
 * Log Levels:
 * - INFO: Important user journey events (authentication, navigation, key actions)
 * - ERROR: Errors that need attention
 * - WARN: Warnings that might indicate issues
 * 
 * Format: JSON for easy parsing and searching
 */

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'WARN';
  category: string;
  message: string;
  data?: Record<string, any>;
  user?: {
    staff_uuid?: string;
    session_uuid?: string;
  };
  context?: {
    pathname?: string;
    component?: string;
    function?: string;
  };
}

// Determine if console logging is enabled (browser console only)
const isConsoleLoggingEnabled = (): boolean => {
  if (typeof window === 'undefined') return false; // Server-side, no console
  // Only log to console if explicitly enabled
  return process.env.NEXT_PUBLIC_LOGGING_ENABLED === 'true';
};

// File logging is always enabled (always write to server)

// Get current user context (if available)
const getUserContext = (): LogEntry['user'] => {
  if (typeof window === 'undefined') return undefined;
  
  try {
    const staffUuid = localStorage.getItem('staff_uuid');
    return staffUuid ? { staff_uuid: staffUuid } : undefined;
  } catch {
    return undefined;
  }
};

// Buffer logs and send to server in batches
let logBuffer: LogEntry[] = [];
const LOG_BUFFER_SIZE = 10; // Send logs in batches of 10
const LOG_FLUSH_INTERVAL = 5000; // Flush every 5 seconds

// Flush logs to server
const flushLogs = async (): Promise<void> => {
  if (logBuffer.length === 0) return;
  if (typeof window === 'undefined') return;
  
  const logsToSend = [...logBuffer];
  logBuffer = [];
  
  try {
    const response = await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logsToSend),
    });
    
    if (!response.ok) {
      // If sending fails, put logs back in buffer (up to limit)
      logBuffer = [...logsToSend.slice(-50), ...logBuffer].slice(0, 100);
    }
  } catch (error) {
    // If sending fails, put logs back in buffer (up to limit)
    logBuffer = [...logsToSend.slice(-50), ...logBuffer].slice(0, 100);
  }
};

// Initialize periodic flush
if (typeof window !== 'undefined') {
  setInterval(flushLogs, LOG_FLUSH_INTERVAL);
  // Also flush on page unload
  window.addEventListener('beforeunload', () => {
    flushLogs();
  });
}

// Write log entry to buffer (will be sent to server)
const writeLogToFile = async (entry: LogEntry): Promise<void> => {
  if (typeof window === 'undefined') return; // Server-side, skip
  
  try {
    // Add to buffer
    logBuffer.push(entry);
    
    // If buffer is full, flush immediately
    if (logBuffer.length >= LOG_BUFFER_SIZE) {
      flushLogs();
    }
    
    // Also store in sessionStorage for immediate debugging (limited size)
    try {
      const logs = JSON.parse(sessionStorage.getItem('app_logs') || '[]');
      logs.push(entry);
      
      // Keep only last 50 logs in sessionStorage
      if (logs.length > 50) {
        logs.shift();
      }
      
      sessionStorage.setItem('app_logs', JSON.stringify(logs));
    } catch {
      // Silently fail if sessionStorage is unavailable
    }
  } catch (error) {
    // Silently fail - don't break app if logging fails
  }
};

// Format log entry as JSON string
const formatLogEntry = (entry: LogEntry): string => {
  return JSON.stringify(entry);
};

/**
 * Log an INFO level message (important user journey events)
 */
export function logInfo(
  category: string,
  message: string,
  data?: Record<string, any>,
  context?: LogEntry['context']
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'INFO',
    category,
    message,
    data,
    user: getUserContext(),
    context,
  };
  
  // Only log to console if explicitly enabled
  if (isConsoleLoggingEnabled()) {
    console.log(`[${category}] ${message}`, data || '');
  }
  
  // Always write to server (file logging)
  writeLogToFile(entry).catch(() => {
    // Silently fail
  });
}

/**
 * Log an ERROR level message
 */
export function logError(
  category: string,
  message: string,
  error?: Error | unknown,
  context?: LogEntry['context']
): void {
  const errorData: Record<string, any> = {};
  if (error instanceof Error) {
    errorData.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  } else if (error) {
    errorData.error = String(error);
  }
  
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    category,
    message,
    data: errorData,
    user: getUserContext(),
    context,
  };
  
  // Only log to console if explicitly enabled
  if (isConsoleLoggingEnabled()) {
    console.error(`[${category}] ${message}`, error || '');
  }
  
  // Always write to server (file logging)
  writeLogToFile(entry).catch(() => {
    // Silently fail
  });
}

/**
 * Log a WARN level message
 */
export function logWarn(
  category: string,
  message: string,
  data?: Record<string, any>,
  context?: LogEntry['context']
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'WARN',
    category,
    message,
    data,
    user: getUserContext(),
    context,
  };
  
  // Only log to console if explicitly enabled
  if (isConsoleLoggingEnabled()) {
    console.warn(`[${category}] ${message}`, data || '');
  }
  
  // Always write to server (file logging)
  writeLogToFile(entry).catch(() => {
    // Silently fail
  });
}

/**
 * Export logs (for debugging or sending to server)
 * Returns all logs stored in sessionStorage
 */
export function exportLogs(): LogEntry[] {
  if (typeof window === 'undefined') return [];
  
  try {
    return JSON.parse(sessionStorage.getItem('app_logs') || '[]');
  } catch {
    return [];
  }
}

/**
 * Clear logs
 */
export function clearLogs(): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem('app_logs');
  } catch {
    // Silently fail
  }
}

