/**
 * WebSocket URL utility
 * 
 * Centralized function to get WebSocket base URL
 * * Always uses environment variables - never hardcodes URLs
 * * Automatically handles protocol conversion (ws:// to wss:// for HTTPS)
 * * Falls back to localhost only for local development
 */

/**
 * Get WebSocket base URL from environment variable
 * 
 * @returns WebSocket base URL (e.g., 'wss://example.com:8000' or 'ws://localhost:8000')
 * 
 * @remarks
 * - Requires NEXT_PUBLIC_WS_URL environment variable to be set in production
 * - For local development, falls back to 'ws://localhost:8000' if env var not set
 * - Automatically converts ws:// to wss:// when page is served over HTTPS
 * - Never hardcodes production URLs - always uses environment variables
 */
export function getWsBaseUrl(): string {
  // Always prefer environment variable
  let wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  
  // Only use localhost fallback for local development (when env var is not set)
  // This prevents hardcoded production URLs
  if (!wsUrl) {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      // For HTTPS in production, NEXT_PUBLIC_WS_URL MUST be set
      // If not set, we can't safely guess - throw error or use current host
      console.warn(
        'NEXT_PUBLIC_WS_URL not set. Using current host for WebSocket connection. ' +
        'Please set NEXT_PUBLIC_WS_URL environment variable in production.'
      );
      // Use current host as fallback (better than hardcoding IP)
      const host = window.location.host;
      wsUrl = `wss://${host.replace(/:\d+$/, '')}:8000`;
    } else {
      // For local development (HTTP), use localhost
      wsUrl = 'ws://localhost:8000';
    }
  }
  
  // Ensure protocol matches page protocol for security
  // If page is HTTPS, WebSocket must be WSS
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    if (wsUrl.startsWith('ws://')) {
      // Convert ws:// to wss:// for HTTPS pages
      wsUrl = wsUrl.replace('ws://', 'wss://');
      console.warn('Converted ws:// to wss:// to match HTTPS page protocol');
    }
  }
  
  return wsUrl;
}

