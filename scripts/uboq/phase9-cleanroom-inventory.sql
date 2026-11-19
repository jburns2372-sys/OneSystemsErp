-- OneSystemsERP Phase 9: READ-ONLY cleanroom source & target inventory.
-- Target: disposable Preview (`oserp_uboq_preview` on Neon project `long-recipe-20782583`,
-- branch `br-restless-dust-bc1a91f4`) or isolated loopback local cleanroom
-- (`oserp_uboq_cleanroom`, `oserp_uboq_cleanroom_restored` on `127.0.0.1`) ONLY.
-- Never run against Production or Neon default/main branches.
-- Enforces stop-on-error, read-only mode, and fail-closed role/membership invariants
-- in-script; no writes, SET ROLE, connection strings, function source, raw proconfig
-- values, user rows, or credentials are returned.

\set ON_ERROR_STOP on

-- 0. Enforce session-level READ ONLY mode and fail closed on wrong database, branch, or host.
SET default_transaction_read_only = on;

SELECT
  CASE
    WHEN (
      1 / CASE
        WHEN current_database() = 'oserp_uboq_preview'
          AND current_setting('neon.project_id', true) = 'long-recipe-20782583'
          AND current_setting('neon.branch_id', true) = 'br-restless-dust-bc1a91f4'
          THEN 1
        WHEN current_database() IN ('oserp_uboq_cleanroom', 'oserp_uboq_cleanroom_restored')
          AND current_setting('neon.project_id', true) IS NULL
          AND current_setting('neon.branch_id', true) IS NULL
          AND host(inet_server_addr()) = '127.0.0.1'
          THEN 1
        ELSE 0
      END
    ) = 1 THEN current_database()
  END AS verified_target_database,
  COALESCE(current_setting('neon.branch_id', true), 'LOCAL_LOOPBACK_127.0.0.1')
    AS verified_branch_or_scope,
  CASE
    WHEN (
      1 / CASE
        WHEN current_setting('transaction_read_only') = 'on' THEN 1
        ELSE 0
      END
    ) = 1 THEN 'READ_ONLY_ENFORCED'
  END AS verified_session_mode;

-- 1. Identity and server compatibility, no password or host disclosure.
SELECT current_database() AS database_name,
       current_user AS connected_role,
       current_setting('server_version_num')::int AS postgres_version_num;

-- 2. Migration ledger summary.
SELECT COUNT(*) FILTER (WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL)
         AS completed_migrations,
       COUNT(*) FILTER (WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL)
         AS incomplete_or_rolled_back_migrations,
       COUNT(*) FILTER (WHERE migration_name =
         '20261118090000_phase9_project_creator_bootstrap'
         AND finished_at IS NOT NULL AND rolled_back_at IS NULL) AS phase9_entries
FROM public._prisma_migrations;

-- 3. Counts only; never retrieve application or user records.
SELECT
  (SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')) AS public_tables,
  (SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relforcerowsecurity) AS force_rls_tables,
  (SELECT COUNT(*) FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public')
     AS public_rls_policies,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.prosecdef) AS public_security_definer_functions,
  (SELECT COUNT(*) FROM public."User") AS user_count,
  (SELECT COUNT(*) FROM public."Project") AS project_count;

-- 4a. Complete owner, governed-group, and runtime login role attribute inventory.
SELECT rolname,
       rolcanlogin,
       rolsuper,
       rolbypassrls,
       rolcreaterole,
       rolcreatedb,
       rolreplication,
       rolinherit,
       rolconnlimit
FROM pg_roles
WHERE rolname ~* '^oserp_'
   OR rolname IN ('neondb_owner', 'cleanroom_db_owner')
ORDER BY rolname;

-- 4b. Recursive pg_auth_members closure across all runtime and governed roles
--     (tracks effective INHERIT, SET, and exercisable ADMIN reachability).
WITH RECURSIVE membership_closure AS (
  SELECT
    m_role.oid AS root_member_oid,
    m_role.rolname AS member_role,
    m_role.rolcanlogin AS member_can_login,
    m_role.rolbypassrls AS member_bypassrls,
    g_role.oid AS target_role_oid,
    g_role.rolname AS granted_role,
    g_role.rolbypassrls AS granted_bypassrls,
    am.admin_option AS exercisable_admin,
    am.inherit_option AS all_inherit,
    am.set_option AS all_set,
    1 AS depth,
    ARRAY[m_role.oid, g_role.oid] AS visited
  FROM pg_auth_members am
  JOIN pg_roles m_role ON m_role.oid = am.member
  JOIN pg_roles g_role ON g_role.oid = am.roleid
  UNION ALL
  SELECT
    mc.root_member_oid,
    mc.member_role,
    mc.member_can_login,
    mc.member_bypassrls,
    parent_role.oid AS target_role_oid,
    parent_role.rolname AS granted_role,
    parent_role.rolbypassrls AS granted_bypassrls,
    ((mc.all_set OR mc.all_inherit) AND am2.admin_option) AS exercisable_admin,
    (mc.all_inherit AND am2.inherit_option) AS all_inherit,
    (mc.all_set AND am2.set_option) AS all_set,
    mc.depth + 1 AS depth,
    mc.visited || parent_role.oid
  FROM membership_closure mc
  JOIN pg_auth_members am2 ON am2.member = mc.target_role_oid
  JOIN pg_roles parent_role ON parent_role.oid = am2.roleid
  WHERE NOT (parent_role.oid = ANY(mc.visited))
)
SELECT
  member_role,
  member_can_login,
  member_bypassrls,
  granted_role,
  granted_bypassrls,
  MIN(depth) AS min_depth,
  BOOL_OR(exercisable_admin) AS effective_admin_path,
  BOOL_OR(all_inherit) AS effective_inherit_path,
  BOOL_OR(all_set) AS effective_set_path
FROM membership_closure
WHERE member_role ~* '^oserp_'
   OR granted_role ~* '^oserp_'
GROUP BY
  member_role,
  member_can_login,
  member_bypassrls,
  granted_role,
  granted_bypassrls
ORDER BY member_role, granted_role;

-- 4c. Fail-closed role & membership invariant assertion:
--     Rejects missing required logins/owners, unexpected oserp_* roles, runtime BYPASSRLS/SUPERUSER/
--     CREATEROLE/CREATEDB, unlocked oserp_preview_migrate_admin, or ANY direct/transitive membership,
--     INHERIT, SET, or ADMIN path from any login role to protected owners or governed groups.
WITH RECURSIVE membership_closure AS (
  SELECT
    m_role.oid AS root_member_oid,
    m_role.rolname AS member_role,
    m_role.rolcanlogin AS member_can_login,
    g_role.oid AS target_role_oid,
    g_role.rolname AS granted_role,
    am.admin_option AS any_edge_admin,
    am.admin_option AS exercisable_admin,
    am.inherit_option AS all_inherit,
    am.set_option AS all_set,
    ARRAY[m_role.oid, g_role.oid] AS visited
  FROM pg_auth_members am
  JOIN pg_roles m_role ON m_role.oid = am.member
  JOIN pg_roles g_role ON g_role.oid = am.roleid
  UNION ALL
  SELECT
    mc.root_member_oid,
    mc.member_role,
    mc.member_can_login,
    parent_role.oid AS target_role_oid,
    parent_role.rolname AS granted_role,
    (mc.any_edge_admin OR am2.admin_option) AS any_edge_admin,
    ((mc.all_set OR mc.all_inherit) AND am2.admin_option) AS exercisable_admin,
    (mc.all_inherit AND am2.inherit_option) AS all_inherit,
    (mc.all_set AND am2.set_option) AS all_set,
    mc.visited || parent_role.oid
  FROM membership_closure mc
  JOIN pg_auth_members am2 ON am2.member = mc.target_role_oid
  JOIN pg_roles parent_role ON parent_role.oid = am2.roleid
  WHERE NOT (parent_role.oid = ANY(mc.visited))
),
violations AS (
  -- Required roles must exist
  SELECT 'MISSING_REQUIRED_ROLE:' || req AS violation
  FROM unnest(ARRAY[
    'oserp_migrations_owner',
    'oserp_preview_migrate_admin',
    'oserp_compat_app',
    'oserp_legacy_app',
    'oserp_maint_cleanup_role',
    'oserp_company_payroll_app',
    'oserp_company_payroll_verifier',
    'oserp_preview_preflight_ro',
    'oserp_preview_runtime_app',
    'oserp_preview_direct_app',
    'oserp_preview_payroll_app'
  ]) AS req
  WHERE NOT EXISTS (SELECT 1 FROM pg_roles r WHERE r.rolname = req)

  UNION ALL
  -- Reject any unrecognized oserp_* role
  SELECT 'UNRECOGNIZED_OSERP_ROLE:' || r.rolname
  FROM pg_roles r
  WHERE r.rolname ~* '^oserp_'
    AND r.rolname NOT IN (
      'oserp_migrations_owner',
      'oserp_preview_migrate_admin',
      'oserp_compat_app',
      'oserp_legacy_app',
      'oserp_maint_cleanup_role',
      'oserp_company_payroll_app',
      'oserp_company_payroll_verifier',
      'oserp_preview_preflight_ro',
      'oserp_preview_runtime_app',
      'oserp_preview_direct_app',
      'oserp_preview_payroll_app',
      'oserp_preview_bootstrap_owner'
    )

  UNION ALL
  -- Trusted command owner must be NOLOGIN + BYPASSRLS + NOSUPERUSER
  SELECT 'INVALID_MIGRATIONS_OWNER_ATTRS'
  FROM pg_roles r
  WHERE r.rolname = 'oserp_migrations_owner'
    AND (r.rolcanlogin OR r.rolsuper OR NOT r.rolbypassrls OR r.rolcreaterole OR r.rolcreatedb OR r.rolreplication)

  UNION ALL
  -- Table/migration owner must be locked NOLOGIN + NOBYPASSRLS at rest
  SELECT 'UNLOCKED_OR_OVERPRIVILEGED_MIGRATE_ADMIN'
  FROM pg_roles r
  WHERE r.rolname = 'oserp_preview_migrate_admin'
    AND (r.rolcanlogin OR r.rolsuper OR r.rolbypassrls OR r.rolcreaterole OR r.rolcreatedb OR r.rolreplication OR r.rolconnlimit <> 0)

  UNION ALL
  -- All 4 runtime/preflight logins must be LOGIN + NOBYPASSRLS + NOSUPERUSER + NOCREATEROLE + NOCREATEDB
  SELECT 'UNSAFE_RUNTIME_LOGIN_ATTRS:' || r.rolname
  FROM pg_roles r
  WHERE r.rolname IN (
    'oserp_preview_preflight_ro',
    'oserp_preview_runtime_app',
    'oserp_preview_direct_app',
    'oserp_preview_payroll_app'
  )
    AND (
      NOT r.rolcanlogin
      OR r.rolsuper
      OR r.rolbypassrls
      OR r.rolcreaterole
      OR r.rolcreatedb
      OR r.rolreplication
      OR (r.rolname = 'oserp_preview_preflight_ro' AND r.rolinherit)
    )

  UNION ALL
  -- No login role (`rolcanlogin = true`) may reach protected owners, hold direct/exercisable ADMIN
  -- on ANY `oserp_*` role, or hold membership in ANY `oserp_*` role unless it is one of the 3 allowlisted app logins
  SELECT 'UNAUTHORIZED_LOGIN_OSERP_GRANT_OR_ADMIN:' || mc.member_role || '->' || mc.granted_role
  FROM membership_closure mc
  WHERE mc.member_can_login
    AND mc.granted_role ~* '^oserp_'
    AND (
      mc.granted_role IN ('oserp_migrations_owner', 'oserp_preview_migrate_admin')
      OR mc.any_edge_admin
      OR mc.exercisable_admin
      OR mc.member_role NOT IN (
        'oserp_preview_runtime_app',
        'oserp_preview_direct_app',
        'oserp_preview_payroll_app'
      )
      OR (mc.member_role IN ('oserp_preview_runtime_app', 'oserp_preview_direct_app') AND mc.granted_role <> 'oserp_compat_app')
      OR (mc.member_role = 'oserp_preview_payroll_app' AND mc.granted_role <> 'oserp_company_payroll_app')
    )

  UNION ALL
  -- Across all roles (including NOLOGIN roles), ONLY locked `oserp_preview_migrate_admin` may hold direct ADMIN on any `oserp_*` role
  SELECT 'UNAUTHORIZED_OSERP_ADMIN_HOLDER:' || m_role.rolname || '->' || g_role.rolname
  FROM pg_auth_members am
  JOIN pg_roles m_role ON m_role.oid = am.member
  JOIN pg_roles g_role ON g_role.oid = am.roleid
  WHERE g_role.rolname ~* '^oserp_'
    AND am.admin_option
    AND m_role.rolname <> 'oserp_preview_migrate_admin'
)
SELECT
  CASE
    WHEN (1 / CASE WHEN COUNT(*) = 0 THEN 1 ELSE 0 END) = 1
      THEN 'PASS_ALL_ROLE_AND_CLOSURE_INVARIANTS'
  END AS verified_role_security_posture
FROM violations;

-- 5. Owner and FORCE RLS on protected Phase 9 tables. Does not print data.
SELECT c.relname AS table_name,
       pg_get_userbyid(c.relowner) AS table_owner,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS force_rls
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
  AND c.relname IN ('Project', 'ProjectUserAssignment', 'User', 'Role', 'RolePermission')
ORDER BY c.relname;

-- 6. Function ownership/signature/search_path compliance (whitelists search_path, redacts arbitrary proconfig values).
SELECT p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS arguments,
       pg_get_userbyid(p.proowner) AS function_owner,
       p.prosecdef AS security_definer,
       (
         SELECT split_part(cfg, '=', 2)
         FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS cfg
         WHERE split_part(cfg, '=', 1) = 'search_path'
         LIMIT 1
       ) AS configured_search_path,
       ARRAY(
         SELECT split_part(cfg, '=', 1)
         FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS cfg
         ORDER BY 1
       ) AS setting_names_only,
       has_function_privilege('public', p.oid, 'EXECUTE') AS public_can_execute,
       CASE WHEN EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'oserp_compat_app')
         THEN has_function_privilege('oserp_compat_app', p.oid, 'EXECUTE')
         ELSE NULL END AS compat_app_can_execute,
       CASE WHEN EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'oserp_legacy_app')
         THEN has_function_privilege('oserp_legacy_app', p.oid, 'EXECUTE')
         ELSE NULL END AS legacy_app_can_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'uboq_verify_signed_rls_proof',
    'uboq_check_tenant_rls',
    'phase9_create_project_profile'
  )
ORDER BY p.proname;

-- 7. Extension inventory needed to reproduce the same PostgreSQL feature set.
SELECT extname AS extension_name, extversion AS extension_version
FROM pg_extension ORDER BY extname;

-- 8. Ledger names and checksum validity in migration order (no migration bodies or app rows).
SELECT migration_name,
       finished_at IS NOT NULL AS applied,
       rolled_back_at IS NOT NULL AS rolled_back,
       (checksum IS NOT NULL AND checksum ~ '^[0-9a-f]{64}$') AS valid_sha256_checksum
FROM public._prisma_migrations
ORDER BY started_at, migration_name;
