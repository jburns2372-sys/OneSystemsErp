-- OneSystemsERP Phase 9: READ-ONLY cleanroom source inventory.
-- Target: disposable Preview database only. Never run against Production by default.
-- All statements are catalog SELECTs (or aggregate SELECTs); no writes, SET ROLE,
-- connection strings, function source, user rows, or credentials are returned.
-- Requires a named libpq service explicitly mapped to Neon project
-- long-recipe-20782583, branch br-restless-dust-bc1a91f4 and DB oserp_uboq_preview.
-- Verify the service endpoint/branch against Neon control-plane metadata before use.
-- Run: psql -X -v ON_ERROR_STOP=1 -d "service=oserp_phase9_disposable" -f scripts/uboq/phase9-cleanroom-inventory.sql
-- Do NOT use implicit PGDATABASE, current defaults or the Neon primary branch.

-- 1. Abort on wrong connected database or major version. This alone cannot
-- distinguish two branches with the same database name; operator must first
-- verify the named service endpoint's exact branch ID using Neon control plane.
-- ON_ERROR_STOP=1 makes any mismatch terminate the entire inventory before
-- reading the migration ledger or protected table metadata.
SELECT 1 / (CASE WHEN current_database() = 'oserp_uboq_preview'
             AND current_user IN ('neondb_owner', 'oserp_preview_preflight_ro')
             AND current_setting('server_version_num')::int BETWEEN 180000 AND 189999
             THEN 1 ELSE 0 END) AS source_database_guard;

-- 2. Identity and server compatibility, no password or host disclosure.
SELECT current_database() AS database_name,
       current_user AS connected_role,
       current_setting('server_version_num')::int AS postgres_version_num;

-- 3. Migration ledger: source schema already has 39 completed Prisma migrations.
SELECT COUNT(*) FILTER (WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL)
         AS completed_migrations,
       COUNT(*) FILTER (WHERE migration_name =
         '20261118090000_phase9_project_creator_bootstrap') AS phase9_entries
FROM public._prisma_migrations;

-- 4. Counts only; never retrieve application or user records.
SELECT
  (SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname='public' AND c.relkind IN ('r','p')) AS public_tables,
  (SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname='public' AND c.relforcerowsecurity) AS force_rls_tables,
  (SELECT COUNT(*) FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
     JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public')
     AS public_rls_policies,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.prosecdef) AS public_security_definer_functions,
  (SELECT COUNT(*) FROM public."User") AS user_count,
  (SELECT COUNT(*) FROM public."Project") AS project_count;

-- 5. Existing owner/privilege graph: NOLOGIN/BYPASSRLS role attributes are important.
SELECT rolname, rolcanlogin, rolsuper, rolbypassrls, rolcreaterole, rolcreatedb,
       pg_has_role(current_user, oid, 'SET') AS caller_can_set,
       pg_has_role(current_user, oid, 'MEMBER') AS caller_is_member
FROM pg_roles
WHERE rolname IN ('neondb_owner', 'oserp_preview_migrate_admin',
                  'oserp_migrations_owner', 'oserp_compat_app',
                  'oserp_legacy_app', 'oserp_maint_cleanup_role')
ORDER BY rolname;

-- 6. Runtime/compatibility roles and transitive privileged-membership closure.
-- pg_has_role(..., 'SET'/'USAGE') evaluates effective paths through group roles,
-- not merely the inventory connector's memberships. No passwords or secrets.
WITH owners AS (
  SELECT (SELECT oid FROM pg_roles WHERE rolname='oserp_preview_migrate_admin') AS table_owner,
         (SELECT oid FROM pg_roles WHERE rolname='oserp_migrations_owner') AS command_owner
)
SELECT r.rolname AS role_name, r.rolcanlogin AS can_login,
       r.rolbypassrls AS bypasses_rls,
       pg_has_role(r.oid, owners.table_owner, 'SET') AS can_set_table_owner,
       pg_has_role(r.oid, owners.command_owner, 'SET') AS can_set_command_owner,
       pg_has_role(r.oid, owners.table_owner, 'USAGE') AS inherits_table_owner,
       pg_has_role(r.oid, owners.command_owner, 'USAGE') AS inherits_command_owner
FROM pg_roles r CROSS JOIN owners
WHERE r.rolname LIKE 'oserp_%'
ORDER BY r.rolname;

-- Fail closed before continuing if ANY runtime/compat/legacy role can bypass
-- RLS or SET/INHERIT either owner; adjust the allowlist only after separate
-- documented review of added roles. A zero denominator aborts in psql.
WITH owners AS (
  SELECT (SELECT oid FROM pg_roles WHERE rolname='oserp_preview_migrate_admin') AS table_owner,
         (SELECT oid FROM pg_roles WHERE rolname='oserp_migrations_owner') AS command_owner
), runtime_roles AS (
  SELECT r.oid, r.rolname, r.rolbypassrls
  FROM pg_roles r
  WHERE r.rolname IN ('oserp_compat_app','oserp_legacy_app',
    'oserp_maint_cleanup_role', 'oserp_company_payroll_app',
    'oserp_company_payroll_verifier', 'oserp_preview_runtime_app',
    'oserp_preview_direct_app', 'oserp_preview_payroll_app')
)
SELECT 1 / (CASE WHEN (SELECT COUNT(*) FROM runtime_roles) = 8
                  AND (SELECT table_owner IS NOT NULL AND command_owner IS NOT NULL FROM owners)
                  AND NOT EXISTS (
                    SELECT 1 FROM runtime_roles r CROSS JOIN owners
                    WHERE r.rolbypassrls
                      OR pg_has_role(r.oid, owners.table_owner, 'SET')
                      OR pg_has_role(r.oid, owners.command_owner, 'SET')
                      OR pg_has_role(r.oid, owners.table_owner, 'USAGE')
                      OR pg_has_role(r.oid, owners.command_owner, 'USAGE'))
             THEN 1 ELSE 0 END) AS runtime_privilege_guard;

-- 7. Owner and FORCE RLS on protected source tables. This does not print data.
SELECT c.relname AS table_name,
       pg_get_userbyid(c.relowner) AS table_owner,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS force_rls
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p')
  AND c.relname IN ('Project','ProjectUserAssignment','User','Role','RolePermission')
ORDER BY c.relname;

-- 8. Function ownership/signature/search_path metadata; only safe flags, NEVER raw proconfig.
SELECT p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS arguments,
       pg_get_userbyid(p.proowner) AS function_owner,
       p.prosecdef AS security_definer,
       EXISTS (SELECT 1 FROM unnest(p.proconfig) AS setting
                 WHERE setting LIKE 'search_path=%') AS has_fixed_search_path,
       COALESCE(array_length(p.proconfig, 1), 0) AS config_setting_count
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
  AND p.proname IN ('uboq_verify_signed_rls_proof',
                    'uboq_check_tenant_rls',
                    'phase9_create_project_profile')
ORDER BY p.proname;

-- 9. Extension inventory needed to reproduce the same PostgreSQL feature set.
SELECT extname AS extension_name, extversion AS extension_version
FROM pg_extension ORDER BY extname;

-- 10. Ledger names in migration order. No migration bodies or application rows.
SELECT migration_name, finished_at IS NOT NULL AS applied,
       rolled_back_at IS NOT NULL AS rolled_back
FROM public._prisma_migrations ORDER BY started_at, migration_name;
