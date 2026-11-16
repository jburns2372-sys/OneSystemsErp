-- ============================================================================
-- OSERP-PROJ-UBOQ-001 — WP-3 BATCH C FINAL CONTROL HARDENING
-- (MIGRATION #32, FORWARD-ONLY)
-- Scope:
--   1. WP3-BC-IR-R2-01 (SensitiveExportLog Audit Authority):
--      - Revokes direct INSERT/UPDATE/DELETE privileges on public."SensitiveExportLog"
--        from oserp_compat_app; enforces function-only append via kernel-verified
--        SECURITY DEFINER owner identity (current_user = 'oserp_migrations_owner')
--        with ZERO reliance on caller-settable custom PostgreSQL GUCs.
--      - Replaces 12-arg uboq_append_sensitive_export_log with 14-arg cryptographic
--        payload-attested function verified inside PostgreSQL against owner-private
--        "_uboq_rls_trust_anchor", preventing signed executives with raw SQL access
--        from fabricating approved export logs.
--      - Adds attested SECURITY DEFINER uboq_append_formal_sensitive_export_log
--        bound 1-to-1 to authoritative FORMAL_EXPORT_GENERATED audit events so
--        T0/T1/T4/T5/T6 formal exports remain intact without direct table INSERT.
--   2. WP3-BC-IR-R2-02 (Verified Client Receipt Authority & Immutability):
--      - Sets UboqClientReceipt.status default to 'DRAFT' (never auto-'VERIFIED').
--      - Enforces finance/commercial verifier role + active non-narrowed project
--        assignment (uboq_actor_can_verify_client_receipt) in RLS WITH CHECK and
--        BEFORE INSERT/UPDATE/DELETE triggers on UboqClientReceipt and
--        UboqClientReceiptAllocation.
--      - Binds verifiedById strictly to authenticated actor, requires complete
--        matching UboqClientReceiptAllocation sum before sealing VERIFIED, and
--        locks sealed VERIFIED/VOID receipts and allocations against post-seal mutation.
--   3. WP3-BC-IR-R2-03 (Target Budget Snapshot Approval Lineage Guard):
--      - Hardens uboq_guard_target_budget_lineage() against partial approval
--        fields and against binding approved target budgets to unapproved snapshots.
--   4. Preserves Migrations #1-#31 byte-for-byte unchanged.
-- ============================================================================

-- Ensure SECURITY DEFINER owner holds explicit read privileges on referenced ERP tables
GRANT SELECT ON
  public."User",
  public."Project",
  public."ProjectUserAssignment",
  public."Billing",
  public."Payment",
  public."UboqOperationalSnapshot",
  public."UboqContractAuthority",
  public."UboqAwardedPhaseLine",
  public."UboqTemplateAuditEvent",
  public."UboqContractorTargetBudget",
  public."UboqClientReceipt",
  public."UboqClientReceiptAllocation"
TO oserp_migrations_owner;

-- ============================================================================
-- 1. WP3-BC-IR-R2-01 — SensitiveExportLog Function-Only Append & Attestation
-- ============================================================================

REVOKE ALL ON TABLE public."SensitiveExportLog"
  FROM PUBLIC, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role;

GRANT SELECT ON TABLE public."SensitiveExportLog"
  TO oserp_compat_app;

GRANT SELECT, INSERT ON TABLE public."SensitiveExportLog"
  TO oserp_migrations_owner;

GRANT SELECT, DELETE ON TABLE public."SensitiveExportLog"
  TO oserp_maint_cleanup_role;

ALTER TABLE public."SensitiveExportLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SensitiveExportLog" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rls_permissive_sensitive_export_log_insert ON public."SensitiveExportLog";
DROP POLICY IF EXISTS rls_permissive_sensitive_export_log_definer_insert ON public."SensitiveExportLog";
CREATE POLICY rls_permissive_sensitive_export_log_definer_insert
  ON public."SensitiveExportLog"
  AS PERMISSIVE
  FOR INSERT
  TO oserp_migrations_owner
  WITH CHECK (
    "projectId" IS NOT NULL
    AND public.uboq_check_tenant_rls("projectId")
    AND "userId" = NULLIF(current_setting('app.current_user_id', true), '')
    AND COALESCE(approved, false) <> COALESCE(blocked, false)
  );

DROP POLICY IF EXISTS rls_deny_compat_insert_sensitive_export_log ON public."SensitiveExportLog";
CREATE POLICY rls_deny_compat_insert_sensitive_export_log
  ON public."SensitiveExportLog"
  AS RESTRICTIVE
  FOR INSERT
  TO oserp_compat_app
  WITH CHECK (false);

DROP POLICY IF EXISTS rls_restrictive_sensitive_export_log_compat ON public."SensitiveExportLog";
CREATE POLICY rls_restrictive_sensitive_export_log_compat
  ON public."SensitiveExportLog"
  AS RESTRICTIVE
  FOR SELECT
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
  );

CREATE OR REPLACE FUNCTION public.uboq_verify_sensitive_export_attestation(
  p_id text,
  p_project_id text,
  p_user_id text,
  p_template_code text,
  p_format text,
  p_source_id text,
  p_record_count integer,
  p_approved boolean,
  p_blocked boolean,
  p_output_sha256 text,
  p_export_proof text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_secret_hex text;
  v_parts text[];
  v_issued_sec bigint;
  v_now_sec bigint;
  v_payload text;
  v_expected_mac text;
BEGIN
  IF p_id IS NULL
     OR p_project_id IS NULL
     OR p_user_id IS NULL
     OR p_template_code IS NULL
     OR p_format IS NULL
     OR p_export_proof IS NULL THEN
    RETURN false;
  END IF;

  SELECT "secretHex"
  INTO v_secret_hex
  FROM public."_uboq_rls_trust_anchor"
  WHERE "anchorId" = 'PRIMARY';

  IF v_secret_hex IS NULL OR char_length(v_secret_hex) < 64 THEN
    RETURN false;
  END IF;

  v_parts := string_to_array(p_export_proof, '.');
  IF array_length(v_parts, 1) <> 3 THEN
    RETURN false;
  END IF;

  IF v_parts[1] !~ '^\d{10,12}$'
     OR v_parts[2] !~ '^[0-9a-f]{16,64}$'
     OR v_parts[3] !~ '^[0-9a-f]{64}$' THEN
    RETURN false;
  END IF;

  v_issued_sec := v_parts[1]::bigint;
  v_now_sec := EXTRACT(EPOCH FROM clock_timestamp())::bigint;

  IF v_issued_sec > (v_now_sec + 30) OR (v_now_sec - v_issued_sec) > 300 THEN
    RETURN false;
  END IF;

  v_payload :=
    v_secret_hex
    || '|UBOQ_SENSITIVE_EXPORT_V1|'
    || p_id
    || '|'
    || p_project_id
    || '|'
    || p_user_id
    || '|'
    || UPPER(BTRIM(p_template_code))
    || '|'
    || UPPER(BTRIM(p_format))
    || '|'
    || COALESCE(BTRIM(p_source_id), '')
    || '|'
    || COALESCE(p_record_count, 0)::text
    || '|'
    || CASE WHEN COALESCE(p_approved, false) THEN 'true' ELSE 'false' END
    || '|'
    || CASE WHEN COALESCE(p_blocked, false) THEN 'true' ELSE 'false' END
    || '|'
    || LOWER(COALESCE(BTRIM(p_output_sha256), ''))
    || '|'
    || v_parts[1]
    || '|'
    || v_parts[2];

  v_expected_mac := encode(sha256(convert_to(v_payload, 'UTF8')), 'hex');
  RETURN v_expected_mac = v_parts[3];
END;
$$;
ALTER FUNCTION public.uboq_verify_sensitive_export_attestation(
  text, text, text, text, text, text, integer, boolean, boolean, text, text
) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_verify_sensitive_export_attestation(
  text, text, text, text, text, text, integer, boolean, boolean, text, text
) FROM PUBLIC, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role;

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
    -- Enforce non-spoofable PostgreSQL kernel definer identity; custom session GUCs are ignored.
    IF current_user <> 'oserp_migrations_owner' THEN
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_DIRECT_INSERT_DENIED: Direct table INSERT on SensitiveExportLog is prohibited; use attested SECURITY DEFINER export audit function'
        USING ERRCODE = '42501';
    END IF;

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
    ELSE
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_DIRECT_INSERT_DENIED: Unsupported governed SensitiveExportLog module (%)',
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

-- Remove unattested 12-argument overload from Migration #31 so raw SQL cannot call it
DROP FUNCTION IF EXISTS public.uboq_append_sensitive_export_log(
  text, text, text, text, text, text, text, integer, text, boolean, boolean, text
);

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

    IF v_sha !~ '^[0-9a-f]{64}$' THEN
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_MISSING_PAYLOAD_HASH: Approved sensitive export requires 64-hex SHA-256 digest of delivered payload'
        USING ERRCODE = '22023';
    END IF;

    IF COALESCE(p_record_count, 0) <= 0 THEN
      RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_INVALID_COUNT: Approved sensitive export requires recordCount > 0'
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
      'T10_EXECUTIVE_MARGIN'
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

-- Attested 1-to-1 formal export SensitiveExportLog writer for T0/T1/T4/T5/T6
CREATE OR REPLACE FUNCTION public.uboq_append_formal_sensitive_export_log(
  p_id text,
  p_audit_event_id text,
  p_data_classification text,
  p_export_proof text
)
RETURNS public."SensitiveExportLog"
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_ev record;
  v_fmt text;
  v_sha text;
  v_row_cnt integer;
  v_cls text;
  v_row public."SensitiveExportLog";
BEGIN
  IF p_id IS NULL OR p_id !~ '^[A-Za-z0-9_-]{8,160}$' THEN
    RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_INVALID_ID: Valid formal export log id required'
      USING ERRCODE = '22023';
  END IF;

  IF p_audit_event_id IS NULL OR BTRIM(p_audit_event_id) = '' THEN
    RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_FORMAL_PROVENANCE_INVALID: Authoritative UboqTemplateAuditEvent id required'
      USING ERRCODE = '42501';
  END IF;

  SELECT
    e.id,
    e."projectId",
    e."templateCode",
    e."eventType",
    e."actorUserId",
    e."sourceId",
    e."sourceVersion",
    e."contractCode",
    e."exportFormat",
    e."outputSha256",
    e."detailsJson"
  INTO v_ev
  FROM public."UboqTemplateAuditEvent" e
  WHERE e.id = p_audit_event_id;

  IF v_ev.id IS NULL OR v_ev."eventType" <> 'FORMAL_EXPORT_GENERATED' THEN
    RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_FORMAL_PROVENANCE_INVALID: Matching FORMAL_EXPORT_GENERATED audit event (%) not found',
      p_audit_event_id
      USING ERRCODE = '42501';
  END IF;

  IF v_ev."projectId" IS NULL
     OR public.uboq_check_tenant_rls(v_ev."projectId") IS NOT TRUE
     OR v_ev."actorUserId" IS DISTINCT FROM NULLIF(current_setting('app.current_user_id', true), '') THEN
    RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_ACTOR_MISMATCH: Formal export audit event actor/project mismatch'
      USING ERRCODE = '42501';
  END IF;

  IF public.uboq_can_formal_export_template(v_ev."projectId", v_ev."actorUserId") IS NOT TRUE THEN
    RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_UNAUTHORIZED_APPROVAL: Actor % lacks formal-export authority on project %',
      v_ev."actorUserId", v_ev."projectId"
      USING ERRCODE = '42501';
  END IF;

  v_fmt := UPPER(BTRIM(COALESCE(v_ev."exportFormat", '')));
  v_sha := LOWER(BTRIM(COALESCE(v_ev."outputSha256", '')));

  IF v_sha !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_MISSING_PAYLOAD_HASH: Formal audit event % lacks valid 64-hex outputSha256',
      v_ev.id
      USING ERRCODE = '22023';
  END IF;

  v_row_cnt := GREATEST(0, COALESCE((v_ev."detailsJson"->>'rowCount')::integer, 0));

  IF public.uboq_verify_sensitive_export_attestation(
    p_id,
    v_ev."projectId",
    v_ev."actorUserId",
    v_ev."templateCode",
    v_fmt,
    v_ev."sourceId",
    v_row_cnt,
    true,
    false,
    v_sha,
    p_export_proof
  ) IS NOT TRUE THEN
    RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_UNATTESTED_CALL: Valid server-minted formal export attestation is required'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public."SensitiveExportLog" prev
    WHERE prev."projectId" = v_ev."projectId"
      AND prev.module = 'UBOQ_FORMAL_TEMPLATES'
      AND POSITION('[auditEvent=' || v_ev.id || ']' IN COALESCE(prev.reason, '')) > 0
  ) THEN
    RAISE EXCEPTION 'UBOQ_SENSITIVE_EXPORT_LOG_FORMAL_REPLAY_DENIED: SensitiveExportLog already recorded for audit event %',
      v_ev.id
      USING ERRCODE = '23505';
  END IF;

  v_cls := COALESCE(
    NULLIF(UPPER(BTRIM(COALESCE(p_data_classification, ''))), ''),
    'RESTRICTED_CONTRACTUAL'
  );

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
    v_ev."actorUserId",
    NULL,
    NULL,
    v_ev."projectId",
    'UBOQ_FORMAL_TEMPLATES',
    COALESCE(v_ev."contractCode", v_ev."templateCode") || ':' || v_fmt,
    v_row_cnt,
    v_cls,
    NULL,
    true,
    false,
    LEFT(
      'Formal '
      || v_ev."templateCode"
      || ' export sha256='
      || v_sha
      || ' source='
      || COALESCE(v_ev."sourceId", '')
      || '@'
      || COALESCE(v_ev."sourceVersion", '')
      || ' [auditEvent='
      || v_ev.id
      || ']',
      500
    )
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;
ALTER FUNCTION public.uboq_append_formal_sensitive_export_log(text, text, text, text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_append_formal_sensitive_export_log(text, text, text, text)
  FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_append_formal_sensitive_export_log(text, text, text, text)
  TO oserp_compat_app;

-- ============================================================================
-- 2. WP3-BC-IR-R2-02 — Verified Client Receipt Authority & Sealed Immutability
-- ============================================================================

ALTER TABLE public."UboqClientReceipt"
  ALTER COLUMN "status" SET DEFAULT 'DRAFT';

ALTER TABLE public."UboqClientReceipt"
  DROP CONSTRAINT IF EXISTS chk_uboq_client_receipt_status_enum,
  ADD CONSTRAINT chk_uboq_client_receipt_status_enum
    CHECK (UPPER(BTRIM("status")) IN ('DRAFT', 'VERIFIED', 'VOID')),
  DROP CONSTRAINT IF EXISTS chk_uboq_client_receipt_verified_fields,
  ADD CONSTRAINT chk_uboq_client_receipt_verified_fields
    CHECK (
      (UPPER(BTRIM("status")) = 'VERIFIED' AND "verifiedById" IS NOT NULL AND "verifiedAt" IS NOT NULL)
      OR (UPPER(BTRIM("status")) IN ('DRAFT', 'VOID') AND "verifiedById" IS NULL AND "verifiedAt" IS NULL)
    );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UboqClientReceipt_verifiedById_fkey'
  ) THEN
    ALTER TABLE public."UboqClientReceipt"
      ADD CONSTRAINT "UboqClientReceipt_verifiedById_fkey"
      FOREIGN KEY ("verifiedById")
      REFERENCES public."User"("id")
      ON DELETE RESTRICT ON UPDATE RESTRICT;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.uboq_actor_can_verify_client_receipt(
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
    'COMMERCIAL_DIRECTOR',
    'COST_CONTROL_MANAGER',
    'ACCOUNTANT',
    'BILLING_ENGINEER'
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

  IF v_role IN ('SUPER_ADMIN', 'PRESIDENT', 'VP_OPERATIONS') THEN
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
       'COMMERCIAL_DIRECTOR',
       'COST_CONTROL_MANAGER',
       'ACCOUNTANT',
       'BILLING_ENGINEER'
     ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;
ALTER FUNCTION public.uboq_actor_can_verify_client_receipt(text, text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_actor_can_verify_client_receipt(text, text)
  FROM PUBLIC, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_actor_can_verify_client_receipt(text, text)
  TO oserp_compat_app;

REVOKE ALL ON public."UboqClientReceipt", public."UboqClientReceiptAllocation"
  FROM PUBLIC, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT SELECT, INSERT, UPDATE ON
  public."UboqClientReceipt",
  public."UboqClientReceiptAllocation"
TO oserp_compat_app;
GRANT SELECT, INSERT, UPDATE ON
  public."UboqClientReceipt",
  public."UboqClientReceiptAllocation"
TO oserp_migrations_owner;
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

    EXECUTE format('DROP POLICY IF EXISTS rls_restrictive_tenant_scope ON public.%I', v_tbl);
    EXECUTE format('DROP POLICY IF EXISTS rls_restrictive_client_receipt_select ON public.%I', v_tbl);
    EXECUTE format(
      'CREATE POLICY rls_restrictive_client_receipt_select ON public.%I AS RESTRICTIVE FOR SELECT TO oserp_compat_app USING (public.uboq_check_tenant_rls("projectId"))',
      v_tbl
    );

    EXECUTE format('DROP POLICY IF EXISTS rls_restrictive_client_receipt_insert ON public.%I', v_tbl);
    EXECUTE format(
      'CREATE POLICY rls_restrictive_client_receipt_insert ON public.%I AS RESTRICTIVE FOR INSERT TO oserp_compat_app WITH CHECK (public.uboq_actor_can_verify_client_receipt("projectId", NULLIF(current_setting(''app.current_user_id'', true), '''')))',
      v_tbl
    );

    EXECUTE format('DROP POLICY IF EXISTS rls_restrictive_client_receipt_update ON public.%I', v_tbl);
    EXECUTE format(
      'CREATE POLICY rls_restrictive_client_receipt_update ON public.%I AS RESTRICTIVE FOR UPDATE TO oserp_compat_app USING (public.uboq_actor_can_verify_client_receipt("projectId", NULLIF(current_setting(''app.current_user_id'', true), ''''))) WITH CHECK (public.uboq_actor_can_verify_client_receipt("projectId", NULLIF(current_setting(''app.current_user_id'', true), '''')))',
      v_tbl
    );

    EXECUTE format('DROP POLICY IF EXISTS rls_restrictive_client_receipt_delete ON public.%I', v_tbl);
    EXECUTE format(
      'CREATE POLICY rls_restrictive_client_receipt_delete ON public.%I AS RESTRICTIVE FOR DELETE TO oserp_compat_app USING (false)',
      v_tbl
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.uboq_guard_client_receipt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_actor_id text;
  v_old_status text;
  v_new_status text;
  v_alloc_cnt integer;
  v_alloc_sum numeric(18, 2);
BEGIN
  IF current_setting('app.synthetic_cleanup_authorized', true) = 'on'
     AND pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER') THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_SEALED_IMMUTABLE: Client receipts cannot be deleted; use governed VOID transition from DRAFT'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    v_old_status := UPPER(BTRIM(COALESCE(OLD.status, '')));
    IF v_old_status IN ('VERIFIED', 'VOID') THEN
      RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_SEALED_IMMUTABLE: Sealed % client receipt % is immutable',
        v_old_status, OLD.id
        USING ERRCODE = '42501';
    END IF;

    IF NEW.id IS DISTINCT FROM OLD.id OR NEW."projectId" IS DISTINCT FROM OLD."projectId" THEN
      RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_IMMUTABLE_IDENTITY: Receipt id and projectId cannot be changed'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF pg_has_role(session_user, 'oserp_compat_app', 'MEMBER')
     OR pg_has_role(current_user, 'oserp_compat_app', 'MEMBER')
     OR COALESCE(current_setting('app.enforce_project_rls', true), 'off') = 'on' THEN
    v_actor_id := NULLIF(current_setting('app.current_user_id', true), '');
    IF public.uboq_actor_can_verify_client_receipt(NEW."projectId", v_actor_id) IS NOT TRUE THEN
      RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_UNAUTHORIZED_ACTOR: Actor % lacks finance/commercial client-receipt authority on project %',
        COALESCE(v_actor_id, 'NULL'), NEW."projectId"
        USING ERRCODE = '42501';
    END IF;
  END IF;

  v_new_status := UPPER(BTRIM(COALESCE(NEW.status, 'DRAFT')));
  NEW.status := v_new_status;

  IF v_new_status IN ('DRAFT', 'VOID') THEN
    IF NEW."verifiedById" IS NOT NULL OR NEW."verifiedAt" IS NOT NULL THEN
      RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_STATE_INVALID: % client receipt cannot populate verifiedById or verifiedAt',
        v_new_status
        USING ERRCODE = '22023';
    END IF;
  ELSIF v_new_status = 'VERIFIED' THEN
    IF TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_ALLOCATION_SUM_MISMATCH: Client receipt must be created as DRAFT and linked to matching UboqClientReceiptAllocation rows before sealing as VERIFIED'
        USING ERRCODE = '22023';
    END IF;

    IF v_actor_id IS NOT NULL THEN
      IF NEW."verifiedById" IS NOT NULL AND NEW."verifiedById" <> v_actor_id THEN
        RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_VERIFIER_FORGED: verifiedById (%) must match authenticated finance verifier (%)',
          NEW."verifiedById", v_actor_id
          USING ERRCODE = '42501';
      END IF;
      NEW."verifiedById" := v_actor_id;
    ELSIF NEW."verifiedById" IS NULL THEN
      RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_VERIFIER_REQUIRED: verifiedById is required to seal VERIFIED receipt'
        USING ERRCODE = '22023';
    END IF;

    IF NEW."verifiedAt" IS NOT NULL AND NEW."verifiedAt" > (clock_timestamp() + interval '30 seconds') THEN
      RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_FUTURE_VERIFIED_AT: verifiedAt cannot be future-dated'
        USING ERRCODE = '22023';
    END IF;
    NEW."verifiedAt" := COALESCE(NEW."verifiedAt", clock_timestamp());

    SELECT count(*)::integer, COALESCE(SUM("allocatedAmount"), 0)::numeric(18, 2)
    INTO v_alloc_cnt, v_alloc_sum
    FROM public."UboqClientReceiptAllocation"
    WHERE "receiptId" = NEW.id
      AND "projectId" = NEW."projectId";

    IF v_alloc_cnt <= 0 OR v_alloc_sum <> ROUND(NEW."totalReceiptAmount"::numeric, 2) THEN
      RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_ALLOCATION_SUM_MISMATCH: Cannot seal receipt % as VERIFIED unless allocation count (%) > 0 and sum (%) equals totalReceiptAmount (%)',
        NEW.id, v_alloc_cnt, v_alloc_sum, ROUND(NEW."totalReceiptAmount"::numeric, 2)
        USING ERRCODE = '22023';
    END IF;
  ELSE
    RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_STATE_INVALID: Unsupported status (%)', v_new_status
      USING ERRCODE = '22023';
  END IF;

  NEW."updatedAt" := clock_timestamp();
  RETURN NEW;
END;
$$;
ALTER FUNCTION public.uboq_guard_client_receipt()
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_guard_client_receipt()
  FROM PUBLIC, oserp_maint_cleanup_role;

DROP TRIGGER IF EXISTS trg_uboq_guard_client_receipt ON public."UboqClientReceipt";
CREATE TRIGGER trg_uboq_guard_client_receipt
  BEFORE INSERT OR UPDATE OR DELETE ON public."UboqClientReceipt"
  FOR EACH ROW
  EXECUTE FUNCTION public.uboq_guard_client_receipt();

CREATE OR REPLACE FUNCTION public.uboq_guard_client_receipt_allocation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_actor_id text;
  v_target_proj text;
  v_target_rcpt text;
  v_rec record;
  v_bil record;
  v_pay record;
BEGIN
  IF current_setting('app.synthetic_cleanup_authorized', true) = 'on'
     AND pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER') THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  v_target_proj := CASE WHEN TG_OP = 'DELETE' THEN OLD."projectId" ELSE NEW."projectId" END;
  v_target_rcpt := CASE WHEN TG_OP = 'DELETE' THEN OLD."receiptId" ELSE NEW."receiptId" END;

  IF pg_has_role(session_user, 'oserp_compat_app', 'MEMBER')
     OR pg_has_role(current_user, 'oserp_compat_app', 'MEMBER')
     OR COALESCE(current_setting('app.enforce_project_rls', true), 'off') = 'on' THEN
    v_actor_id := NULLIF(current_setting('app.current_user_id', true), '');
    IF public.uboq_actor_can_verify_client_receipt(v_target_proj, v_actor_id) IS NOT TRUE THEN
      RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_UNAUTHORIZED_ACTOR: Actor % lacks finance/commercial client-receipt allocation authority on project %',
        COALESCE(v_actor_id, 'NULL'), COALESCE(v_target_proj, 'NULL')
        USING ERRCODE = '42501';
    END IF;
  END IF;

  SELECT id, "projectId", status
  INTO v_rec
  FROM public."UboqClientReceipt"
  WHERE id = v_target_rcpt
  FOR UPDATE;

  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_SEALED_IMMUTABLE: Client receipt allocations cannot be deleted (receipt=%)',
      v_target_rcpt
      USING ERRCODE = '42501';
  END IF;

  IF v_rec.id IS NULL OR v_rec."projectId" IS DISTINCT FROM NEW."projectId" THEN
    RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_ALLOC_PROJECT_MISMATCH: Receipt % does not belong to project %',
      NEW."receiptId", NEW."projectId"
      USING ERRCODE = '23503';
  END IF;

  IF UPPER(BTRIM(COALESCE(v_rec.status, ''))) <> 'DRAFT' THEN
    RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_SEALED_IMMUTABLE: Allocations cannot be added or modified once receipt % is %',
      v_rec.id, v_rec.status
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' AND (NEW.id IS DISTINCT FROM OLD.id OR NEW."projectId" IS DISTINCT FROM OLD."projectId" OR NEW."receiptId" IS DISTINCT FROM OLD."receiptId") THEN
    RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_IMMUTABLE_IDENTITY: Allocation id, projectId, and receiptId cannot be changed'
      USING ERRCODE = '42501';
  END IF;

  SELECT id, "projectId", status, "approvedById"
  INTO v_bil
  FROM public."Billing"
  WHERE id = NEW."billingId";

  IF v_bil.id IS NULL OR v_bil."projectId" IS DISTINCT FROM NEW."projectId" THEN
    RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_ALLOC_BILLING_MISMATCH: Billing % does not belong to project %',
      NEW."billingId", NEW."projectId"
      USING ERRCODE = '23503';
  END IF;

  IF UPPER(BTRIM(COALESCE(v_bil.status, ''))) NOT IN ('APPROVED', 'APPROVED_FOR_PAYMENT', 'PAID', 'PARTIALLY_PAID')
     OR v_bil."approvedById" IS NULL THEN
    RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_ALLOC_BILLING_UNAPPROVED: Billing % must be approved before receipt allocation',
      NEW."billingId"
      USING ERRCODE = '22023';
  END IF;

  SELECT id, "billingId", "amountPaid"
  INTO v_pay
  FROM public."Payment"
  WHERE id = NEW."paymentId";

  IF v_pay.id IS NULL OR v_pay."billingId" IS DISTINCT FROM NEW."billingId" THEN
    RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_ALLOC_PAYMENT_MISMATCH: Payment % does not belong to billing %',
      NEW."paymentId", NEW."billingId"
      USING ERRCODE = '23503';
  END IF;

  IF ROUND(COALESCE(v_pay."amountPaid", 0)::numeric, 2) <> ROUND(NEW."allocatedAmount"::numeric, 2) THEN
    RAISE EXCEPTION 'UBOQ_CLIENT_RECEIPT_ALLOC_AMOUNT_MISMATCH: allocatedAmount (%) must equal Payment.amountPaid (%) for payment %',
      ROUND(NEW."allocatedAmount"::numeric, 2), ROUND(COALESCE(v_pay."amountPaid", 0)::numeric, 2), NEW."paymentId"
      USING ERRCODE = '22023';
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
  BEFORE INSERT OR UPDATE OR DELETE ON public."UboqClientReceiptAllocation"
  FOR EACH ROW
  EXECUTE FUNCTION public.uboq_guard_client_receipt_allocation();

-- ============================================================================
-- 3. WP3-BC-IR-R2-03 — Target Budget Snapshot Approval Lineage Guard
-- ============================================================================

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

  IF (NEW."approvedById" IS NULL) <> (NEW."approvedAt" IS NULL) THEN
    RAISE EXCEPTION 'UBOQ_TARGET_BUDGET_APPROVAL_INCOMPLETE: approvedById and approvedAt must both be set or both be NULL'
      USING ERRCODE = '22023';
  END IF;

  IF NEW."snapshotId" IS NOT NULL THEN
    SELECT id, "projectId", status, "approvedById", "approvedAt"
    INTO v_snap
    FROM public."UboqOperationalSnapshot"
    WHERE id = NEW."snapshotId";

    IF v_snap.id IS NULL OR v_snap."projectId" IS DISTINCT FROM NEW."projectId" THEN
      RAISE EXCEPTION 'UBOQ_TARGET_BUDGET_SNAPSHOT_MISMATCH: Snapshot % does not belong to project %',
        NEW."snapshotId", NEW."projectId"
        USING ERRCODE = '23503';
    END IF;

    IF NEW."approvedById" IS NOT NULL
       AND (
         v_snap.status::text NOT IN ('APPROVED', 'SUPERSEDED')
         OR v_snap."approvedById" IS NULL
         OR v_snap."approvedAt" IS NULL
       ) THEN
      RAISE EXCEPTION 'UBOQ_TARGET_BUDGET_UNAPPROVED_SNAPSHOT_DENIED: Approved target budget cannot bind unapproved snapshot %',
        NEW."snapshotId"
        USING ERRCODE = '22023';
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
