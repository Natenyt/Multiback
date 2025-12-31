Task 2.5: Django Authentication API (Custom User Model)

Objective: Implement the Authentication endpoints using the existing User model. The system supports two auth flows: OTP (for Citizens) and Password (for Staff).

Context:

Model: We are using a custom User model (already defined in users/models.py) where USERNAME_FIELD = 'phone_number'.

Staff Link: Staff members have a corresponding StaffProfile entry linking them to a Department.

1. Helper Service (OTPService)
Create support_tools/services.py:

generate_otp(phone_number): Returns random 4 digits.

store_otp(phone_number, code): Saves to Redis (TTL=300s).

validate_otp(phone_number, code): Checks Redis. Returns True if valid.

Dev Mode: If settings.DEBUG is True, verify accepts 1111 for any phone.

2. API Endpoints
A. Citizen Flow (OTP)

POST /api/auth/send-otp/

Input: { "phone_number": "+998..." }

Logic: Normalize phone_number -> Call OTPService.generate -> Send SMS (Mock).

POST /api/auth/verify-otp/

Input: { "phone_number": "...", "code": "..." }

Logic:

Validate OTP.

Get or Create: user, created = User.objects.get_or_create(phone_number=phone).

Generate JWT Tokens (SimpleJWT).

Response:

JSON

{
    "access": "...",
    "refresh": "...",
    "is_new_user": true,  # Frontend uses this to show Registration Form
    "role": "citizen"
}
B. Staff Flow (Password)

POST /api/auth/staff-login/

Input: { "phone_number": "...", "password": "..." }

Logic:

user = authenticate(phone_number=..., password=...)

Security Check: Check if StaffProfile exists for this user.

If no StaffProfile, return 403 Forbidden (Citizen cannot log in here).

Fetch department_id from the profile.

Response:

JSON

{
    "access": "...",
    "role": "staff",
    "department_id": "uuid-of-dept"
}
C. Registration / Profile (The "New User Save")
PATCH /api/users/profile/

Permission: IsAuthenticated.

Input: { "full_name": "...", "neighborhood": "...", "location": "..." } same registration as the telegram bot but without the phone_number

Logic: Update the request.user instance with these fields.

Use Case: This is called immediately after a New Citizen logs in via OTP.


D. User Data

GET /api/users/me/:

Logic: Check request.user. If they have a StaffProfile, return staff data. If UserProfile, return citizen data.


Definition of Done:

send-otp generates a Redis key.

verify-otp logs in existing users AND creates new users automatically.

staff-login strictly enforces StaffProfile existence.

PATCH /profile successfully updates the full_name of the logged-in user.







reddis is running on port 6379