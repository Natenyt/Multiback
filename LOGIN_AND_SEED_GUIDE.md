# Login Page and Database Seeding Guide

## Login Page

### Features
- ✅ Login with **username** or **email**
- ✅ Toggle between username/email login methods
- ✅ JWT authentication
- ✅ Automatic redirect to dashboard after login
- ✅ Custom footer: "Don't have an account? contact superuser" with link to https://t.me/nathan_2net
- ✅ No "Forgot password" option
- ✅ No "Login with Google" option

### Access
- URL: `http://localhost:3000/login`
- Root page (`/`) redirects to `/login`

### Backend Changes
- Modified `StaffLoginSerializer` to accept either `username` or `email`
- Login endpoint: `POST /api/auth/staff-login/`
- Request body examples:
  ```json
  // Username login
  {
    "username": "alisher",
    "password": "testpass123"
  }
  
  // Email login
  {
    "email": "alisher.staff@example.com",
    "password": "testpass123"
  }
  ```

## Database Seeding

### Run Seed Command
```bash
cd django_backend
python manage.py seed_data
```

### Clear Existing Data (Optional)
```bash
python manage.py seed_data --clear
```

### What Gets Created

1. **6 Neighborhoods**
   - Tinchlik, Yangiobod, Dustlik, Olmazor, Yunusobod, Chilonzor

2. **4 Departments**
   - Ijtimoiy himoya (Social Protection)
   - Sog'liqni saqlash (Healthcare)
   - Ta'lim (Education)
   - Kommunal xizmatlar (Utilities)

3. **5 Staff Users** (with profiles)
   - Alisher Usmanov (username: `alisher`, email: `alisher.staff@example.com`)
   - Aziza Karimova (username: `aziza`, email: `aziza.staff@example.com`)
   - Bekzod Toshmatov (username: `bekzod`, email: `bekzod.staff@example.com`)
   - Dilnoza Rahimova (username: `dilnoza`, email: `dilnoza.staff@example.com`)
   - Eldor Sobirov (username: `eldor`, email: `eldor.staff@example.com`)
   - **Password for all**: `testpass123`

4. **30 Citizen Users**
   - Random names (male and female)
   - Assigned to random neighborhoods
   - Email addresses generated

5. **Sessions (Past 7 Days)**
   - 10-20 sessions per day
   - Random statuses: unassigned, assigned, closed, escalated
   - Random origins: web, telegram
   - Sessions distributed across departments

6. **Daily Performance Records**
   - Records for all staff members for the past 7 days
   - Random tickets solved (0-15 per day)
   - Random average response times

## Testing Login

### Test Credentials (after seeding)

**Username Login:**
- Username: `alisher`
- Password: `testpass123`

**Email Login:**
- Email: `alisher.staff@example.com`
- Password: `testpass123`

You can use any of the 5 staff users created by the seed script.

## Authentication Flow

1. User visits `/login`
2. User enters username/email and password
3. Frontend sends request to `/api/auth/staff-login/`
4. Backend validates and returns JWT token
5. Token stored in `localStorage` as `auth_token`
6. User redirected to `/dashboard`
7. Dashboard layout checks for token (via `AuthGuard`)
8. If no token, redirects back to `/login`

## Files Created/Modified

### Backend
- `django_backend/users/serializers.py` - Updated to support email login
- `django_backend/departments/management/commands/seed_data.py` - New seed command

### Frontend
- `node_backend/staff-dashboard/app/login/page.tsx` - Login page
- `node_backend/staff-dashboard/components/auth-guard.tsx` - Auth protection component
- `node_backend/staff-dashboard/app/dashboard/layout.tsx` - Added AuthGuard
- `node_backend/staff-dashboard/app/layout.tsx` - Removed sidebar (moved to dashboard layout)
- `node_backend/staff-dashboard/app/page.tsx` - Redirects to login





