-- ============================================================================
-- OSERP-PROJ-UBOQ-001 — WP-3 BATCH D PHASE D2 (MIGRATION #34, FORWARD-ONLY)
-- Scope:
--   1. Enforces Row-Level Security (ENABLE + FORCE RLS, cryptographically bound
--      project scope via public.uboq_check_tenant_rls(...), cross-project BOQ
--      and subcontract FK rejection, and legacy-role governed-project block) on
--      Variation Order tables activated for T11_VARIATION_ORDER_REGISTER:
--        - ClientVariationOrder (newly RLS-enabled + bounded compat grants)
--        - AIVariationOrderValidation (newly RLS-enabled + bounded compat grants)
--        - SubcontractorVariationOrder (hardened cross-project BOQ FK check)
--        - VariationOrderItem (hardened cross-project AwardedBOQItem FK check)
--   2. Extends UboqTemplateAuditEvent templateCode CHECK constraint and
--      public.uboq_guard_template_definition() to Owner-ratified Phase D2 slots:
--        - T11_VARIATION_ORDER_REGISTER (rowGrain = VARIATION_ORDER_ITEM)
--        - T12_CASHFLOW_VARIANCE_TREASURY (rowGrain = CASH_FLOW_PERIOD)
--      while keeping unratified aliases (T11_VARIATION_IMPACT,
--      T12_CHANGE_REGISTER) rejected fail-closed.
--   3. Enforces SQL-level executive-sensitive field authorization in
--      public.uboq_guard_template_definition() for newly authorized sensitive
--      columns (vo_subcon_commitment_delta_amt, total_forecast_cash_out_amt,
--      disbursement_variance_amt).
--   4. Extends public.uboq_guard_template_audit_event() to authorize internal
--      formal contract ERP_CANONICAL_T11_FORMAL_V1 on T11_VARIATION_ORDER_REGISTER
--      (requiring APPROVED UboqOperationalSnapshot + APPROVED UboqContractAuthority
--      lineage, and executive authority if vo_subcon_commitment_delta_amt is
--      included), while keeping T12_CASHFLOW_VARIANCE_TREASURY strictly blocked
--      from FORMAL_EXPORT_GENERATED.
--   5. Extends attested public.uboq_append_sensitive_export_log(...) to record
--      approved and blocked executive-sensitive exports on T11 and T12.
--   6. Preserves Migrations #1-#33 byte-for-byte unchanged.
-- ============================================================================

-- 1. Deterministic SECURITY DEFINER Project Resolvers for Phase D2 Variation Order Tables
CREATE OR REPLACE FUNCTION public.uboq_resolve_client_vo_project(
  p_project_id text,
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
ALTER FUNCTION public.uboq_resolve_client_vo_project(text, text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_resolve_client_vo_project(text, text)
  FROM PUBLIC, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_resolve_client_vo_project(text, text)
  TO oserp_compat_app, oserp_legacy_app, oserp_migrations_owner;

CREATE OR REPLACE FUNCTION public.uboq_resolve_ai_vo_validation_project(
  p_variation_order_id text
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT vo."projectId"
  FROM public."VariationOrder" vo
  WHERE vo.id = p_variation_order_id;
$$;
ALTER FUNCTION public.uboq_resolve_ai_vo_validation_project(text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_resolve_ai_vo_validation_project(text)
  FROM PUBLIC, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_resolve_ai_vo_validation_project(text)
  TO oserp_compat_app, oserp_legacy_app, oserp_migrations_owner;

CREATE OR REPLACE FUNCTION public.uboq_resolve_subcontractor_vo_full_project(
  p_project_id text,
  p_original_subcontract_id text,
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
           p_original_subcontract_id IS NULL
           OR EXISTS (
             SELECT 1
             FROM public."SubcontractPackage" sp
             WHERE sp.id = p_original_subcontract_id
               AND sp."projectId" = p_project_id
           )
         )
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
ALTER FUNCTION public.uboq_resolve_subcontractor_vo_full_project(text, text, text, text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_resolve_subcontractor_vo_full_project(text, text, text, text)
  FROM PUBLIC, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_resolve_subcontractor_vo_full_project(text, text, text, text)
  TO oserp_compat_app, oserp_legacy_app, oserp_migrations_owner;

CREATE OR REPLACE FUNCTION public.uboq_resolve_variation_order_item_full_project(
  p_variation_order_id text,
  p_original_boq_item_id text
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT CASE
    WHEN vo.id IS NOT NULL
         AND (
           p_original_boq_item_id IS NULL
           OR EXISTS (
             SELECT 1
             FROM public."AwardedBOQItem" ab
             WHERE ab.id = p_original_boq_item_id
               AND ab."projectId" = vo."projectId"
           )
         )
    THEN vo."projectId"
    ELSE NULL
  END
  FROM public."VariationOrder" vo
  WHERE vo.id = p_variation_order_id;
$$;
ALTER FUNCTION public.uboq_resolve_variation_order_item_full_project(text, text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_resolve_variation_order_item_full_project(text, text)
  FROM PUBLIC, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_resolve_variation_order_item_full_project(text, text)
  TO oserp_compat_app, oserp_legacy_app, oserp_migrations_owner;

-- 2. Bounded Operational Privileges & ENABLE + FORCE RLS on ClientVariationOrder and AIVariationOrderValidation
REVOKE ALL ON public."ClientVariationOrder", public."AIVariationOrderValidation"
  FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
REVOKE DELETE, TRUNCATE ON public."ClientVariationOrder", public."AIVariationOrderValidation"
  FROM oserp_compat_app;
GRANT SELECT, INSERT, UPDATE ON
  public."ClientVariationOrder",
  public."AIVariationOrderValidation"
TO oserp_compat_app, oserp_migrations_owner;
GRANT SELECT, DELETE ON
  public."ClientVariationOrder",
  public."AIVariationOrderValidation"
TO oserp_maint_cleanup_role;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT *
    FROM (VALUES
      ('ClientVariationOrder', 'public.uboq_resolve_client_vo_project("projectId", "awardedBoqItemId")'),
      ('AIVariationOrderValidation', 'public.uboq_resolve_ai_vo_validation_project("variationOrderId")')
    ) AS d2_vo_tables(tbl, proj_expr)
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tbl);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', r.tbl);

    EXECUTE format('DROP POLICY IF EXISTS rls_permissive_app_access ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY rls_permissive_app_access ON public.%I AS PERMISSIVE FOR ALL TO PUBLIC USING (true) WITH CHECK (true)',
      r.tbl
    );

    EXECUTE format('DROP POLICY IF EXISTS rls_permissive_maint_cleanup ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY rls_permissive_maint_cleanup ON public.%I AS PERMISSIVE FOR DELETE TO oserp_maint_cleanup_role USING (current_setting(''app.synthetic_cleanup_authorized'', true) = ''on'')',
      r.tbl
    );

    EXECUTE format('DROP POLICY IF EXISTS rls_restrictive_tenant_scope ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY rls_restrictive_tenant_scope ON public.%I AS RESTRICTIVE FOR ALL TO oserp_compat_app USING (public.uboq_check_tenant_rls(%s)) WITH CHECK (public.uboq_check_tenant_rls(%s))',
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

-- Harden cross-project BOQ FK checks on SubcontractorVariationOrder and VariationOrderItem
DROP POLICY IF EXISTS rls_restrictive_subcon_vo_boq_project ON public."SubcontractorVariationOrder";
CREATE POLICY rls_restrictive_subcon_vo_boq_project
  ON public."SubcontractorVariationOrder"
  AS RESTRICTIVE
  FOR ALL
  TO oserp_compat_app
  USING (
    public.uboq_check_tenant_rls(
      public.uboq_resolve_subcontractor_vo_full_project(
        "projectId",
        "originalSubcontractId",
        "consolidatedBoqItemId",
        "awardedBoqItemId"
      )
    )
  )
  WITH CHECK (
    public.uboq_check_tenant_rls(
      public.uboq_resolve_subcontractor_vo_full_project(
        "projectId",
        "originalSubcontractId",
        "consolidatedBoqItemId",
        "awardedBoqItemId"
      )
    )
  );

DROP POLICY IF EXISTS rls_restrictive_vo_item_boq_project ON public."VariationOrderItem";
CREATE POLICY rls_restrictive_vo_item_boq_project
  ON public."VariationOrderItem"
  AS RESTRICTIVE
  FOR ALL
  TO oserp_compat_app
  USING (
    public.uboq_check_tenant_rls(
      public.uboq_resolve_variation_order_item_full_project(
        "variationOrderId",
        "originalBoqItemId"
      )
    )
  )
  WITH CHECK (
    public.uboq_check_tenant_rls(
      public.uboq_resolve_variation_order_item_full_project(
        "variationOrderId",
        "originalBoqItemId"
      )
    )
  );

-- 3. Extend UboqTemplateAuditEvent templateCode CHECK Constraint to Owner-Ratified T0-T12
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
      'T10_EXECUTIVE_MARGIN',
      'T11_VARIATION_ORDER_REGISTER',
      'T12_CASHFLOW_VARIANCE_TREASURY'
    )
  );

-- 4. Extend UboqTemplateDefinition Lineage & Authorization Guard to T0-T12 + Phase D2 Sensitive Columns
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
    'T10_EXECUTIVE_MARGIN',
    'T11_VARIATION_ORDER_REGISTER',
    'T12_CASHFLOW_VARIANCE_TREASURY'
  ) THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_CODE_NOT_ENABLED: Saved layouts are enabled only for Owner-ratified T0-T12 templates (got %)', NEW."templateCode"
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
     OR (NEW."templateCode" = 'T10_EXECUTIVE_MARGIN' AND NEW."rowGrain" <> 'PHASE_BOQ_LINE')
     OR (NEW."templateCode" = 'T11_VARIATION_ORDER_REGISTER' AND NEW."rowGrain" <> 'VARIATION_ORDER_ITEM')
     OR (NEW."templateCode" = 'T12_CASHFLOW_VARIANCE_TREASURY' AND NEW."rowGrain" <> 'CASH_FLOW_PERIOD') THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_GRAIN_MISMATCH: Invalid rowGrain % for template %', NEW."rowGrain", NEW."templateCode"
      USING ERRCODE = '22023';
  END IF;

  IF NEW."formulaAstJson" IS NOT NULL OR NEW."groupingRulesJson" IS NOT NULL THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_UNSUPPORTED_CUSTOM_AST: Arbitrary user formula AST and grouping overrides are prohibited; only whitelisted template derived columns are permitted'
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
      'quarterly_liquidity_gap',
      'vo_subcon_commitment_delta_amt',
      'total_forecast_cash_out_amt',
      'disbursement_variance_amt'
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

-- 5. Extend Formal Export Provenance Guard for ERP_CANONICAL_T11_FORMAL_V1 (T12 Remains Non-Formal)
CREATE OR REPLACE FUNCTION public.uboq_guard_template_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_user record;
  v_db_role text;
  v_tpl record;
  v_ca record;
  v_snap record;
  v_acc record;
  v_bil record;
  v_ver_str text;
  v_ver_num integer;
BEGIN
  IF current_setting('app.synthetic_cleanup_authorized', true) = 'on'
     AND pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER') THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_IMMUTABLE: Template audit provenance records are append-only'
      USING ERRCODE = '42501';
  END IF;

  IF current_setting('app.uboq_audit_fn_active', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_DIRECT_INSERT_DENIED: Direct table INSERT on UboqTemplateAuditEvent is prohibited; use uboq_append_template_audit_event'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public."Project" WHERE id = NEW."projectId") THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_PROJECT_NOT_FOUND: Project % does not exist', NEW."projectId"
      USING ERRCODE = 'P0002';
  END IF;

  IF NEW."actorUserId" IS DISTINCT FROM NULLIF(current_setting('app.current_user_id', true), '')
     OR public.uboq_check_tenant_rls(NEW."projectId") IS NOT TRUE THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_ACTOR_MISMATCH: Bound actor context required for template audit provenance'
      USING ERRCODE = '42501';
  END IF;

  SELECT id, role, status, "lockedUntil"
  INTO v_user
  FROM public."User"
  WHERE id = NEW."actorUserId";

  IF v_user.id IS NULL
     OR UPPER(COALESCE(v_user.status, '')) <> 'ACTIVE'
     OR (v_user."lockedUntil" IS NOT NULL AND v_user."lockedUntil" > clock_timestamp()) THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_INACTIVE_ACTOR: Actor % is inactive or locked', NEW."actorUserId"
      USING ERRCODE = '42501';
  END IF;

  v_db_role := UPPER(BTRIM(COALESCE(v_user.role, '')));
  IF v_db_role = '' OR UPPER(BTRIM(COALESCE(NEW."actorRole", ''))) IS DISTINCT FROM v_db_role THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_ACTOR_ROLE_FORGED: Supplied actorRole (%) does not match authenticated User.role (%)',
      COALESCE(NEW."actorRole", 'NULL'), v_db_role
      USING ERRCODE = '42501';
  END IF;
  NEW."actorRole" := v_db_role;

  IF NEW."eventType" IN ('LAYOUT_CREATED', 'LAYOUT_VERSIONED', 'LAYOUT_DUPLICATED') THEN
    IF NEW."layoutDefinitionId" IS NULL
       OR NEW."sourceId" IS NOT NULL
       OR NEW."sourceVersion" IS NOT NULL
       OR NEW."contractCode" IS NOT NULL
       OR NEW."exportFormat" IS NOT NULL
       OR NEW."outputSha256" IS NOT NULL THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_LAYOUT_EVENT_FIELDS_INVALID: Layout lifecycle audit event cannot carry formal-export fields'
        USING ERRCODE = '22023';
    END IF;

    SELECT id, "projectId", "layoutGroupId", "versionNumber", "templateCode", "createdById", "sharingScope", "supersedesId", "duplicatedFromId"
    INTO v_tpl
    FROM public."UboqTemplateDefinition"
    WHERE "projectId" = NEW."projectId"
      AND id = NEW."layoutDefinitionId"
      AND "isSystemPreset" = false;

    IF v_tpl.id IS NULL THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_LAYOUT_NOT_FOUND: Layout revision % does not exist on project %',
        NEW."layoutDefinitionId", NEW."projectId"
        USING ERRCODE = 'P0002';
    END IF;

    IF v_tpl."createdById" IS DISTINCT FROM NEW."actorUserId" THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_LAYOUT_AUTHOR_MISMATCH: Actor % is not creator of layout revision %',
        NEW."actorUserId", NEW."layoutDefinitionId"
        USING ERRCODE = '42501';
    END IF;

    IF public.uboq_can_write_template_layout(NEW."projectId", NEW."actorUserId", v_tpl."sharingScope") IS NOT TRUE THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_LAYOUT_WRITE_DENIED: Actor % lacks write authority for % layout on project %',
        NEW."actorUserId", v_tpl."sharingScope", NEW."projectId"
        USING ERRCODE = '42501';
    END IF;

    IF v_tpl."layoutGroupId" IS DISTINCT FROM NEW."layoutGroupId"
       OR v_tpl."versionNumber" IS DISTINCT FROM NEW."layoutVersionNumber"
       OR v_tpl."templateCode" IS DISTINCT FROM NEW."templateCode" THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_LINEAGE_MISMATCH: Audit metadata does not match persisted layout revision %',
        NEW."layoutDefinitionId"
        USING ERRCODE = '22023';
    END IF;

    IF (NEW."eventType" = 'LAYOUT_CREATED' AND (v_tpl."versionNumber" <> 1 OR v_tpl."supersedesId" IS NOT NULL OR v_tpl."duplicatedFromId" IS NOT NULL))
       OR (NEW."eventType" = 'LAYOUT_DUPLICATED' AND (v_tpl."versionNumber" <> 1 OR v_tpl."supersedesId" IS NOT NULL OR v_tpl."duplicatedFromId" IS NULL))
       OR (NEW."eventType" = 'LAYOUT_VERSIONED' AND (v_tpl."versionNumber" < 2 OR v_tpl."supersedesId" IS NULL OR v_tpl."duplicatedFromId" IS NOT NULL)) THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_EVENT_LINEAGE_MISMATCH: Event % inconsistent with revision lineage on %',
        NEW."eventType", NEW."layoutDefinitionId"
        USING ERRCODE = '22023';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public."UboqTemplateAuditEvent"
      WHERE "projectId" = NEW."projectId"
        AND "layoutDefinitionId" = v_tpl.id
        AND "eventType" = NEW."eventType"
    ) THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_DUPLICATE_LIFECYCLE_EVENT: Lifecycle audit % already recorded for %',
        NEW."eventType", v_tpl.id
        USING ERRCODE = '23505';
    END IF;

    NEW."layoutOwnerId" := v_tpl."createdById";
    NEW."sharingScope" := v_tpl."sharingScope";
    RETURN NEW;
  END IF;

  IF NEW."eventType" = 'FORMAL_EXPORT_GENERATED' THEN
    IF NEW."templateCode" NOT IN (
      'T0_MASTER_CONTRACT',
      'T1_PHASE_BOQ',
      'T4_RESOURCE_TAKEOFF',
      'T5_ACCOMPLISHMENT_CERT',
      'T6_PROGRESS_BILLING',
      'T11_VARIATION_ORDER_REGISTER'
    ) THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_NON_FORMAL_TEMPLATE: Template % is not a formal compliance output contract',
        COALESCE(NEW."templateCode", 'NULL')
        USING ERRCODE = '22023';
    END IF;

    IF public.uboq_can_formal_export_template(NEW."projectId", NEW."actorUserId") IS NOT TRUE THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_FORMAL_EXPORT_DENIED: Actor % lacks formal export entitlement on project %',
        NEW."actorUserId", NEW."projectId"
        USING ERRCODE = '42501';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public."UboqValidationException"
      WHERE "projectId" = NEW."projectId"
        AND status::text = 'OPEN'
        AND severity::text = 'BLOCKING'
    ) THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_BLOCKING_EXCEPTIONS: Formal export audit blocked while OPEN BLOCKING exceptions exist on project %',
        NEW."projectId"
        USING ERRCODE = 'P0001';
    END IF;

    IF (NEW."templateCode" = 'T0_MASTER_CONTRACT' AND NEW."contractCode" IS DISTINCT FROM 'ERP_CANONICAL_T0_FORMAL_V1')
       OR (NEW."templateCode" = 'T1_PHASE_BOQ' AND NEW."contractCode" IS DISTINCT FROM 'ERP_CANONICAL_T1_FORMAL_V1')
       OR (NEW."templateCode" = 'T4_RESOURCE_TAKEOFF' AND NEW."contractCode" IS DISTINCT FROM 'ERP_CANONICAL_T4_FORMAL_V1')
       OR (NEW."templateCode" = 'T5_ACCOMPLISHMENT_CERT' AND NEW."contractCode" IS DISTINCT FROM 'ERP_CANONICAL_T5_FORMAL_V1')
       OR (NEW."templateCode" = 'T6_PROGRESS_BILLING' AND NEW."contractCode" IS DISTINCT FROM 'ERP_CANONICAL_T6_FORMAL_V1')
       OR (NEW."templateCode" = 'T11_VARIATION_ORDER_REGISTER' AND NEW."contractCode" IS DISTINCT FROM 'ERP_CANONICAL_T11_FORMAL_V1') THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_CONTRACT_CODE_MISMATCH: Invalid contractCode % for %',
        COALESCE(NEW."contractCode", 'NULL'), NEW."templateCode"
        USING ERRCODE = '22023';
    END IF;

    IF NEW."templateCode" = 'T0_MASTER_CONTRACT' THEN
      SELECT id, "projectId", status, "approvedAt", "approvedById"
      INTO v_ca
      FROM public."UboqContractAuthority"
      WHERE id = NEW."sourceId"
        AND "projectId" = NEW."projectId";

      IF v_ca.id IS NULL
         OR v_ca.status::text <> 'APPROVED'
         OR v_ca."approvedAt" IS NULL
         OR v_ca."approvedById" IS NULL THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_UNAPPROVED_SOURCE: T0 formal export requires APPROVED UboqContractAuthority on project % (got %)',
          NEW."projectId", COALESCE(NEW."sourceId", 'NULL')
          USING ERRCODE = 'P0001';
      END IF;

      IF NEW."sourceVersion" IS DISTINCT FROM v_ca.id THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_SOURCE_VERSION_MISMATCH: T0 sourceVersion (%) must equal approved contract id (%)',
          COALESCE(NEW."sourceVersion", 'NULL'), v_ca.id
          USING ERRCODE = '22023';
      END IF;
    ELSIF NEW."templateCode" = 'T1_PHASE_BOQ' THEN
      SELECT id, "projectId", status, "versionNumber", "approvedAt", "approvedById", "contractAuthorityId"
      INTO v_snap
      FROM public."UboqOperationalSnapshot"
      WHERE id = NEW."sourceId"
        AND "projectId" = NEW."projectId";

      IF v_snap.id IS NULL
         OR v_snap.status::text <> 'APPROVED'
         OR v_snap."approvedAt" IS NULL
         OR v_snap."approvedById" IS NULL THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_UNAPPROVED_SOURCE: T1 formal export requires APPROVED UboqOperationalSnapshot on project % (got %)',
          NEW."projectId", COALESCE(NEW."sourceId", 'NULL')
          USING ERRCODE = 'P0001';
      END IF;

      IF NEW."sourceVersion" IS DISTINCT FROM v_snap."versionNumber"::text THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_SOURCE_VERSION_MISMATCH: T1 sourceVersion (%) must match snapshot versionNumber (%)',
          COALESCE(NEW."sourceVersion", 'NULL'), v_snap."versionNumber"::text
          USING ERRCODE = '22023';
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM public."UboqAwardedPhaseLine"
        WHERE "projectId" = NEW."projectId"
          AND "snapshotId" = v_snap.id
      ) THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_EMPTY_SNAPSHOT: Snapshot % has zero phase lines',
          v_snap.id
          USING ERRCODE = 'P0001';
      END IF;

      IF v_snap."contractAuthorityId" IS NOT NULL THEN
        SELECT id, status, "approvedAt", "approvedById"
        INTO v_ca
        FROM public."UboqContractAuthority"
        WHERE id = v_snap."contractAuthorityId"
          AND "projectId" = NEW."projectId";

        IF v_ca.id IS NULL
           OR v_ca.status::text <> 'APPROVED'
           OR v_ca."approvedAt" IS NULL
           OR v_ca."approvedById" IS NULL THEN
          RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_UNAPPROVED_LINKED_CONTRACT: Linked contract authority % on snapshot % is not APPROVED',
            v_snap."contractAuthorityId", v_snap.id
            USING ERRCODE = 'P0001';
        END IF;
      END IF;
    ELSIF NEW."templateCode" = 'T4_RESOURCE_TAKEOFF' THEN
      SELECT id, "projectId", status, "versionNumber", "approvedAt", "approvedById", "contractAuthorityId"
      INTO v_snap
      FROM public."UboqOperationalSnapshot"
      WHERE id = NEW."sourceId"
        AND "projectId" = NEW."projectId";

      IF v_snap.id IS NULL
         OR v_snap.status::text <> 'APPROVED'
         OR v_snap."approvedAt" IS NULL
         OR v_snap."approvedById" IS NULL THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_UNAPPROVED_SOURCE: T4 formal export requires APPROVED UboqOperationalSnapshot on project % (got %)',
          NEW."projectId", COALESCE(NEW."sourceId", 'NULL')
          USING ERRCODE = 'P0001';
      END IF;

      IF NEW."sourceVersion" IS DISTINCT FROM v_snap."versionNumber"::text THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_SOURCE_VERSION_MISMATCH: T4 sourceVersion (%) must match snapshot versionNumber (%)',
          COALESCE(NEW."sourceVersion", 'NULL'), v_snap."versionNumber"::text
          USING ERRCODE = '22023';
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM public."UboqProcurementResourceRequirement"
        WHERE "projectId" = NEW."projectId"
          AND "snapshotId" = v_snap.id
          AND status::text IN ('APPROVED', 'SUPERSEDED')
          AND "approvedAt" IS NOT NULL
          AND "approvedById" IS NOT NULL
      ) THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_EMPTY_RESOURCE_TAKEOFF: Snapshot % has zero approved procurement resource requirements',
          v_snap.id
          USING ERRCODE = 'P0001';
      END IF;

      IF v_snap."contractAuthorityId" IS NOT NULL THEN
        SELECT id, status, "approvedAt", "approvedById"
        INTO v_ca
        FROM public."UboqContractAuthority"
        WHERE id = v_snap."contractAuthorityId"
          AND "projectId" = NEW."projectId";

        IF v_ca.id IS NULL
           OR v_ca.status::text <> 'APPROVED'
           OR v_ca."approvedAt" IS NULL
           OR v_ca."approvedById" IS NULL THEN
          RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_UNAPPROVED_LINKED_CONTRACT: Linked contract authority % on snapshot % is not APPROVED',
            v_snap."contractAuthorityId", v_snap.id
            USING ERRCODE = 'P0001';
        END IF;
      END IF;
    ELSIF NEW."templateCode" = 'T5_ACCOMPLISHMENT_CERT' THEN
      SELECT id, "projectId", status, "accomplishmentDate"
      INTO v_acc
      FROM public."Accomplishment"
      WHERE id = NEW."sourceId"
        AND "projectId" = NEW."projectId";

      IF v_acc.id IS NULL
         OR UPPER(BTRIM(COALESCE(v_acc.status, ''))) <> 'APPROVED' THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_UNAPPROVED_SOURCE: T5 formal export requires APPROVED Accomplishment on project % (got %)',
          NEW."projectId", COALESCE(NEW."sourceId", 'NULL')
          USING ERRCODE = 'P0001';
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM public."UboqOperationalSnapshot" s
        WHERE s."projectId" = NEW."projectId"
          AND s.status::text IN ('APPROVED', 'SUPERSEDED')
          AND s."approvedAt" IS NOT NULL
          AND s."approvedById" IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM public."UboqAwardedPhaseLine" pl
            WHERE pl."projectId" = NEW."projectId"
              AND pl."snapshotId" = s.id
          )
      ) THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_MISSING_SNAPSHOT: T5 formal export requires an APPROVED UboqOperationalSnapshot with phase lines on project %',
          NEW."projectId"
          USING ERRCODE = 'P0001';
      END IF;

      IF NEW."sourceVersion" IS NULL
         OR POSITION((v_acc.id || '@v') IN NEW."sourceVersion") <> 1 THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_SOURCE_VERSION_MISMATCH: T5 sourceVersion (%) must have format %@v<N>',
          COALESCE(NEW."sourceVersion", 'NULL'), v_acc.id
          USING ERRCODE = '22023';
      END IF;

      v_ver_str := SUBSTRING(NEW."sourceVersion" FROM CHAR_LENGTH(v_acc.id) + 3);
      IF v_ver_str IS NULL OR v_ver_str !~ '^[0-9]+$' THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_SOURCE_VERSION_MISMATCH: T5 sourceVersion (%) has invalid snapshot version suffix',
          COALESCE(NEW."sourceVersion", 'NULL')
          USING ERRCODE = '22023';
      END IF;
      v_ver_num := v_ver_str::integer;

      SELECT id, "versionNumber", status, "approvedAt", "approvedById", "contractAuthorityId", "supersedesSnapshotId"
      INTO v_snap
      FROM public."UboqOperationalSnapshot"
      WHERE "projectId" = NEW."projectId"
        AND "versionNumber" = v_ver_num
        AND status::text IN ('APPROVED', 'SUPERSEDED')
        AND "approvedAt" IS NOT NULL
        AND "approvedById" IS NOT NULL;

      IF v_snap.id IS NULL
         OR NOT EXISTS (
           SELECT 1
           FROM public."UboqAwardedPhaseLine"
           WHERE "projectId" = NEW."projectId"
             AND "snapshotId" = v_snap.id
         ) THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_HISTORICAL_SNAPSHOT_UNVERIFIED: Snapshot version v% is not an approved phase-line baseline on project %',
          v_ver_num, NEW."projectId"
          USING ERRCODE = 'P0001';
      END IF;

      IF v_snap."approvedAt" > v_acc."accomplishmentDate" THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_HISTORICAL_SNAPSHOT_POSTDATED: Snapshot % (approvedAt %) post-dates accomplishment cutoff (%)',
          v_snap.id, v_snap."approvedAt", v_acc."accomplishmentDate"
          USING ERRCODE = 'P0001';
      END IF;

      IF EXISTS (
        SELECT 1
        FROM public."UboqOperationalSnapshot" s2
        WHERE s2."projectId" = NEW."projectId"
          AND s2."supersedesSnapshotId" = v_snap.id
          AND s2.status::text IN ('APPROVED', 'SUPERSEDED')
          AND s2."approvedAt" IS NOT NULL
          AND s2."approvedById" IS NOT NULL
          AND s2."approvedAt" <= v_acc."accomplishmentDate"
      ) THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_HISTORICAL_SNAPSHOT_SUPERSEDED: Snapshot % was already superseded on or before accomplishment cutoff (%)',
          v_snap.id, v_acc."accomplishmentDate"
          USING ERRCODE = 'P0001';
      END IF;

      IF EXISTS (
        SELECT 1
        FROM public."UboqOperationalSnapshot" sp
        WHERE sp."projectId" = NEW."projectId"
          AND sp.id <> v_snap.id
          AND sp.status::text IN ('APPROVED', 'SUPERSEDED')
          AND sp."approvedAt" IS NOT NULL
          AND sp."approvedById" IS NOT NULL
          AND sp."approvedAt" <= v_acc."accomplishmentDate"
          AND NOT EXISTS (
            SELECT 1
            FROM public."UboqOperationalSnapshot" ch
            WHERE ch."projectId" = NEW."projectId"
              AND ch."supersedesSnapshotId" = sp.id
              AND ch.status::text IN ('APPROVED', 'SUPERSEDED')
              AND ch."approvedAt" IS NOT NULL
              AND ch."approvedById" IS NOT NULL
              AND ch."approvedAt" <= v_acc."accomplishmentDate"
          )
      ) THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_HISTORICAL_SNAPSHOT_AMBIGUOUS: Multiple non-superseded snapshots exist on project % as of accomplishment cutoff (%)',
          NEW."projectId", v_acc."accomplishmentDate"
          USING ERRCODE = 'P0001';
      END IF;

      IF v_snap."contractAuthorityId" IS NULL THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_CONTRACT_RATE_ASSOCIATION_UNVERIFIED: T5 formal export requires snapshot % to have a verified contractAuthorityId',
          v_snap.id
          USING ERRCODE = 'P0001';
      END IF;

      SELECT id, status, "approvedAt", "approvedById"
      INTO v_ca
      FROM public."UboqContractAuthority"
      WHERE id = v_snap."contractAuthorityId"
        AND "projectId" = NEW."projectId";

      IF v_ca.id IS NULL
         OR v_ca.status::text <> 'APPROVED'
         OR v_ca."approvedAt" IS NULL
         OR v_ca."approvedById" IS NULL
         OR v_ca."approvedAt" > v_acc."accomplishmentDate" THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_CONTRACT_RATE_ASSOCIATION_UNVERIFIED: Linked contract authority % on snapshot % is not APPROVED on or before accomplishment cutoff',
          v_snap."contractAuthorityId", v_snap.id
          USING ERRCODE = 'P0001';
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM public."AccomplishmentItem" ai
        JOIN public."AwardedBOQItem" b ON b.id = ai."boqItemId"
        WHERE ai."accomplishmentId" = v_acc.id
          AND b."projectId" = NEW."projectId"
      ) THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_EMPTY_ACCOMPLISHMENT: Accomplishment % has zero project-scoped AccomplishmentItem rows',
          v_acc.id
          USING ERRCODE = 'P0001';
      END IF;

      IF EXISTS (
        SELECT 1
        FROM public."AccomplishmentItem" ai
        JOIN public."AwardedBOQItem" b ON b.id = ai."boqItemId"
        WHERE ai."accomplishmentId" = v_acc.id
          AND b."projectId" IS DISTINCT FROM NEW."projectId"
      ) THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_CROSS_PROJECT_BOQ_ITEM: Accomplishment % references foreign AwardedBOQItem',
          v_acc.id
          USING ERRCODE = '42501';
      END IF;

      IF EXISTS (
        SELECT 1
        FROM public."AccomplishmentItem" ai
        WHERE ai."accomplishmentId" = v_acc.id
          AND ROUND(COALESCE(ai."approvedQuantity", ai."currentQuantityClaimed", 0)::numeric, 4) > 0
          AND NOT EXISTS (
            SELECT 1
            FROM public."Inspection" ins
            WHERE ins."accomplishmentItemId" = ai.id
              AND UPPER(BTRIM(COALESCE(ins."approvalStatus", ''))) = 'APPROVED'
          )
      ) THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_MISSING_INSPECTION_EVIDENCE: T5 formal export requires APPROVED Inspection evidence for every positive AccomplishmentItem on %',
          v_acc.id
          USING ERRCODE = 'P0001';
      END IF;

      IF EXISTS (
        SELECT 1
        FROM public."AccomplishmentItem" ai
        JOIN public."Inspection" ins ON ins."accomplishmentItemId" = ai.id
        WHERE ai."accomplishmentId" = v_acc.id
          AND ROUND(COALESCE(ai."approvedQuantity", ai."currentQuantityClaimed", 0)::numeric, 4) > 0
          AND UPPER(BTRIM(COALESCE(ins."approvalStatus", ''))) = 'APPROVED'
          AND (
            ROUND(COALESCE(ins."approvedQuantity", 0)::numeric, 4) < 0
            OR (
              ROUND(COALESCE(ins."actualQuantityVerified", 0)::numeric, 4) > 0
              AND ROUND(COALESCE(ins."approvedQuantity", 0)::numeric, 4) > ROUND(COALESCE(ins."actualQuantityVerified", 0)::numeric, 4)
            )
          )
      ) THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_INSPECTION_QTY_INVALID: Inspection approvedQuantity cannot be negative or exceed actualQuantityVerified on Accomplishment %',
          v_acc.id
          USING ERRCODE = 'P0001';
      END IF;

      IF EXISTS (
        SELECT 1
        FROM public."AccomplishmentItem" ai
        WHERE ai."accomplishmentId" = v_acc.id
          AND ROUND(COALESCE(ai."approvedQuantity", ai."currentQuantityClaimed", 0)::numeric, 4) > 0
          AND (
            SELECT COUNT(*)
            FROM public."Inspection" ins
            WHERE ins."accomplishmentItemId" = ai.id
              AND UPPER(BTRIM(COALESCE(ins."approvalStatus", ''))) = 'APPROVED'
          ) > 1
          AND (
            EXISTS (
              SELECT 1
              FROM public."Inspection" ins2
              WHERE ins2."accomplishmentItemId" = ai.id
                AND UPPER(BTRIM(COALESCE(ins2."approvalStatus", ''))) = 'APPROVED'
                AND COALESCE(NULLIF(BTRIM(ins2.remarks), ''), NULLIF(BTRIM(ins2."inspectionFindings"), '')) IS NULL
            )
            OR (
              SELECT COUNT(*)
              FROM public."Inspection" ins3
              WHERE ins3."accomplishmentItemId" = ai.id
                AND UPPER(BTRIM(COALESCE(ins3."approvalStatus", ''))) = 'APPROVED'
            ) <> (
              SELECT COUNT(DISTINCT UPPER(COALESCE(NULLIF(BTRIM(ins4.remarks), ''), NULLIF(BTRIM(ins4."inspectionFindings"), ''))))
              FROM public."Inspection" ins4
              WHERE ins4."accomplishmentItemId" = ai.id
                AND UPPER(BTRIM(COALESCE(ins4."approvalStatus", ''))) = 'APPROVED'
            )
          )
      ) THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_DUPLICATE_INSPECTION_LINKAGE: Multiple APPROVED inspections on Accomplishment % require distinct non-blank lot/scope linkage',
          v_acc.id
          USING ERRCODE = 'P0001';
      END IF;

      IF EXISTS (
        SELECT 1
        FROM public."AccomplishmentItem" ai
        WHERE ai."accomplishmentId" = v_acc.id
          AND ROUND(COALESCE(ai."approvedQuantity", ai."currentQuantityClaimed", 0)::numeric, 4) > 0
          AND (
            SELECT COALESCE(SUM(ROUND(COALESCE(ins."approvedQuantity", 0)::numeric, 4)), 0)
            FROM public."Inspection" ins
            WHERE ins."accomplishmentItemId" = ai.id
              AND UPPER(BTRIM(COALESCE(ins."approvalStatus", ''))) = 'APPROVED'
          ) < ROUND(COALESCE(ai."approvedQuantity", ai."currentQuantityClaimed", 0)::numeric, 4)
      ) THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_INSPECTION_QTY_INSUFFICIENT: Approved inspection quantity is below certified claim on Accomplishment %',
          v_acc.id
          USING ERRCODE = 'P0001';
      END IF;
    ELSIF NEW."templateCode" = 'T6_PROGRESS_BILLING' THEN
      SELECT id, "projectId", status, "approvedById", "billingPeriodTo"
      INTO v_bil
      FROM public."Billing"
      WHERE id = NEW."sourceId"
        AND "projectId" = NEW."projectId";

      IF v_bil.id IS NULL
         OR UPPER(BTRIM(COALESCE(v_bil.status, ''))) NOT IN ('APPROVED', 'APPROVED_FOR_PAYMENT', 'PAID')
         OR NULLIF(BTRIM(COALESCE(v_bil."approvedById", '')), '') IS NULL THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_UNAPPROVED_SOURCE: T6 formal export requires APPROVED Billing certificate with approvedById on project % (got %)',
          NEW."projectId", COALESCE(NEW."sourceId", 'NULL')
          USING ERRCODE = 'P0001';
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM public."UboqOperationalSnapshot" s
        WHERE s."projectId" = NEW."projectId"
          AND s.status::text IN ('APPROVED', 'SUPERSEDED')
          AND s."approvedAt" IS NOT NULL
          AND s."approvedById" IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM public."UboqAwardedPhaseLine" pl
            WHERE pl."projectId" = NEW."projectId"
              AND pl."snapshotId" = s.id
          )
      ) THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_MISSING_SNAPSHOT: T6 formal export requires an APPROVED UboqOperationalSnapshot with phase lines on project %',
          NEW."projectId"
          USING ERRCODE = 'P0001';
      END IF;

      IF NEW."sourceVersion" IS NULL
         OR POSITION((v_bil.id || '@v') IN NEW."sourceVersion") <> 1 THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_SOURCE_VERSION_MISMATCH: T6 sourceVersion (%) must have format %@v<N>',
          COALESCE(NEW."sourceVersion", 'NULL'), v_bil.id
          USING ERRCODE = '22023';
      END IF;

      v_ver_str := SUBSTRING(NEW."sourceVersion" FROM CHAR_LENGTH(v_bil.id) + 3);
      IF v_ver_str IS NULL OR v_ver_str !~ '^[0-9]+$' THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_SOURCE_VERSION_MISMATCH: T6 sourceVersion (%) has invalid snapshot version suffix',
          COALESCE(NEW."sourceVersion", 'NULL')
          USING ERRCODE = '22023';
      END IF;
      v_ver_num := v_ver_str::integer;

      SELECT id, "versionNumber", status, "approvedAt", "approvedById", "contractAuthorityId", "supersedesSnapshotId"
      INTO v_snap
      FROM public."UboqOperationalSnapshot"
      WHERE "projectId" = NEW."projectId"
        AND "versionNumber" = v_ver_num
        AND status::text IN ('APPROVED', 'SUPERSEDED')
        AND "approvedAt" IS NOT NULL
        AND "approvedById" IS NOT NULL;

      IF v_snap.id IS NULL
         OR NOT EXISTS (
           SELECT 1
           FROM public."UboqAwardedPhaseLine"
           WHERE "projectId" = NEW."projectId"
             AND "snapshotId" = v_snap.id
         ) THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_HISTORICAL_SNAPSHOT_UNVERIFIED: Snapshot version v% is not an approved phase-line baseline on project %',
          v_ver_num, NEW."projectId"
          USING ERRCODE = 'P0001';
      END IF;

      IF v_snap."approvedAt" > v_bil."billingPeriodTo" THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_HISTORICAL_SNAPSHOT_POSTDATED: Snapshot % (approvedAt %) post-dates billing period cutoff (%)',
          v_snap.id, v_snap."approvedAt", v_bil."billingPeriodTo"
          USING ERRCODE = 'P0001';
      END IF;

      IF EXISTS (
        SELECT 1
        FROM public."UboqOperationalSnapshot" s2
        WHERE s2."projectId" = NEW."projectId"
          AND s2."supersedesSnapshotId" = v_snap.id
          AND s2.status::text IN ('APPROVED', 'SUPERSEDED')
          AND s2."approvedAt" IS NOT NULL
          AND s2."approvedById" IS NOT NULL
          AND s2."approvedAt" <= v_bil."billingPeriodTo"
      ) THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_HISTORICAL_SNAPSHOT_SUPERSEDED: Snapshot % was already superseded on or before billing period cutoff (%)',
          v_snap.id, v_bil."billingPeriodTo"
          USING ERRCODE = 'P0001';
      END IF;

      IF EXISTS (
        SELECT 1
        FROM public."UboqOperationalSnapshot" sp
        WHERE sp."projectId" = NEW."projectId"
          AND sp.id <> v_snap.id
          AND sp.status::text IN ('APPROVED', 'SUPERSEDED')
          AND sp."approvedAt" IS NOT NULL
          AND sp."approvedById" IS NOT NULL
          AND sp."approvedAt" <= v_bil."billingPeriodTo"
          AND NOT EXISTS (
            SELECT 1
            FROM public."UboqOperationalSnapshot" ch
            WHERE ch."projectId" = NEW."projectId"
              AND ch."supersedesSnapshotId" = sp.id
              AND ch.status::text IN ('APPROVED', 'SUPERSEDED')
              AND ch."approvedAt" IS NOT NULL
              AND ch."approvedById" IS NOT NULL
              AND ch."approvedAt" <= v_bil."billingPeriodTo"
          )
      ) THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_HISTORICAL_SNAPSHOT_AMBIGUOUS: Multiple non-superseded snapshots exist on project % as of billing period cutoff (%)',
          NEW."projectId", v_bil."billingPeriodTo"
          USING ERRCODE = 'P0001';
      END IF;

      IF v_snap."contractAuthorityId" IS NULL THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_CONTRACT_RATE_ASSOCIATION_UNVERIFIED: T6 formal export requires snapshot % to have a verified contractAuthorityId',
          v_snap.id
          USING ERRCODE = 'P0001';
      END IF;

      SELECT id, status, "approvedAt", "approvedById"
      INTO v_ca
      FROM public."UboqContractAuthority"
      WHERE id = v_snap."contractAuthorityId"
        AND "projectId" = NEW."projectId";

      IF v_ca.id IS NULL
         OR v_ca.status::text <> 'APPROVED'
         OR v_ca."approvedAt" IS NULL
         OR v_ca."approvedById" IS NULL
         OR v_ca."approvedAt" > v_bil."billingPeriodTo" THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_CONTRACT_RATE_ASSOCIATION_UNVERIFIED: Linked contract authority % on snapshot % is not APPROVED on or before billing period cutoff',
          v_snap."contractAuthorityId", v_snap.id
          USING ERRCODE = 'P0001';
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM public."BillingItem" bi
        JOIN public."AwardedBOQItem" b ON b.id = bi."boqItemId"
        WHERE bi."billingId" = v_bil.id
          AND b."projectId" = NEW."projectId"
      ) THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_EMPTY_BILLING: Billing % has zero project-scoped BillingItem rows',
          v_bil.id
          USING ERRCODE = 'P0001';
      END IF;

      IF EXISTS (
        SELECT 1
        FROM public."BillingItem" bi
        JOIN public."AwardedBOQItem" b ON b.id = bi."boqItemId"
        WHERE bi."billingId" = v_bil.id
          AND b."projectId" IS DISTINCT FROM NEW."projectId"
      ) THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_CROSS_PROJECT_BOQ_ITEM: Billing % references foreign AwardedBOQItem',
          v_bil.id
          USING ERRCODE = '42501';
      END IF;
    ELSIF NEW."templateCode" = 'T11_VARIATION_ORDER_REGISTER' THEN
      SELECT id, "projectId", status, "versionNumber", "approvedAt", "approvedById", "contractAuthorityId"
      INTO v_snap
      FROM public."UboqOperationalSnapshot"
      WHERE id = NEW."sourceId"
        AND "projectId" = NEW."projectId";

      IF v_snap.id IS NULL
         OR v_snap.status::text <> 'APPROVED'
         OR v_snap."approvedAt" IS NULL
         OR v_snap."approvedById" IS NULL THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_UNAPPROVED_SOURCE: T11 formal export requires APPROVED UboqOperationalSnapshot on project % (got %)',
          NEW."projectId", COALESCE(NEW."sourceId", 'NULL')
          USING ERRCODE = 'P0001';
      END IF;

      IF NEW."sourceVersion" IS DISTINCT FROM v_snap."versionNumber"::text THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_SOURCE_VERSION_MISMATCH: T11 sourceVersion (%) must match snapshot versionNumber (%)',
          COALESCE(NEW."sourceVersion", 'NULL'), v_snap."versionNumber"::text
          USING ERRCODE = '22023';
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM public."UboqAwardedPhaseLine"
        WHERE "projectId" = NEW."projectId"
          AND "snapshotId" = v_snap.id
      ) THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_EMPTY_SNAPSHOT: Snapshot % has zero phase lines',
          v_snap.id
          USING ERRCODE = 'P0001';
      END IF;

      IF v_snap."contractAuthorityId" IS NULL THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_CONTRACT_RATE_ASSOCIATION_UNVERIFIED: T11 formal export requires snapshot % to have a verified contractAuthorityId',
          v_snap.id
          USING ERRCODE = 'P0001';
      END IF;

      SELECT id, status, "approvedAt", "approvedById"
      INTO v_ca
      FROM public."UboqContractAuthority"
      WHERE id = v_snap."contractAuthorityId"
        AND "projectId" = NEW."projectId";

      IF v_ca.id IS NULL
         OR v_ca.status::text <> 'APPROVED'
         OR v_ca."approvedAt" IS NULL
         OR v_ca."approvedById" IS NULL THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_UNAPPROVED_LINKED_CONTRACT: Linked contract authority % on snapshot % is not APPROVED',
          v_snap."contractAuthorityId", v_snap.id
          USING ERRCODE = 'P0001';
      END IF;

      -- If T11 formal export includes executive-sensitive vo_subcon_commitment_delta_amt, enforce SQL-level executive access
      IF jsonb_typeof(NEW."detailsJson"->'selectedFields') = 'array'
         AND EXISTS (
           SELECT 1
           FROM jsonb_array_elements_text(NEW."detailsJson"->'selectedFields') AS sf(field_id)
           WHERE sf.field_id = 'vo_subcon_commitment_delta_amt'
         )
         AND public.uboq_actor_has_executive_sensitive_access(NEW."projectId", NEW."actorUserId") IS NOT TRUE THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_SENSITIVE_FIELD_DENIED: Actor % lacks executive authority to include vo_subcon_commitment_delta_amt in T11 formal export',
          NEW."actorUserId"
          USING ERRCODE = '42501';
      END IF;
    END IF;

    IF NEW."layoutDefinitionId" IS NULL THEN
      IF NEW."layoutGroupId" IS NOT NULL
         OR NEW."layoutVersionNumber" IS DISTINCT FROM 1
         OR NEW."layoutOwnerId" IS NOT NULL
         OR NEW."sharingScope" IS DISTINCT FROM 'SYSTEM_FORMAL_PRESET' THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_PRESET_METADATA_INVALID: System formal preset export audit requires null layout IDs, version 1, and SYSTEM_FORMAL_PRESET scope'
          USING ERRCODE = '22023';
      END IF;
    ELSE
      SELECT id, "projectId", "layoutGroupId", "versionNumber", "templateCode", "createdById", "sharingScope"
      INTO v_tpl
      FROM public."UboqTemplateDefinition"
      WHERE "projectId" = NEW."projectId"
        AND id = NEW."layoutDefinitionId"
        AND "isSystemPreset" = false;

      IF v_tpl.id IS NULL THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_LAYOUT_NOT_FOUND: Layout revision % does not exist on project %',
          NEW."layoutDefinitionId", NEW."projectId"
          USING ERRCODE = 'P0002';
      END IF;

      IF v_tpl."layoutGroupId" IS DISTINCT FROM NEW."layoutGroupId"
         OR v_tpl."versionNumber" IS DISTINCT FROM NEW."layoutVersionNumber"
         OR v_tpl."templateCode" IS DISTINCT FROM NEW."templateCode" THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_LINEAGE_MISMATCH: Audit metadata does not match persisted layout revision %',
          NEW."layoutDefinitionId"
          USING ERRCODE = '22023';
      END IF;

      IF v_tpl."sharingScope" <> 'PROJECT_SHARED'
         AND v_tpl."createdById" IS DISTINCT FROM NEW."actorUserId" THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_PRIVATE_LAYOUT_DENIED: Actor % cannot export another user''s private layout %',
          NEW."actorUserId", NEW."layoutDefinitionId"
          USING ERRCODE = '42501';
      END IF;

      NEW."layoutOwnerId" := v_tpl."createdById";
      NEW."sharingScope" := v_tpl."sharingScope";
    END IF;

    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_UNSUPPORTED_EVENT: Unsupported eventType %', COALESCE(NEW."eventType", 'NULL')
    USING ERRCODE = '22023';
END;
$$;
ALTER FUNCTION public.uboq_guard_template_audit_event() OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_guard_template_audit_event() FROM PUBLIC;

-- 6. Extend Attested Executive SensitiveExportLog Writer to T11_VARIATION_ORDER_REGISTER and T12_CASHFLOW_VARIANCE_TREASURY
CREATE OR REPLACE FUNCTION public.uboq_append_sensitive_export_log(
  p_id text,
  p_user_id text,
  p_user_email text,
  p_project_id text,
  p_template_code text,
  p_format text,
  p_source_id text,
  p_record_count integer,
  p_source_ip text,
  p_approved boolean,
  p_blocked boolean,
  p_reason text,
  p_output_sha256 text,
  p_export_proof text
)
RETURNS public."SensitiveExportLog"
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_tpl text;
  v_fmt text;
  v_sha text;
  v_snap record;
  v_phase_cnt integer;
  v_row public."SensitiveExportLog";
BEGIN
  IF p_id IS NULL OR p_id !~ '^[A-Za-z0-9_-]{8,160}$' THEN
    RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_INVALID_ID: Valid export log id required'
      USING ERRCODE = '22023';
  END IF;

  IF p_project_id IS NULL
     OR public.uboq_check_tenant_rls(p_project_id) IS NOT TRUE
     OR p_user_id IS DISTINCT FROM NULLIF(current_setting('app.current_user_id', true), '') THEN
    RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_ACTOR_MISMATCH: Bound project and actor context required'
      USING ERRCODE = '42501';
  END IF;

  v_tpl := UPPER(BTRIM(COALESCE(p_template_code, '')));
  v_fmt := UPPER(BTRIM(COALESCE(p_format, '')));
  v_sha := LOWER(COALESCE(BTRIM(p_output_sha256), ''));

  IF v_fmt NOT IN ('JSON', 'XLSX', 'CSV') THEN
    RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_INVALID_FORMAT: Unsupported export format (%)', v_fmt
      USING ERRCODE = '22023';
  END IF;

  IF COALESCE(p_approved, false) = COALESCE(p_blocked, false) THEN
    RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_STATE_INVALID: approved and blocked must be mutually exclusive'
      USING ERRCODE = '22023';
  END IF;

  IF p_approved IS TRUE THEN
    IF v_tpl NOT IN (
      'T8_CASHFLOW_HALF_MONTH',
      'T9_CASHFLOW_QUARTERLY',
      'T10_EXECUTIVE_MARGIN',
      'T11_VARIATION_ORDER_REGISTER',
      'T12_CASHFLOW_VARIANCE_TREASURY'
    ) THEN
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_INVALID_TEMPLATE: Approved executive sensitive export requires T8/T9/T10/T11/T12, got (%)',
        v_tpl
        USING ERRCODE = '22023';
    END IF;

    IF public.uboq_actor_has_executive_sensitive_access(p_project_id, p_user_id) IS NOT TRUE THEN
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_UNAUTHORIZED_APPROVAL: Actor % lacks executive sensitive-export authority on project %',
        p_user_id, p_project_id
        USING ERRCODE = '42501';
    END IF;

    IF v_sha !~ '^[0-9a-f]{64}$' THEN
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_MISSING_PAYLOAD_HASH: Approved sensitive export requires 64-hex SHA-256 digest of delivered payload'
        USING ERRCODE = '22023';
    END IF;

    IF v_tpl = 'T11_VARIATION_ORDER_REGISTER' THEN
      IF COALESCE(p_record_count, -1) < 0 THEN
        RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_INVALID_COUNT: Approved T11 sensitive export requires recordCount >= 0'
          USING ERRCODE = '22023';
      END IF;
    ELSE
      IF COALESCE(p_record_count, 0) <= 0 THEN
        RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_INVALID_COUNT: Approved sensitive export requires recordCount > 0'
          USING ERRCODE = '22023';
      END IF;
    END IF;

    IF public.uboq_verify_sensitive_export_attestation(
      p_id,
      p_project_id,
      p_user_id,
      v_tpl,
      v_fmt,
      p_source_id,
      p_record_count,
      p_approved,
      p_blocked,
      v_sha,
      p_export_proof
    ) IS NOT TRUE THEN
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_UNATTESTED_CALL: Valid server-minted export attestation over delivered bytes is required'
        USING ERRCODE = '42501';
    END IF;

    SELECT s.id, s."projectId", s.status, s."approvedAt", s."approvedById", s."contractAuthorityId", s."versionNumber"
    INTO v_snap
    FROM public."UboqOperationalSnapshot" s
    WHERE s.id = p_source_id
      AND s."projectId" = p_project_id;

    IF v_snap.id IS NULL
       OR v_snap.status::text <> 'APPROVED'
       OR v_snap."approvedAt" IS NULL
       OR v_snap."approvedById" IS NULL
       OR v_snap."contractAuthorityId" IS NULL
       OR NOT EXISTS (
         SELECT 1
         FROM public."UboqContractAuthority" ca
         WHERE ca.id = v_snap."contractAuthorityId"
           AND ca."projectId" = p_project_id
           AND ca.status::text = 'APPROVED'
           AND ca."approvedAt" IS NOT NULL
           AND ca."approvedById" IS NOT NULL
       ) THEN
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_INVALID_SOURCE: Approved operational snapshot linked to approved contract authority is required'
        USING ERRCODE = '42501';
    END IF;

    SELECT count(*)::integer
    INTO v_phase_cnt
    FROM public."UboqAwardedPhaseLine" pl
    WHERE pl."projectId" = p_project_id
      AND pl."snapshotId" = v_snap.id;

    IF v_phase_cnt <= 0 THEN
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_INVALID_SOURCE: Snapshot % has zero phase lines', v_snap.id
        USING ERRCODE = '42501';
    END IF;
  ELSE
    IF v_tpl NOT IN (
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
      'T10_EXECUTIVE_MARGIN',
      'T11_VARIATION_ORDER_REGISTER',
      'T12_CASHFLOW_VARIANCE_TREASURY'
    ) THEN
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_INVALID_TEMPLATE: Unsupported template code (%)', v_tpl
        USING ERRCODE = '22023';
    END IF;

    IF COALESCE(p_record_count, 0) <> 0 THEN
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_INVALID_COUNT: Blocked sensitive export requires recordCount = 0'
        USING ERRCODE = '22023';
    END IF;

    IF public.uboq_verify_sensitive_export_attestation(
      p_id,
      p_project_id,
      p_user_id,
      v_tpl,
      v_fmt,
      p_source_id,
      p_record_count,
      p_approved,
      p_blocked,
      v_sha,
      p_export_proof
    ) IS NOT TRUE THEN
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_UNATTESTED_CALL: Valid server-minted export attestation is required'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  INSERT INTO public."SensitiveExportLog" (
    "id",
    "userId",
    "userEmail",
    "role",
    "projectId",
    "module",
    "exportType",
    "recordCount",
    "dataClassification",
    "sourceIp",
    "approved",
    "blocked",
    "reason"
  )
  VALUES (
    p_id,
    p_user_id,
    p_user_email,
    NULL,
    p_project_id,
    'UBOQ_EXECUTIVE_TEMPLATES',
    v_tpl || ':' || v_fmt,
    p_record_count,
    'SENSITIVE_EXECUTIVE_FINANCIAL',
    p_source_ip,
    p_approved,
    p_blocked,
    LEFT(
      COALESCE(NULLIF(BTRIM(p_reason), ''), 'SENSITIVE_EXECUTIVE_TEMPLATE')
      || CASE WHEN p_source_id IS NOT NULL AND BTRIM(p_source_id) <> '' THEN ' [source=' || BTRIM(p_source_id) || ']' ELSE '' END
      || CASE WHEN p_approved IS TRUE THEN ' [sha256=' || v_sha || ']' ELSE '' END,
      500
    )
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;
ALTER FUNCTION public.uboq_append_sensitive_export_log(
  text, text, text, text, text, text, text, integer, text, boolean, boolean, text, text, text
) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_append_sensitive_export_log(
  text, text, text, text, text, text, text, integer, text, boolean, boolean, text, text, text
) FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_append_sensitive_export_log(
  text, text, text, text, text, text, text, integer, text, boolean, boolean, text, text, text
) TO oserp_compat_app;

-- Re-assert least-privilege ACLs on UboqTemplateAuditEvent & SensitiveExportLog
REVOKE ALL ON TABLE public."UboqTemplateAuditEvent"
  FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public."UboqTemplateAuditEvent"
  FROM oserp_compat_app;
GRANT SELECT ON TABLE public."UboqTemplateAuditEvent" TO oserp_compat_app;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public."SensitiveExportLog"
  FROM PUBLIC, oserp_compat_app, oserp_legacy_app;
GRANT SELECT ON TABLE public."SensitiveExportLog" TO oserp_compat_app;
