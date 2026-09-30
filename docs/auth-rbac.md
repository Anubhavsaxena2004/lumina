# Authentication, RBAC & Staff Isolation Design

## Overview
Kumkum Payal strictly isolates Staff users from Owner users:
- **Roles**: `OWNER` (Admin) and `STAFF`.
- **Password Security**: Passwords are saved with high-entropy Argon2 hashes.
- **Session Tokens**: Short-lived JWT access tokens (15m) distributed via `httpOnly` secure cookies with refresh token rotation (7d).
- **Rate Limiting & Deactivation**: Deactivated users (`is_active = false`) are rejected at the guard level on every incoming request.

## Double-Layer Staff Isolation

1. **Service Query Layer**:
   All database queries executed by staff automatically include:
   ```sql
   WHERE created_by = $caller_id
   ```
2. **Server-Owned Field Protection**:
   The `SanitizeInputInterceptor` blocks any request payload that attempts to submit:
   - `entry_at` (stamped solely by database `now()`)
   - `created_by` (derived exclusively from validated JWT context)
   - `is_deleted`, `deleted_at`, `deleted_by`

3. **Staff Access Boundaries**:
   - Staff **cannot** view entries of other staff.
   - Staff **cannot** edit or delete any transaction entry.
   - Staff **cannot** access staff management, audit log, cash & bank balance books, or reminder settings.
