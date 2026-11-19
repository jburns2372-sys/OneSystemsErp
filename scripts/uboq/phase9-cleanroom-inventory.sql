-- OneSystemsERP Phase 9: READ-ONLY cleanroom source inventory.
-- Target: disposable Preview database only. Never run against Production by default.
-- All statements are catalog SELECTs (or aggregate SELECTs); no writes, SET ROLE,
-- connection strings, function source, user rows, or credentials are returned.
-- Run with psql -X -v ON_ERROR_STOP=1 -f <this-file> using scoped Preview credentials.

-- 1. Identity and server compatibility, no password or host disclosure.
SELECT current_database() AS database_name,
       current_user AS connected_role,
       current_setting('server_version_num')::int AS postgres_version_num;

-- 2. Migration ledger: source schema already has 39 completed Prisma migrations.
SELECT COUNT(*) FILTER (WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL)
         AS completed_migrations,
       COUNT(*) FILTER (WHERE migration_name =
         '20261118090000_phase9_project_creator_bootstrap') AS phase9_entries
FROM public._prisma_migrations;

-- 3. Counts only; never retrieve application or user records.
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

-- 4. Existing owner/privilege graph: NOLOGIN/BYPASSRLS role attributes are important.
SELECT rolname, rolcanlogin, rolsuper, rolbypassrls, rolcreaterole, rolcreatedb,
       pg_has_role(current_user, oid, 'SET') AS caller_can_set,
       pg_has_role(current_user, oid, 'MEMBER') AS caller_is_member
FROM pg_roles
WHERE rolname IN ('neondb_owner', 'oserp_preview_migrate_admin',
                  'oserp_migrations_owner', 'oserp_compat_app',
                  'oserp_legacy_app', 'oserp_maint_cleanup_role')
ORDER BY rolname;

-- 5. Owner and FORCE RLS on protected source tables. This does not print data.
SELECT c.relname AS table_name,
       pg_get_userbyid(c.relowner) AS table_owner,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS force_rls
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p')
  AND c.relname IN ('Project','ProjectUserAssignment','User','Role','RolePermission')
ORDER BY c.relname;

-- 6. Function ownership/signature/search_path metadata, never function source.
SELECT p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS arguments,
       pg_get_userbyid(p.proowner) AS function_owner,
       p.prosecdef AS security_definer,
       p.proconfig AS function_settings
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
  AND p.proname IN ('uboq_verify_signed_rls_proof',
                    'uboq_check_tenant_rls',
                    'phase9_create_project_profile')
ORDER BY p.proname;

-- 7. Extension inventory needed to reproduce the same PostgreSQL feature set.
SELECT extname AS extension_name, extversion AS extension_version
FROM pg_extension ORDER BY extname;

-- 8. Ledger names in migration order. No migration bodies or application rows.
SELECT migration_name, finished_at IS NOT NULL AS applied,
       rolled_back_at IS NOT NULL AS rolled_back
FROM public._prisma_migrations ORDER BY started_at, migration_name;
