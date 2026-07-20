# V4-R4 Gate 8D Credential Provenance Failed

## Cause
On V4-R4, the Engineer credential was changed through the generic `updateUser` server action rather than the dedicated `resetUserPassword` workflow.

## Preservation Data
- **Engineer User ID**: `cmriniqgy001lvchcegw8qcxv`
- **updateUser operation timestamp**: `2026-07-16T12:18:15.081Z`
- **Fields changed**: `passwordHash`, `updatedAt`
- **Authenticated actor**: `cmqiy15bq0000vc1cq1f3zg6j` (Super Admin)
- **Available audit records**: Missing for password reset.
- **Missing PASSWORD_RESET_COMPLETED record**: Yes
- **Missing USER_SESSIONS_REVOKED record**: Yes
- **Schedule tables remain zero**: Yes
