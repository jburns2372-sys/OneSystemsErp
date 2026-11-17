# Phase 8 migration ownership correction

Status: **PREPARED; privileged integration validation BLOCKED**.
PR #3 remains draft. Release authorization is recorded, but no acceptance gate is
bypassed. Original Preview and Production have not been modified by this task.

## Verified access and minimal correction

Read-only checks on restored branch `br-shy-thunder-bchgx7m8`, project
`long-recipe-20782583`, database `oserp_uboq_preview`, endpoint
`ep-dry-meadow-bc7x6os3` (PostgreSQL 18.7), confirmed:

- Restore of `snap-super-hall-bck8bmte`; 32 Role rows, 470 RolePermission rows and
  39 migration records. No existing auth-boundary roles.
- User, PasswordRecoveryToken and AuditLog belong to NOLOGIN
  `oserp_preview_migrate_admin`. Database owner is `neondb_owner`.
- Available `neondb_owner` cannot SET ROLE to that table owner, cannot grant the
  required object privileges and lacks tokenHash REFERENCES. Its membership in
  `neon_superuser` does not confer this ownership. The table-owner role has no
  incoming membership grants. Repeating the rejected GRANT would not fix access.
- Local protected credential inventory contains only `credential.dpapi`; no
  separate approved administrator credential is available. No secret was printed.

The auth routine bodies are unchanged. SQL DDL now grants the final owner only
`REFERENCES ("tokenHash")`, explicitly becomes `oserp_auth_owner` for private
schema/object creation and returns to the session identity for role administration.
`INHERIT FALSE, SET TRUE` by itself does not confer private-schema owner rights.
No runtime grants, RBAC implementation, password logic or Prisma models change.

The restored-branch wrapper supplies temporary table-owner inheritance to the
existing migration executor **inside the same uncommitted transaction only**.
This lets existing-object GRANT statements run with owner authority, without
permanent grant options or table ownership transfers to `neondb_owner`. It does
not grant ADMIN or SET on the table-owner role to that executor. No other session
can observe the temporary grant before cleanup removes it.

References:
[PostgreSQL GRANT](https://www.postgresql.org/docs/current/sql-grant.html),
[role membership](https://www.postgresql.org/docs/18/role-membership.html),
[REVOKE](https://www.postgresql.org/docs/current/sql-revoke.html).

## Exact remaining operator action

Arrange an approved database administrator/provider operator for **the isolated
restored branch only**. The administrator must have:

1. ADMIN OPTION on `oserp_preview_migrate_admin`, or actual superuser authority.
2. Permission to SET ROLE to `neondb_owner`, baseline read access, and authority to
   revoke the recorded grantor-specific creator memberships for the three new
   auth roles. PostgreSQL may record the bootstrap superuser as their grantor;
   ordinary Neon project-console access or `CREATEROLE` alone is insufficient.

Neon support/provider assistance is required if no existing approved administrator
has those capabilities. Do not enable LOGIN on the NOLOGIN table owner, reset
another role's password, attempt cloud_admin login through the app connector,
create a replacement privileged user, or grant anything to ERP runtime roles.
Never send credentials in chat, Git, command arguments or logs. An administrator
may execute the following directly or supply an approved protected local service
credential location for the same identity. Do not change the pinned branch guard.

## Privileged bootstrap, validation and cleanup

Review these three files together and record their SHA-256 hashes:

- `scripts/auth-security/isolated-ownership-bootstrap.psql`
- `scripts/auth-security/isolated-ownership-cleanup.sql`
- `prisma/auth-security/preview-auth-boundary-v1.sql`

Use psql 16+ with a protected libpq service entry named
`oserp_p8_isolated_admin`, verified-TLS/direct host
`ep-dry-meadow-bc7x6os3.c-16.us-east-1.aws.neon.tech` for the restored branch,
and a separate protected password file or approved secure credential mechanism.
Verify that endpoint association in Neon before connecting. Do not reuse the
original Preview host. From the security worktree:

```powershell
Get-FileHash scripts/auth-security/isolated-ownership-bootstrap.psql
Get-FileHash scripts/auth-security/isolated-ownership-cleanup.sql
Get-FileHash prisma/auth-security/preview-auth-boundary-v1.sql
psql -X --dbname=service=oserp_p8_isolated_admin --file=scripts/auth-security/isolated-ownership-bootstrap.psql
if ($LASTEXITCODE -ne 0) { throw 'Isolated ownership rehearsal failed; stop.' }
```

Default execution ROLLBACKs the entire migration after assertions. The wrapper:

1. Rejects other project/branch/database identities, the ordinary migration login
   as administrator, wrong owners, conflicting objects and baseline count drift.
2. Captures protected-data fingerprints and existing ERP memberships/table ACLs
   in session-local temporary objects; raw data is never printed.
3. Grants temporary `oserp_preview_migrate_admin` membership to `neondb_owner`
   with `ADMIN FALSE, INHERIT TRUE, SET FALSE`; enters that migration identity.
4. Requires effective tokenHash REFERENCES, applies the corrected boundary SQL,
   and gives the final NOLOGIN owner explicit tokenHash REFERENCES. All new
   SECURITY DEFINER routines remain owned by `oserp_auth_owner`.
5. Returns to the administrator and revokes **all recorded grantor-specific**
   memberships for the three created roles and the temporary table-owner grant
   from `neondb_owner`. Self-issued dependent grants are revoked first; RESTRICT
   refuses unexpected dependencies. No CASCADE or broad privilege revocation.
6. Asserts final ownership, REFERENCES cleanup, runtime NOLOGIN/role flags,
   unchanged ERP memberships/table ACLs and protected data. Any failure aborts;
   with ON_ERROR_STOP and a fresh psql process, disconnection rolls back everything.

After a successful rehearsal, to persist **only in the isolated branch** for
actual-role/concurrency testing, repeat the same command with
`--set=commit_boundary=true`. This leaves all three new auth roles NOLOGIN.
The default rollback receipt is not proof of a committed migration. A connection
loss at COMMIT needs catalog inspection before retry; do not assume rollback.

Run the affected privilege/ownership tests against this restored database with
authorized identities. In particular verify private-schema DDL as non-superuser,
the real FK, no retained owner/creator membership, no general-runtime DML or auth
EXECUTE, exact dispatch split and original authentication/concurrency scenarios.
The current local-fixture test harness creates its own empty database/cluster
roles; do not point it at this restored shared database as-is. Adapt only a guarded
restored-branch harness if required, then retain sanitized results.

Existing 71/71 RBAC and 48/48 application evidence remains applicable because
those implementations are unchanged. Existing 30/30 PostgreSQL evidence is retained
as historical routine validation; it does not validate this new privilege bootstrap.
No SQL integration PASS is claimed until authorized execution succeeds.

Offline checks passed: six routine definitions exactly match reviewed commit
`9d8669d`; application/adapters and both accepted test files are unchanged; psql
include paths resolve; diff whitespace checks pass. These are source checks,
not a PostgreSQL syntax/execution test. No fixture suites or TypeScript rerun
was needed for the unchanged TypeScript implementation.

## Continue release only after the blocker clears

After isolated migration/cleanup and affected tests pass, review and pin a distinct
original-Preview identity configuration before any live apply. Do not relax the
isolated wrapper guard or call the old `--apply` blindly: its neondb_owner-only
credential cannot bootstrap owner access. Refresh preflight/hash receipts after
the SQL change. Use the approved administrator procedure and the existing
Preview plan for guarded migration, branch-scoped secrets, deployment, synthetic
UAT and actual Owner acceptance. Provider delivery and Owner acceptance cannot be
inferred from local evidence.

Production remains gated on those results and an exact reviewed Production
target/configuration. Current application adapters deliberately pin Preview and
reject Production, so a Production rollout needs a reviewed configuration change
and affected tests first; do not simply promote this Preview-only build. Keep
PR #3 draft until migration, deployment and acceptance gates succeed.
