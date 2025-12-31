# Running the Dashboard

## Prerequisites

1. **Django Backend** - Make sure you have:
   - Python virtual environment activated
   - Database migrations applied: `python manage.py migrate`
   - Install CORS package: `pip install django-cors-headers`
   - Redis running (if needed for caching/websockets)

2. **Next.js Frontend** - Make sure you have:
   - Node.js installed
   - Dependencies installed: `cd node_backend/staff-dashboard && npm install`

## Step-by-Step Guide

### 1. Install CORS Package (First Time Only)

```bash
cd django_backend
pip install django-cors-headers
```

### 2. Start Django Backend Server

Open a terminal and run:

```bash
cd django_backend
python manage.py runserver
```

The Django server will start on **http://localhost:8000**

**Note**: Make sure you've run migrations: `python manage.py migrate`

### 3. Start Next.js Frontend Server

Open a **second terminal** and run:

```bash
cd node_backend/staff-dashboard
npm run dev
```

The Next.js server will start on **http://localhost:3000**

### 4. Open in Cursor Browser Preview

1. In Cursor, press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Simple Browser" or "Preview"
3. Select "Simple Browser: Show"
4. Enter the URL: `http://localhost:3000`

Alternatively, you can:
- Click on the URL in the terminal output (it should be clickable)
- Or manually open `http://localhost:3000` in your browser

### 5. Authentication

**Important**: The dashboard requires authentication. You'll need to:

1. Have a valid JWT token stored in localStorage
2. Or implement a login page (currently not included)
3. For testing, you can manually set a token in browser DevTools:
   ```javascript
   localStorage.setItem('auth_token', 'your-jwt-token-here');
   ```

## Quick Start Script (Optional)

You can create a script to run both servers. For Windows PowerShell:

**`start-servers.ps1`**:
```powershell
# Start Django
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd django_backend; python manage.py runserver"

# Wait a bit
Start-Sleep -Seconds 3

# Start Next.js
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd node_backend/staff-dashboard; npm run dev"
```

Run it with:
```powershell
.\start-servers.ps1
```

## Troubleshooting

### CORS Issues
If you see CORS errors, make sure Django has CORS configured. Check `django_backend/graveyard/settings.py` for CORS settings.

### API Connection Issues
- Verify Django is running on port 8000
- Check the `.env.local` file in `node_backend/staff-dashboard/` has the correct API URL
- Check browser console for errors

### Port Already in Use
- Django: Change port with `python manage.py runserver 8001`
- Next.js: Change port with `npm run dev -- -p 3001`
- Update `.env.local` accordingly

## Development URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Django Admin**: http://localhost:8000/admin (if configured)

