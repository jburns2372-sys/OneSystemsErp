# UAT V2 Actor Readiness

## 1. Environment Details
- **Environment**: UAT V2
- **Branch**: `scheduling-reconstruction-uat-v2`
- **Application**: `http://localhost:3000`

## 2. Selected Actors
The following actors have been provisioned and successfully verified for interactive UAT workflows on the live Next.js application:

### Site Engineer
- **Email**: `engineer@onesystemserp.com`
- **Role**: `SITE_ENGINEER`
- **Capabilities**: Project access, Schedule-generation access, `canCreate`, `canSubmit`
- **Restrictions**: Denied from `canReview`, `canApprove`, `canLock`

### Project Manager
- **Email**: `manager@onesystemserp.com`
- **Role**: `PROJECT_MANAGER`
- **Capabilities**: Project creation, BOQ import, Technical review, `canCreate`, `canSubmit`, `canReview`, `canEdit`, `canRevise`
- **Restrictions**: Denied from `canApprove`, `canLock`, Baseline activation

### Project Director
- **Email**: `director@onesystemserp.com`
- **Role**: `PROJECT_DIRECTOR`
- **Capabilities**: BOQ validation/locking, Technical approval, Baseline approval, Final activation, `canApprove`, `canLock`

## 3. Authentication Security
All actors have successfully completed the mandatory password reset flow triggered via `mustChangePassword=true`.
Legacy plaintext sessions are rejected, and only Auth.js signed JWTs verified against `sessionVersion` are accepted. Session isolation is strictly enforced.

## 4. Status
**GATE_5_COMPLETE**
