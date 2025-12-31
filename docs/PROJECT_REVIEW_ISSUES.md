# Project Review - Issues Found

## 🔴 CRITICAL SECURITY ISSUES

### 1. Hardcoded Secret Key in Settings
**File:** `django_backend/graveyard/settings.py:28`
- **Issue:** Secret key is hardcoded in source code
- **Risk:** High - Anyone with access to code can compromise sessions
- **Fix:** Use environment variable: `SECRET_KEY = config('SECRET_KEY')`

### 2. DEBUG Mode Enabled in Production
**File:** `django_backend/graveyard/settings.py:31`
- **Issue:** `DEBUG = True` exposes sensitive error information
- **Risk:** High - Information disclosure, security vulnerabilities exposed
- **Fix:** `DEBUG = config('DEBUG', default=False, cast=bool)`

### 3. Empty ALLOWED_HOSTS
**File:** `django_backend/graveyard/settings.py:33`
- **Issue:** `ALLOWED_HOSTS = []` allows any host header
- **Risk:** High - Host header injection attacks
- **Fix:** `ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')`

### 4. JWT Token Validation Uses Wrong Key
**File:** `django_backend/websockets/middleware.py:13`
- **Issue:** Uses `settings.SECRET_KEY` instead of JWT signing key
- **Risk:** High - Token validation will fail or use wrong key
- **Fix:** Should use `settings.SIMPLE_JWT['SIGNING_KEY']` or proper JWT library validation

### 5. JWT Token Uses Wrong Payload Field
**File:** `django_backend/websockets/middleware.py:14`
- **Issue:** Uses `payload.get("user_id")` but JWT tokens typically use `user_id` or `sub`
- **Risk:** Medium - Authentication may fail
- **Fix:** Verify actual JWT payload structure from `rest_framework_simplejwt`

### 6. Missing Function Definition
**File:** `django_backend/users/views.py:28`
- **Issue:** `get_tokens_for_user()` is called but not defined in the file
- **Risk:** High - Code will crash with `NameError`
- **Fix:** Add function:
```python
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }
```

### 7. Unprotected Internal Endpoints
**File:** `django_backend/api/views.py:16, 44`
- **Issue:** `@permission_classes([AllowAny])` on internal endpoints
- **Risk:** High - Anyone can call these endpoints
- **Fix:** Use IP whitelist or internal network authentication

## 🟠 HIGH PRIORITY ISSUES

### 8. Duplicate Imports in views_history.py
**File:** `django_backend/message_app/views_history.py:1-22`
- **Issue:** Entire import block is duplicated (lines 1-11 and 13-22)
- **Risk:** Low - Code duplication, maintenance issue
- **Fix:** Remove duplicate imports

### 9. Duplicate Import of config in settings.py
**File:** `django_backend/graveyard/settings.py:15, 186`
- **Issue:** `from decouple import config` imported twice
- **Risk:** Low - Redundant import
- **Fix:** Remove duplicate import on line 186

### 10. Missing Error Handling in Database Queries
**File:** `django_backend/message_app/views_ai_webhook.py:21-33`
- **Issue:** Uses `.get()` which raises exceptions, but error handling is incomplete
- **Risk:** Medium - Could expose internal errors
- **Fix:** Already has try-except, but could be improved

### 11. Missing Transaction Management
**File:** `django_backend/message_app/views_send.py:72-91`
- **Issue:** Uses `transaction.atomic()` but doesn't handle all edge cases
- **Risk:** Medium - Partial data could be saved on error
- **Fix:** Ensure all database operations are within transaction

### 12. Missing Input Validation
**File:** `django_backend/api/views.py:18, 46`
- **Issue:** No validation on incoming data from external services
- **Risk:** Medium - Could cause errors or security issues
- **Fix:** Add serializer validation or explicit field validation

### 13. Potential N+1 Query Problem
**File:** `django_backend/message_app/views_history.py:42-44`
- **Issue:** Uses `prefetch_related` but may still have N+1 issues with serializers
- **Risk:** Medium - Performance degradation with many messages
- **Fix:** Review serializer usage and optimize queries

### 14. Missing Permission Check on AI Webhook
**File:** `django_backend/message_app/views_ai_webhook.py:9`
- **Issue:** `AIWebhookView` has no permission classes defined
- **Risk:** Medium - Anyone can call this endpoint
- **Fix:** Add authentication or IP whitelist

### 15. Inconsistent Error Responses
**File:** `django_backend/api/views.py:106`
- **Issue:** Returns HTTP 200 on error instead of appropriate error code
- **Risk:** Low - Makes error handling difficult for clients
- **Fix:** Return proper HTTP status codes

## 🟡 MEDIUM PRIORITY ISSUES

### 16. Missing URL Encoding in Token Parsing
**File:** `django_backend/websockets/middleware.py:40`
- **Issue:** Token extraction doesn't handle URL encoding
- **Risk:** Medium - Tokens with special characters may fail
- **Fix:** Use `urllib.parse.parse_qs()` for proper parsing

### 17. Print Statements Instead of Logging
**File:** Multiple files
- **Issue:** Uses `print()` instead of proper logging
- **Risk:** Low - Not production-ready
- **Fix:** Replace with `logger.debug/info/warning/error()`

### 18. Missing Timeout on External Requests
**File:** `django_backend/api/views.py:100`
- **Issue:** Has timeout but no retry logic
- **Risk:** Medium - Could fail silently
- **Fix:** Add retry logic or better error handling

### 19. Hardcoded Values
**File:** `django_backend/support_tools/ai_client.py:20-22`
- **Issue:** Model settings hardcoded in function
- **Risk:** Low - Not configurable
- **Fix:** Move to settings or make configurable

### 20. Missing Validation on UUID Format
**File:** `django_backend/message_app/views_send.py:23`
- **Issue:** No validation that `session_uuid` is valid UUID format
- **Risk:** Low - Could cause 500 errors
- **Fix:** Django URL routing handles this, but could add explicit validation

### 21. Incomplete Error Messages
**File:** `django_backend/message_app/routing.py:29-34`
- **Issue:** Only prints errors, doesn't log or notify
- **Risk:** Low - Errors may go unnoticed
- **Fix:** Use proper logging and error tracking

### 22. Missing Index on Foreign Keys
**File:** `django_backend/message_app/models.py`
- **Issue:** Some foreign keys may not have explicit indexes
- **Risk:** Low - Performance issue with large datasets
- **Fix:** Review and add `db_index=True` where needed

### 23. Race Condition in Message Creation
**File:** `django_backend/message_app/views_send.py:59-69`
- **Issue:** Check-then-create pattern without proper locking
- **Risk:** Medium - Could create duplicates under high load
- **Fix:** Use `get_or_create()` or database-level unique constraint

### 24. Missing Celery Configuration
**File:** `django_backend/message_app/tasks.py`
- **Issue:** Celery tasks defined but no Celery configuration visible
- **Risk:** Medium - Tasks may not work
- **Fix:** Ensure Celery is properly configured in settings

### 25. Duplicate Task Definition
**File:** `django_backend/message_app/tasks.py:1-28, 36-97`
- **Issue:** File appears to have duplicate task definitions or structure
- **Risk:** Low - Code organization issue
- **Fix:** Review and consolidate

## 🟢 LOW PRIORITY / CODE QUALITY

### 26. Inconsistent Naming Conventions
- **Issue:** Mix of snake_case and camelCase in some places
- **Fix:** Standardize on snake_case (Python convention)

### 27. Missing Type Hints
- **Issue:** Many functions lack type hints
- **Fix:** Add type hints for better IDE support and documentation

### 28. Missing Docstrings
- **Issue:** Some functions/classes lack docstrings
- **Fix:** Add comprehensive docstrings

### 29. Magic Numbers
- **Issue:** Hardcoded numbers (e.g., timeout values, sizes)
- **Fix:** Extract to constants or settings

### 30. Missing Tests
- **Issue:** No visible test coverage for critical paths
- **Fix:** Add unit and integration tests

### 31. Inconsistent Response Formats
- **Issue:** Some endpoints return different response structures
- **Fix:** Standardize API response format

## 📋 SUMMARY

**Total Issues Found:** 31
- **Critical Security:** 7
- **High Priority:** 8
- **Medium Priority:** 10
- **Low Priority:** 6

**Immediate Actions Required:**
1. Fix missing function (6) - Code will crash!
2. Fix all security issues (1-5, 7)
3. Remove duplicate code (8-9)
4. Add proper authentication to webhooks (14)
5. Fix JWT token validation (4-5)
6. Add input validation (12)

