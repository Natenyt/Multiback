# Data Model Relations Map

This document serves as the absolute source of truth for the Django Backend data model.

## 1. User `users.User`
**Identity & Demographics**
- `user_uuid` (UUID, Unique)
- `phone_number` (String, Unique)
- `full_name` (String, Nullable)
- `avatar` (ImageField, Nullable)
- `neighborhood` (String! **Note: This is currently a CharField, NOT a ForeignKey to Neighborhood model in current implementation? Checking code...**)
    - *Correction*: `users/models.py` line 43: `neighborhood = models.CharField(max_length=128, blank=True, null=True)`.
    - *CRITICAL FINDING*: The `User` model has `neighborhood` as a **CharField**, not a ForeignKey.
    - *IMPLICATION*: `obj.user.neighborhood.name_uz` in serializer WILL FAIL if `neighborhood` is just a string. 
    - *ACTION REQUIRED*: I must verify if `User.neighborhood` is intended to be a plain string or if there is a mismatch with `support_tools.Neighborhood`.
    - *Wait, looking at `implementation_plan.md` (Task 1)*: It says "Neighborhood Selection".
    - *Logic Check*: If `User.neighborhood` is a CharField, then `source='user.neighborhood.name_uz'` is WRONG. It should just be `source='user.neighborhood'`.
    - *Hypothesis*: The User model definition I just read shows `neighborhood = models.CharField`.
    - *Verification*: I will verify this in the test script.

## 2. Session `message_app.Session`
**Links**
- `user` -> `users.User` (The Citizen)
- `assigned_staff` -> `users.User` (The Staff Member)
- `assigned_department` -> `departments.Department` (The Unit)

**Fields**
- `status` (Open/Pending/Closed)
- `created_at`

**Traversals**
- **Citizen Name**: `session.user.full_name`
- **Citizen Avatar**: `session.user.avatar`
- **Citizen Neighborhood**: `session.user.neighborhood` (String) ?? 
- **Staff Name**: `session.assigned_staff.full_name`
- **Staff Avatar**: `session.assigned_staff.avatar`

## 3. StaffProfile `departments.StaffProfile`
**Links**
- `user` -> `users.User` (OneToOne)
- `department` -> `departments.Department`

**Fields**
- `role` (Manager/Staff)
- `job_title`

## 4. Neighborhood `support_tools.Neighborhood`
- `name_uz`, `name_ru`
- *Usage*: Currently used in `NeighborhoodListView` for dropdowns.
- *Disconnection*: It seems `User.neighborhood` is storing the *name* (String) rather than the FK, OR the model definition I saw is outdated/simplified.

## 5. Message `message_app.Message`
- `session` -> `Session`
- `sender` -> `users.User`
- `is_staff_message` (Boolean)

## Critical Audit Findings (Pre-Test)
1. **User.neighborhood Type Mismatch**:
   - `users/models.py` defines `neighborhood = models.CharField`.
   - `SessionListSerializer` attempts `source='user.neighborhood.name_uz'`.
   - **Constraint**: `CharField` does not have `.name_uz`. This will cause an **AttributeError**.
   - **Fix**: Logic must change to `source='user.neighborhood'` OR `User` model must be updated to FK. 
   - *Decision*: Given "Full System Health Audit", I should probably fix the serializer to match the model (`source='user.neighborhood'`) unless the user explicitly wants an FK. Using a string is "safer" for now to avoid migration hell, but less strictly relational.

2. **User.location**:
   - `users/models.py` defines `location = models.CharField`.
   - `SessionListSerializer` uses `source='user.location'`.
   - **Status**: Correct.

3. **Staff Name/Avatar**:
   - `Session.assigned_staff` -> `User`. `User` has `full_name` and `avatar`.
   - `SessionListSerializer` uses `source='assigned_staff.full_name'`.
   - **Status**: Correct.
