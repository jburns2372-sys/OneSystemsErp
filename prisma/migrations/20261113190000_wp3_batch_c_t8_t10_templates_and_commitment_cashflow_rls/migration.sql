-- ============================================================================
-- OSERP-PROJ-UBOQ-001 — WP-3 BATCH C (MIGRATION #30, FORWARD-ONLY)
-- Scope:
--   1. Enforces Row-Level Security (ENABLE + FORCE RLS, cryptographically bound
--      project scope via public.uboq_check_tenant_rls(...), cross-project child
--      FK rejection, and legacy-role governed-project block) across all 5 newly
--      activated Batch C commitment & subcontract tables:
--        - CommitmentLedger
--        - SubcontractBilling
--        - SubcontractAccomplishment
--        - PaymentRecord
--        - SubcontractorVariationOrder
--      without altering any G02/H02B policy on SubcontractPackage, JobOrder,
--      PayrollPeriod, or Payroll.
--   2. Hardens public."UboqContractorTargetBudget" with an executive-finance
--      restrictive RLS policy (public.uboq_actor_has_executive_sensitive_access)
--      honoring ProjectUserAssignment role narrowing so non-executive roles
--      cannot SELECT target budgets even via direct SQL on oserp_compat_app.
--   3. Enforces append-only immutability, verified actor binding, and project
--      tenant RLS on public."SensitiveExportLog".
--   4. Provides a cryptographically RLS-guarded, PII-free financial summary
--      reader public.uboq_read_project_subcontract_and_payroll_facts(text) for
--      authorized commercial/executive template projections.
--   5. Enables Persistent Saved Layouts & Audit Provenance for Batch C Templates:
--        - T8_CASHFLOW_HALF_MONTH (rowGrain = CASH_FLOW_PERIOD, non-formal)
--        - T9_CASHFLOW_QUARTERLY  (rowGrain = CASH_FLOW_QUARTER, non-formal)
--        - T10_EXECUTIVE_MARGIN   (rowGrain = PHASE_BOQ_LINE, non-formal)
--      with SQL-level sensitive-column write enforcement while keeping T8-T10
--      blocked from FORMAL_EXPORT_GENERATED and keeping T11-T12 gated for Batch D.
--   6. Preserves Migrations #1-#29 byte-for-byte unchanged.
-- ============================================================================

-- 1. Executive-Finance Sensitive Access Predicate (Honoring Project Role Narrowing)
CREATE OR REPLACE FUNCTION public.uboq_actor_has_executive_sensitive_access(
  p_project_id text,
  p_actor_id text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_user record;
  v_proj record;
  v_assign record;
  v_role text;
  v_proj_role text;
  v_access text;
BEGIN
  IF p_project_id IS NULL OR p_actor_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_actor_id IS DISTINCT FROM NULLIF(current_setting('app.current_user_id', true), '') THEN
    RETURN false;
  END IF;

  IF public.uboq_check_tenant_rls(p_project_id) IS NOT TRUE THEN
    RETURN false;
  END IF;

  SELECT id, role, status, "lockedUntil"
  INTO v_user
  FROM public."User"
  WHERE id = p_actor_id;

  IF v_user.id IS NULL
     OR UPPER(COALESCE(v_user.status, '')) <> 'ACTIVE'
     OR (v_user."lockedUntil" IS NOT NULL AND v_user."lockedUntil" > clock_timestamp()) THEN
    RETURN false;
  END IF;

  v_role := UPPER(BTRIM(COALESCE(v_user.role, '')));
  IF v_role NOT IN (
    'SUPER_ADMIN',
    'PRESIDENT',
    'VP_OPERATIONS',
    'FINANCE_DIRECTOR',
    'COST_CONTROL_MANAGER',
    'COMMERCIAL_DIRECTOR',
    'CHIEF_ESTIMATOR'
  ) THEN
    RETURN false;
  END IF;

  SELECT id, "managerId"
  INTO v_proj
  FROM public."Project"
  WHERE id = p_project_id;

  IF v_proj.id IS NULL THEN
    RETURN false;
  END IF;

  IF v_role IN ('SUPER_ADMIN', 'PRESIDENT', 'VP_OPERATIONS')
     OR v_proj."managerId" = p_actor_id THEN
    RETURN true;
  END IF;

  SELECT id, "projectRole", "accessLevel"
  INTO v_assign
  FROM public."ProjectUserAssignment"
  WHERE "projectId" = p_project_id
    AND "userId" = p_actor_id
    AND UPPER(COALESCE("assignmentStatus", '')) = 'ACTIVE'
  ORDER BY id ASC
  LIMIT 1;

  IF v_assign.id IS NULL THEN
    RETURN false;
  END IF;

  v_access := UPPER(BTRIM(COALESCE(v_assign."accessLevel", '')));
  v_proj_role := UPPER(BTRIM(COALESCE(v_assign."projectRole", '')));

  IF v_access IN ('VIEWER', 'VIEW_ONLY', 'READ_ONLY', 'OBSERVER', 'GUEST', 'EXTERNAL_VIEWER')
     OR v_proj_role IN ('VIEWER', 'VIEW_ONLY', 'READ_ONLY', 'OBSERVER', 'GUEST', 'EXTERNAL_VIEWER') THEN
    RETURN false;
  END IF;

  -- Enforce strict role narrowing: if a projectRole is specified beyond generic membership,
  -- it must ALSO be an executive/finance role to retain sensitive field & target-budget access.
  IF v_proj_role NOT IN ('', 'MEMBER', 'STANDARD', 'FULL')
     AND v_proj_role NOT IN (
       'SUPER_ADMIN',
       'PRESIDENT',
       'VP_OPERATIONS',
       'FINANCE_DIRECTOR',
       'COST_CONTROL_MANAGER',
       'COMMERCIAL_DIRECTOR',
       'CHIEF_ESTIMATOR'
     ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;
ALTER FUNCTION public.uboq_actor_has_executive_sensitive_access(text, text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_actor_has_executive_sensitive_access(text, text)
  FROM PUBLIC, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_actor_has_executive_sensitive_access(text, text)
  TO oserp_compat_app, oserp_legacy_app;

-- 2. Deterministic SECURITY DEFINER Project Resolvers for Batch C Commitment & Subcontract Tables
CREATE OR REPLACE FUNCTION public.uboq_resolve_commitment_ledger_project(
  p_project_id text,
  p_consolidated_boq_item_id text,
  p_awarded_boq_item_id text
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT CASE
    WHEN p_project_id IS NOT NULL
         AND (
           p_consolidated_boq_item_id IS NULL
           OR EXISTS (
             SELECT 1
             FROM public."ConsolidatedBOQItem" cb
             WHERE cb.id = p_consolidated_boq_item_id
               AND cb."projectId" = p_project_id
           )
         )
         AND (
           p_awarded_boq_item_id IS NULL
           OR EXISTS (
             SELECT 1
             FROM public."AwardedBOQItem" ab
             WHERE ab.id = p_awarded_boq_item_id
               AND ab."projectId" = p_project_id
           )
         )
    THEN p_project_id
    ELSE NULL
  END;
$$;
ALTER FUNCTION public.uboq_resolve_commitment_ledger_project(text, text, text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_resolve_commitment_ledger_project(text, text, text)
  FROM PUBLIC, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_resolve_commitment_ledger_project(text, text, text)
  TO oserp_compat_app, oserp_legacy_app;

CREATE OR REPLACE FUNCTION public.uboq_resolve_subcontract_billing_project(
  p_project_id text,
  p_package_id text,
  p_job_order_id text
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT CASE
    WHEN p_project_id IS NOT NULL
         AND (
           p_package_id IS NULL
           OR EXISTS (
             SELECT 1
             FROM public."SubcontractPackage" sp
             WHERE sp.id = p_package_id
               AND sp."projectId" = p_project_id
           )
         )
         AND (
           p_job_order_id IS NULL
           OR EXISTS (
             SELECT 1
             FROM public."JobOrder" jo
             WHERE jo.id = p_job_order_id
               AND jo."projectId" = p_project_id
           )
         )
    THEN p_project_id
    ELSE NULL
  END;
$$;
ALTER FUNCTION public.uboq_resolve_subcontract_billing_project(text, text, text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_resolve_subcontract_billing_project(text, text, text)
  FROM PUBLIC, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_resolve_subcontract_billing_project(text, text, text)
  TO oserp_compat_app, oserp_legacy_app;

CREATE OR REPLACE FUNCTION public.uboq_resolve_subcontract_accomplishment_project(
  p_package_id text,
  p_job_order_id text
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT CASE
    WHEN p_package_id IS NOT NULL AND p_job_order_id IS NOT NULL THEN (
      SELECT CASE
        WHEN sp."projectId" IS NOT NULL AND sp."projectId" = jo."projectId" THEN sp."projectId"
        ELSE NULL
      END
      FROM public."SubcontractPackage" sp,
           public."JobOrder" jo
      WHERE sp.id = p_package_id
        AND jo.id = p_job_order_id
    )
    WHEN p_package_id IS NOT NULL THEN (
      SELECT sp."projectId"
      FROM public."SubcontractPackage" sp
      WHERE sp.id = p_package_id
    )
    WHEN p_job_order_id IS NOT NULL THEN (
      SELECT jo."projectId"
      FROM public."JobOrder" jo
      WHERE jo.id = p_job_order_id
    )
    ELSE NULL
  END;
$$;
ALTER FUNCTION public.uboq_resolve_subcontract_accomplishment_project(text, text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_resolve_subcontract_accomplishment_project(text, text)
  FROM PUBLIC, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_resolve_subcontract_accomplishment_project(text, text)
  TO oserp_compat_app, oserp_legacy_app;

CREATE OR REPLACE FUNCTION public.uboq_resolve_subcontract_payment_project(
  p_billing_id text
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT sb."projectId"
  FROM public."SubcontractBilling" sb
  WHERE sb.id = p_billing_id;
$$;
ALTER FUNCTION public.uboq_resolve_subcontract_payment_project(text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_resolve_subcontract_payment_project(text)
  FROM PUBLIC, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_resolve_subcontract_payment_project(text)
  TO oserp_compat_app, oserp_legacy_app;

CREATE OR REPLACE FUNCTION public.uboq_resolve_subcontractor_vo_project(
  p_project_id text,
  p_original_subcontract_id text
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT CASE
    WHEN p_project_id IS NOT NULL
         AND (
           p_original_subcontract_id IS NULL
           OR EXISTS (
             SELECT 1
             FROM public."SubcontractPackage" sp
             WHERE sp.id = p_original_subcontract_id
               AND sp."projectId" = p_project_id
           )
         )
    THEN p_project_id
    ELSE NULL
  END;
$$;
ALTER FUNCTION public.uboq_resolve_subcontractor_vo_project(text, text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_resolve_subcontractor_vo_project(text, text)
  FROM PUBLIC, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_resolve_subcontractor_vo_project(text, text)
  TO oserp_compat_app, oserp_legacy_app;

-- 3. Grant Bounded Operational Privileges & Enable + Force Tenant-Scoped RLS on Batch C Tables
GRANT SELECT, INSERT, UPDATE ON
  public."SubcontractBilling",
  public."SubcontractAccomplishment",
  public."PaymentRecord",
  public."SubcontractorVariationOrder"
TO oserp_compat_app;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT *
    FROM (VALUES
      ('CommitmentLedger', 'public.uboq_resolve_commitment_ledger_project("projectId", "consolidatedBoqItemId", "awardedBoqItemId")'),
      ('SubcontractBilling', 'public.uboq_resolve_subcontract_billing_project("projectId", "packageId", "jobOrderId")'),
      ('SubcontractAccomplishment', 'public.uboq_resolve_subcontract_accomplishment_project("packageId", "jobOrderId")'),
      ('PaymentRecord', 'public.uboq_resolve_subcontract_payment_project("billingId")'),
      ('SubcontractorVariationOrder', 'public.uboq_resolve_subcontractor_vo_project("projectId", "originalSubcontractId")')
    ) AS batch_c_tables(tbl, proj_expr)
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tbl);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', r.tbl);

    EXECUTE format('DROP POLICY IF EXISTS rls_permissive_app_access ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY rls_permissive_app_access ON public.%I AS PERMISSIVE FOR ALL TO PUBLIC USING (true) WITH CHECK (true)',
      r.tbl
    );

    EXECUTE format('DROP POLICY IF EXISTS rls_restrictive_tenant_scope ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY rls_restrictive_tenant_scope ON public.%I AS RESTRICTIVE FOR ALL TO PUBLIC USING (public.uboq_check_tenant_rls(%s)) WITH CHECK (public.uboq_check_tenant_rls(%s))',
      r.tbl,
      r.proj_expr,
      r.proj_expr
    );

    EXECUTE format('DROP POLICY IF EXISTS rls_block_legacy_role_on_uboq ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY rls_block_legacy_role_on_uboq ON public.%I AS RESTRICTIVE FOR ALL TO oserp_legacy_app USING (NOT public.uboq_is_governed_project(%s)) WITH CHECK (NOT public.uboq_is_governed_project(%s))',
      r.tbl,
      r.proj_expr,
      r.proj_expr
    );
  END LOOP;
END;
$$;

-- 4. Harden UboqContractorTargetBudget with Executive-Finance Restrictive RLS Policy
DROP POLICY IF EXISTS rls_restrictive_uboq_target_budget_exec ON public."UboqContractorTargetBudget";
CREATE POLICY rls_restrictive_uboq_target_budget_exec
  ON public."UboqContractorTargetBudget"
  AS RESTRICTIVE
  FOR ALL
  TO oserp_compat_app
  USING (
    public.uboq_actor_has_executive_sensitive_access(
      "projectId",
      NULLIF(current_setting('app.current_user_id', true), '')
    )
  )
  WITH CHECK (
    public.uboq_actor_has_executive_sensitive_access(
      "projectId",
      NULLIF(current_setting('app.current_user_id', true), '')
    )
  );

-- 5. Enable + Force RLS and Append-Only Immutability on SensitiveExportLog
REVOKE UPDATE, DELETE ON public."SensitiveExportLog" FROM oserp_compat_app;
GRANT SELECT, INSERT ON public."SensitiveExportLog" TO oserp_compat_app;

ALTER TABLE public."SensitiveExportLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SensitiveExportLog" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rls_permissive_sensitive_export_log_insert ON public."SensitiveExportLog";
CREATE POLICY rls_permissive_sensitive_export_log_insert
  ON public."SensitiveExportLog"
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

DROP POLICY IF EXISTS rls_permissive_sensitive_export_log_select ON public."SensitiveExportLog";
CREATE POLICY rls_permissive_sensitive_export_log_select
  ON public."SensitiveExportLog"
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING (true);

DROP POLICY IF EXISTS rls_permissive_sensitive_export_log_maint ON public."SensitiveExportLog";
CREATE POLICY rls_permissive_sensitive_export_log_maint
  ON public."SensitiveExportLog"
  AS PERMISSIVE
  FOR DELETE
  TO oserp_maint_cleanup_role
  USING (current_setting('app.synthetic_cleanup_authorized', true) = 'on');

DROP POLICY IF EXISTS rls_deny_legacy_on_sensitive_export_log ON public."SensitiveExportLog";
CREATE POLICY rls_deny_legacy_on_sensitive_export_log
  ON public."SensitiveExportLog"
  AS RESTRICTIVE
  FOR ALL
  TO oserp_legacy_app
  USING (NOT public.uboq_is_governed_project("projectId"))
  WITH CHECK (NOT public.uboq_is_governed_project("projectId"));

DROP POLICY IF EXISTS rls_restrictive_sensitive_export_log_compat ON public."SensitiveExportLog";
CREATE POLICY rls_restrictive_sensitive_export_log_compat
  ON public."SensitiveExportLog"
  AS RESTRICTIVE
  FOR ALL
  TO oserp_compat_app
  USING (
    "projectId" IS NOT NULL
    AND public.uboq_check_tenant_rls("projectId")
    AND (
      "userId" = NULLIF(current_setting('app.current_user_id', true), '')
      OR public.uboq_actor_has_executive_sensitive_access(
        "projectId",
        NULLIF(current_setting('app.current_user_id', true), '')
      )
    )
  )
  WITH CHECK (
    "projectId" IS NOT NULL
    AND public.uboq_check_tenant_rls("projectId")
    AND "userId" = NULLIF(current_setting('app.current_user_id', true), '')
  );

CREATE OR REPLACE FUNCTION public.uboq_guard_sensitive_export_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_user record;
  v_db_role text;
BEGIN
  IF current_setting('app.synthetic_cleanup_authorized', true) = 'on'
     AND pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER') THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_IMMUTABLE: SensitiveExportLog records are append-only'
      USING ERRCODE = '42501';
  END IF;

  IF pg_has_role(session_user, 'oserp_compat_app', 'MEMBER')
     OR pg_has_role(current_user, 'oserp_compat_app', 'MEMBER')
     OR COALESCE(current_setting('app.enforce_project_rls', true), 'off') = 'on' THEN
    IF NEW."projectId" IS NULL
       OR public.uboq_check_tenant_rls(NEW."projectId") IS NOT TRUE
       OR NEW."userId" IS DISTINCT FROM NULLIF(current_setting('app.current_user_id', true), '') THEN
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_ACTOR_MISMATCH: Bound project and actor context required for SensitiveExportLog'
        USING ERRCODE = '42501';
    END IF;

    SELECT id, role, status, "lockedUntil"
    INTO v_user
    FROM public."User"
    WHERE id = NEW."userId";

    IF v_user.id IS NULL
       OR UPPER(COALESCE(v_user.status, '')) <> 'ACTIVE'
       OR (v_user."lockedUntil" IS NOT NULL AND v_user."lockedUntil" > clock_timestamp()) THEN
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_INACTIVE_ACTOR: Actor % is inactive or locked', NEW."userId"
        USING ERRCODE = '42501';
    END IF;

    v_db_role := UPPER(BTRIM(COALESCE(v_user.role, '')));
    IF NEW.role IS NOT NULL AND UPPER(BTRIM(NEW.role)) <> v_db_role THEN
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_ROLE_FORGED: Supplied role (%) does not match authenticated User.role (%)',
        NEW.role, v_db_role
        USING ERRCODE = '42501';
    END IF;
    NEW.role := v_db_role;
  END IF;

  RETURN NEW;
END;
$$;
ALTER FUNCTION public.uboq_guard_sensitive_export_log()
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_guard_sensitive_export_log()
  FROM PUBLIC, oserp_maint_cleanup_role;

DROP TRIGGER IF EXISTS trg_uboq_guard_sensitive_export_log ON public."SensitiveExportLog";
CREATE TRIGGER trg_uboq_guard_sensitive_export_log
  BEFORE INSERT OR UPDATE OR DELETE ON public."SensitiveExportLog"
  FOR EACH ROW
  EXECUTE FUNCTION public.uboq_guard_sensitive_export_log();

-- 6. Bounded Cryptographically RLS-Guarded, PII-Free Subcontract & Payroll Financial Summary Reader
CREATE OR REPLACE FUNCTION public.uboq_actor_has_commercial_restricted_access(
  p_project_id text,
  p_actor_id text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_user record;
  v_proj record;
  v_assign record;
  v_role text;
  v_proj_role text;
  v_access text;
BEGIN
  IF p_project_id IS NULL OR p_actor_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_actor_id IS DISTINCT FROM NULLIF(current_setting('app.current_user_id', true), '') THEN
    RETURN false;
  END IF;

  IF public.uboq_check_tenant_rls(p_project_id) IS NOT TRUE THEN
    RETURN false;
  END IF;

  SELECT id, role, status, "lockedUntil"
  INTO v_user
  FROM public."User"
  WHERE id = p_actor_id;

  IF v_user.id IS NULL
     OR UPPER(COALESCE(v_user.status, '')) <> 'ACTIVE'
     OR (v_user."lockedUntil" IS NOT NULL AND v_user."lockedUntil" > clock_timestamp()) THEN
    RETURN false;
  END IF;

  v_role := UPPER(BTRIM(COALESCE(v_user.role, '')));
  IF v_role NOT IN (
    'SUPER_ADMIN',
    'PRESIDENT',
    'VP_OPERATIONS',
    'FINANCE_DIRECTOR',
    'COST_CONTROL_MANAGER',
    'COMMERCIAL_DIRECTOR',
    'CHIEF_ESTIMATOR',
    'PROJECT_MANAGER',
    'QUANTITY_SURVEYOR',
    'PROCUREMENT_MANAGER',
    'PROCUREMENT_OFFICER',
    'ACCOUNTANT',
    'BILLING_ENGINEER',
    'OPERATIONS_MANAGER'
  ) THEN
    RETURN false;
  END IF;

  SELECT id, "managerId"
  INTO v_proj
  FROM public."Project"
  WHERE id = p_project_id;

  IF v_proj.id IS NULL THEN
    RETURN false;
  END IF;

  IF v_role IN ('SUPER_ADMIN', 'PRESIDENT', 'VP_OPERATIONS')
     OR v_proj."managerId" = p_actor_id THEN
    RETURN true;
  END IF;

  SELECT id, "projectRole", "accessLevel"
  INTO v_assign
  FROM public."ProjectUserAssignment"
  WHERE "projectId" = p_project_id
    AND "userId" = p_actor_id
    AND UPPER(COALESCE("assignmentStatus", '')) = 'ACTIVE'
  ORDER BY id ASC
  LIMIT 1;

  IF v_assign.id IS NULL THEN
    RETURN false;
  END IF;

  v_access := UPPER(BTRIM(COALESCE(v_assign."accessLevel", '')));
  v_proj_role := UPPER(BTRIM(COALESCE(v_assign."projectRole", '')));

  IF v_access IN ('VIEWER', 'VIEW_ONLY', 'READ_ONLY', 'OBSERVER', 'GUEST', 'EXTERNAL_VIEWER')
     OR v_proj_role IN ('VIEWER', 'VIEW_ONLY', 'READ_ONLY', 'OBSERVER', 'GUEST', 'EXTERNAL_VIEWER') THEN
    RETURN false;
  END IF;

  IF v_proj_role NOT IN ('', 'MEMBER', 'STANDARD', 'FULL')
     AND v_proj_role NOT IN (
       'SUPER_ADMIN',
       'PRESIDENT',
       'VP_OPERATIONS',
       'FINANCE_DIRECTOR',
       'COST_CONTROL_MANAGER',
       'COMMERCIAL_DIRECTOR',
       'CHIEF_ESTIMATOR',
       'PROJECT_MANAGER',
       'QUANTITY_SURVEYOR',
       'PROCUREMENT_MANAGER',
       'PROCUREMENT_OFFICER',
       'ACCOUNTANT',
       'BILLING_ENGINEER',
       'OPERATIONS_MANAGER'
     ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;
ALTER FUNCTION public.uboq_actor_has_commercial_restricted_access(text, text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_actor_has_commercial_restricted_access(text, text)
  FROM PUBLIC, oserp_maint_cleanup_role, oserp_legacy_app;
GRANT EXECUTE ON FUNCTION public.uboq_actor_has_commercial_restricted_access(text, text)
  TO oserp_compat_app;

CREATE OR REPLACE FUNCTION public.uboq_read_project_subcontract_and_payroll_facts(
  p_project_id text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_actor_id text;
  v_is_exec boolean;
  v_packages jsonb;
  v_job_orders jsonb;
  v_payrolls jsonb;
BEGIN
  v_actor_id := NULLIF(current_setting('app.current_user_id', true), '');
  IF p_project_id IS NULL
     OR v_actor_id IS NULL
     OR public.uboq_check_tenant_rls(p_project_id) IS NOT TRUE THEN
    RAISE EXCEPTION 'UBOQ_COMMITMENT_FACTS_RLS_DENIED: Signed project RLS context required'
      USING ERRCODE = '42501';
  END IF;

  IF public.uboq_actor_has_commercial_restricted_access(p_project_id, v_actor_id) IS NOT TRUE THEN
    RAISE EXCEPTION 'UBOQ_COMMITMENT_FACTS_ROLE_DENIED: Commercial or executive project role required'
      USING ERRCODE = '42501';
  END IF;

  v_is_exec := public.uboq_actor_has_executive_sensitive_access(p_project_id, v_actor_id);

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', sp.id,
        'packageNumber', sp."packageNumber",
        'subcontractorId', sp."subcontractorId",
        'awardedBoqItemId', sp."awardedBoqItemId",
        'consolidatedBoqItemId', sp."consolidatedBoqItemId",
        'quantity', sp.quantity,
        'unit', sp.unit,
        'unitCost', sp."unitCost",
        'contractAmount', sp."contractAmount",
        'costType', sp."costType"::text,
        'retentionPct', sp."retentionPct",
        'whtPct', sp."whtPct",
        'startDate', sp."startDate",
        'targetCompletion', sp."targetCompletion",
        'status', sp.status::text,
        'createdAt', sp."createdAt"
      )
      ORDER BY sp.id ASC
    ),
    '[]'::jsonb
  )
  INTO v_packages
  FROM public."SubcontractPackage" sp
  WHERE sp."projectId" = p_project_id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', jo.id,
        'jobNumber', jo."jobNumber",
        'packageId', jo."packageId",
        'subcontractorId', jo."subcontractorId",
        'boqReferenceId', jo."boqReferenceId",
        'consolidatedBoqItemId', jo."consolidatedBoqItemId",
        'contractAmount', jo."contractAmount",
        'startDate', jo."startDate",
        'completionDate', jo."completionDate",
        'status', jo.status::text,
        'createdAt', jo."createdAt"
      )
      ORDER BY jo.id ASC
    ),
    '[]'::jsonb
  )
  INTO v_job_orders
  FROM public."JobOrder" jo
  WHERE jo."projectId" = p_project_id;

  IF v_is_exec THEN
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', py.id,
          'payrollPeriodId', py."payrollPeriodId",
          'payrollBatchNumber', pp."payrollBatchNumber",
          'grossPay', py."grossPay",
          'netPay', py."netPay",
          'employerStatutoryShare', (
            COALESCE(py."sssEmployerShare", 0)
            + COALESCE(py."sssEcEmployerShare", 0)
            + COALESCE(py."sssWispEmployerShare", 0)
            + COALESCE(py."philhealthEmployerShare", 0)
            + COALESCE(py."pagibigEmployerShare", 0)
          ),
          'paymentStatus', py."paymentStatus",
          'transactionReference', py."transactionReference",
          'periodStatus', pp.status,
          'periodStartDate', pp."startDate",
          'periodEndDate', pp."endDate",
          'payrollDate', pp."payrollDate",
          'dateReleased', pp."dateReleased",
          'createdAt', py."createdAt"
        )
        ORDER BY py.id ASC
      ),
      '[]'::jsonb
    )
    INTO v_payrolls
    FROM public."Payroll" py
    JOIN public."PayrollPeriod" pp ON pp.id = py."payrollPeriodId"
    WHERE COALESCE(py."projectId", pp."projectId") = p_project_id
      AND (py."projectId" IS NULL OR pp."projectId" IS NULL OR py."projectId" = pp."projectId");
  ELSE
    v_payrolls := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'subcontractPackages', v_packages,
    'jobOrders', v_job_orders,
    'payrollSummaries', v_payrolls
  );
END;
$$;
ALTER FUNCTION public.uboq_read_project_subcontract_and_payroll_facts(text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_read_project_subcontract_and_payroll_facts(text)
  FROM PUBLIC, oserp_maint_cleanup_role, oserp_legacy_app;
GRANT EXECUTE ON FUNCTION public.uboq_read_project_subcontract_and_payroll_facts(text)
  TO oserp_compat_app;

-- 7. Extend UboqTemplateAuditEvent templateCode CHECK Constraint to T0-T10 (T11-T12 remain gated)
ALTER TABLE public."UboqTemplateAuditEvent"
  DROP CONSTRAINT IF EXISTS chk_uboq_tpl_audit_template_code;

ALTER TABLE public."UboqTemplateAuditEvent"
  ADD CONSTRAINT chk_uboq_tpl_audit_template_code CHECK (
    "templateCode" IN (
      'T0_MASTER_CONTRACT',
      'T1_PHASE_BOQ',
      'T2_CONSOLIDATED_BOQ',
      'T3_AGENCY_ESTIMATE',
      'T4_RESOURCE_TAKEOFF',
      'T5_ACCOMPLISHMENT_CERT',
      'T6_PROGRESS_BILLING',
      'T7_SCHEDULE_EVM',
      'T8_CASHFLOW_HALF_MONTH',
      'T9_CASHFLOW_QUARTERLY',
      'T10_EXECUTIVE_MARGIN'
    )
  );

-- 8. Extend UboqTemplateDefinition Lineage & Authorization Guard to T0-T10 with SQL-Level Sensitive Field Enforcement
CREATE OR REPLACE FUNCTION public.uboq_guard_template_definition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_latest record;
  v_dup_src record;
BEGIN
  IF current_setting('app.synthetic_cleanup_authorized', true) = 'on'
     AND pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER') THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_IMMUTABLE_REVISION: UboqTemplateDefinition rows are immutable; create a new version revision instead'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_DELETE_DENIED: Saved layout revisions cannot be deleted; version history is append-only'
      USING ERRCODE = '42501';
  END IF;

  -- TG_OP = 'INSERT'
  IF NEW."isSystemPreset" IS TRUE THEN
    IF pg_has_role(session_user, 'oserp_compat_app', 'MEMBER')
       OR pg_has_role(current_user, 'oserp_compat_app', 'MEMBER') THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_SYSTEM_PRESET_DENIED: Application sessions cannot insert system presets'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW."projectId" IS NULL
     OR NEW."createdById" IS NULL
     OR NEW."layoutGroupId" IS NULL
     OR BTRIM(NEW."layoutGroupId") = ''
     OR NEW."definitionHash" IS NULL
     OR NEW."definitionHash" !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_METADATA_REQUIRED: projectId, createdById, layoutGroupId, and 64-hex definitionHash are required'
      USING ERRCODE = '22023';
  END IF;

  IF NEW."templateCode" NOT IN (
    'T0_MASTER_CONTRACT',
    'T1_PHASE_BOQ',
    'T2_CONSOLIDATED_BOQ',
    'T3_AGENCY_ESTIMATE',
    'T4_RESOURCE_TAKEOFF',
    'T5_ACCOMPLISHMENT_CERT',
    'T6_PROGRESS_BILLING',
    'T7_SCHEDULE_EVM',
    'T8_CASHFLOW_HALF_MONTH',
    'T9_CASHFLOW_QUARTERLY',
    'T10_EXECUTIVE_MARGIN'
  ) THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_CODE_NOT_ENABLED: Saved layouts are enabled only for T0-T10 in Batch C (got %)', NEW."templateCode"
      USING ERRCODE = '22023';
  END IF;

  IF (NEW."templateCode" = 'T0_MASTER_CONTRACT' AND NEW."rowGrain" <> 'CONTRACT_HEADER')
     OR (NEW."templateCode" = 'T1_PHASE_BOQ' AND NEW."rowGrain" <> 'PHASE_BOQ_LINE')
     OR (NEW."templateCode" = 'T2_CONSOLIDATED_BOQ' AND NEW."rowGrain" <> 'CONSOLIDATED_WORK_ITEM')
     OR (NEW."templateCode" = 'T3_AGENCY_ESTIMATE' AND NEW."rowGrain" <> 'PHASE_BOQ_LINE')
     OR (NEW."templateCode" = 'T4_RESOURCE_TAKEOFF' AND NEW."rowGrain" <> 'CANONICAL_RESOURCE')
     OR (NEW."templateCode" = 'T5_ACCOMPLISHMENT_CERT' AND NEW."rowGrain" <> 'PHASE_BOQ_LINE')
     OR (NEW."templateCode" = 'T6_PROGRESS_BILLING' AND NEW."rowGrain" <> 'PHASE_BOQ_LINE')
     OR (NEW."templateCode" = 'T7_SCHEDULE_EVM' AND NEW."rowGrain" <> 'SCHEDULE_ACTIVITY')
     OR (NEW."templateCode" = 'T8_CASHFLOW_HALF_MONTH' AND NEW."rowGrain" <> 'CASH_FLOW_PERIOD')
     OR (NEW."templateCode" = 'T9_CASHFLOW_QUARTERLY' AND NEW."rowGrain" <> 'CASH_FLOW_QUARTER')
     OR (NEW."templateCode" = 'T10_EXECUTIVE_MARGIN' AND NEW."rowGrain" <> 'PHASE_BOQ_LINE') THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_GRAIN_MISMATCH: Invalid rowGrain % for template %', NEW."rowGrain", NEW."templateCode"
      USING ERRCODE = '22023';
  END IF;

  IF NEW."formulaAstJson" IS NOT NULL OR NEW."groupingRulesJson" IS NOT NULL THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_UNSUPPORTED_CUSTOM_AST: Custom formula AST and grouping overrides are not enabled in Batch C'
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(NEW."selectedFieldsJson") <> 'array'
     OR jsonb_array_length(NEW."selectedFieldsJson") < 1 THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_FIELDS_REQUIRED: selectedFieldsJson must be a non-empty JSON array'
      USING ERRCODE = '22023';
  END IF;

  IF NEW."headingAliasesJson" IS NOT NULL AND jsonb_typeof(NEW."headingAliasesJson") <> 'object' THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_HEADINGS_INVALID: headingAliasesJson must be a JSON object when provided'
      USING ERRCODE = '22023';
  END IF;

  IF public.uboq_can_write_template_layout(NEW."projectId", NEW."createdById", NEW."sharingScope") IS NOT TRUE THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_WRITE_DENIED: Actor % is not authorized to save % layout on project %',
      NEW."createdById", NEW."sharingScope", NEW."projectId"
      USING ERRCODE = '42501';
  END IF;

  -- Enforce executive-finance entitlement at the database boundary whenever any sensitive column is persisted
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(NEW."selectedFieldsJson") AS fld(field_id)
    WHERE fld.field_id IN (
      'target_direct_cost_amt',
      'target_total_cost',
      'target_profit',
      'target_margin',
      'commitment_open_amt',
      'etc_uncommitted',
      'forecast_eac',
      'forecast_profit',
      'procurement_cash_out_amt',
      'payroll_subcon_cash_out_amt',
      'other_cash_out_amt',
      'actual_cash_paid_amt',
      'quarterly_closing_cash',
      'quarterly_liquidity_gap'
    )
  ) THEN
    IF public.uboq_actor_has_executive_sensitive_access(NEW."projectId", NEW."createdById") IS NOT TRUE THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_SENSITIVE_FIELD_DENIED: Actor % lacks executive/finance authority to persist sensitive columns on project %',
        NEW."createdById", NEW."projectId"
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Serialize concurrent writes within the same (projectId, layoutGroupId)
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW."projectId" || ':' || NEW."layoutGroupId", 0));

  IF NEW."versionNumber" = 1 THEN
    IF EXISTS (
      SELECT 1
      FROM public."UboqTemplateDefinition"
      WHERE "projectId" = NEW."projectId"
        AND "layoutGroupId" = NEW."layoutGroupId"
    ) THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_GROUP_ALREADY_EXISTS: layoutGroupId % already exists on project %',
        NEW."layoutGroupId", NEW."projectId"
        USING ERRCODE = '23505';
    END IF;

    IF NEW."duplicatedFromId" IS NOT NULL THEN
      SELECT id, "projectId", "templateCode", "sharingScope", "createdById"
      INTO v_dup_src
      FROM public."UboqTemplateDefinition"
      WHERE "projectId" = NEW."projectId"
        AND id = NEW."duplicatedFromId";

      IF v_dup_src.id IS NULL THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_DUPLICATE_SOURCE_NOT_FOUND: Source layout % does not exist on project %',
          NEW."duplicatedFromId", NEW."projectId"
          USING ERRCODE = 'P0002';
      END IF;

      IF v_dup_src."templateCode" IS DISTINCT FROM NEW."templateCode" THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_DUPLICATE_CODE_MISMATCH: Cannot duplicate % layout as %',
          v_dup_src."templateCode", NEW."templateCode"
          USING ERRCODE = '22023';
      END IF;

      IF v_dup_src."sharingScope" <> 'PROJECT_SHARED'
         AND v_dup_src."createdById" IS DISTINCT FROM NEW."createdById" THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_DUPLICATE_PRIVATE_DENIED: Cannot duplicate another user''s private layout'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  ELSE
    SELECT id, "versionNumber", "templateCode", "sharingScope", "createdById"
    INTO v_latest
    FROM public."UboqTemplateDefinition"
    WHERE "projectId" = NEW."projectId"
      AND "layoutGroupId" = NEW."layoutGroupId"
    ORDER BY "versionNumber" DESC
    LIMIT 1;

    IF v_latest.id IS NULL THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_BASE_GROUP_NOT_FOUND: layoutGroupId % has no prior revision on project %',
        NEW."layoutGroupId", NEW."projectId"
        USING ERRCODE = 'P0002';
    END IF;

    IF v_latest.id IS DISTINCT FROM NEW."supersedesId"
       OR NEW."versionNumber" <> (v_latest."versionNumber" + 1) THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_VERSION_CONFLICT: New revision must supersede latest head % (v%) as v%',
        v_latest.id, v_latest."versionNumber", v_latest."versionNumber" + 1
        USING ERRCODE = '23505';
    END IF;

    IF v_latest."templateCode" IS DISTINCT FROM NEW."templateCode" THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_CODE_IMMUTABLE_ACROSS_VERSIONS: Cannot change templateCode from % to %',
        v_latest."templateCode", NEW."templateCode"
        USING ERRCODE = '22023';
    END IF;

    IF v_latest."createdById" IS DISTINCT FROM NEW."createdById" THEN
      IF v_latest."sharingScope" <> 'PROJECT_SHARED' THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_PRIVATE_OWNERSHIP_DENIED: Cannot create a revision on another user''s private layout'
          USING ERRCODE = '42501';
      END IF;
      IF public.uboq_can_share_template_layout(NEW."projectId", NEW."createdById") IS NOT TRUE THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_SHARED_REVISION_DENIED: Actor % lacks controlled sharing authority to version shared layout %',
          NEW."createdById", NEW."layoutGroupId"
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
ALTER FUNCTION public.uboq_guard_template_definition()
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_guard_template_definition()
  FROM PUBLIC, oserp_maint_cleanup_role;
