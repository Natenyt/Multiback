# Token Refresh Race Condition Fix - Explanation

## Problem Overview

The original code had a **race condition** where multiple concurrent API calls could trigger simultaneous token refresh requests. This could lead to authentication failures and unnecessary API calls.

## How the Race Condition Occurred

### Original Code Flow (BROKEN):

```typescript
// Multiple functions calling getValidAuthToken() simultaneously
export async function getValidAuthToken(): Promise<string | null> {
  let token = getAuthToken();
  
  if (isTokenExpired(token)) {
    // ❌ PROBLEM: Each call creates its own refresh request
    token = await refreshAccessToken(); // No locking mechanism
  }
  
  return token;
}
```

### The Race Condition Scenario:

**Timeline of Events:**

1. **T=0ms**: User's access token expires
2. **T=1ms**: User clicks "Send Message" button
3. **T=2ms**: Dashboard stats hook runs (polling every 10 seconds)
4. **T=3ms**: Notification manager receives WebSocket message, triggers API call
5. **T=4ms**: All three functions detect expired token simultaneously

**What Happens Without the Fix:**

```
Call 1 (sendMessage):     getValidAuthToken() → refreshAccessToken() → Request 1 to backend
Call 2 (dashboard stats): getValidAuthToken() → refreshAccessToken() → Request 2 to backend  
Call 3 (notifications):   getValidAuthToken() → refreshAccessToken() → Request 3 to backend
```

**Result:**
- **3 simultaneous refresh requests** sent to backend
- Backend processes all 3 requests
- **First request succeeds** → Returns new access token + invalidates old refresh token
- **Second request fails** → Refresh token already used/invalidated → Returns 401
- **Third request fails** → Refresh token already used/invalidated → Returns 401

### Example Case: Authentication Failure

**Scenario:** User is actively using the dashboard when their token expires.

**Step-by-step failure:**

1. **Initial State:**
   - Access token: `expired_at: 10:00:00`
   - Refresh token: `valid`
   - Current time: `10:00:01` (token expired 1 second ago)

2. **User Actions Trigger Multiple API Calls:**
   ```javascript
   // User sends a message
   sendMessage(sessionUuid, { text: "Hello" })
   
   // Dashboard stats auto-refresh (polling)
   useDashboardStats() // Calls getDashboardStats()
   
   // Notification manager receives new notification
   NotificationManager receives WebSocket message → calls getTickets()
   ```

3. **All Three Calls Detect Expired Token:**
   ```javascript
   // Call 1: sendMessage
   getValidAuthToken() 
   → isTokenExpired() returns true
   → refreshAccessToken() // Starts Request A
   
   // Call 2: getDashboardStats (happens 5ms later)
   getValidAuthToken()
   → isTokenExpired() returns true  
   → refreshAccessToken() // Starts Request B
   
   // Call 3: getTickets (happens 10ms later)
   getValidAuthToken()
   → isTokenExpired() returns true
   → refreshAccessToken() // Starts Request C
   ```

4. **Backend Receives Three Refresh Requests:**
   ```
   Request A: POST /auth/token/refresh/ { refresh: "token123" }
   Request B: POST /auth/token/refresh/ { refresh: "token123" }  // 5ms later
   Request C: POST /auth/token/refresh/ { refresh: "token123" }  // 10ms later
   ```

5. **Backend Processing (Typical JWT Refresh Token Behavior):**
   - **Request A** (first): ✅ Success
     - Validates refresh token
     - Issues new access token: `new_access_token_abc`
     - **Invalidates old refresh token** (security best practice)
     - Issues new refresh token: `new_refresh_token_xyz`
   
   - **Request B** (second): ❌ Fails
     - Tries to validate `token123`
     - **Refresh token already invalidated by Request A**
     - Returns: `401 Unauthorized` or `403 Forbidden`
   
   - **Request C** (third): ❌ Fails
     - Same as Request B
     - Returns: `401 Unauthorized` or `403 Forbidden`

6. **Frontend Consequences:**
   ```javascript
   // Call 1 (sendMessage): ✅ Success
   // Gets new_access_token_abc, request succeeds
   
   // Call 2 (getDashboardStats): ❌ Failure
   // refreshAccessToken() returns null
   // clearAuthTokens() is called
   // User is redirected to /login
   // Dashboard stats never load
   
   // Call 3 (getTickets): ❌ Failure  
   // refreshAccessToken() returns null
   // clearAuthTokens() is called (again)
   // User is redirected to /login (again)
   // Tickets never load
   ```

7. **User Experience:**
   - User successfully sends message (Call 1 worked)
   - **Dashboard suddenly logs them out** (Call 2 failed)
   - User is redirected to login page
   - User has to log in again, losing their work/context
   - **Frustrating user experience**

## The Fix: Promise-Based Mutex

### New Code Flow (FIXED):

```typescript
// Global lock variable
let refreshPromise: Promise<string | null> | null = null;

export async function getValidAuthToken(): Promise<string | null> {
  let token = getAuthToken();
  
  if (isTokenExpired(token)) {
    // ✅ FIX: Check if refresh is already in progress
    if (refreshPromise) {
      // Wait for existing refresh instead of starting new one
      return await refreshPromise;
    }
    
    // ✅ FIX: Create refresh promise and store it
    refreshPromise = refreshAccessToken()
      .then((newToken) => {
        refreshPromise = null; // Clear after completion
        return newToken;
      })
      .catch((error) => {
        refreshPromise = null; // Clear on error
        throw error;
      });
    
    token = await refreshPromise;
  }
  
  return token;
}
```

### How the Fix Prevents the Race Condition:

**Same Scenario with Fix:**

1. **T=0ms**: Token expires
2. **T=1ms**: User clicks "Send Message"
3. **T=2ms**: Dashboard stats hook runs
4. **T=3ms**: Notification manager triggers API call

**What Happens With the Fix:**

```
Call 1 (sendMessage):     
  getValidAuthToken() 
  → isTokenExpired() = true
  → refreshPromise = null (no existing refresh)
  → Creates refreshPromise = refreshAccessToken()
  → Starts Request A to backend

Call 2 (dashboard stats): 
  getValidAuthToken()
  → isTokenExpired() = true
  → refreshPromise exists! ✅
  → Waits for existing refreshPromise
  → Does NOT create new request

Call 3 (notifications):    
  getValidAuthToken()
  → isTokenExpired() = true
  → refreshPromise exists! ✅
  → Waits for existing refreshPromise
  → Does NOT create new request
```

**Result:**
- **Only 1 refresh request** sent to backend ✅
- All three calls wait for the same refresh promise
- All three calls get the same new token
- **No authentication failures** ✅
- **Better user experience** ✅

### Visual Timeline Comparison:

**BEFORE (Broken):**
```
Time →
Call 1: [Refresh Request A] ──────────┐
Call 2: [Refresh Request B] ──────────┤──→ 2 failures, 1 success
Call 3: [Refresh Request C] ──────────┘
```

**AFTER (Fixed):**
```
Time →
Call 1: [Refresh Request] ──────────┐
Call 2: [Wait for promise] ──────────┤──→ All succeed
Call 3: [Wait for promise] ──────────┘
```

## Additional Benefits

1. **Reduced Server Load**: Only one refresh request instead of multiple
2. **Consistent State**: All concurrent calls get the same new token
3. **Better Performance**: No wasted network requests
4. **Prevents Token Invalidation**: Refresh token isn't invalidated prematurely

## Testing the Fix

To verify the fix works, you can:

1. **Simulate concurrent calls:**
   ```javascript
   // In browser console
   Promise.all([
     getValidAuthToken(),
     getValidAuthToken(),
     getValidAuthToken(),
   ]).then(tokens => {
     console.log('All tokens:', tokens);
     // Should all be the same token
   });
   ```

2. **Monitor network tab:**
   - Before fix: Multiple `/auth/token/refresh/` requests
   - After fix: Only one `/auth/token/refresh/` request

3. **Check console logs:**
   - Should see: "Token refresh already in progress, waiting for existing refresh..."
   - For concurrent calls after the first one

## Conclusion

The fix ensures that **only one token refresh happens at a time**, even when multiple API calls need authentication simultaneously. This prevents authentication failures, improves user experience, and reduces server load.

