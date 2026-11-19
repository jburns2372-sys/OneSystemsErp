# OneSystemsERP Phase 9 — Local PostgreSQL 18 Cleanroom Execution Evidence Report

## 1. Execution Summary

| Field | Value |
|---|---|
| Repository | `jburns2372-sys/OneSystemsErp` |
| Base Development SHA | `e51be896907620d3c0945d779af37ca99151219c` (`feat/oserp-unified-project-intake-p9`) |
| Specification & Read-Only Prep | Issue `#9`, PR `#11` (`4677520a8e887afb444d9221942fa0199f87561a`) |
| Isolated Git Worktree Branch | `feat/oserp-phase9-cleanroom-local-pg18` |
| Local PostgreSQL Engine | `PostgreSQL 18.4` (`initdb`, `pg_ctl`, `psql`, `pg_dump`, `pg_restore` `18.4`, loopback `127.0.0.1` only, `scram-sha-256`) |
| Approved Phase 9 Migration | `prisma/migrations/20261118090000_phase9_project_creator_bootstrap/migration.sql` (**unmodified**) |
| Canonical Phase 9 SQL SHA-256 | `89ad5e8bcbbaf33564d0f4a77ffd39874ec2496b85d3140b52c30e82733f27df` |
| Recorded `_prisma_migrations` Checksum | `89ad5e8bcbbaf33564d0f4a77ffd39874ec2496b85d3140b52c30e82733f27df` (`40/40` active rows, `0` unfinished/rolled-back) |
| Phase 9 PostgreSQL 18 Cleanroom Verdict | **`PASS` (`18/18` automated checks passed on actual PostgreSQL 18.4)** |
| Cloud / Neon / Production Mutations | **`0` (strictly read-only source inventory; zero Neon writes, zero cloud billing, zero Vercel/Production changes)** |

---

## 2. Stage 0 — Read-Only Disposable Preview Source Inventory (`PASS`)

Executed `scripts/uboq/phase9-cleanroom-inventory.sql` with in-script `\set ON_ERROR_STOP on`, `SET default_transaction_read_only = on;`, server-side Neon project/branch verification (`neon.project_id = 'long-recipe-20782583'`, `neon.branch_id = 'br-restless-dust-bc1a91f4'`), and explicit `-d oserp_uboq_preview` binding against disposable Preview source (`long-recipe-20782583`, non-default branch `br-restless-dust-bc1a91f4`, PostgreSQL `180007`). Raw schema-only `pg_dump` archive (`1,568,736` bytes, SHA-256 `554f882e6bd16c6dda771ffacc9618deae0c0de421ccd926ba2d5571ca690836`) was retained strictly in local private scratch and never committed.

### Source Baseline vs. Reconciled Local PG18 Cleanroom Parity

| Metric / Invariant | Disposable Preview Source (`oserp_uboq_preview`) | Local PG18 Pre-Phase-9 (`#1`–`#39`) | Local PG18 Post-Phase-9 (`#1`–`#40`) | Local PG18 `pg_restore` Rollback (`oserp_uboq_cleanroom_restored`) |
|---|---|---|---|---|
| PostgreSQL Major Version | `18` (`180007`) | `18` (`180004`) | `18` (`180004`) | `18` (`180004`) |
| Completed `_prisma_migrations` | `39` | `39` (`ELIGIBLE_MANAGED_PG18_RC_V1_LINEAGE`) | `40` | `39` (`ELIGIBLE_MANAGED_PG18_RC_V1_LINEAGE`) |
| Phase 9 Ledger Entries | `0` | `0` | `1` | `0` |
| Public Base/Partitioned Tables | `252` | `252` | `252` | `252` |
| `FORCE ROW LEVEL SECURITY` Tables | `88` | `88` | `88` | `88` |
| Public RLS Policies | `325` | `325` | `325` | `325` |
| Public `SECURITY DEFINER` Functions | `110` | `110` | `111` | `110` |
| `Project` & `ProjectUserAssignment` Owner | `oserp_preview_migrate_admin` (`NOLOGIN NOBYPASSRLS`) | `oserp_preview_migrate_admin` (`NOLOGIN NOBYPASSRLS`) | `oserp_preview_migrate_admin` (`NOLOGIN NOBYPASSRLS`) | `oserp_preview_migrate_admin` (`NOLOGIN NOBYPASSRLS`) |
| `uboq_verify_signed_rls_proof` Owner | `oserp_migrations_owner` (`NOLOGIN BYPASSRLS`) | `oserp_migrations_owner` (`NOLOGIN BYPASSRLS`) | `oserp_migrations_owner` (`NOLOGIN BYPASSRLS`) | `oserp_migrations_owner` (`NOLOGIN BYPASSRLS`) |
| `phase9_create_project_profile` Owner | *(absent)* | *(absent)* | `oserp_migrations_owner` (`NOLOGIN BYPASSRLS`, `search_path=pg_catalog`) | *(absent)* |
| Runtime Logins `rolbypassrls` / `SET` to Owners | `false` / `0` paths | `false` / `0` paths | `false` / `0` paths | `false` / `0` paths |

---

## 3. Bounded Cleanroom Migration Window Finding (PostgreSQL 18 `AlterFunctionOwner_internal`)

During actual PostgreSQL 18.4 execution after Checkpoint 4 lockdown (`REVOKE CREATE ON SCHEMA public FROM PUBLIC` + `oserp_preview_migrate_admin` `NOLOGIN NOBYPASSRLS`), executing `prisma/migrations/20261118090000_phase9_project_creator_bootstrap/migration.sql` unmodified requires **two tightly bounded window grants** and **zero `BYPASSRLS` or `PUBLIC` schema loosening**:

1. `ALTER ROLE oserp_preview_migrate_admin LOGIN NOBYPASSRLS NOCREATEROLE NOCREATEDB CONNECTION LIMIT 2 PASSWORD '<ephemeral>'` (`oserp_preview_migrate_admin` already owns `_prisma_migrations`, `User`, `Role`, `RolePermission`, `Project`, and `ProjectUserAssignment`, and already holds `SET` membership on `oserp_migrations_owner`).
2. `GRANT CREATE ON SCHEMA public TO oserp_migrations_owner` (PostgreSQL 18 `AlterFunctionOwner_internal` in `aclchk.c` verifies that the target owner `oserp_migrations_owner` holds `CREATE` on `SCHEMA public` when `ALTER FUNCTION public.phase9_create_project_profile(...) OWNER TO oserp_migrations_owner` executes under a non-superuser).
3. Inside a cleanup scope entered **before** the first grant (`try ... finally`, running on both success and failure paths):
   - `ALTER ROLE oserp_preview_migrate_admin NOLOGIN NOBYPASSRLS NOCREATEROLE NOCREATEDB CONNECTION LIMIT 0`
   - `pg_terminate_backend(pid)` followed by bounded polling until `pg_stat_activity` confirms `0` active `oserp_preview_migrate_admin` sessions
   - Independent `NOLOGIN` rejection verification (`28000` `/not permitted to log in/i`) while the SCRAM verifier is still present, followed by `ALTER ROLE oserp_preview_migrate_admin PASSWORD NULL`
   - `REVOKE CREATE ON SCHEMA public FROM oserp_migrations_owner` (surfacing any error)
   - Explicit post-window verification of `has_schema_privilege('oserp_migrations_owner', 'public', 'CREATE') = false`, `pg_authid` (`rolcanlogin = false`, `rolpassword IS NULL`, `rolconnlimit = 0`), and `0` active `oserp_preview_migrate_admin` sessions.

At rest after Migration `#40`, `evaluateRolePostureForManagedPg18Rc` verifies `PASS_ROLE_POSTURE_VERIFIED` across all 6 governed group roles, all operational roles, and all 9 `pg_auth_members` edges.

---

## 4. Automated Verification Matrix (`18/18 PASS` on Real PostgreSQL 18.4)

Reproducible command: `node scripts/uboq/run-phase9-cleanroom-local-pg18.cjs`

1. **PG18 toolchain & canonical Git blob verification (`PASS`)**: `postgres`, `initdb`, `pg_ctl`, `psql`, `pg_dump`, `pg_restore` `18.4`; unmodified Phase 9 SQL SHA-256 verified against `HEAD`.
2. **Isolated loopback SCRAM cluster (`PASS`)**: `127.0.0.1` ephemeral port, `scram-sha-256` local/host auth, non-superuser `cleanroom_db_owner`.
3. **Operational role provisioning & empty preflight (`PASS`)**: 5 operational roles provisioned; `inspectTargetForManagedPg18Rc(..., { allowEmpty: true })` -> `ELIGIBLE_APPROVED_EMPTY_BASELINE`.
4. **All 39 `MANAGED_PG18_RC_V1` migrations reconciled & locked (`PASS`)**: `39/39` checksum parity, fresh 256-bit CSPRNG trust anchors seeded, `oserp_preview_migrate_admin` locked `NOLOGIN`, `252` tables, `88` `FORCE RLS`, `325` policies, `110` `SECURITY DEFINER` functions.
5. **Pre-Phase-9 `pg_dump` backup snapshot (`PASS`)**: custom archive captured prior to Migration `#40`.
6. **Pre-Phase-9 runtime direct DML denial (`PASS`)**: direct `Project` and `ProjectUserAssignment` `INSERT`s by `oserp_preview_runtime_app` fail closed (`42501`).
7. **Unmodified Phase 9 Migration (`#40`) deployment & re-lock (`PASS`)**: `prisma migrate deploy` records `40/40` active rows (`checksum = 89ad5e8bcbbaf33564d0f4a77ffd39874ec2496b85d3140b52c30e82733f27df`); `oserp_preview_migrate_admin` re-locked `NOLOGIN`; `EXECUTE` granted solely to `oserp_compat_app` and denied to `PUBLIC`, `oserp_legacy_app`, `oserp_maint_cleanup_role`, `oserp_preview_preflight_ro`, and `oserp_preview_payroll_app`.
8. **Signed RLS proof negative suite (`PASS`)**: unsigned, malformed, current-timestamp tampered-HMAC, wrong-secret, expired, and cross-project `app.current_rls_proof` rejected (`42501`).
9. **Caller role negative suite (`PASS`)**: `oserp_preview_preflight_ro` and `oserp_preview_payroll_app` rejected (`42501` / `25006`).
10. **Actor operational state negative suite (`PASS`)**: stale `sessionVersion`, `status = 'INACTIVE'`, `lockedUntil > now()`, and `mustChangePassword = true` rejected (`42501`).
11. **Database RBAC negative suite (`PASS`)**: `canCreate = false` (`SITE_ENGINEER`) and `Role.isActive = false` rejected (`42501`) even with valid signed proof.
12. **Database input constraint suite (`PASS`)**: short name (`<3`), invalid sector, and overlong description (`>2000`) rejected (`22023`).
13. **End-to-end `createProjectProfile` (`src/app/actions/project-intake.ts`) (`PASS`)**: real `PrismaClient` connected as `oserp_preview_runtime_app` (`NOBYPASSRLS`) creates `Project` (`PLANNING`, `contractAmount = 0`, `uboqGovernanceEnabled = false`, `0` BOQ rows) and atomically assigns `creator-pm` (`PROJECT_MANAGER`, `FULL`, `active`), ignoring spoofed `formData` `userId` and `projectRole`.
14. **Signed RLS tenant isolation (`PASS`)**: `creator-pm` reads new `Project` and `ProjectUserAssignment` (`1` row); `peer-pm` (`0` rows) and unbound runtime session (`0` rows) are isolated.
15. **Replay / duplicate `projectId` protection (`PASS`)**: replay rejected (`23505`) with zero secondary assignments added.
16. **Transactional rollback atomicity (`PASS`)**: simulated failure on `ProjectUserAssignment` rolls back `Project` insert (`0` orphan projects).
17. **Runtime privilege containment (`PASS`)**: direct `UPDATE`/`DELETE`/`INSERT` on `ProjectUserAssignment`, `SELECT` on `_prisma_migrations`, and `SET ROLE` to `oserp_migrations_owner` or `oserp_preview_migrate_admin` remain denied (`42501`).
18. **Full-ownership `pg_restore` rollback recovery (`PASS`)**: restoring pre-Phase-9 `pg_dump` archive into `oserp_uboq_cleanroom_restored` preserves `oserp_preview_migrate_admin` and `oserp_migrations_owner` ownership plus individual `relrowsecurity` / `relforcerowsecurity` flags on `Project` and `ProjectUserAssignment`, passes `inspectTargetForManagedPg18Rc` (`39/39` + `PASS_ROLE_POSTURE_VERIFIED`), confirms `to_regprocedure('public.phase9_create_project_profile(text,text,text,text,text,text,text)') IS NULL` (`0` overloads), and proves live restored `FORCE RLS` row visibility filtering on seeded `Project` / `ProjectUserAssignment` rows across unbound (`0`), peer (`0`), tampered-HMAC (`0`), and valid signed creator (`1`) runtime sessions.
