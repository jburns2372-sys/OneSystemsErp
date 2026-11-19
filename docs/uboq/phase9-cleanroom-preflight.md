# OneSystemsERP Phase 9 — Cleanroom Preflight and Controlled Local PostgreSQL 18 Migration Runbook

**Purpose:** establish and execute a verified PostgreSQL 18 cleanroom environment for the atomic project/creator bootstrap (`20261118090000_phase9_project_creator_bootstrap`) without relying on Neon ticket **#01077965** for privileges in the existing Preview branch.

**Scope boundaries:**
- Does **not** modify existing Neon databases (`br-quiet-rice-bc1edkvd` or `br-restless-dust-bc1a91f4`), Production, protected Neon roles, or Vercel credentials.
- Does **not** provision billable cloud infrastructure.
- Uses GitHub Issue **#9** and read-only preflight PR **#11** for approved scope and acceptance criteria.

## Source identity — verified on the disposable Preview database

- Neon project: `long-recipe-20782583`; disposable branch: `br-restless-dust-bc1a91f4`; DB: `oserp_uboq_preview`. **Never substitute Neon default/main branch (`br-quiet-rice-bc1edkvd`) or another project.**
- PostgreSQL version: `18`; `39` completed Prisma migrations (`MANAGED_PG18_RC_V1`); Phase 9 `20261118090000_phase9_project_creator_bootstrap` absent on source; `phase9_create_project_profile` absent on source.
- Baseline **252** public tables, **88** `FORCE ROW LEVEL SECURITY` tables, **325** public RLS policies, **110** public `SECURITY DEFINER` functions. Snapshot counts are drift checks paired with cryptographic checksum and role-closure verification.
- Source `neondb_owner` is `LOGIN CREATEROLE CREATEDB BYPASSRLS` (`NOSUPERUSER`) and cannot `SET ROLE` to either protected owner role created outside its admin graph. `oserp_preview_migrate_admin` is `NOLOGIN NOBYPASSRLS` and owns `Project`, `ProjectUserAssignment`, `User`, `Role`, `RolePermission`, and `_prisma_migrations`. `oserp_migrations_owner` is `NOLOGIN BYPASSRLS` (`NOSUPERUSER`) and owns signed RLS verification functions. **The approved Phase 9 SQL intentionally requires `NOLOGIN BYPASSRLS` on `oserp_migrations_owner`**; never weaken or replace it with `NOBYPASSRLS` or a `LOGIN` owner.
- Existing disposable Preview contains synthetic/owner test state (`1` user, `0` projects), **not an export entitlement**. Never copy identities, passwords, authentication hashes, app secrets, signing keys, or private document vault content into another environment.

## Stage 0 — isolate the runner and perform read-only inventory

1. Use **one separate Git worktree** pinned to the approved development SHA (`e51be896907620d3c0945d779af37ca99151219c`). Do not mutate another agent's worktree or a running server.
2. Verify that `postgres`, `initdb`, `pg_ctl`, `psql`, `pg_dump`, and `pg_restore` are major version **18** (`18.4`). Never upgrade or mutate a shared PostgreSQL instance.
3. Resolve the endpoint hostname strictly from Neon API `GET /projects/long-recipe-20782583/branches/br-restless-dust-bc1a91f4` (`default = false`, `primary = false`). Create an owner-only (`0700` / `umask 077`) scratch directory resolved to its canonical physical path (`pwd -P`) strictly outside `git rev-parse --show-toplevel`, store credentials in an ephemeral `0600` `.pgpass` file (`PGPASSFILE`, cleaned up via `trap` so passwords never appear in `psql`, `pg_dump`, or `/usr/bin/env` `argv`), and run client tools inside `env -i` with **`PGGSSENCMODE=disable`**, **`PGSSLMODE=verify-full`**, and **`PGSSLROOTCERT="$SYSTEM_CA_BUNDLE"`** so TLS certificate chain and endpoint hostname verification cannot be bypassed or downgraded.
4. Initialize the verified out-of-repo scratch directory and `.pgpass` file, then run the hardened read-only inventory script bound explicitly to `-h "$PREVIEW_DISPOSABLE_HOST" -p "$PREVIEW_DISPOSABLE_PORT" -d oserp_uboq_preview`:
   ```bash
   REPO_TOP_REAL="$(cd "$(git rev-parse --show-toplevel)" && pwd -P)" && \
   RAW_SCRATCH_DIR="$(umask 077 && mktemp -d "${TMPDIR:-/tmp}/oserp-p9-ro-XXXXXX")" && \
   chmod 700 "$RAW_SCRATCH_DIR" && \
   PRIVATE_SCRATCH_DIR="$(cd "$RAW_SCRATCH_DIR" && pwd -P)" && \
   if git -C "$PRIVATE_SCRATCH_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then rm -rf "$PRIVATE_SCRATCH_DIR"; echo "Refusing in-git scratch dir" >&2; exit 1; fi && \
   case "$PRIVATE_SCRATCH_DIR/" in "$REPO_TOP_REAL/"*) rm -rf "$PRIVATE_SCRATCH_DIR"; echo "Refusing in-repo scratch dir" >&2; exit 1 ;; esac && \
   PGPASS_FILE="$PRIVATE_SCRATCH_DIR/.pgpass" && \
   trap 'rm -f "$PGPASS_FILE"' EXIT INT TERM && \
   (umask 077 && printf '%s:%s:oserp_uboq_preview:%s:%s\n' \
     "$PREVIEW_DISPOSABLE_HOST" "$PREVIEW_DISPOSABLE_PORT" \
     "$PREVIEW_SCOPED_USER" "$PREVIEW_SCOPED_PASSWORD" > "$PGPASS_FILE") && \
   chmod 600 "$PGPASS_FILE" && \
   env -i PATH="$PATH" HOME="$HOME" SYSTEMROOT="${SYSTEMROOT:-}" \
     PGGSSENCMODE=disable \
     PGSSLMODE=verify-full \
     PGSSLROOTCERT="$SYSTEM_CA_BUNDLE" \
     PGPASSFILE="$PGPASS_FILE" \
     PGOPTIONS='-c default_transaction_read_only=on' \
     psql -X -w -v ON_ERROR_STOP=1 \
       -h "$PREVIEW_DISPOSABLE_HOST" -p "$PREVIEW_DISPOSABLE_PORT" \
       -U "$PREVIEW_SCOPED_USER" -d oserp_uboq_preview \
       -f scripts/uboq/phase9-cleanroom-inventory.sql
   ```
   `scripts/uboq/phase9-cleanroom-inventory.sql` sets `\set ON_ERROR_STOP on` in-script, enforces `SET default_transaction_read_only = on;`, fails closed unless `current_database() = 'oserp_uboq_preview'` **and** `neon.project_id = 'long-recipe-20782583'` **and** `neon.branch_id = 'br-restless-dust-bc1a91f4'` (or loopback `127.0.0.1` for local cleanroom DBs), fails closed if any required runtime/governed role is missing, over-privileged (`BYPASSRLS` / `SUPERUSER` / `CREATEROLE` / `CREATEDB`), or if **any** login role holds `ADMIN` or unauthorized membership on **any** `oserp_*` role, and redacts arbitrary `pg_proc.proconfig` values so only `search_path` and setting names are emitted.
5. Compare function owners, table owners, role attributes, recursive role-membership edges, `FORCE RLS` flags, extensions, and 39 migration ledger entries against the verified baseline before proceeding.
6. Verify server-side branch identity over the exact same `env -i` + `PGGSSENCMODE=disable` + `PGSSLMODE=verify-full` + `PGPASSFILE` connection parameters, and write the `0600` schema-only archive inside `"$PRIVATE_SCRATCH_DIR"` (never to stdout or inside any Git worktree):
   ```bash
   PRIVATE_DUMP_FILE="$PRIVATE_SCRATCH_DIR/private-source-schema-only.dump" && \
   umask 077 && \
   env -i PATH="$PATH" HOME="$HOME" SYSTEMROOT="${SYSTEMROOT:-}" \
     PGGSSENCMODE=disable \
     PGSSLMODE=verify-full \
     PGSSLROOTCERT="$SYSTEM_CA_BUNDLE" \
     PGPASSFILE="$PGPASS_FILE" \
     PGOPTIONS='-c default_transaction_read_only=on' \
     psql -X -w -v ON_ERROR_STOP=1 \
       -h "$PREVIEW_DISPOSABLE_HOST" -p "$PREVIEW_DISPOSABLE_PORT" \
       -U "$PREVIEW_SCOPED_USER" -d oserp_uboq_preview \
       -c "SELECT 1 / CASE WHEN current_database() = 'oserp_uboq_preview' AND current_setting('neon.project_id', true) = 'long-recipe-20782583' AND current_setting('neon.branch_id', true) = 'br-restless-dust-bc1a91f4' THEN 1 ELSE 0 END;" && \
   env -i PATH="$PATH" HOME="$HOME" SYSTEMROOT="${SYSTEMROOT:-}" \
     PGGSSENCMODE=disable \
     PGSSLMODE=verify-full \
     PGSSLROOTCERT="$SYSTEM_CA_BUNDLE" \
     PGPASSFILE="$PGPASS_FILE" \
     PGOPTIONS='-c default_transaction_read_only=on' \
     pg_dump -w --schema-only --format=custom --no-owner --no-acl \
       -h "$PREVIEW_DISPOSABLE_HOST" -p "$PREVIEW_DISPOSABLE_PORT" \
       -U "$PREVIEW_SCOPED_USER" -d oserp_uboq_preview \
       -f "$PRIVATE_DUMP_FILE" && \
   chmod 600 "$PRIVATE_DUMP_FILE"
   ```

## Stage 1 — local-only PostgreSQL 18 cleanroom execution (no cloud billing)

Run the reproducible zero-cloud cleanroom verification runner:

```bash
node scripts/uboq/run-phase9-cleanroom-local-pg18.cjs
```

What `scripts/uboq/run-phase9-cleanroom-local-pg18.cjs` executes end-to-end:

1. **Sanitized loopback PostgreSQL 18 SCRAM cluster:** strips all inherited `PG*` / `DATABASE_URL` / `DIRECT_URL` / `NEON_*` / `VERCEL_*` environment variables, binds `PGHOST=127.0.0.1`, `PGHOSTADDR=127.0.0.1`, and explicit `-h 127.0.0.1 -p <port>` on all CLI invocations, and initializes a fresh disposable `UTF8` cluster in `os.tmpdir()` with `--auth-local=scram-sha-256 --auth-host=scram-sha-256` and non-superuser `cleanroom_db_owner` (`NOSUPERUSER CREATEDB CREATEROLE BYPASSRLS`).
2. **Pinned 39-migration authority & role reconstruction:** verifies all 39 `MANAGED_PG18_RC_V1` Git blobs at pinned base commit `e51be896907620d3c0945d779af37ca99151219c` against their independently pinned release-candidate SHA-256 digests, deploys `#1`–`#39` via `prisma migrate deploy`, seeds fresh cleanroom-only 256-bit CSPRNG trust anchors, locks `oserp_preview_migrate_admin` (`NOLOGIN NOBYPASSRLS NOCREATEROLE NOCREATEDB CONNECTION LIMIT 0 PASSWORD NULL`), drops `prov_role_admin`, revokes `CREATE ON SCHEMA public FROM PUBLIC`, and asserts `ELIGIBLE_MANAGED_PG18_RC_V1_LINEAGE` (`39/39` checksums, `252` tables, `88` `FORCE RLS` tables, `325` policies, `110` `SECURITY DEFINER` functions).
3. **Pre-Phase-9 backup archive:** captures a custom `pg_dump` archive at Migration `#39` before applying Phase 9.
4. **Bounded Phase 9 Migration (`#40`) execution & verified cleanup:** verifies `prisma/migrations/20261118090000_phase9_project_creator_bootstrap/migration.sql` matches pinned SHA-256 `89ad5e8bcbbaf33564d0f4a77ffd39874ec2496b85d3140b52c30e82733f27df`, enters a guarded `try/finally` cleanup scope **before** granting `CREATE ON SCHEMA public TO oserp_migrations_owner` and opening `LOGIN NOBYPASSRLS NOCREATEROLE NOCREATEDB CONNECTION LIMIT 2` on `oserp_preview_migrate_admin`, executes `prisma migrate deploy` for Migration `#40`, and inside `finally` (on both success and failure paths) sets `NOLOGIN CONNECTION LIMIT 0`, terminates and polls `pg_stat_activity` until `active_sessions = 0`, revokes `CREATE ON SCHEMA public FROM oserp_migrations_owner`, proves `NOLOGIN` rejection (`/not permitted to log in/i`) with the still-valid SCRAM verifier, clears `PASSWORD NULL`, and asserts `rolcanlogin = false`, `rolpassword IS NULL`, `has_schema_privilege = false`, and `0` active migration sessions.
5. **Positive, negative, cryptographic HMAC, RBAC, atomicity, and full-ownership recovery tests:**
   - Exercises unsigned, malformed, expired, **well-formed fresh tampered-HMAC**, wrong-secret, and cross-project `app.current_rls_proof` rejections (`42501`).
   - Exercises stale `sessionVersion`, `INACTIVE`, locked, `mustChangePassword = true`, `canCreate = false`, `Role.isActive = false`, non-compat login, and invalid profile rejections (`42501` / `22023`).
   - Exercises `createProjectProfile(formData)` over a real `PrismaClient` connected as `oserp_preview_runtime_app` (`NOBYPASSRLS`), signed RLS tenant isolation, duplicate `projectId` replay rejection (`23505`), transactional rollback atomicity (`0` orphan `Project` rows), and denial of direct `ProjectUserAssignment` DML / `SET ROLE`.
   - Restores the pre-Phase-9 `pg_dump` archive into `oserp_uboq_cleanroom_restored` preserving full ownership and ACLs, verifies individual `relrowsecurity` / `relforcerowsecurity` flags on `Project` and `ProjectUserAssignment`, verifies `to_regprocedure('public.phase9_create_project_profile(text,text,text,text,text,text,text)') IS NULL` (`0` overloads), and proves live restored `FORCE RLS` row visibility filtering on seeded `Project` / `ProjectUserAssignment` rows across unbound, peer, tampered-HMAC, and valid signed runtime sessions.

## Stage 2 — new isolated Neon cloud Preview, only after separate owner approval

- Provision a **new Neon project** (PostgreSQL 18, distinct Preview-only namespace, isolated secrets) **only after explicit owner authorization**, as cloud projects can incur usage charges. **Do not** clone the old Neon branch.
- Reproduce the exact Stage 1 role separation and bounded `oserp_preview_migrate_admin` deployment window on the customer-controlled cleanroom database. Never use the provider admin role as runtime login or `SECURITY DEFINER` owner.
- Bind credentials only to a dedicated feature Preview branch/deployment; never overwrite Production, global Preview variables, or the existing Preview database without an accepted cutover plan.

## Production hold / explicit STOP

- Never alter protected ownership, `main`/default branches, `FORCE RLS`, or grants on existing Neon branches, and never manually falsify `_prisma_migrations`.
- Do not run recovery writes, merge PR #2, provision paid cloud resources, edit Vercel secrets, or touch Production based solely on local cleanroom PASS.
- Neon ticket **#01077965** remains open as an independent fallback path for existing Preview until the owner approves Stage 2 cloud cleanroom provisioning or Neon Support completes the ticket.
