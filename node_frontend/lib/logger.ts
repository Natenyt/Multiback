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

// Cache user context to avoid repeated localStorage access
let cachedUserContext: LogEntry['user'] | null = null;
let userContextCacheTime = 0;
const USER_CONTEXT_CACHE_TTL = 30000; // Cache for 30 seconds

// Get current user context (if available) - with caching
const getUserContext = (): LogEntry['user'] => {
  if (typeof window === 'undefined') return undefined;
  
  // Return cached value if still valid
  const now = Date.now();
  if (cachedUserContext !== null && (now - userContextCacheTime) < USER_CONTEXT_CACHE_TTL) {
    return cachedUserContext;
  }
  
  // Refresh cache
  try {
    const staffUuid = localStorage.getItem('staff_uuid');
    cachedUserContext = staffUuid ? { staff_uuid: staffUuid } : undefined;
    userContextCacheTime = now;
    return cachedUserContext;
  } catch {
    cachedUserContext = undefined;
    userContextCacheTime = now;
    return undefined;
  }
};

// Buffer logs and send to server in batches
let logBuffer: LogEntry[] = [];
const LOG_BUFFER_SIZE = 10; // Send logs in batches of 10
const LOG_BUFFER_MAX_SIZE = 500; // Maximum buffer size to prevent memory issues
const LOG_FLUSH_INTERVAL = 5000; // Flush every 5 seconds

// Lock mechanism to prevent concurrent flush operations
let isFlushing = false;
let flushIntervalId: NodeJS.Timeout | null = null;
let beforeUnloadHandler: (() => void) | null = null;

// Flush logs to server (with lock to prevent concurrent execution)
const flushLogs = async (): Promise<void> => {
  // Prevent concurrent flush operations
  if (isFlushing) return;
  if (logBuffer.length === 0) return;
  if (typeof window === 'undefined') return;
  
  // Acquire lock
  isFlushing = true;
  
  try {
    // Copy buffer and clear it atomically
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
        // Keep only most recent logs to prevent buffer bloat
        const logsToKeep = logsToSend.slice(-50);
        logBuffer = [...logsToKeep, ...logBuffer].slice(0, LOG_BUFFER_MAX_SIZE);
      }
    } catch (error) {
      // If sending fails, put logs back in buffer (up to limit)
      const logsToKeep = logsToSend.slice(-50);
      logBuffer = [...logsToKeep, ...logBuffer].slice(0, LOG_BUFFER_MAX_SIZE);
    }
  } finally {
    // Always release lock
    isFlushing = false;
  }
};

// Initialize periodic flush (only once)
if (typeof window !== 'undefined' && !flushIntervalId) {
  flushIntervalId = setInterval(flushLogs, LOG_FLUSH_INTERVAL);
  
  // Also flush on page unload (using sendBeacon for reliability)
  beforeUnloadHandler = () => {
    // Use sendBeacon for reliable delivery on page unload
    if (logBuffer.length > 0 && !isFlushing) {
      try {
        const logsToSend = [...logBuffer];
        const logsJson = JSON.stringify(logsToSend);
        // sendBeacon has size limit (~64KB), so we may need to split
        if (logsJson.length < 60000) {
          const blob = new Blob([logsJson], { type: 'application/json' });
          navigator.sendBeacon('/api/logs', blob);
        } else {
          // If too large, send only recent logs
          const recentLogs = logBuffer.slice(-20);
          const recentJson = JSON.stringify(recentLogs);
          const blob = new Blob([recentJson], { type: 'application/json' });
          navigator.sendBeacon('/api/logs', blob);
        }
      } catch {
        // Fallback to async fetch (may not complete before page closes)
        // Don't await - let it run in background
        flushLogs().catch(() => {});
      }
    }
  };
  
  window.addEventListener('beforeunload', beforeUnloadHandler);
  
  // Cleanup function (for Next.js hot reloading)
  if (typeof window !== 'undefined' && (window as any).__loggerCleanup) {
    (window as any).__loggerCleanup();
  }
  
  (window as any).__loggerCleanup = () => {
    if (flushIntervalId) {
      clearInterval(flushIntervalId);
      flushIntervalId = null;
    }
    if (beforeUnloadHandler) {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      beforeUnloadHandler = null;
    }
  };
}

// Write log entry to buffer (will be sent to server)
const writeLogToFile = async (entry: LogEntry): Promise<void> => {
  if (typeof window === 'undefined') return; // Server-side, skip
  
  try {
    // Enforce maximum buffer size to prevent memory issues
    if (logBuffer.length >= LOG_BUFFER_MAX_SIZE) {
      // Remove oldest logs (keep most recent)
      logBuffer = logBuffer.slice(-LOG_BUFFER_MAX_SIZE + 1);
    }
    
    // Add to buffer
    logBuffer.push(entry);
    
    // If buffer is full, flush immediately (non-blocking)
    if (logBuffer.length >= LOG_BUFFER_SIZE) {
      flushLogs().catch(() => {
        // Silently fail - flush will retry on next interval
      });
    }
    
    // Also store in sessionStorage for immediate debugging (limited size)
    // Optimize: Only update sessionStorage, don't parse entire array every time
    try {
      const storageKey = 'app_logs';
      const existing = sessionStorage.getItem(storageKey);
      let logs: LogEntry[] = [];
      
      if (existing) {
        try {
          logs = JSON.parse(existing);
        } catch {
          // If corrupted, start fresh
          logs = [];
        }
      }
      
      logs.push(entry);
      
      // Keep only last 50 logs in sessionStorage
      if (logs.length > 50) {
        logs = logs.slice(-50);
      }
      
      sessionStorage.setItem(storageKey, JSON.stringify(logs));
    } catch {
      // Silently fail if sessionStorage is unavailable
    }
  } catch (error) {
    // Silently fail - don't break app if logging fails
  }
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
  context?: LogEntry['context'],
  data?: Record<string, any>
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
  
  // Merge additional data with error data
  const mergedData = { ...errorData, ...(data || {}) };
  
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    category,
    message,
    data: mergedData,
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

