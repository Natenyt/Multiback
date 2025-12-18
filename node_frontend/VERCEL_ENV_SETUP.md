# Vercel Environment Variable Setup

## Required Variable Name (EXACT)

```
NEXT_PUBLIC_API_URL
```

**Important:**
- Must be exactly this name (case-sensitive)
- Must start with `NEXT_PUBLIC_` prefix
- No spaces, no typos

## How to Set in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-backend-domain.com/api` (your actual backend URL)
   - **Environment**: Select **Production** (or all environments)
5. Click **Save**
6. **IMPORTANT**: Redeploy your application after adding/changing

## Common Mistakes

❌ `NEXT_PUBLIC_API_BASE_URL` (wrong name)
❌ `API_URL` (missing NEXT_PUBLIC_ prefix)
❌ `next_public_api_url` (wrong case)
❌ `NEXT_PUBLIC_API_URL ` (trailing space)
❌ `NEXT_PUBLIC_API_URL/` (trailing slash in name)

✅ `NEXT_PUBLIC_API_URL` (correct!)

## Value Format

✅ `https://api.example.com/api`
✅ `https://your-app.railway.app/api`
✅ `https://your-app.render.com/api`
❌ `http://localhost:8000/api` (won't work from Vercel)
❌ `api.example.com/api` (missing protocol)

## Verify It's Working

After redeploying, check browser console - you should see:
```
NEXT_PUBLIC_API_URL: https://your-backend-url.com/api
```

If you see `undefined` or `http://localhost:8000/api`, the variable isn't set correctly.


