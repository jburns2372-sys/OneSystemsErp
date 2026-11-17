# Phase 8 authentication security closeout — Preview only

Historical baseline findings below are superseded by the completed implementation
and [final local review / Preview acceptance plan](PHASE8_AUTH_FINAL_REVIEW_AND_PREVIEW_PLAN.md).
Local security review: **PASS**. Live Preview acceptance and merge remain **NO-GO**
until the documented gates pass. The implementation-required checklist below is
retained as historical context, not a request to repeat completed work.
Baseline release branch: `release/oserp-proj-uboq-001`, exact pre-change SHA `a850708f003798fbc237b8908330a0552beed7ec`.
Independent RBAC: 71/71 tests and 6/6 Preview checks were reported PASS on baseline; not rerun here.
Unrelated Project Intake redesign in Draft PR #2 is paused.

## Independently verified Preview privileges (2026-11-17)
Neon project `long-recipe-20782583`, branch `br-quiet-rice-bc1edkvd`, DB `oserp_uboq_preview`.

All of `oserp_preview_runtime_app`, `oserp_preview_direct_app`, `oserp_compat_app`, and `oserp_legacy_app` have:
- `User`: SELECT, no UPDATE/INSERT/DELETE; UPDATE is absent even for `failedLoginAttempts`, `lockedUntil`, `passwordHash`, and `sessionVersion`.
- `PasswordRecoveryToken`: no SELECT/INSERT/UPDATE/DELETE.
- `PasswordRecoveryRateLimit`: no SELECT/INSERT/UPDATE/DELETE.
- `AuditLog`: SELECT and INSERT, no UPDATE/DELETE.
No existing auth-oriented SECURITY DEFINER procedure was found in `public`.
The four tables have RLS off, so this is an explicit privilege-boundary issue, not an RLS filtering issue.

## Confirmed application defects on baseline

- `src/auth.ts` increments `failedLoginAttempts` with Prisma on bad passwords but has no threshold-based lockout, and its runtime role has no UPDATE access. A wrong password can cause a database exception instead of a normal rejected sign-in.
- `src/app/actions/recovery.ts` reads and writes recovery tables and updates `User` using the same runtime Prisma connection, which lacks permissions. Its multi-step token lifecycle and password reset cannot work as deployed.
- `src/lib/services/PasswordRecoveryMailer.ts` previously reported success for unsupported providers and ignored the `{error}` response of Resend. It also accepted incomplete provider configuration. Those defects are addressed on this *candidate branch*, not yet verified in Preview.
- The `requestPasswordReset` path previously revealed provider misconfiguration for known eligible accounts; candidate branch now returns its generic anti-enumeration response.
- Login email and password-validation result were unnecessarily logged; candidate branch removes that logging.

## Closeout implementation required (Codex)

1. Select a narrow, auditable database operation boundary for authentication; **do not grant blanket `User` UPDATE or unrestricted password/token-table DML to the general ERP runtime role**. Options: reviewed parameter-restricted, non-public SQL routines with strict search_path/ownership and explicit EXECUTE grants; or a separately secured auth-only service/database role with minimum necessary privileges. Document abuse analysis before selecting.
2. Make failed-login recording atomic and race-safe. Apply bounded threshold and lockout policy; preserve generic external sign-in errors; clear counter only after proven successful bcrypt authentication. Explicitly test wrong-password behavior when persistence fails and when account already locked.
3. Repair recovery rate limits (including concurrent requests and spoofed headers), token creation/revocation, provider dispatch handling, and single-use token redemption. All token/credential mutations must be transactional, role-scoped, and audit logged. Ensure password reset increments sessionVersion, clears lockout, and invalidates other active tokens.
4. Require verified SMTP/Resend provider configuration, verified sender domain, and Preview-only HTTPS `APP_BASE_URL`. Delivery-provider accepted != delivered; confirm via sanitized provider event or one Owner-approved real mailbox test, no token leakage.
5. Cover known/unknown accounts uniformly, missing provider credentials, provider error response, invalid/expired/duplicate tokens, password policy, concurrent redemption, role restrictions, and reverse-account-enumeration attempts.
6. Verify auth service cannot mutate arbitrary unrelated `User` columns or bypass project/RBAC controls. Review exact SQL privileges from `pg_catalog` and effective runtime role after migration.
7. Run `npx tsc --noEmit`, focused auth/recovery tests, Preview build, and bounded live Preview login + recovery checks with Owner interaction. The existing 71 RBAC tests need not be rerun except affected regression tests.
8. Record exact SHA, migration identity, CI/deployment checks, sanitized receipt, and GO/NO-GO. **No Production writes, merges, or deployment without separate authorization.**

## Changes already on security candidate branch
- `src/lib/services/PasswordRecoveryMailer.ts`: fail closed unless Resend key/from/HTTPS origin valid, fail on provider `error`, avoid sensitive logs.
- `src/app/actions/recovery.ts`: preserve generic response on missing provider for known users, sanitize error logs.
- `src/auth.ts`: eliminate raw email and password-check diagnostic logs.

These three fixes alone **do not resolve the database authorization/lockout blockers**. Do not mark overall security PASS until functional tests, DB permissions, real Preview deployment, and Owner UI acceptance are complete.
