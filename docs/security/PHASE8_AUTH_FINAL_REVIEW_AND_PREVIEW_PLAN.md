# Phase 8 final local security review and Preview acceptance

Local security review: **PASS**; no material auth defect found. Ready to request
controlled Preview acceptance. Migration/deployment/Owner acceptance remain gates;
PR #3 stays draft and unmerged. No Production change is authorized.

Repository `jburns2372-sys/OneSystemsErp`; worktree `.worktrees/auth-security-closeout`;
branch `fix/oserp-p8-auth-security-closeout`; pre-completion head
`7964e401465b69b051876266837cd9b038730756`. PR base is
`release/oserp-proj-uboq-001` at `a850708f003798fbc237b8908330a0552beed7ec`.

## Focused review

- `login_attempt(email,password)` verifies bcrypt inside PostgreSQL under a User
  row lock. No caller-validity boolean, legacy snapshot/finish API, or returned hash.
  Status/lock checks, bounded counters, five-attempt/15-minute lockout, session
  invalidation and audit insertion share that transaction. DB errors fail closed.
- Recovery uses 256-bit random tokens, SHA-256 digests, 30-minute expiry, prior-token
  revocation, locked single-use redemption and atomic password/session/audit changes.
  Reset locks User then token, clears lockout and preserves unrelated User fields.
- Normalized-email budgets serialize concurrent recovery requests, including absent
  accounts. Headers cannot bypass the budget. Generic responses, response floors
  and deferred provider work reduce enumeration; they do not guarantee identical
  network timing under every load condition.
- Only the independent dispatch identity can attest provider acceptance; issuer
  cannot activate a chosen token. Pending/failed tokens cannot reset passwords.
  Both identities live in the trusted server process: the split protects against
  one DB credential being compromised, not compromise of the entire app host.
- NOLOGIN owner has column-scoped User UPDATE; neither runtime role has direct
  User/token DML or owner membership. Role/status/email/assignments remain outside
  the routine mutation boundary. Non-public, fixed-search-path/UTC routines have
  explicit role-specific EXECUTE grants. No ordinary ERP privilege expansion.
- SUPER_ADMIN actor fields and existing RBAC/DAL sessionVersion checks are preserved.
  SQL matches existing public Prisma fields; private tables are SQL-managed.
- Verified TLS, parameterized queries, Preview-pinned mail origin and sanitized
  errors are retained. Provider acceptance is not inbox-delivery proof.
- All changed/untracked security files were reviewed. Test URLs/passwords and the
  public dummy bcrypt hash are synthetic; no new real secrets were found.

Working auth code, SQL and tests were preserved. Verified operational correction:
security-branch pushes/closure now skip the Neon lifecycle workflow, and Vercel Git
deployment is disabled for this branch only. Other branches retain their behavior.
[Vercel configuration reference](https://vercel.com/docs/project-configuration/git-configuration).

## Existing validation retained

| Check | Result |
| --- | --- |
| RBAC security | 71/71 PASS |
| Authentication application | 48/48 PASS |
| Isolated PostgreSQL 18 atomic security | 30/30 PASS |
| TypeScript | PASS, exit 0 |
| PostgreSQL bcrypt compatibility / dispatch isolation | local PASS |
| Login-Proof Patch V2 installer | exit 0 |

These are Owner-supplied completed results, deliberately not rerun. The PostgreSQL
log in Documents was inspected: `OSERP_AUTH_POSTGRES_FIXTURE_20261117-153440.log`,
30 pass, zero fail/skipped/cancelled. SHA-256:
`3034343cfde02121f0f3ef2019e9e60884595165b83b58011a9f1da65c6c0bf3`.
Backup: `OSERP_AUTH_LOGINPROOF_BACKUP_20261117-153226`.
Completion checks PASS: all three security scripts parse; JSON/YAML assertions
verify branch-only Vercel exclusion, skipped Neon dependency jobs and unchanged
compile-only build; 16 changed/untracked files passed the secret-pattern scan
(synthetic fixture URL excluded) and manual review; diff whitespace check passed.
Completion checks cover syntax, secret/diff review and automation exclusions only;
no app/SQL correction requires repeating the supplied suites. Preview build and
end-to-end acceptance remain pending.

## Preview-only execution plan - NOT EXECUTED

Execute only after separate Owner authorization for Preview writes/deployment.
Stop on any mismatch or failed gate. Record sanitized receipts, never URLs with
credentials, tokens, passwords, provider payloads or reset links.

1. **Pin target and operator.** Confirm clean worktree, branch and committed SHA;
   record `Get-FileHash prisma/auth-security/preview-auth-boundary-v1.sql`.
   Verify in Neon's control plane: project `long-recipe-20782583`, branch
   `br-quiet-rice-bc1edkvd`, endpoint `ep-small-paper-bcyvlhat`, database
   `oserp_uboq_preview`. Use the existing protected migration credential as
   `neondb_owner` via direct host
   `ep-small-paper-bcyvlhat.c-16.us-east-1.aws.neon.tech`; never an ERP credential.
   Compare SQL identity with those values:

   ```sql
   SELECT current_database(), session_user, current_user,
          current_setting('neon.project_id',true) AS project_id,
          current_setting('neon.branch_id',true) AS branch_id,
          current_setting('neon.endpoint_id',true) AS endpoint_id;
   ```

2. **Preconditions and recovery point.** Verify operator ownership/grant authority
   on User, PasswordRecoveryToken and AuditLog, role creation and ownership-transfer
   authority; trusted `public.pgcrypto` installation; no untrusted CREATE on public
   or private schemas. Require absent auth roles/schema/legacy proof routines.
   Existing objects require inspection and a reviewed forward repair, never a blind
   rerun/drop. Capture and verify an approved Preview recovery point; record exact
   identity, recovery identifier/time and recoverability in
   `artifacts/auth-security/pre-auth-snapshot.json` outside Git. The runner's
   branch-string check alone does not prove a usable recovery point.

3. **Controlled forward migration.** From this worktree run the following in order,
   reviewing the preflight identity, SQL hash and protected-data fingerprints before
   apply. The runner wraps SQL, role activation and checks in one transaction and
   stores generated runtime credentials locally using DPAPI.

   ```powershell
   node scripts/auth-security/preview-boundary.cjs --preflight
   node scripts/auth-security/preview-boundary.cjs --apply
   node scripts/auth-security/preview-boundary.cjs --verify
   ```

   Record owners/grants, then revoke temporary operator membership as the verified
   migration login: `REVOKE oserp_auth_owner FROM neondb_owner;`.
   Retain a separately controlled administrative recovery path. No runtime may
   inherit or SET ROLE to owner. Never use `prisma db push` or build-time migration.

4. **Effective privilege acceptance.** Inspect catalogs and test with actual issuer,
   delivery and ERP connections. Owner `oserp_auth_owner` remains NOLOGIN with only
   listed User column UPDATE. `oserp_preview_auth_service` can execute login,
   prepare, inspect and reset only; `oserp_preview_delivery_service` can execute
   delivery-result only. Both lack direct table DML/elevated roles/owner membership.
   No PUBLIC EXECUTE or unauthorized User role/status/email UPDATE. Verify all four
   ERP identities exist and retain restrictions: `oserp_preview_runtime_app`,
   `oserp_preview_direct_app`, `oserp_compat_app`, `oserp_legacy_app`. Missing roles
   fail the gate. The runner's verify mode is not the entire acceptance matrix.

5. **Secure branch-scoped Preview.** Verify Vercel team `jburns2372-sys-projects`,
   project `prj_eeuFU8EAtmiQp2TIIzuqcD91bNzi`, exact security branch and commit.
   Keep Git auto-deployment disabled; deploy manually only after approval. Register
   sensitive AUTH_DATABASE_URL and AUTH_DELIVERY_DATABASE_URL with their independent
   exact roles and pooled host, only for this branch's Preview scope; preserve ERP
   DATABASE_URL/RBAC. Configure Resend with a sending-scoped sensitive RESEND_API_KEY,
   PASSWORD_RECOVERY_EMAIL_PROVIDER=resend and PASSWORD_RECOVERY_EMAIL_FROM on a
   provider-verified domain. Verify sender status without printing secrets.
   Leave APP_BASE_URL unset initially: mailer uses the system VERCEL_URL. If set,
   require the immutable deployment HTTPS origin exactly, not a branch alias or
   prior deployment URL. Do not blindly use `--register-env`: its fixed APP_BASE_URL
   can differ from the next deployment origin. Check AUTH_URL/NEXTAUTH_URL and host
   handling separately. Build/deploy the exact commit as Preview; require successful
   build and correct system VERCEL_ENV, VERCEL_GIT_COMMIT_REF and VERCEL_URL. Do not
   promote, merge or assign Production domains.

6. **Synthetic flows and Owner acceptance.** Use approved synthetic Preview users
   for good/bad login, concurrent five-attempt lockout, expiry, reset, stale-session
   rejection and counter clearing. Verify unknown/inactive/unactivated denial;
   equivalent recovery responses; concurrent/case-varied five-request budget;
   pending/rejected/expired/revoked token denial; one successful concurrent reset;
   sibling revocation, audit persistence and unchanged role/status/assignments.
   Verify negative issuer/dispatch/ERP permissions. Confirm provider acceptance
   AND inbox delivery through an Owner-approved mailbox and correct Preview link.
   Owner verifies SUPER_ADMIN access, RBAC/project boundaries and self-service
   recovery. Never lock out the real Owner to test lockout. Record commit, SQL hash,
   target, deployment ID, sanitized results and Owner GO/NO-GO before merge review.

7. **Rollback and compensating recovery.** Before commit, runner errors roll back
   DB changes; protected credential files may already exist, so verify outcome
   before reuse/rotation. Connection loss at COMMIT is ambiguous: inspect catalogs
   before retry. After commit, retain schema/audits/session changes and repair with
   reviewed forward SQL. For containment, as verified migration operator:

   ```sql
   ALTER ROLE oserp_preview_auth_service NOLOGIN;
   ALTER ROLE oserp_preview_delivery_service NOLOGIN;
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity
   WHERE usename IN ('oserp_preview_auth_service','oserp_preview_delivery_service')
     AND pid <> pg_backend_pid();
   ```

   Revoke affected EXECUTE grants if needed, rotate the two auth credentials and
   keep the security Preview unavailable while repairing. Do not restore the old
   broken auth path, old passwords/session versions, erase audits, reset the shared
   branch or drop private objects. Recovery-point restoration needs a separately
   approved procedure preserving intervening data. Production and other PRs remain
   outside scope.
