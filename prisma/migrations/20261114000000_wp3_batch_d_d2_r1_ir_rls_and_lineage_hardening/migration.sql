-- ============================================================================
-- OSERP-PROJ-UBOQ-001 — WP-3 BATCH D PHASE D2 R1 INDEPENDENT REVIEW CORRECTIONS
-- (MIGRATION #35, FORWARD-ONLY — PRESERVES MIGRATIONS #1-#34 BYTE-FOR-BYTE)
--
-- Scope:
--   1. D2-IR-01 (HIGH) — Cleanup-Role RLS & Unspoofable Synthetic Cleanup Proof:
--      - Narrows permissive rls_permissive_app_access policies on
--        ClientVariationOrder, AIVariationOrderValidation, and
--        SubcontractorVariationOrder from PUBLIC to
--        (oserp_compat_app, oserp_legacy_app) so oserp_maint_cleanup_role
--        never inherits an unconditional OR(true) permissive grant.
--      - Introduces public.uboq_is_verified_synthetic_cleanup_row(p_project_id)
--        (SECURITY DEFINER owned by oserp_migrations_owner) verifying BOTH:
--          (a) synthetic-owned row lineage (^SYNTH-UBOQ-TEST- prefix AND
--              Project.isSyntheticTestFixture = true), AND
--          (b) an unspoofable transaction-bound HMAC/SHA-256 proof derived
--              from owner-private public."_uboq_rls_trust_anchor" +
--              p_project_id + txid_current(), preventing raw SQL GUC spoofing
--              (SET LOCAL app.synthetic_cleanup_authorized = 'on') and blocking
--              cross-project or non-synthetic SELECT/DELETE even during an
--              active cleanup transaction.
--      - Enforces PERMISSIVE + RESTRICTIVE cleanup policies AND defense-in-depth
--        BEFORE INSERT/UPDATE/DELETE triggers on ClientVariationOrder and
--        AIVariationOrderValidation.
--      - Extends uboq_build_synthetic_cleanup_manifest, adds
--        uboq_authorize_verified_synthetic_cleanup_tx, and updates
--        uboq_execute_verified_synthetic_cleanup to cover D2 VO/treasury tables
--        with _uboq_rls_trust_anchor transaction proofs.
--   2. D2-IR-03 (HIGH) — Subcontract VO Package & BOQ Lineage Enforcement:
--      - Adds restrictive cross-project subcontractPackageId RLS policy on
--        VariationOrder (uboq_resolve_variation_order_full_project).
--      - Adds narrow non-financial SECURITY DEFINER reader
--        public.uboq_read_project_subcontract_package_lineage(p_project_id)
--        strictly gated by public.uboq_check_tenant_rls(p_project_id) so ALL
--        project roles (including non-executive views) enforce identical
--        approved SubcontractPackage + BOQ/snapshot lineage checks with zero
--        validation bypass and zero commercial rate leakage.
--   3. D2-IR-04 (MEDIUM) — Governed Treasury Opening-Balance Authority:
--      - Creates public."UboqTreasuryOpeningBalance" with ENABLE + FORCE RLS,
--        snapshot/project lineage verification, finance-verifier seal
--        immutability, support for positive/zero/negative starting cash, and
--        unspoofable synthetic cleanup scoping.
-- ============================================================================

GRANT SELECT ON
  public."Project",
  public."User",
  public."ProjectUserAssignment",
  public."AwardedBOQItem",
  public."ConsolidatedBOQItem",
  public."BOQMapping",
  public."SubcontractPackage",
  public."VariationOrder",
  public."VariationOrderItem",
  public."VariationOrderDocument",
  public."VariationOrderApproval",
  public."AIVariationOrderValidation",
  public."ClientVariationOrder",
  public."SubcontractorVariationOrder",
  public."UboqOperationalSnapshot",
  public."SensitiveExportLog",
  public."UboqClientReceipt",
  public."UboqClientReceiptAllocation",
  public."UboqSignedRoundTripPackage",
  public."UboqRoundTripImportSubmission",
  public."_uboq_rls_trust_anchor"
TO oserp_migrations_owner;

GRANT DELETE ON
  public."SensitiveExportLog",
  public."UboqClientReceipt",
  public."UboqClientReceiptAllocation",
  public."UboqSignedRoundTripPackage",
  public."UboqRoundTripImportSubmission"
TO oserp_migrations_owner;

-- ============================================================================
-- 1. D2-IR-01 — Unspoofable Synthetic-Cleanup Verifier & Scoped RLS Policies
-- ============================================================================

CREATE OR REPLACE FUNCTION public.uboq_is_verified_synthetic_cleanup_row(
  p_project_id text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_secret_hex text;
  v_expected_proof text;
  v_is_synth boolean := false;
BEGIN
  IF p_project_id IS NULL OR p_project_id !~ '^SYNTH-UBOQ-TEST-' THEN
    RETURN false;
  END IF;

  IF pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER') IS NOT TRUE
     AND COALESCE((SELECT rolsuper FROM pg_roles WHERE rolname = session_user), false) IS NOT TRUE THEN
    RETURN false;
  END IF;

  IF current_setting('app.synthetic_cleanup_authorized', true) IS DISTINCT FROM 'on'
     OR current_setting('app.synthetic_cleanup_project_id', true) IS DISTINCT FROM p_project_id THEN
    RETURN false;
  END IF;

  SELECT COALESCE(pr."isSyntheticTestFixture", false)
  INTO v_is_synth
  FROM public."Project" pr
  WHERE pr.id = p_project_id;

  IF v_is_synth IS DISTINCT FROM true THEN
    RETURN false;
  END IF;

  SELECT "secretHex"
  INTO v_secret_hex
  FROM public."_uboq_rls_trust_anchor"
  WHERE "anchorId" = 'PRIMARY';

  IF v_secret_hex IS NULL OR char_length(v_secret_hex) < 64 THEN
    RETURN false;
  END IF;

  v_expected_proof := encode(
    sha256(
      convert_to(
        v_secret_hex
        || '|UBOQ_SYNTH_CLEANUP_V1|'
        || p_project_id
        || '|'
        || txid_current()::text,
        'UTF8'
      )
    ),
    'hex'
  );

  RETURN COALESCE(current_setting('app.synthetic_cleanup_proof', true), '') = v_expected_proof;
END;
$$;
ALTER FUNCTION public.uboq_is_verified_synthetic_cleanup_row(text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_is_verified_synthetic_cleanup_row(text)
  FROM PUBLIC, oserp_compat_app, oserp_legacy_app;
GRANT EXECUTE ON FUNCTION public.uboq_is_verified_synthetic_cleanup_row(text)
  TO oserp_maint_cleanup_role, oserp_migrations_owner;

-- Allow cleanup RLS evaluation on AIVariationOrderValidation to resolve parent VO projectId safely
GRANT EXECUTE ON FUNCTION public.uboq_resolve_ai_vo_validation_project(text)
  TO oserp_maint_cleanup_role;

-- Grant bounded cleanup SELECT/DELETE on SubcontractorVariationOrder to match ClientVariationOrder
GRANT SELECT, DELETE ON public."SubcontractorVariationOrder"
  TO oserp_maint_cleanup_role;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT *
    FROM (VALUES
      ('ClientVariationOrder', '"projectId"'),
      ('AIVariationOrderValidation', 'public.uboq_resolve_ai_vo_validation_project("variationOrderId")'),
      ('SubcontractorVariationOrder', '"projectId"')
    ) AS vo_cleanup_tables(tbl, cleanup_proj_expr)
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tbl);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', r.tbl);

    -- Narrow permissive app policy from PUBLIC to application roles ONLY (fixes D2-IR-01 OR-bypass)
    EXECUTE format('DROP POLICY IF EXISTS rls_permissive_app_access ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY rls_permissive_app_access ON public.%I AS PERMISSIVE FOR ALL TO oserp_compat_app, oserp_legacy_app USING (true) WITH CHECK (true)',
      r.tbl
    );

    -- Scoped PERMISSIVE + RESTRICTIVE policies for oserp_maint_cleanup_role
    EXECUTE format('DROP POLICY IF EXISTS rls_permissive_maint_cleanup ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY rls_permissive_maint_cleanup ON public.%I AS PERMISSIVE FOR ALL TO oserp_maint_cleanup_role USING (public.uboq_is_verified_synthetic_cleanup_row(%s)) WITH CHECK (false)',
      r.tbl,
      r.cleanup_proj_expr
    );

    EXECUTE format('DROP POLICY IF EXISTS rls_restrictive_maint_cleanup_scope ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY rls_restrictive_maint_cleanup_scope ON public.%I AS RESTRICTIVE FOR ALL TO oserp_maint_cleanup_role USING (public.uboq_is_verified_synthetic_cleanup_row(%s)) WITH CHECK (false)',
      r.tbl,
      r.cleanup_proj_expr
    );
  END LOOP;

  -- Harden maintenance-cleanup policies on Batch C / Phase D1 governed tables to require
  -- unspoofable uboq_is_verified_synthetic_cleanup_row("projectId") as well
  FOR r IN
    SELECT *
    FROM (VALUES
      ('SensitiveExportLog', 'rls_permissive_sensitive_export_log_maint'),
      ('UboqClientReceipt', 'rls_permissive_maint_cleanup'),
      ('UboqClientReceiptAllocation', 'rls_permissive_maint_cleanup'),
      ('UboqSignedRoundTripPackage', 'rls_permissive_rtpkg_maint_cleanup'),
      ('UboqRoundTripImportSubmission', 'rls_permissive_rtimp_maint_cleanup')
    ) AS prior_maint_tables(tbl, pol_name)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.pol_name, r.tbl);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS PERMISSIVE FOR ALL TO oserp_maint_cleanup_role USING (public.uboq_is_verified_synthetic_cleanup_row("projectId")) WITH CHECK (false)',
      r.pol_name,
      r.tbl
    );
    EXECUTE format('DROP POLICY IF EXISTS rls_restrictive_maint_cleanup_scope ON public.%I', r.tbl);
    EXECUTE format(
      'CREATE POLICY rls_restrictive_maint_cleanup_scope ON public.%I AS RESTRICTIVE FOR ALL TO oserp_maint_cleanup_role USING (public.uboq_is_verified_synthetic_cleanup_row("projectId")) WITH CHECK (false)',
      r.tbl
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.uboq_guard_d2_vo_aux_cleanup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_proj_id text;
BEGIN
  IF COALESCE((SELECT rolsuper FROM pg_roles WHERE rolname = session_user), false) IS TRUE THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER') THEN
    IF TG_OP <> 'DELETE' THEN
      RAISE EXCEPTION 'UBOQ_MAINT_WRITE_DENIED: Maintenance cleanup role cannot % on %',
        TG_OP, TG_TABLE_NAME
        USING ERRCODE = '42501';
    END IF;

    IF TG_TABLE_NAME = 'ClientVariationOrder' THEN
      v_proj_id := OLD."projectId";
    ELSIF TG_TABLE_NAME = 'AIVariationOrderValidation' THEN
      v_proj_id := public.uboq_resolve_ai_vo_validation_project(OLD."variationOrderId");
    ELSIF TG_TABLE_NAME = 'SubcontractorVariationOrder' THEN
      v_proj_id := OLD."projectId";
    END IF;

    IF public.uboq_is_verified_synthetic_cleanup_row(v_proj_id) IS NOT TRUE THEN
      RAISE EXCEPTION 'UBOQ_SYNTH_CLEANUP_UNAUTHORIZED: Maintenance DELETE denied outside verified synthetic cleanup context on % (project=%)',
        TG_TABLE_NAME, COALESCE(v_proj_id, 'NULL')
        USING ERRCODE = '42501';
    END IF;

    RETURN OLD;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'UBOQ_VO_AUX_DELETE_DENIED: Direct DELETE on % is prohibited outside verified synthetic cleanup',
      TG_TABLE_NAME
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;
ALTER FUNCTION public.uboq_guard_d2_vo_aux_cleanup()
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_guard_d2_vo_aux_cleanup()
  FROM PUBLIC, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role;

DROP TRIGGER IF EXISTS trg_uboq_guard_d2_vo_aux_cleanup ON public."ClientVariationOrder";
CREATE TRIGGER trg_uboq_guard_d2_vo_aux_cleanup
  BEFORE INSERT OR UPDATE OR DELETE ON public."ClientVariationOrder"
  FOR EACH ROW
  EXECUTE FUNCTION public.uboq_guard_d2_vo_aux_cleanup();

DROP TRIGGER IF EXISTS trg_uboq_guard_d2_vo_aux_cleanup ON public."AIVariationOrderValidation";
CREATE TRIGGER trg_uboq_guard_d2_vo_aux_cleanup
  BEFORE INSERT OR UPDATE OR DELETE ON public."AIVariationOrderValidation"
  FOR EACH ROW
  EXECUTE FUNCTION public.uboq_guard_d2_vo_aux_cleanup();

DROP TRIGGER IF EXISTS trg_uboq_guard_d2_vo_aux_cleanup ON public."SubcontractorVariationOrder";
CREATE TRIGGER trg_uboq_guard_d2_vo_aux_cleanup
  BEFORE INSERT OR UPDATE OR DELETE ON public."SubcontractorVariationOrder"
  FOR EACH ROW
  EXECUTE FUNCTION public.uboq_guard_d2_vo_aux_cleanup();

-- ============================================================================
-- 2. D2-IR-03 — Subcontract Package Lineage Reader & VariationOrder FK Guard
-- ============================================================================

CREATE OR REPLACE FUNCTION public.uboq_resolve_variation_order_full_project(
  p_project_id text,
  p_subcontract_package_id text
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
           p_subcontract_package_id IS NULL
           OR EXISTS (
             SELECT 1
             FROM public."SubcontractPackage" sp
             WHERE sp.id = p_subcontract_package_id
               AND sp."projectId" = p_project_id
           )
         )
    THEN p_project_id
    ELSE NULL
  END;
$$;
ALTER FUNCTION public.uboq_resolve_variation_order_full_project(text, text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_resolve_variation_order_full_project(text, text)
  FROM PUBLIC, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_resolve_variation_order_full_project(text, text)
  TO oserp_compat_app, oserp_legacy_app, oserp_migrations_owner;

DROP POLICY IF EXISTS rls_restrictive_vo_subcon_pkg_project ON public."VariationOrder";
CREATE POLICY rls_restrictive_vo_subcon_pkg_project
  ON public."VariationOrder"
  AS RESTRICTIVE
  FOR ALL
  TO oserp_compat_app
  USING (
    public.uboq_check_tenant_rls(
      public.uboq_resolve_variation_order_full_project(
        "projectId",
        "subcontractPackageId"
      )
    )
  )
  WITH CHECK (
    public.uboq_check_tenant_rls(
      public.uboq_resolve_variation_order_full_project(
        "projectId",
        "subcontractPackageId"
      )
    )
  );

-- Narrow non-financial SubcontractPackage lineage projection for T11 validation across all project roles
CREATE OR REPLACE FUNCTION public.uboq_read_project_subcontract_package_lineage(
  p_project_id text
)
RETURNS TABLE (
  id text,
  "projectId" text,
  "packageNumber" text,
  status text,
  "awardedBoqItemId" text,
  "consolidatedBoqItemId" text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF p_project_id IS NULL OR public.uboq_check_tenant_rls(p_project_id) IS NOT TRUE THEN
    RAISE EXCEPTION 'UBOQ_SUBCON_LINEAGE_TENANT_DENIED: Cryptographically bound tenant RLS context required for project %',
      COALESCE(p_project_id, 'NULL')
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    sp.id::text,
    sp."projectId"::text,
    sp."packageNumber"::text,
    sp.status::text,
    sp."awardedBoqItemId"::text,
    sp."consolidatedBoqItemId"::text
  FROM public."SubcontractPackage" sp
  WHERE sp."projectId" = p_project_id
  ORDER BY sp.id ASC;
END;
$$;
ALTER FUNCTION public.uboq_read_project_subcontract_package_lineage(text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_read_project_subcontract_package_lineage(text)
  FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_read_project_subcontract_package_lineage(text)
  TO oserp_compat_app, oserp_migrations_owner;

-- Detect cross-project VO/SVO/CVO lineage anomalies on p_project_id without leaking foreign tenant data,
-- ensuring pre-existing or admin-seeded cross-project associations fail closed (409) instead of being silently hidden by SELECT RLS
CREATE OR REPLACE FUNCTION public.uboq_detect_project_vo_cross_tenant_anomalies(
  p_project_id text
)
RETURNS TABLE (
  source_table text,
  record_id text,
  anomaly_reason text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF p_project_id IS NULL OR public.uboq_check_tenant_rls(p_project_id) IS NOT TRUE THEN
    RAISE EXCEPTION 'UBOQ_VO_ANOMALY_CHECK_TENANT_DENIED: Cryptographically bound tenant RLS context required for project %',
      COALESCE(p_project_id, 'NULL')
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    'VariationOrder'::text,
    vo.id::text,
    'CROSS_PROJECT_VO_SUBCONTRACT_PACKAGE'::text
  FROM public."VariationOrder" vo
  JOIN public."SubcontractPackage" sp ON sp.id = vo."subcontractPackageId"
  WHERE vo."projectId" = p_project_id
    AND sp."projectId" IS DISTINCT FROM p_project_id

  UNION ALL

  SELECT
    'VariationOrderItem'::text,
    voi.id::text,
    'CROSS_PROJECT_VO_ITEM_AWARDED_BOQ'::text
  FROM public."VariationOrderItem" voi
  JOIN public."VariationOrder" vo ON vo.id = voi."variationOrderId"
  JOIN public."AwardedBOQItem" ab ON ab.id = voi."originalBoqItemId"
  WHERE vo."projectId" = p_project_id
    AND ab."projectId" IS DISTINCT FROM p_project_id

  UNION ALL

  SELECT
    'SubcontractorVariationOrder'::text,
    svo.id::text,
    CASE
      WHEN sp.id IS NOT NULL AND sp."projectId" IS DISTINCT FROM p_project_id
        THEN 'CROSS_PROJECT_SVO_SUBCONTRACT_PACKAGE'
      WHEN ab.id IS NOT NULL AND ab."projectId" IS DISTINCT FROM p_project_id
        THEN 'CROSS_PROJECT_SVO_AWARDED_BOQ'
      ELSE 'CROSS_PROJECT_SVO_CONSOLIDATED_BOQ'
    END::text
  FROM public."SubcontractorVariationOrder" svo
  LEFT JOIN public."SubcontractPackage" sp ON sp.id = svo."originalSubcontractId"
  LEFT JOIN public."AwardedBOQItem" ab ON ab.id = svo."awardedBoqItemId"
  LEFT JOIN public."ConsolidatedBOQItem" cb ON cb.id = svo."consolidatedBoqItemId"
  WHERE svo."projectId" = p_project_id
    AND (
      (sp.id IS NOT NULL AND sp."projectId" IS DISTINCT FROM p_project_id)
      OR (ab.id IS NOT NULL AND ab."projectId" IS DISTINCT FROM p_project_id)
      OR (cb.id IS NOT NULL AND cb."projectId" IS DISTINCT FROM p_project_id)
    )

  UNION ALL

  SELECT
    'ClientVariationOrder'::text,
    cvo.id::text,
    'CROSS_PROJECT_CVO_AWARDED_BOQ'::text
  FROM public."ClientVariationOrder" cvo
  JOIN public."AwardedBOQItem" ab ON ab.id = cvo."awardedBoqItemId"
  WHERE cvo."projectId" = p_project_id
    AND ab."projectId" IS DISTINCT FROM p_project_id;
END;
$$;
ALTER FUNCTION public.uboq_detect_project_vo_cross_tenant_anomalies(text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_detect_project_vo_cross_tenant_anomalies(text)
  FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_detect_project_vo_cross_tenant_anomalies(text)
  TO oserp_compat_app, oserp_migrations_owner;

-- ============================================================================
-- 3. D2-IR-04 — Governed Treasury Opening-Balance Authority Table & RLS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."UboqTreasuryOpeningBalance" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "openingEffectiveDate" TIMESTAMP(3) NOT NULL,
  "openingCashAmt" NUMERIC(18, 2) NOT NULL,
  "bankStatementEvidenceRef" TEXT NOT NULL,
  "verificationStatus" TEXT NOT NULL DEFAULT 'DRAFT',
  "preparedById" TEXT NOT NULL,
  "verifiedById" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "remarks" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UboqTreasuryOpeningBalance_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chk_uboq_treasury_opening_status" CHECK (
    "verificationStatus" IN ('DRAFT', 'VERIFIED', 'VOID')
  ),
  CONSTRAINT "chk_uboq_treasury_opening_evidence_nonempty" CHECK (
    BTRIM("bankStatementEvidenceRef") <> ''
  ),
  CONSTRAINT "chk_uboq_treasury_opening_verifier_completeness" CHECK (
    (
      "verificationStatus" = 'VERIFIED'
      AND "verifiedById" IS NOT NULL
      AND "verifiedAt" IS NOT NULL
    )
    OR (
      "verificationStatus" IN ('DRAFT', 'VOID')
    )
  ),
  CONSTRAINT "UboqTreasuryOpeningBalance_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES public."Project"("id")
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "UboqTreasuryOpeningBalance_snapshotId_fkey"
    FOREIGN KEY ("snapshotId") REFERENCES public."UboqOperationalSnapshot"("id")
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "UboqTreasuryOpeningBalance_preparedById_fkey"
    FOREIGN KEY ("preparedById") REFERENCES public."User"("id")
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "UboqTreasuryOpeningBalance_verifiedById_fkey"
    FOREIGN KEY ("verifiedById") REFERENCES public."User"("id")
    ON DELETE RESTRICT ON UPDATE RESTRICT
);

ALTER TABLE public."UboqTreasuryOpeningBalance"
  OWNER TO oserp_migrations_owner;

CREATE UNIQUE INDEX IF NOT EXISTS "UboqTreasuryOpeningBalance_projectId_snapshotId_key"
  ON public."UboqTreasuryOpeningBalance"("projectId", "snapshotId");

CREATE INDEX IF NOT EXISTS "UboqTreasuryOpeningBalance_projectId_verificationStatus_idx"
  ON public."UboqTreasuryOpeningBalance"("projectId", "verificationStatus");

REVOKE ALL ON TABLE public."UboqTreasuryOpeningBalance"
  FROM PUBLIC, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role;

GRANT SELECT, INSERT, UPDATE ON TABLE public."UboqTreasuryOpeningBalance"
  TO oserp_compat_app, oserp_migrations_owner;

GRANT SELECT, DELETE ON TABLE public."UboqTreasuryOpeningBalance"
  TO oserp_maint_cleanup_role;

GRANT DELETE ON TABLE public."UboqTreasuryOpeningBalance"
  TO oserp_migrations_owner;

ALTER TABLE public."UboqTreasuryOpeningBalance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UboqTreasuryOpeningBalance" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rls_permissive_app_access ON public."UboqTreasuryOpeningBalance";
CREATE POLICY rls_permissive_app_access
  ON public."UboqTreasuryOpeningBalance"
  AS PERMISSIVE
  FOR ALL
  TO oserp_compat_app
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS rls_restrictive_tenant_scope ON public."UboqTreasuryOpeningBalance";
CREATE POLICY rls_restrictive_tenant_scope
  ON public."UboqTreasuryOpeningBalance"
  AS RESTRICTIVE
  FOR ALL
  TO oserp_compat_app
  USING (public.uboq_check_tenant_rls("projectId"))
  WITH CHECK (public.uboq_check_tenant_rls("projectId"));

DROP POLICY IF EXISTS rls_block_legacy_role_on_uboq ON public."UboqTreasuryOpeningBalance";
CREATE POLICY rls_block_legacy_role_on_uboq
  ON public."UboqTreasuryOpeningBalance"
  AS RESTRICTIVE
  FOR ALL
  TO oserp_legacy_app
  USING (NOT public.uboq_is_governed_project("projectId"))
  WITH CHECK (NOT public.uboq_is_governed_project("projectId"));

DROP POLICY IF EXISTS rls_permissive_maint_cleanup ON public."UboqTreasuryOpeningBalance";
CREATE POLICY rls_permissive_maint_cleanup
  ON public."UboqTreasuryOpeningBalance"
  AS PERMISSIVE
  FOR ALL
  TO oserp_maint_cleanup_role
  USING (public.uboq_is_verified_synthetic_cleanup_row("projectId"))
  WITH CHECK (false);

DROP POLICY IF EXISTS rls_restrictive_maint_cleanup_scope ON public."UboqTreasuryOpeningBalance";
CREATE POLICY rls_restrictive_maint_cleanup_scope
  ON public."UboqTreasuryOpeningBalance"
  AS RESTRICTIVE
  FOR ALL
  TO oserp_maint_cleanup_role
  USING (public.uboq_is_verified_synthetic_cleanup_row("projectId"))
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.uboq_guard_treasury_opening_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_snap record;
  v_actor_id text;
BEGIN
  IF COALESCE((SELECT rolsuper FROM pg_roles WHERE rolname = session_user), false) IS TRUE THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER')
     OR (TG_OP = 'DELETE' AND current_user = 'oserp_migrations_owner') THEN
    IF TG_OP <> 'DELETE' THEN
      RAISE EXCEPTION 'UBOQ_TREASURY_OPENING_MAINT_WRITE_DENIED: Maintenance role cannot % on UboqTreasuryOpeningBalance',
        TG_OP
        USING ERRCODE = '42501';
    END IF;
    IF public.uboq_is_verified_synthetic_cleanup_row(OLD."projectId") IS NOT TRUE THEN
      RAISE EXCEPTION 'UBOQ_TREASURY_OPENING_CLEANUP_UNAUTHORIZED: Unverified synthetic cleanup DELETE denied on UboqTreasuryOpeningBalance (project=%)',
        COALESCE(OLD."projectId", 'NULL')
        USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'UBOQ_TREASURY_OPENING_DELETE_DENIED: Treasury opening-balance authority records cannot be deleted; mark VOID instead'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD."verificationStatus" IN ('VERIFIED', 'VOID') THEN
    RAISE EXCEPTION 'UBOQ_TREASURY_OPENING_IMMUTABLE: Sealed % treasury opening-balance record % cannot be mutated',
      OLD."verificationStatus", OLD.id
      USING ERRCODE = '42501';
  END IF;

  SELECT id, "projectId", status, "approvedAt", "approvedById"
  INTO v_snap
  FROM public."UboqOperationalSnapshot"
  WHERE id = NEW."snapshotId";

  IF v_snap.id IS NULL OR v_snap."projectId" IS DISTINCT FROM NEW."projectId" THEN
    RAISE EXCEPTION 'UBOQ_TREASURY_OPENING_SNAPSHOT_MISMATCH: Snapshot % does not belong to project %',
      COALESCE(NEW."snapshotId", 'NULL'), COALESCE(NEW."projectId", 'NULL')
      USING ERRCODE = '22023';
  END IF;

  IF v_snap.status::text <> 'APPROVED' OR v_snap."approvedAt" IS NULL OR v_snap."approvedById" IS NULL THEN
    RAISE EXCEPTION 'UBOQ_TREASURY_OPENING_UNAPPROVED_SNAPSHOT: Treasury opening balance requires an APPROVED UboqOperationalSnapshot (got %)',
      v_snap.status::text
      USING ERRCODE = 'P0001';
  END IF;

  IF NEW."verificationStatus" = 'VERIFIED' THEN
    IF pg_has_role(session_user, 'oserp_compat_app', 'MEMBER')
       OR pg_has_role(current_user, 'oserp_compat_app', 'MEMBER') THEN
      v_actor_id := NULLIF(current_setting('app.current_user_id', true), '');
      IF v_actor_id IS NULL
         OR NEW."verifiedById" IS DISTINCT FROM v_actor_id
         OR public.uboq_actor_can_verify_client_receipt(NEW."projectId", v_actor_id) IS NOT TRUE THEN
        RAISE EXCEPTION 'UBOQ_TREASURY_OPENING_VERIFIER_DENIED: Actor % lacks finance/commercial treasury verification authority on project %',
          COALESCE(v_actor_id, 'NULL'), NEW."projectId"
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
ALTER FUNCTION public.uboq_guard_treasury_opening_balance()
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_guard_treasury_opening_balance()
  FROM PUBLIC, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role;

DROP TRIGGER IF EXISTS trg_uboq_guard_treasury_opening_balance ON public."UboqTreasuryOpeningBalance";
CREATE TRIGGER trg_uboq_guard_treasury_opening_balance
  BEFORE INSERT OR UPDATE OR DELETE ON public."UboqTreasuryOpeningBalance"
  FOR EACH ROW
  EXECUTE FUNCTION public.uboq_guard_treasury_opening_balance();

-- ============================================================================
-- 4. Update Synthetic Cleanup Manifest, Controlled Tx Proof Minting & Executor
-- ============================================================================

CREATE OR REPLACE FUNCTION public.uboq_build_synthetic_cleanup_manifest(
  p_project_id text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_proj record;
  v_disqualifiers jsonb := '[]'::jsonb;
  v_counts jsonb := '{}'::jsonb;
  v_out_of_scope jsonb := '{}'::jsonb;
  v_canonical_parts text[] := ARRAY[]::text[];
  v_paid_ap_cnt int := 0;
  v_posted_exp_cnt int := 0;
  v_cross_boq_cnt int := 0;
  v_cross_po_cnt int := 0;
  v_ext_ref_cnt int := 0;
  v_cross_vo_cnt int := 0;
  v_tbl record;
  v_ids text[];
  v_dyn_cnt bigint;
  v_eligible boolean := true;
  v_manifest_hash text;
  v_scope jsonb := '{}'::jsonb;
  v_rows jsonb;
  v_closure jsonb;
BEGIN
  IF pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER') IS NOT TRUE
     AND COALESCE((SELECT rolsuper FROM pg_roles WHERE rolname = session_user), false) IS NOT TRUE THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_ROLE_DENIED: Only oserp_maint_cleanup_role may build synthetic cleanup manifests (session_user=%)', session_user
      USING ERRCODE = '42501';
  END IF;

  IF p_project_id IS NULL OR btrim(p_project_id) = '' THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_PROJECT_REQUIRED: p_project_id is required'
      USING ERRCODE = '22023';
  END IF;

  IF p_project_id !~ '^SYNTH-UBOQ-TEST-' THEN
    v_disqualifiers := v_disqualifiers || jsonb_build_array('DISQUALIFIED_NON_SYNTHETIC_PREFIX');
  END IF;

  SELECT id, name, status, COALESCE("isSyntheticTestFixture", false) AS is_synth, COALESCE("uboqGovernanceEnabled", false) AS is_gov
  INTO v_proj
  FROM "Project"
  WHERE id = p_project_id;

  IF v_proj.id IS NULL THEN
    RETURN jsonb_build_object(
      'projectId', p_project_id,
      'exists', false,
      'eligible', false,
      'disqualifiers', v_disqualifiers || jsonb_build_array('PROJECT_NOT_FOUND'),
      'closureCounts', '{}'::jsonb,
      'outOfScopeDescendants', '{}'::jsonb,
      'sharedMastersProtected', true,
      'manifestSha256', NULL
    );
  END IF;

  IF v_proj.is_synth IS DISTINCT FROM true THEN
    v_disqualifiers := v_disqualifiers || jsonb_build_array('DISQUALIFIED_PROJECT_FIXTURE_FLAG_FALSE');
  END IF;

  v_canonical_parts := array_append(
    v_canonical_parts,
    format('PROJECT:%s|isSynth:%s|isGov:%s', v_proj.id, v_proj.is_synth::text, v_proj.is_gov::text)
  );

  SELECT jsonb_build_object('Project', jsonb_build_array(to_jsonb(p))) INTO v_scope FROM "Project" p WHERE id = p_project_id;

  FOR v_tbl IN
    SELECT * FROM (
      VALUES
        ('ProjectUserAssignment', format('SELECT ARRAY(SELECT id::text FROM "ProjectUserAssignment" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('ProjectSchedule', format('SELECT ARRAY(SELECT id::text FROM "ProjectSchedule" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('AwardedBOQItem', format('SELECT ARRAY(SELECT id::text FROM "AwardedBOQItem" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('ConsolidatedBOQItem', format('SELECT ARRAY(SELECT id::text FROM "ConsolidatedBOQItem" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('BOQMapping', format('SELECT ARRAY(SELECT id::text FROM "BOQMapping" WHERE "consolidatedBoqItemId" IN (SELECT id FROM "ConsolidatedBOQItem" WHERE "projectId" = %L) OR "awardedBoqItemId" IN (SELECT id FROM "AwardedBOQItem" WHERE "projectId" = %L) ORDER BY id)', p_project_id, p_project_id)),
        ('UboqSourceDocument', format('SELECT ARRAY(SELECT id::text FROM "UboqSourceDocument" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('UboqDocumentSection', format('SELECT ARRAY(SELECT id::text FROM "UboqDocumentSection" WHERE "sourceDocumentId" IN (SELECT id FROM "UboqSourceDocument" WHERE "projectId" = %L) ORDER BY id)', p_project_id)),
        ('UboqExtractionCandidate', format('SELECT ARRAY(SELECT id::text FROM "UboqExtractionCandidate" WHERE "sourceDocumentId" IN (SELECT id FROM "UboqSourceDocument" WHERE "projectId" = %L) ORDER BY id)', p_project_id)),
        ('UboqTaxPricingProfile', format('SELECT ARRAY(SELECT id::text FROM "UboqTaxPricingProfile" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('UboqContractAuthority', format('SELECT ARRAY(SELECT id::text FROM "UboqContractAuthority" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('UboqOperationalSnapshot', format('SELECT ARRAY(SELECT id::text FROM "UboqOperationalSnapshot" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('UboqAwardedPhaseLine', format('SELECT ARRAY(SELECT id::text FROM "UboqAwardedPhaseLine" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('UboqConsolidationGroup', format('SELECT ARRAY(SELECT id::text FROM "UboqConsolidationGroup" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('UboqConsolidationLink', format('SELECT ARRAY(SELECT id::text FROM "UboqConsolidationLink" WHERE "consolidationGroupId" IN (SELECT id FROM "UboqConsolidationGroup" WHERE "projectId" = %L) ORDER BY id)', p_project_id)),
        ('UboqAgencyEstimateBaseline', format('SELECT ARRAY(SELECT id::text FROM "UboqAgencyEstimateBaseline" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('UboqContractorTargetBudget', format('SELECT ARRAY(SELECT id::text FROM "UboqContractorTargetBudget" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('UboqCanonicalResourceAccount', format('SELECT ARRAY(SELECT id::text FROM "UboqCanonicalResourceAccount" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('UboqProcurementResourceRequirement', format('SELECT ARRAY(SELECT id::text FROM "UboqProcurementResourceRequirement" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('UboqResourceWorkItemAllocation', format('SELECT ARRAY(SELECT id::text FROM "UboqResourceWorkItemAllocation" WHERE "prrId" IN (SELECT id FROM "UboqProcurementResourceRequirement" WHERE "projectId" = %L) ORDER BY id)', p_project_id)),
        ('UboqStockLotEvidence', format('SELECT ARRAY(SELECT id::text FROM "UboqStockLotEvidence" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('UboqResourceLedgerEntry', format('SELECT ARRAY(SELECT id::text FROM "UboqResourceLedgerEntry" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('UboqTemplateDefinition', format('SELECT ARRAY(SELECT id::text FROM "UboqTemplateDefinition" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('UboqScheduleActivityLink', format('SELECT ARRAY(SELECT id::text FROM "UboqScheduleActivityLink" WHERE "phaseLineId" IN (SELECT id FROM "UboqAwardedPhaseLine" WHERE "projectId" = %L) ORDER BY id)', p_project_id)),
        ('UboqCashFlowPeriod', format('SELECT ARRAY(SELECT id::text FROM "UboqCashFlowPeriod" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('UboqTreasuryOpeningBalance', format('SELECT ARRAY(SELECT id::text FROM "UboqTreasuryOpeningBalance" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('UboqClientReceipt', format('SELECT ARRAY(SELECT id::text FROM "UboqClientReceipt" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('UboqClientReceiptAllocation', format('SELECT ARRAY(SELECT id::text FROM "UboqClientReceiptAllocation" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('UboqSignedRoundTripPackage', format('SELECT ARRAY(SELECT id::text FROM "UboqSignedRoundTripPackage" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('UboqRoundTripImportSubmission', format('SELECT ARRAY(SELECT id::text FROM "UboqRoundTripImportSubmission" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('UboqValidationException', format('SELECT ARRAY(SELECT id::text FROM "UboqValidationException" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('MaterialRequest', format('SELECT ARRAY(SELECT id::text FROM "MaterialRequest" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('MaterialRequestItem', format('SELECT ARRAY(SELECT id::text FROM "MaterialRequestItem" WHERE "mrId" IN (SELECT id FROM "MaterialRequest" WHERE "projectId" = %L) ORDER BY id)', p_project_id)),
        ('CanvassForm', format('SELECT ARRAY(SELECT id::text FROM "CanvassForm" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('CanvassItem', format('SELECT ARRAY(SELECT id::text FROM "CanvassItem" WHERE "canvassFormId" IN (SELECT id FROM "CanvassForm" WHERE "projectId" = %L) ORDER BY id)', p_project_id)),
        ('SupplierQuotation', format('SELECT ARRAY(SELECT id::text FROM "SupplierQuotation" WHERE "canvassFormId" IN (SELECT id FROM "CanvassForm" WHERE "projectId" = %L) ORDER BY id)', p_project_id)),
        ('QuotationItem', format('SELECT ARRAY(SELECT id::text FROM "QuotationItem" WHERE "canvassItemId" IN (SELECT ci.id FROM "CanvassItem" ci JOIN "CanvassForm" cf ON cf.id = ci."canvassFormId" WHERE cf."projectId" = %L) ORDER BY id)', p_project_id)),
        ('PurchaseOrder', format('SELECT ARRAY(SELECT po.id::text FROM "PurchaseOrder" po WHERE uboq_resolve_po_project(po."mrId", po."canvassFormId") = %L ORDER BY po.id)', p_project_id)),
        ('PurchaseOrderItem', format('SELECT ARRAY(SELECT poi.id::text FROM "PurchaseOrderItem" poi JOIN "PurchaseOrder" po ON po.id = poi."poId" WHERE uboq_resolve_po_project(po."mrId", po."canvassFormId") = %L ORDER BY poi.id)', p_project_id)),
        ('Delivery', format('SELECT ARRAY(SELECT d.id::text FROM "Delivery" d JOIN "PurchaseOrder" po ON po.id = d."poId" WHERE uboq_resolve_po_project(po."mrId", po."canvassFormId") = %L ORDER BY d.id)', p_project_id)),
        ('DeliveryItem', format('SELECT ARRAY(SELECT di.id::text FROM "DeliveryItem" di JOIN "Delivery" d ON d.id = di."deliveryId" JOIN "PurchaseOrder" po ON po.id = d."poId" WHERE uboq_resolve_po_project(po."mrId", po."canvassFormId") = %L ORDER BY di.id)', p_project_id)),
        ('AccountsPayable', format('SELECT ARRAY(SELECT ap.id::text FROM "AccountsPayable" ap JOIN "PurchaseOrder" po ON po.id = ap."poId" WHERE uboq_resolve_po_project(po."mrId", po."canvassFormId") = %L ORDER BY ap.id)', p_project_id)),
        ('MaterialIssuance', format('SELECT ARRAY(SELECT id::text FROM "MaterialIssuance" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('IssuanceItem', format('SELECT ARRAY(SELECT id::text FROM "IssuanceItem" WHERE "issuanceId" IN (SELECT id FROM "MaterialIssuance" WHERE "projectId" = %L) ORDER BY id)', p_project_id)),
        ('MaterialReturn', format('SELECT ARRAY(SELECT id::text FROM "MaterialReturn" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('ReturnItem', format('SELECT ARRAY(SELECT id::text FROM "ReturnItem" WHERE "returnId" IN (SELECT id FROM "MaterialReturn" WHERE "projectId" = %L) ORDER BY id)', p_project_id)),
        ('ConsumptionLog', format('SELECT ARRAY(SELECT id::text FROM "ConsumptionLog" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('ConsumptionItem', format('SELECT ARRAY(SELECT id::text FROM "ConsumptionItem" WHERE "logId" IN (SELECT id FROM "ConsumptionLog" WHERE "projectId" = %L) ORDER BY id)', p_project_id)),
        ('Expense', format('SELECT ARRAY(SELECT id::text FROM "Expense" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('ExpenseBreakdownItem', format('SELECT ARRAY(SELECT id::text FROM "ExpenseBreakdownItem" WHERE "expenseId" IN (SELECT id FROM "Expense" WHERE "projectId" = %L) ORDER BY id)', p_project_id)),
        ('ProjectCostLedger', format('SELECT ARRAY(SELECT id::text FROM "ProjectCostLedger" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('CommitmentLedger', format('SELECT ARRAY(SELECT id::text FROM "CommitmentLedger" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('VariationOrder', format('SELECT ARRAY(SELECT id::text FROM "VariationOrder" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('VariationOrderItem', format('SELECT ARRAY(SELECT id::text FROM "VariationOrderItem" WHERE "variationOrderId" IN (SELECT id FROM "VariationOrder" WHERE "projectId" = %L) ORDER BY id)', p_project_id)),
        ('VariationOrderDocument', format('SELECT ARRAY(SELECT id::text FROM "VariationOrderDocument" WHERE "variationOrderId" IN (SELECT id FROM "VariationOrder" WHERE "projectId" = %L) ORDER BY id)', p_project_id)),
        ('VariationOrderApproval', format('SELECT ARRAY(SELECT id::text FROM "VariationOrderApproval" WHERE "variationOrderId" IN (SELECT id FROM "VariationOrder" WHERE "projectId" = %L) ORDER BY id)', p_project_id)),
        ('AIVariationOrderValidation', format('SELECT ARRAY(SELECT id::text FROM "AIVariationOrderValidation" WHERE "variationOrderId" IN (SELECT id FROM "VariationOrder" WHERE "projectId" = %L) ORDER BY id)', p_project_id)),
        ('ClientVariationOrder', format('SELECT ARRAY(SELECT id::text FROM "ClientVariationOrder" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('SubcontractorVariationOrder', format('SELECT ARRAY(SELECT id::text FROM "SubcontractorVariationOrder" WHERE "projectId" = %L ORDER BY id)', p_project_id)),
        ('Document', format('SELECT ARRAY(SELECT id::text FROM "Document" WHERE "projectId" = %L ORDER BY id)', p_project_id))
    ) AS t(tbl_name, sql_q)
  LOOP
    EXECUTE v_tbl.sql_q INTO v_ids;
    EXECUTE format('SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY id), ''[]''::jsonb) FROM %I r WHERE id::text = ANY($1)', v_tbl.tbl_name)
      INTO v_rows
      USING v_ids;
    v_scope := v_scope || jsonb_build_object(v_tbl.tbl_name, v_rows);
    v_counts := v_counts || jsonb_build_object(v_tbl.tbl_name, COALESCE(array_length(v_ids, 1), 0));
    v_canonical_parts := array_append(
      v_canonical_parts,
      v_tbl.tbl_name || ':' || COALESCE(array_to_string(v_ids, ','), '')
    );
  END LOOP;

  SELECT COUNT(*)
  INTO v_paid_ap_cnt
  FROM "AccountsPayable" ap
  JOIN "PurchaseOrder" po ON po.id = ap."poId"
  WHERE uboq_resolve_po_project(po."mrId", po."canvassFormId") = p_project_id
    AND (
      COALESCE(ap."paidAmount", 0) > 0
      OR ap."paidAt" IS NOT NULL
      OR UPPER(COALESCE(ap.status, '')) NOT IN ('PENDING', 'DRAFT', 'OPEN', 'UNPAID', 'CREDITED_REVERSED', 'CANCELLED', 'VOID')
    );

  IF v_paid_ap_cnt > 0 THEN
    v_disqualifiers := v_disqualifiers || jsonb_build_array(
      format('DISQUALIFIED_PAID_OR_POSTED_ACCOUNTS_PAYABLE(%s)', v_paid_ap_cnt)
    );
  END IF;

  SELECT COUNT(*)
  INTO v_posted_exp_cnt
  FROM "Expense" e
  WHERE e."projectId" = p_project_id
    AND (
      UPPER(COALESCE(e.status, '')) NOT IN ('DRAFT', 'CANCELLED', 'VOID')
      OR UPPER(COALESCE(e."approvalStatus", '')) = 'APPROVED'
      OR COALESCE(e."isAccrued", false) = true
    );

  IF v_posted_exp_cnt > 0 THEN
    v_disqualifiers := v_disqualifiers || jsonb_build_array(
      format('DISQUALIFIED_POSTED_EXPENSE_RECORDS(%s)', v_posted_exp_cnt)
    );
  END IF;

  SELECT COUNT(*)
  INTO v_cross_boq_cnt
  FROM "BOQMapping" bm
  LEFT JOIN "ConsolidatedBOQItem" cb ON cb.id = bm."consolidatedBoqItemId"
  LEFT JOIN "AwardedBOQItem" ab ON ab.id = bm."awardedBoqItemId"
  WHERE (cb."projectId" = p_project_id AND ab.id IS NOT NULL AND ab."projectId" <> p_project_id)
     OR (ab."projectId" = p_project_id AND cb."projectId" <> p_project_id);

  IF v_cross_boq_cnt > 0 THEN
    v_disqualifiers := v_disqualifiers || jsonb_build_array('DISQUALIFIED_CROSS_PROJECT_BOQ_MAPPING');
  END IF;

  SELECT COUNT(*)
  INTO v_cross_po_cnt
  FROM "PurchaseOrderItem" poi
  JOIN "PurchaseOrder" po ON po.id = poi."poId"
  JOIN "ConsolidatedBOQItem" cb ON cb.id = poi."consolidatedBoqItemId"
  WHERE (uboq_resolve_po_project(po."mrId", po."canvassFormId") = p_project_id AND cb."projectId" <> p_project_id)
     OR (uboq_resolve_po_project(po."mrId", po."canvassFormId") <> p_project_id AND cb."projectId" = p_project_id);

  IF v_cross_po_cnt > 0 THEN
    v_disqualifiers := v_disqualifiers || jsonb_build_array('DISQUALIFIED_CROSS_PROJECT_PROCUREMENT_REFERENCE');
  END IF;

  SELECT COUNT(*)
  INTO v_ext_ref_cnt
  FROM "PurchaseOrderItem" poi
  JOIN "UboqCanonicalResourceAccount" cra ON cra.id = poi."canonicalResourceId"
  JOIN "PurchaseOrder" po ON po.id = poi."poId"
  WHERE cra."projectId" = p_project_id
    AND uboq_resolve_po_project(po."mrId", po."canvassFormId") <> p_project_id;

  IF v_ext_ref_cnt > 0 THEN
    v_disqualifiers := v_disqualifiers || jsonb_build_array('DISQUALIFIED_EXTERNAL_RESOURCE_ACCOUNT_LINK');
  END IF;

  -- Disqualify cross-project VO / SVO / ClientVO references
  SELECT (
    (SELECT COUNT(*) FROM "ClientVariationOrder" cvo JOIN "AwardedBOQItem" ab ON ab.id = cvo."awardedBoqItemId"
      WHERE (cvo."projectId" = p_project_id AND ab."projectId" <> p_project_id)
         OR (cvo."projectId" <> p_project_id AND ab."projectId" = p_project_id))
    +
    (SELECT COUNT(*) FROM "SubcontractorVariationOrder" svo LEFT JOIN "AwardedBOQItem" ab ON ab.id = svo."awardedBoqItemId" LEFT JOIN "SubcontractPackage" sp ON sp.id = svo."originalSubcontractId"
      WHERE svo."projectId" = p_project_id
        AND ((ab.id IS NOT NULL AND ab."projectId" <> p_project_id) OR (sp.id IS NOT NULL AND sp."projectId" <> p_project_id)))
  )
  INTO v_cross_vo_cnt;

  IF v_cross_vo_cnt > 0 THEN
    v_disqualifiers := v_disqualifiers || jsonb_build_array('DISQUALIFIED_CROSS_PROJECT_VO_REFERENCE');
  END IF;

  FOR v_tbl IN
    SELECT DISTINCT c.relname AS child_table, a.attname AS fk_col
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = con.conkey[1]
    WHERE con.contype = 'f'
      AND con.confrelid = '"Project"'::regclass
      AND n.nspname = 'public'
      AND array_length(con.conkey, 1) = 1
      AND c.relname NOT IN (
        'ProjectUserAssignment', 'ProjectSchedule', 'AwardedBOQItem', 'ConsolidatedBOQItem',
        'UboqSourceDocument', 'UboqTaxPricingProfile', 'UboqContractAuthority',
        'UboqOperationalSnapshot', 'UboqAwardedPhaseLine', 'UboqConsolidationGroup',
        'UboqAgencyEstimateBaseline', 'UboqContractorTargetBudget', 'UboqCanonicalResourceAccount',
        'UboqProcurementResourceRequirement', 'UboqStockLotEvidence', 'UboqResourceLedgerEntry',
        'UboqTemplateDefinition', 'UboqCashFlowPeriod', 'UboqTreasuryOpeningBalance',
        'UboqClientReceipt', 'UboqClientReceiptAllocation',
        'UboqSignedRoundTripPackage', 'UboqRoundTripImportSubmission',
        'UboqValidationException', 'MaterialRequest', 'CanvassForm', 'MaterialIssuance',
        'MaterialReturn', 'ConsumptionLog', 'Expense', 'ProjectCostLedger', 'CommitmentLedger',
        'VariationOrder', 'ClientVariationOrder', 'SubcontractorVariationOrder', 'Document'
      )
    ORDER BY c.relname, a.attname
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE %I = $1', v_tbl.child_table, v_tbl.fk_col)
      INTO v_dyn_cnt
      USING p_project_id;
    IF v_dyn_cnt > 0 THEN
      v_out_of_scope := v_out_of_scope || jsonb_build_object(v_tbl.child_table, v_dyn_cnt);
      v_disqualifiers := v_disqualifiers || jsonb_build_array(
        format('DISQUALIFIED_OUT_OF_SCOPE_DESCENDANT:%s(%s)', v_tbl.child_table, v_dyn_cnt)
      );
      v_canonical_parts := array_append(
        v_canonical_parts,
        format('OUT_OF_SCOPE:%s=%s', v_tbl.child_table, v_dyn_cnt::text)
      );
    END IF;
  END LOOP;

  SELECT jsonb_object_agg(
    key,
    (SELECT COALESCE(jsonb_agg(payload ORDER BY payload::text), '[]'::jsonb) FROM jsonb_array_elements(value) a(payload))
  )
  INTO v_scope
  FROM jsonb_each(v_scope);

  v_closure := uboq_recursive_cleanup_closure(v_scope);
  IF v_closure IS DISTINCT FROM v_scope THEN
    v_disqualifiers := v_disqualifiers || jsonb_build_array('DISQUALIFIED_TRANSITIVE_OR_EXTERNAL_FK_DEPENDENCY');
  END IF;

  v_eligible := (jsonb_array_length(v_disqualifiers) = 0);
  v_canonical_parts := array_append(v_canonical_parts, v_closure::text);
  v_canonical_parts := array_append(v_canonical_parts, 'ELIGIBLE:' || v_eligible::text);
  v_canonical_parts := array_append(v_canonical_parts, 'DISQ:' || v_disqualifiers::text);

  v_manifest_hash := encode(
    sha256(convert_to(array_to_string(v_canonical_parts, E'\n'), 'UTF8')),
    'hex'
  );

  RETURN jsonb_build_object(
    'projectId', p_project_id,
    'projectName', v_proj.name,
    'exists', true,
    'isSyntheticTestFixture', v_proj.is_synth,
    'uboqGovernanceEnabled', v_proj.is_gov,
    'eligible', v_eligible,
    'disqualifiers', v_disqualifiers,
    'closureCounts', v_counts,
    'outOfScopeDescendants', v_out_of_scope,
    'sharedMastersProtected', true,
    'manifestSha256', v_manifest_hash
  );
END;
$$;
ALTER FUNCTION public.uboq_build_synthetic_cleanup_manifest(text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_build_synthetic_cleanup_manifest(text)
  FROM PUBLIC, oserp_compat_app, oserp_legacy_app;
GRANT EXECUTE ON FUNCTION public.uboq_build_synthetic_cleanup_manifest(text)
  TO oserp_maint_cleanup_role, oserp_migrations_owner;

-- Controlled transaction-bound cleanup token minter (requires verified manifest SHA-256 + synthetic project row)
CREATE OR REPLACE FUNCTION public.uboq_authorize_verified_synthetic_cleanup_tx(
  p_project_id text,
  p_expected_manifest_sha256 text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_locked_id text;
  v_live_manifest jsonb;
  v_live_hash text;
  v_secret_hex text;
  v_cleanup_proof text;
BEGIN
  IF pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER') IS NOT TRUE
     AND COALESCE((SELECT rolsuper FROM pg_roles WHERE rolname = session_user), false) IS NOT TRUE THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_ROLE_DENIED: Only oserp_maint_cleanup_role may authorize synthetic cleanup (session_user=%)', session_user
      USING ERRCODE = '42501';
  END IF;

  IF p_expected_manifest_sha256 IS NULL OR lower(btrim(p_expected_manifest_sha256)) !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_MANIFEST_REQUIRED: Valid 64-character SHA-256 cleanup manifest digest is required'
      USING ERRCODE = '22023';
  END IF;

  IF p_project_id IS NULL OR p_project_id !~ '^SYNTH-UBOQ-TEST-' THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_PREFIX_REJECTED: Project id % does not match ^SYNTH-UBOQ-TEST- namespace', COALESCE(p_project_id, 'NULL')
      USING ERRCODE = 'P0001';
  END IF;

  SELECT id
  INTO v_locked_id
  FROM public."Project"
  WHERE id = p_project_id
  FOR UPDATE;

  IF v_locked_id IS NULL THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_PROJECT_NOT_FOUND: Project % does not exist', p_project_id
      USING ERRCODE = 'P0002';
  END IF;

  v_live_manifest := public.uboq_build_synthetic_cleanup_manifest(p_project_id);

  IF COALESCE((v_live_manifest->>'eligible')::boolean, false) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_DISQUALIFIED_RECORDS: Synthetic cleanup refused for % due to disqualifiers: %',
      p_project_id,
      COALESCE((v_live_manifest->'disqualifiers')::text, '[]')
      USING ERRCODE = 'P0001';
  END IF;

  v_live_hash := lower(COALESCE(v_live_manifest->>'manifestSha256', ''));
  IF v_live_hash <> lower(btrim(p_expected_manifest_sha256)) THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_STALE_MANIFEST_MISMATCH: Expected manifest % does not match live closure manifest % for project %',
      lower(btrim(p_expected_manifest_sha256)),
      v_live_hash,
      p_project_id
      USING ERRCODE = 'P0001';
  END IF;

  SELECT "secretHex"
  INTO v_secret_hex
  FROM public."_uboq_rls_trust_anchor"
  WHERE "anchorId" = 'PRIMARY';

  IF v_secret_hex IS NULL OR char_length(v_secret_hex) < 64 THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_TRUST_ANCHOR_MISSING: Primary RLS trust anchor is unavailable'
      USING ERRCODE = 'P0001';
  END IF;

  v_cleanup_proof := encode(
    sha256(
      convert_to(
        v_secret_hex
        || '|UBOQ_SYNTH_CLEANUP_V1|'
        || p_project_id
        || '|'
        || txid_current()::text,
        'UTF8'
      )
    ),
    'hex'
  );

  PERFORM set_config('app.synthetic_cleanup_authorized', 'on', true);
  PERFORM set_config('app.synthetic_cleanup_project_id', p_project_id, true);
  PERFORM set_config('app.synthetic_cleanup_proof', v_cleanup_proof, true);

  RETURN jsonb_build_object(
    'authorizedProjectId', p_project_id,
    'verifiedManifestSha256', v_live_hash,
    'txid', txid_current()::text
  );
END;
$$;
ALTER FUNCTION public.uboq_authorize_verified_synthetic_cleanup_tx(text, text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_authorize_verified_synthetic_cleanup_tx(text, text)
  FROM PUBLIC, oserp_compat_app, oserp_legacy_app;
GRANT EXECUTE ON FUNCTION public.uboq_authorize_verified_synthetic_cleanup_tx(text, text)
  TO oserp_maint_cleanup_role, oserp_migrations_owner;

CREATE OR REPLACE FUNCTION public.uboq_execute_verified_synthetic_cleanup(
  p_project_id text,
  p_expected_manifest_sha256 text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_locked_id text;
  v_live_manifest jsonb;
  v_live_hash text;
  v_secret_hex text;
  v_cleanup_proof text;
  v_deleted_ledger int := 0;
  v_lock record;
BEGIN
  IF pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER') IS NOT TRUE
     AND COALESCE((SELECT rolsuper FROM pg_roles WHERE rolname = session_user), false) IS NOT TRUE THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_ROLE_DENIED: Only oserp_maint_cleanup_role may execute synthetic cleanup (session_user=%)', session_user
      USING ERRCODE = '42501';
  END IF;

  IF p_expected_manifest_sha256 IS NULL OR lower(btrim(p_expected_manifest_sha256)) !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_MANIFEST_REQUIRED: Valid 64-character SHA-256 cleanup manifest digest is required'
      USING ERRCODE = '22023';
  END IF;

  IF p_project_id IS NULL OR p_project_id !~ '^SYNTH-UBOQ-TEST-' THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_PREFIX_REJECTED: Project id % does not match ^SYNTH-UBOQ-TEST- namespace', p_project_id
      USING ERRCODE = 'P0001';
  END IF;

  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_REQUIRES_READ_COMMITTED';
  END IF;

  PERFORM set_config('lock_timeout', '5000ms', true);

  IF EXISTS (
    SELECT 1 FROM pg_constraint k
    WHERE k.contype = 'f'
      AND k.conrelid IN (
        'public."Employer"'::regclass,
        'public."EmployerPayrollAuthority"'::regclass,
        'public._company_payroll_commands'::regclass,
        'public._company_payroll_trust_anchor'::regclass
      )
      AND k.confrelid NOT IN ('public."Employer"'::regclass, 'public."User"'::regclass)
  ) THEN
    RAISE EXCEPTION 'CLEANUP_PROTECTED_MASTER_DEPENDENCY_DRIFT';
  END IF;

  FOR v_lock IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND c.relname NOT IN (
        'Employer',
        'EmployerPayrollAuthority',
        '_company_payroll_commands',
        '_company_payroll_trust_anchor'
      )
    ORDER BY c.relname
  LOOP
    EXECUTE format('LOCK TABLE public.%I IN SHARE ROW EXCLUSIVE MODE', v_lock.relname);
  END LOOP;

  SELECT id
  INTO v_locked_id
  FROM "Project"
  WHERE id = p_project_id
  FOR UPDATE;

  IF v_locked_id IS NULL THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_PROJECT_NOT_FOUND: Project % does not exist', p_project_id
      USING ERRCODE = 'P0002';
  END IF;

  v_live_manifest := uboq_build_synthetic_cleanup_manifest(p_project_id);

  IF COALESCE((v_live_manifest->>'eligible')::boolean, false) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_DISQUALIFIED_RECORDS: Synthetic cleanup refused for % due to disqualifiers: %',
      p_project_id,
      COALESCE((v_live_manifest->'disqualifiers')::text, '[]')
      USING ERRCODE = 'P0001';
  END IF;

  v_live_hash := lower(COALESCE(v_live_manifest->>'manifestSha256', ''));
  IF v_live_hash <> lower(btrim(p_expected_manifest_sha256)) THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_STALE_MANIFEST_MISMATCH: Expected manifest % does not match live closure manifest % for project %',
      lower(btrim(p_expected_manifest_sha256)),
      v_live_hash,
      p_project_id
      USING ERRCODE = 'P0001';
  END IF;

  SELECT "secretHex"
  INTO v_secret_hex
  FROM public."_uboq_rls_trust_anchor"
  WHERE "anchorId" = 'PRIMARY';

  IF v_secret_hex IS NULL OR char_length(v_secret_hex) < 64 THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_TRUST_ANCHOR_MISSING: Primary RLS trust anchor is unavailable'
      USING ERRCODE = 'P0001';
  END IF;

  v_cleanup_proof := encode(
    sha256(
      convert_to(
        v_secret_hex
        || '|UBOQ_SYNTH_CLEANUP_V1|'
        || p_project_id
        || '|'
        || txid_current()::text,
        'UTF8'
      )
    ),
    'hex'
  );

  PERFORM set_config('app.synthetic_cleanup_authorized', 'on', true);
  PERFORM set_config('app.synthetic_cleanup_project_id', p_project_id, true);
  PERFORM set_config('app.synthetic_cleanup_proof', v_cleanup_proof, true);

  DELETE FROM "ExpenseBreakdownItem" WHERE "expenseId" IN (SELECT id FROM "Expense" WHERE "projectId" = p_project_id);
  DELETE FROM "Expense" WHERE "projectId" = p_project_id;
  DELETE FROM "ProjectCostLedger" WHERE "projectId" = p_project_id;
  DELETE FROM "CommitmentLedger" WHERE "projectId" = p_project_id;
  DELETE FROM "AccountsPayable" WHERE "poId" IN (
    SELECT po.id FROM "PurchaseOrder" po
    WHERE uboq_resolve_po_project(po."mrId", po."canvassFormId") = p_project_id
  );
  DELETE FROM "ReturnItem" WHERE "returnId" IN (SELECT id FROM "MaterialReturn" WHERE "projectId" = p_project_id);
  DELETE FROM "MaterialReturn" WHERE "projectId" = p_project_id;
  DELETE FROM "IssuanceItem" WHERE "issuanceId" IN (SELECT id FROM "MaterialIssuance" WHERE "projectId" = p_project_id);
  DELETE FROM "MaterialIssuance" WHERE "projectId" = p_project_id;
  DELETE FROM "ConsumptionItem" WHERE "logId" IN (SELECT id FROM "ConsumptionLog" WHERE "projectId" = p_project_id);
  DELETE FROM "ConsumptionLog" WHERE "projectId" = p_project_id;
  DELETE FROM "DeliveryItem" WHERE "deliveryId" IN (
    SELECT d.id FROM "Delivery" d
    JOIN "PurchaseOrder" po ON po.id = d."poId"
    WHERE uboq_resolve_po_project(po."mrId", po."canvassFormId") = p_project_id
  );
  DELETE FROM "Delivery" WHERE "poId" IN (
    SELECT po.id FROM "PurchaseOrder" po
    WHERE uboq_resolve_po_project(po."mrId", po."canvassFormId") = p_project_id
  );
  DELETE FROM "PurchaseOrderItem" WHERE "poId" IN (
    SELECT po.id FROM "PurchaseOrder" po
    WHERE uboq_resolve_po_project(po."mrId", po."canvassFormId") = p_project_id
  );
  DELETE FROM "PurchaseOrder" WHERE uboq_resolve_po_project("mrId", "canvassFormId") = p_project_id;

  DELETE FROM "AIVariationOrderValidation" WHERE "variationOrderId" IN (
    SELECT id FROM "VariationOrder" WHERE "projectId" = p_project_id
  );
  DELETE FROM "VariationOrderApproval" WHERE "variationOrderId" IN (
    SELECT id FROM "VariationOrder" WHERE "projectId" = p_project_id
  );
  DELETE FROM "VariationOrderDocument" WHERE "variationOrderId" IN (
    SELECT id FROM "VariationOrder" WHERE "projectId" = p_project_id
  );
  DELETE FROM "VariationOrderItem" WHERE "variationOrderId" IN (
    SELECT id FROM "VariationOrder" WHERE "projectId" = p_project_id
  );
  DELETE FROM "ClientVariationOrder" WHERE "projectId" = p_project_id;
  DELETE FROM "SubcontractorVariationOrder" WHERE "projectId" = p_project_id;
  DELETE FROM "VariationOrder" WHERE "projectId" = p_project_id;
  DELETE FROM "Document" WHERE "projectId" = p_project_id;

  DELETE FROM "QuotationItem" WHERE "canvassItemId" IN (
    SELECT ci.id FROM "CanvassItem" ci
    JOIN "CanvassForm" cf ON cf.id = ci."canvassFormId"
    WHERE cf."projectId" = p_project_id
  );
  DELETE FROM "SupplierQuotation" WHERE "canvassFormId" IN (SELECT id FROM "CanvassForm" WHERE "projectId" = p_project_id);
  DELETE FROM "CanvassItem" WHERE "canvassFormId" IN (SELECT id FROM "CanvassForm" WHERE "projectId" = p_project_id);
  DELETE FROM "CanvassForm" WHERE "projectId" = p_project_id;
  DELETE FROM "MaterialRequestItem" WHERE "mrId" IN (SELECT id FROM "MaterialRequest" WHERE "projectId" = p_project_id);
  DELETE FROM "MaterialRequest" WHERE "projectId" = p_project_id;

  DELETE FROM "UboqResourceLedgerEntry" WHERE "projectId" = p_project_id;
  GET DIAGNOSTICS v_deleted_ledger = ROW_COUNT;
  DELETE FROM "UboqStockLotEvidence" WHERE "projectId" = p_project_id;
  UPDATE "UboqCanonicalResourceAccount" SET "activeApprovedPrId" = NULL WHERE "projectId" = p_project_id;
  UPDATE "UboqProcurementResourceRequirement" SET "supersedesId" = NULL WHERE "projectId" = p_project_id;
  DELETE FROM "UboqResourceWorkItemAllocation" WHERE "prrId" IN (
    SELECT id FROM "UboqProcurementResourceRequirement" WHERE "projectId" = p_project_id
  );
  DELETE FROM "UboqProcurementResourceRequirement" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqCanonicalResourceAccount" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqConsolidationLink" WHERE "consolidationGroupId" IN (
    SELECT id FROM "UboqConsolidationGroup" WHERE "projectId" = p_project_id
  );
  DELETE FROM "UboqConsolidationGroup" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqScheduleActivityLink" WHERE "phaseLineId" IN (
    SELECT id FROM "UboqAwardedPhaseLine" WHERE "projectId" = p_project_id
  );
  DELETE FROM "UboqAgencyEstimateBaseline" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqContractorTargetBudget" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqCashFlowPeriod" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqTreasuryOpeningBalance" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqClientReceiptAllocation" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqClientReceipt" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqRoundTripImportSubmission" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqSignedRoundTripPackage" WHERE "projectId" = p_project_id;
  DELETE FROM "SensitiveExportLog" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqValidationException" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqAwardedPhaseLine" WHERE "projectId" = p_project_id;
  UPDATE "UboqOperationalSnapshot" SET "supersedesSnapshotId" = NULL WHERE "projectId" = p_project_id;
  DELETE FROM "UboqOperationalSnapshot" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqContractAuthority" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqTaxPricingProfile" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqExtractionCandidate" WHERE "sourceDocumentId" IN (SELECT id FROM "UboqSourceDocument" WHERE "projectId" = p_project_id);
  DELETE FROM "UboqDocumentSection" WHERE "sourceDocumentId" IN (SELECT id FROM "UboqSourceDocument" WHERE "projectId" = p_project_id);
  DELETE FROM "UboqSourceDocument" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqTemplateDefinition" WHERE "projectId" = p_project_id;
  DELETE FROM "BOQMapping" WHERE "consolidatedBoqItemId" IN (SELECT id FROM "ConsolidatedBOQItem" WHERE "projectId" = p_project_id)
    OR "awardedBoqItemId" IN (SELECT id FROM "AwardedBOQItem" WHERE "projectId" = p_project_id);
  DELETE FROM "ConsolidatedBOQItem" WHERE "projectId" = p_project_id;
  DELETE FROM "AwardedBOQItem" WHERE "projectId" = p_project_id;
  DELETE FROM "ProjectSchedule" WHERE "projectId" = p_project_id;
  DELETE FROM "ProjectUserAssignment" WHERE "projectId" = p_project_id;
  DELETE FROM "Project" WHERE id = p_project_id;

  PERFORM set_config('app.synthetic_cleanup_authorized', 'off', true);
  PERFORM set_config('app.synthetic_cleanup_project_id', '', true);
  PERFORM set_config('app.synthetic_cleanup_proof', '', true);

  RETURN jsonb_build_object(
    'cleanedProjectId', p_project_id,
    'verifiedManifestSha256', v_live_hash,
    'deletedLedgerRows', v_deleted_ledger,
    'closureCounts', v_live_manifest->'closureCounts'
  );
END;
$$;
ALTER FUNCTION public.uboq_execute_verified_synthetic_cleanup(text, text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_execute_verified_synthetic_cleanup(text, text)
  FROM PUBLIC, oserp_compat_app, oserp_legacy_app;
GRANT EXECUTE ON FUNCTION public.uboq_execute_verified_synthetic_cleanup(text, text)
  TO oserp_maint_cleanup_role, oserp_migrations_owner;
