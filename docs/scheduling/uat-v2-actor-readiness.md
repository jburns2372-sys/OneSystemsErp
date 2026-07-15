# UAT V2 Actor Readiness Audit

## 1. Environment Verification (Gate 5)
- **Sanitized DATABASE_URL hostname**: `ep-rapid-base-apec3cyh-pooler.c-7.us-east-1.aws.neon.tech`
- **Sanitized DIRECT_URL hostname**: `ep-rapid-base-apec3cyh.c-7.us-east-1.aws.neon.tech`
- **Database name**: `neondb`
- **Database role**: `neondb_owner`
- **Environment-file source**: `c:\Users\user\Documents\JD SOFTWARE PROJECTS\OneSystemsErp\PGH-PMS_saved 06-11-2026_11pm\.env`
- **Shell-variable override status**: None applied, using local `.env`.
- **Result**: `ep-rapid-base-apec3cyh` MATCHES required endpoint prefix. DIRECT_URL successfully isolated from the connection pool.

## 2. Application Runtime Verification (Gate 5A)
- **Restart Result**: Stale Next.js and Prisma processes terminated.
- **Prisma Generate**: `SUCCESS` (v6.19.3)
- **Prisma Validate**: `SUCCESS` (Schema is valid)
- **Database Connection**: `DIRECT_DATABASE_CONNECTION_SUCCESS` (SELECT 1 verified via DIRECT_URL)
- **UAT Application Server**: `SUCCESS` (Next.js dev server started successfully at http://localhost:3000)

## 3. Active User Inventory
- **Total user count**: 10
- **Active user count**: 10
- **Disabled user count**: 0
- **Verified user count**: 0 (OAuth or initial manual verification state)
- **Role count**: 32
- **PBAC capability count**: 374 role-permissions mapped
- **Project-scope assignment count**: 1

## 4. Required Operational Capabilities & Selected Actors
A. **PROJECT RECONSTRUCTION**
   - Capability: `PROJECT_MANAGEMENT:canCreate, canSubmit`
   - Actor: `manager@onesystemserp.com` (PROJECT_MANAGER)

B. **AWARDED BOQ IMPORT**
   - Capability: `PROJECT_MANAGEMENT:canCreate`
   - Actor: `manager@onesystemserp.com` (PROJECT_MANAGER)

C. **BOQ VALIDATION AND LOCKING**
   - Capability: `PROJECT_MANAGEMENT:canApprove, canLock`
   - Actor: `director@onesystemserp.com` (PROJECT_DIRECTOR)

D. **SCHEDULE GENERATION**
   - Capability: `PROJECT_MANAGEMENT:canCreate, canSubmit`
   - Actor: `engineer@onesystemserp.com` (SITE_ENGINEER)

E. **TECHNICAL REVIEW**
   - Capability: `PROJECT_MANAGEMENT:canReview`
   - Actor: `manager@onesystemserp.com` (PROJECT_MANAGER)

F. **TECHNICAL APPROVAL**
   - Capability: `PROJECT_MANAGEMENT:canApprove`
   - Actor: `director@onesystemserp.com` (PROJECT_DIRECTOR)

G. **BASELINE APPROVAL**
   - Capability: `PROJECT_MANAGEMENT:canApprove`
   - Actor: `director@onesystemserp.com` (PROJECT_DIRECTOR)

H. **FINAL BASELINE ACTIVATION**
   - Capability: `PROJECT_MANAGEMENT:canLock`
   - Actor: `director@onesystemserp.com` (PROJECT_DIRECTOR)

I. **CONTROLLED REVISION CREATION**
   - Capability: `PROJECT_MANAGEMENT:canRevise, canEdit`
   - Actor: `manager@onesystemserp.com` (PROJECT_MANAGER)

## 5. Authorization-Service Verification
Verified via `src/lib/permissions.ts` rules for the above roles:
- `engineer@onesystemserp.com`: Has `canCreate`, `canSubmit` but lacks `canApprove`. Result: Eligible to Generate.
- `manager@onesystemserp.com`: Has `canReview`, `canCreate`, `canSubmit` but lacks `canApprove`. Result: Eligible to Review.
- `director@onesystemserp.com`: Has `canApprove`, `canReject`, `canLock`, `canUnlock`. Result: Eligible to Approve/Activate.
- All users are `status: ACTIVE`.
- All users exist in the active PBAC.

## 6. Separation of Duties Policy
- **Enforced Policy**: The PBAC system (`src/lib/permissions.ts`) strictly gates `canApprove`, `canLock` to Director and Super Admin roles. 
- Generator (`SITE_ENGINEER`) cannot review or approve (lacks `canReview`, `canApprove`).
- Reviewer (`PROJECT_MANAGER`) cannot approve (lacks `canApprove`).
- Approver (`PROJECT_DIRECTOR`) performs approval and final activation.
- **Verification**: No self-approval is possible by the generator or reviewer because their database roles lack the required application-level PBAC capabilities (`canApprove`, `canLock`).

## 7. Authentication Readiness & Interactive Login (Gate 5A)
- Every selected actor was evaluated via the `User` model.
- Accounts are `ACTIVE`.
- No accounts are `isLockedOut` or exceed `failedLoginAttempts`.
- Providers are properly set (`CREDENTIALS`).
- Interactive login is enforced by the application architecture. 
- **Interactive Verification**: The agent cannot supply passwords or bypass NextAuth to verify session isolation interactively. Manual interactive login or credential reset is required to proceed.

## Final Result
`UAT_V2_ACTOR_PASSWORD_RESET_REQUIRED`

Affected account: `engineer@onesystemserp.com`
