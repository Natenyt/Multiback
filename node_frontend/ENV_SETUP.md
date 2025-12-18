# Environment Variables Setup for Vercel

## Required Environment Variables

### 1. `BACKEND_PRIVATE_URL` (Private - Server-side only)
- **Purpose**: Backend API URL for HTTP requests (kept private via Next.js API proxy)
- **Value**: `http://185.247.118.219:8000/api`
- **Visibility**: Server-side only (not exposed to browser)
- **Usage**: Used by Next.js API routes to proxy requests to your Django backend

### 2. `NEXT_PUBLIC_WS_URL` (Public - Client-side)
- **Purpose**: WebSocket URL for real-time connections
- **Value**: `wss://185.247.118.219:8000` (use `wss://` for HTTPS, `ws://` for HTTP)
- **Visibility**: Public (exposed to browser - required for WebSocket connections)
- **Usage**: Used by client-side components for WebSocket connections
- **Note**: 
  - WebSockets require direct connection, cannot use HTTP proxy
  - **IMPORTANT**: For HTTPS pages (Vercel), you MUST use `wss://` (secure WebSocket)
  - If not set, the code will auto-detect and use `wss://` for HTTPS pages

## How to Set in Vercel

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add both variables:
   - **Name**: `BACKEND_PRIVATE_URL`
     - **Value**: `http://185.247.118.219:8000/api`
     - **Environment**: Production (or all)
   
   - **Name**: `NEXT_PUBLIC_WS_URL`
     - **Value**: `ws://185.247.118.219:8000`
     - **Environment**: Production (or all)
3. **IMPORTANT**: Redeploy after adding/changing variables

## How It Works

### HTTP Requests (Private)
- Client makes request to `/api/proxy/...`
- Next.js API route receives request
- API route uses `BACKEND_PRIVATE_URL` (server-side only) to forward request
- Backend URL is never exposed to browser

### WebSocket Connections (Public)
- Client connects directly to WebSocket server
- Uses `NEXT_PUBLIC_WS_URL` (must be public for browser access)
- WebSockets cannot use HTTP proxy, require direct connection

## Security Benefits

✅ Backend HTTP URL is kept private (server-side only)
✅ Only WebSocket URL is public (necessary for real-time features)
✅ All HTTP API calls go through Next.js proxy
✅ Backend URL cannot be discovered by inspecting browser code

