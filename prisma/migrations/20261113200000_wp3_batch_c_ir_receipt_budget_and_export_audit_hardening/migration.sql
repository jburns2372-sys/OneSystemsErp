-- ============================================================================
-- OSERP-PROJ-UBOQ-001 — WP-3 BATCH C INDEPENDENT REVIEW REMEDIATION
-- (MIGRATION #31, FORWARD-ONLY)
-- Scope:
--   1. WP3-BC-IR-01: Adds canonical project-level client receipt and verified
--      multi-billing allocation tables (UboqClientReceipt &
--      UboqClientReceiptAllocation) with ENABLE + FORCE RLS, tenant binding,
--      legacy-role governed-project denial, and cross-project/billing/payment
--      integrity trigger guards.
--   2. WP3-BC-IR-04: Adds snapshotId, revisionNumber, and supersedesId lineage
--      columns to UboqContractorTargetBudget with same-project, snapshot-scope,
--      and strictly increasing revision lineage trigger guards.
--   3. WP3-BC-IR-05: Hardens SensitiveExportLog with operation-specific
--      SECURITY DEFINER append authority (uboq_append_sensitive_export_log)
--      plus trigger and RLS WITH CHECK enforcement so signed non-executive or
--      raw-SQL callers cannot fabricate approved=true sensitive-export records,
--      while preserving verified UBOQ_FORMAL_TEMPLATES audit linkage.
--   4. Preserves Migrations #1-#30 byte-for-byte unchanged.
-- ============================================================================

-- 1. UboqContractorTargetBudget Snapshot & Revision Lineage Columns + Guards (WP3-BC-IR-04)
ALTER TABLE public."UboqContractorTargetBudget"
  ADD COLUMN IF NOT EXISTS "snapshotId" TEXT,
  ADD COLUMN IF NOT EXISTS "revisionNumber" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "supersedesId" TEXT;

ALTER TABLE public."UboqContractorTargetBudget"
  DROP CONSTRAINT IF EXISTS chk_uboq_target_budget_revision_positive,
  ADD CONSTRAINT chk_uboq_target_budget_revision_positive
    CHECK ("revisionNumber" >= 1),
  DROP CONSTRAINT IF EXISTS chk_uboq_target_budget_no_self_supersede,
  ADD CONSTRAINT chk_uboq_target_budget_no_self_supersede
    CHECK ("supersedesId" IS NULL OR "supersedesId" <> id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UboqContractorTargetBudget_snapshotId_fkey'
  ) THEN
    ALTER TABLE public."UboqContractorTargetBudget"
      ADD CONSTRAINT "UboqContractorTargetBudget_snapshotId_fkey"
      FOREIGN KEY ("snapshotId")
      REFERENCES public."UboqOperationalSnapshot"("id")
      ON DELETE RESTRICT ON UPDATE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UboqContractorTargetBudget_supersedesId_fkey'
  ) THEN
    ALTER TABLE public."UboqContractorTargetBudget"
      ADD CONSTRAINT "UboqContractorTargetBudget_supersedesId_fkey"
      FOREIGN KEY ("supersedesId")
      REFERENCES public."UboqContractorTargetBudget"("id")
      ON DELETE RESTRICT ON UPDATE RESTRICT;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS "UboqContractorTargetBudget_projectId_snapshotId_idx"
  ON public."UboqContractorTargetBudget"("projectId", "snapshotId");

CREATE INDEX IF NOT EXISTS "UboqContractorTargetBudget_projectId_supersedesId_idx"
  ON public."UboqContractorTargetBudget"("projectId", "supersedesId");

CREATE OR REPLACE FUNCTION public.uboq_guard_target_budget_lineage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_snap record;
  v_pl record;
  v_prior record;
BEGIN
  IF current_setting('app.synthetic_cleanup_authorized', true) = 'on'
     AND pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER') THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF NEW."snapshotId" IS NOT NULL THEN
    SELECT id, "projectId"
    INTO v_snap
    FROM public."UboqOperationalSnapshot"
    WHERE id = NEW."snapshotId";

    IF v_snap.id IS NULL OR v_snap."projectId" IS DISTINCT FROM NEW."projectId" THEN
      RAISE EXCEPTION 'UBOQ_TARGET_BUDGET_SNAPSHOT_MISMATCH: Snapshot % does not belong to project %',
        NEW."snapshotId", NEW."projectId"
        USING ERRCODE = '23503';
    END IF;
  END IF;

  IF NEW."phaseLineId" IS NOT NULL THEN
    SELECT id, "projectId", "snapshotId"
    INTO v_pl
    FROM public."UboqAwardedPhaseLine"
    WHERE id = NEW."phaseLineId";

    IF v_pl.id IS NULL OR v_pl."projectId" IS DISTINCT FROM NEW."projectId" THEN
      RAISE EXCEPTION 'UBOQ_TARGET_BUDGET_PHASE_LINE_MISMATCH: Phase line % does not belong to project %',
        NEW."phaseLineId", NEW."projectId"
        USING ERRCODE = '23503';
    END IF;

    IF NEW."snapshotId" IS NOT NULL AND v_pl."snapshotId" IS DISTINCT FROM NEW."snapshotId" THEN
      RAISE EXCEPTION 'UBOQ_TARGET_BUDGET_PHASE_SNAPSHOT_MISMATCH: Phase line % belongs to snapshot % rather than %',
        NEW."phaseLineId", COALESCE(v_pl."snapshotId", 'NULL'), NEW."snapshotId"
        USING ERRCODE = '22023';
    END IF;
  END IF;

  IF NEW."supersedesId" IS NOT NULL THEN
    SELECT id, "projectId", "phaseLineId", "revisionNumber"
    INTO v_prior
    FROM public."UboqContractorTargetBudget"
    WHERE id = NEW."supersedesId";

    IF v_prior.id IS NULL OR v_prior."projectId" IS DISTINCT FROM NEW."projectId" THEN
      RAISE EXCEPTION 'UBOQ_TARGET_BUDGET_SUPERSEDES_PROJECT_MISMATCH: Prior target budget % does not belong to project %',
        NEW."supersedesId", NEW."projectId"
        USING ERRCODE = '23503';
    END IF;

    IF COALESCE(v_prior."phaseLineId", '') <> COALESCE(NEW."phaseLineId", '') THEN
      RAISE EXCEPTION 'UBOQ_TARGET_BUDGET_SUPERSEDES_SCOPE_MISMATCH: Target budget revision cannot supersede a different scope'
        USING ERRCODE = '22023';
    END IF;

    IF NEW."revisionNumber" <= v_prior."revisionNumber" THEN
      RAISE EXCEPTION 'UBOQ_TARGET_BUDGET_REVISION_ORDER_INVALID: revisionNumber (%) must exceed superseded revisionNumber (%)',
        NEW."revisionNumber", v_prior."revisionNumber"
        USING ERRCODE = '22023';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
ALTER FUNCTION public.uboq_guard_target_budget_lineage()
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_guard_target_budget_lineage()
  FROM PUBLIC, oserp_maint_cleanup_role;

DROP TRIGGER IF EXISTS trg_uboq_guard_target_budget_lineage ON public."UboqContractorTargetBudget";
CREATE TRIGGER trg_uboq_guard_target_budget_lineage
  BEFORE INSERT OR UPDATE ON public."UboqContractorTargetBudget"
  FOR EACH ROW
  EXECUTE FUNCTION public.uboq_guard_target_budget_lineage();

-- 2. Canonical Project-Level Client Receipt & Verified Allocation Ledger (WP3-BC-IR-01)
CREATE TABLE IF NOT EXISTS public."UboqClientReceipt" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "receiptReference" TEXT NOT NULL,
  "receiptDate" TIMESTAMP(3) NOT NULL,
  "totalReceiptAmount" DECIMAL(18, 2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'VERIFIED',
  "verifiedById" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "remarks" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UboqClientReceipt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chk_uboq_client_receipt_positive_amt" CHECK ("totalReceiptAmount" > 0),
  CONSTRAINT "chk_uboq_client_receipt_nonempty_ref" CHECK (BTRIM("receiptReference") <> ''),
  CONSTRAINT "UboqClientReceipt_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES public."Project"("id")
    ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS "UboqClientReceipt_projectId_receiptReference_key"
  ON public."UboqClientReceipt"("projectId", "receiptReference");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_uboq_client_receipt_project_ref_norm"
  ON public."UboqClientReceipt"("projectId", UPPER(BTRIM("receiptReference")));

CREATE INDEX IF NOT EXISTS "UboqClientReceipt_projectId_idx"
  ON public."UboqClientReceipt"("projectId");

CREATE TABLE IF NOT EXISTS public."UboqClientReceiptAllocation" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "receiptId" TEXT NOT NULL,
  "billingId" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "allocatedAmount" DECIMAL(18, 2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UboqClientReceiptAllocation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chk_uboq_client_receipt_alloc_positive_amt" CHECK ("allocatedAmount" > 0),
  CONSTRAINT "UboqClientReceiptAllocation_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES public."Project"("id")
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "UboqClientReceiptAllocation_receiptId_fkey"
    FOREIGN KEY ("receiptId") REFERENCES public."UboqClientReceipt"("id")
    ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT "UboqClientReceiptAllocation_billingId_fkey"
    FOREIGN KEY ("billingId") REFERENCES public."Billing"("id")
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "UboqClientReceiptAllocation_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES public."Payment"("id")
    ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS "UboqClientReceiptAllocation_paymentId_key"
  ON public."UboqClientReceiptAllocation"("paymentId");

CREATE UNIQUE INDEX IF NOT EXISTS "UboqClientReceiptAllocation_receiptId_billingId_key"
  ON public."UboqClientReceiptAllocation"("receiptId", "billingId");

CREATE INDEX IF NOT EXISTS "UboqClientReceiptAllocation_projectId_receiptId_idx"
  ON public."UboqClientReceiptAllocation"("projectId", "receiptId");

REVOKE ALL ON public."UboqClientReceipt", public."UboqClientReceiptAllocation" FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON
  public."UboqClientReceipt",
  public."UboqClientReceiptAllocation"
TO oserp_compat_app;
GRANT SELECT, DELETE ON
  public."UboqClientReceipt",
  public."UboqClientReceiptAllocation"
TO oserp_maint_cleanup_role;

DO $$
DECLARE
  v_tbl text;
BEGIN
  FOREACH v_tbl IN ARRAY ARRAY['UboqClientReceipt', 'UboqClientReceiptAllocation']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_tbl);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', v_tbl);

    EXECUTE format('DROP POLICY IF EXISTS rls_permissive_app_access ON public.%I', v_tbl);
    EXECUTE format(
      'CREATE POLICY rls_permissive_app_access ON public.%I AS PERMISSIVE FOR ALL TO oserp_compat_app USING (true) WITH CHECK (true)',
      v_tbl
    );

    EXECUTE format('DROP POLICY IF EXISTS rls_permissive_maint_cleanup ON public.%I', v_tbl);
    EXECUTE format(
      'CREATE POLICY rls_permissive_maint_cleanup ON public.%I AS PERMISSIVE FOR ALL TO oserp_maint_cleanup_role USING (current_setting(''app.synthetic_cleanup_authorized'', true) = ''on'') WITH CHECK (current_setting(''app.synthetic_cleanup_authorized'', true) = ''on'')',
      v_tbl
    );

    EXECUTE format('DROP POLICY IF EXISTS rls_restrictive_tenant_scope ON public.%I', v_tbl);
    EXECUTE format(
      'CREATE POLICY rls_restrictive_tenant_scope ON public.%I AS RESTRICTIVE FOR ALL TO oserp_compat_app USING (public.uboq_check_tenant_rls("projectId")) WITH CHECK (public.uboq_check_tenant_rls("projectId"))',
      v_tbl
    );

    EXECUTE format('DROP POLICY IF EXISTS rls_block_legacy_role_on_uboq ON public.%I', v_tbl);
    EXECUTE format(
      'CREATE POLICY rls_block_legacy_role_on_uboq ON public.%I AS RESTRICTIVE FOR ALL TO oserp_legacy_app USING (NOT public.uboq_is_governed_project("projectId")) WITH CHECK (NOT public.uboq_is_governed_project("projectId"))',
      v_tbl
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.uboq_guard_client_receipt_allocation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_rec record;
  v_bil record;
  v_pay record;
BEGIN
  IF current_setting('app.synthetic_cleanup_authorized', true) = 'on'
     AND pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER') THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  SELECT id, "projectId"
  INTO v_rec
  FROM public."UboqClientReceipt"
  WHERE id = NEW."receiptId";

  IF v_rec.id IS NULL OR v_rec."projectId" IS DISTINCT FROM NEW."projectId" THEN
    RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_ALLOC_PROJECT_MISMATCH: Receipt % does not belong to project %',
      NEW."receiptId", NEW."projectId"
      USING ERRCODE = '23503';
  END IF;

  SELECT id, "projectId"
  INTO v_bil
  FROM public."Billing"
  WHERE id = NEW."billingId";

  IF v_bil.id IS NULL OR v_bil."projectId" IS DISTINCT FROM NEW."projectId" THEN
    RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_ALLOC_BILLING_MISMATCH: Billing % does not belong to project %',
      NEW."billingId", NEW."projectId"
      USING ERRCODE = '23503';
  END IF;

  SELECT id, "billingId"
  INTO v_pay
  FROM public."Payment"
  WHERE id = NEW."paymentId";

  IF v_pay.id IS NULL OR v_pay."billingId" IS DISTINCT FROM NEW."billingId" THEN
    RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_ALLOC_PAYMENT_MISMATCH: Payment % does not belong to billing %',
      NEW."paymentId", NEW."billingId"
      USING ERRCODE = '23503';
  END IF;

  RETURN NEW;
END;
$$;
ALTER FUNCTION public.uboq_guard_client_receipt_allocation()
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_guard_client_receipt_allocation()
  FROM PUBLIC, oserp_maint_cleanup_role;

DROP TRIGGER IF EXISTS trg_uboq_guard_client_receipt_allocation ON public."UboqClientReceiptAllocation";
CREATE TRIGGER trg_uboq_guard_client_receipt_allocation
  BEFORE INSERT OR UPDATE ON public."UboqClientReceiptAllocation"
  FOR EACH ROW
  EXECUTE FUNCTION public.uboq_guard_client_receipt_allocation();

-- 3. SensitiveExportLog Operation-Specific Provenance & Authorization Hardening (WP3-BC-IR-05)
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
    AND COALESCE(approved, false) <> COALESCE(blocked, false)
    AND (
      (
        module = 'UBOQ_EXECUTIVE_TEMPLATES'
        AND current_setting('app.uboq_sensitive_export_fn_active', true) = 'on'
        AND (
          approved IS NOT TRUE
          OR public.uboq_actor_has_executive_sensitive_access(
            "projectId",
            NULLIF(current_setting('app.current_user_id', true), '')
          )
        )
      )
      OR (
        module = 'UBOQ_FORMAL_TEMPLATES'
        AND approved IS TRUE
        AND blocked IS FALSE
        AND public.uboq_can_formal_export_template(
          "projectId",
          NULLIF(current_setting('app.current_user_id', true), '')
        )
      )
    )
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
  v_formal_audit_cnt integer;
  v_prior_formal_sel_cnt integer;
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

    IF COALESCE(NEW.approved, false) = COALESCE(NEW.blocked, false) THEN
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_STATE_INVALID: approved (%) and blocked (%) must be mutually exclusive',
        COALESCE(NEW.approved, false), COALESCE(NEW.blocked, false)
        USING ERRCODE = '22023';
    END IF;

    IF NEW.module = 'UBOQ_EXECUTIVE_TEMPLATES' THEN
      IF NEW.approved IS TRUE
         AND public.uboq_actor_has_executive_sensitive_access(NEW."projectId", NEW."userId") IS NOT TRUE THEN
        RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_UNAUTHORIZED_APPROVAL: Actor % lacks executive sensitive-export authority on project %',
          NEW."userId", NEW."projectId"
          USING ERRCODE = '42501';
      END IF;

      IF current_setting('app.uboq_sensitive_export_fn_active', true) IS DISTINCT FROM 'on' THEN
        RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_DIRECT_INSERT_DENIED: Direct table INSERT on SensitiveExportLog is prohibited; use uboq_append_sensitive_export_log'
          USING ERRCODE = '42501';
      END IF;
    ELSIF NEW.module = 'UBOQ_FORMAL_TEMPLATES' THEN
      IF NEW.approved IS NOT TRUE OR NEW.blocked IS NOT FALSE THEN
        RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_STATE_INVALID: UBOQ_FORMAL_TEMPLATES export log requires approved=true and blocked=false'
          USING ERRCODE = '22023';
      END IF;

      IF public.uboq_can_formal_export_template(NEW."projectId", NEW."userId") IS NOT TRUE THEN
        RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_UNAUTHORIZED_APPROVAL: Actor % lacks formal-export authority on project %',
          NEW."userId", NEW."projectId"
          USING ERRCODE = '42501';
      END IF;

      SELECT count(*)::integer
      INTO v_formal_audit_cnt
      FROM public."UboqTemplateAuditEvent" e
      WHERE e."projectId" = NEW."projectId"
        AND e."actorUserId" = NEW."userId"
        AND e."eventType" = 'FORMAL_EXPORT_GENERATED'
        AND (e."contractCode" || ':' || UPPER(COALESCE(e."exportFormat", ''))) = NEW."exportType"
        AND e."outputSha256" IS NOT NULL
        AND POSITION('sha256=' || e."outputSha256" IN COALESCE(NEW.reason, '')) > 0;

      SELECT count(*)::integer
      INTO v_prior_formal_sel_cnt
      FROM public."SensitiveExportLog" prev
      WHERE prev."projectId" = NEW."projectId"
        AND prev."userId" = NEW."userId"
        AND prev.module = 'UBOQ_FORMAL_TEMPLATES'
        AND prev."exportType" = NEW."exportType"
        AND COALESCE(prev.reason, '') = COALESCE(NEW.reason, '');

      IF v_formal_audit_cnt <= v_prior_formal_sel_cnt THEN
        RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_DIRECT_INSERT_DENIED: Unverified UBOQ_FORMAL_TEMPLATES export log without matching UboqTemplateAuditEvent provenance'
          USING ERRCODE = '42501';
      END IF;
    ELSE
      IF NEW.approved IS TRUE
         AND public.uboq_actor_has_executive_sensitive_access(NEW."projectId", NEW."userId") IS NOT TRUE THEN
        RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_UNAUTHORIZED_APPROVAL: Actor % lacks sensitive-export approval authority on project %',
          NEW."userId", NEW."projectId"
          USING ERRCODE = '42501';
      END IF;

      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_DIRECT_INSERT_DENIED: Unsupported governed SensitiveExportLog module (%) via direct table INSERT',
        COALESCE(NEW.module, 'NULL')
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
ALTER FUNCTION public.uboq_guard_sensitive_export_log()
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_guard_sensitive_export_log()
  FROM PUBLIC, oserp_maint_cleanup_role;

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
  p_reason text
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
  v_snap record;
  v_phase_cnt integer;
  v_row public."SensitiveExportLog";
BEGIN
  IF p_id IS NULL OR p_id !~ '^[A-Za-z0-9_-]{8,160}$' THEN
    RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_INVALID_ID: Valid audit event id required'
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

  IF v_fmt NOT IN ('JSON', 'XLSX', 'CSV') THEN
    RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_INVALID_FORMAT: Unsupported export format (%)', v_fmt
      USING ERRCODE = '22023';
  END IF;

  IF COALESCE(p_approved, false) = COALESCE(p_blocked, false) THEN
    RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_STATE_INVALID: approved and blocked must be mutually exclusive'
      USING ERRCODE = '22023';
  END IF;

  IF p_approved IS TRUE THEN
    IF v_tpl NOT IN ('T8_CASHFLOW_HALF_MONTH', 'T9_CASHFLOW_QUARTERLY', 'T10_EXECUTIVE_MARGIN') THEN
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_INVALID_TEMPLATE: Approved executive sensitive export requires T8/T9/T10, got (%)',
        v_tpl
        USING ERRCODE = '22023';
    END IF;

    IF public.uboq_actor_has_executive_sensitive_access(p_project_id, p_user_id) IS NOT TRUE THEN
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_UNAUTHORIZED_APPROVAL: Actor % lacks executive sensitive-export authority on project %',
        p_user_id, p_project_id
        USING ERRCODE = '42501';
    END IF;

    IF COALESCE(p_record_count, 0) <= 0 THEN
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_INVALID_COUNT: Approved sensitive export requires recordCount > 0'
        USING ERRCODE = '22023';
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
      'T10_EXECUTIVE_MARGIN'
    ) THEN
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_INVALID_TEMPLATE: Unsupported template code (%)', v_tpl
        USING ERRCODE = '22023';
    END IF;

    IF COALESCE(p_record_count, 0) <> 0 THEN
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_INVALID_COUNT: Blocked sensitive export requires recordCount = 0'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  PERFORM set_config('app.uboq_sensitive_export_fn_active', 'on', true);
  BEGIN
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
        || CASE WHEN p_source_id IS NOT NULL AND BTRIM(p_source_id) <> '' THEN ' [source=' || BTRIM(p_source_id) || ']' ELSE '' END,
        500
      )
    )
    RETURNING * INTO v_row;

    PERFORM set_config('app.uboq_sensitive_export_fn_active', 'off', true);
  EXCEPTION
    WHEN OTHERS THEN
      PERFORM set_config('app.uboq_sensitive_export_fn_active', 'off', true);
      RAISE;
  END;

  RETURN v_row;
END;
$$;
ALTER FUNCTION public.uboq_append_sensitive_export_log(
  text, text, text, text, text, text, text, integer, text, boolean, boolean, text
) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_append_sensitive_export_log(
  text, text, text, text, text, text, text, integer, text, boolean, boolean, text
) FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_append_sensitive_export_log(
  text, text, text, text, text, text, text, integer, text, boolean, boolean, text
) TO oserp_compat_app;
