-- ============================================================================
-- OSERP-PROJ-UBOQ-001 — WP-3 BATCH D PHASE D1: SIGNED T0/T1 ROUND-TRIP IMPORT
-- (MIGRATION #33, FORWARD-ONLY)
-- Scope:
--   1. Creates governed tables public."UboqSignedRoundTripPackage" and
--      public."UboqRoundTripImportSubmission" strictly scoped to ratified
--      T0_MASTER_CONTRACT and T1_PHASE_BOQ (unratified T11/T12 remain blocked).
--   2. Enforces ENABLE + FORCE ROW LEVEL SECURITY, revokes direct INSERT/UPDATE/
--      DELETE from oserp_compat_app, and restricts financial proposal SELECT
--      visibility at the PostgreSQL kernel level to authorized commercial roles.
--   3. Provides owner-attested SECURITY DEFINER functions
--      public.uboq_issue_signed_roundtrip_package and
--      public.uboq_record_roundtrip_import_submission verified inside PostgreSQL
--      against owner-private public."_uboq_rls_trust_anchor" with ZERO reliance
--      on caller-settable custom PostgreSQL GUCs (kernel current_user check).
--   4. Guarantees zero in-place mutation of UboqContractAuthority,
--      UboqOperationalSnapshot, UboqAwardedPhaseLine, or AwardedBOQItem, plus
--      atomic FOR UPDATE replay & idempotency protection.
--   5. Preserves Migrations #1-#32 byte-for-byte unchanged.
-- ============================================================================

-- Ensure SECURITY DEFINER owner holds explicit read privileges on referenced ERP tables
GRANT SELECT ON
  public."User",
  public."Project",
  public."ProjectUserAssignment",
  public."SystemRole",
  public."RolePermission",
  public."UboqContractAuthority",
  public."UboqTaxPricingProfile",
  public."UboqOperationalSnapshot",
  public."UboqAwardedPhaseLine",
  public."UboqTemplateDefinition",
  public."UboqValidationException"
TO oserp_migrations_owner;

-- ============================================================================
-- 1. Governed Tables, Foreign Keys, Indexes & Domain CHECK Constraints
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."UboqSignedRoundTripPackage" (
  "id"                      TEXT NOT NULL,
  "projectId"               TEXT NOT NULL,
  "templateCode"            TEXT NOT NULL,
  "sourceType"              TEXT NOT NULL,
  "sourceId"                TEXT NOT NULL,
  "sourceVersion"           TEXT NOT NULL,
  "sourceCanonicalHash"     TEXT NOT NULL,
  "layoutMode"              TEXT NOT NULL,
  "layoutGroupId"           TEXT,
  "layoutDefinitionId"      TEXT,
  "layoutVersionNumber"     INTEGER,
  "layoutDefinitionHash"    TEXT NOT NULL,
  "selectedFieldsJson"      JSONB NOT NULL,
  "headingAliasesJson"      JSONB,
  "rowCount"                INTEGER NOT NULL,
  "rowIdentityDigest"       TEXT NOT NULL,
  "financialFieldsIncluded" BOOLEAN NOT NULL DEFAULT false,
  "exportFormat"            TEXT NOT NULL,
  "packageNonce"            TEXT NOT NULL,
  "baselinePayloadSha256"   TEXT NOT NULL,
  "manifestSignature"       TEXT NOT NULL,
  "issuedById"              TEXT NOT NULL,
  "issuedByRole"            TEXT NOT NULL,
  "issuedAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"               TIMESTAMP(3) NOT NULL,
  "consumedByImportId"      TEXT,
  "consumedAt"              TIMESTAMP(3),

  CONSTRAINT "UboqSignedRoundTripPackage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chk_uboq_rtpkg_template_code"
    CHECK ("templateCode" IN ('T0_MASTER_CONTRACT', 'T1_PHASE_BOQ')),
  CONSTRAINT "chk_uboq_rtpkg_source_type"
    CHECK (
      ("templateCode" = 'T0_MASTER_CONTRACT' AND "sourceType" = 'CONTRACT_AUTHORITY')
      OR ("templateCode" = 'T1_PHASE_BOQ' AND "sourceType" = 'OPERATIONAL_SNAPSHOT')
    ),
  CONSTRAINT "chk_uboq_rtpkg_layout_mode"
    CHECK ("layoutMode" IN ('WORKING_PRESET', 'SAVED_LAYOUT', 'FORMAL_CONTRACT')),
  CONSTRAINT "chk_uboq_rtpkg_export_format"
    CHECK ("exportFormat" IN ('XLSX', 'JSON')),
  CONSTRAINT "chk_uboq_rtpkg_hashes_hex64"
    CHECK (
      "sourceCanonicalHash" ~ '^[0-9a-f]{64}$'
      AND "layoutDefinitionHash" ~ '^[0-9a-f]{64}$'
      AND "rowIdentityDigest" ~ '^[0-9a-f]{64}$'
      AND "baselinePayloadSha256" ~ '^[0-9a-f]{64}$'
      AND "manifestSignature" ~ '^[0-9a-f]{64}$'
      AND "packageNonce" ~ '^[0-9a-f]{24,64}$'
    ),
  CONSTRAINT "chk_uboq_rtpkg_row_count"
    CHECK ("rowCount" > 0 AND "rowCount" <= 1000),
  CONSTRAINT "chk_uboq_rtpkg_expiry_window"
    CHECK ("expiresAt" > "issuedAt"),
  CONSTRAINT "chk_uboq_rtpkg_consumed_consistency"
    CHECK (
      ("consumedByImportId" IS NULL AND "consumedAt" IS NULL)
      OR ("consumedByImportId" IS NOT NULL AND "consumedAt" IS NOT NULL)
    ),
  CONSTRAINT "UboqSignedRoundTripPackage_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES public."Project"("id")
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "UboqSignedRoundTripPackage_issuedById_fkey"
    FOREIGN KEY ("issuedById") REFERENCES public."User"("id")
    ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS "UboqSignedRoundTripPackage_packageNonce_key"
  ON public."UboqSignedRoundTripPackage"("packageNonce");

CREATE UNIQUE INDEX IF NOT EXISTS "UboqSignedRoundTripPackage_consumedByImportId_key"
  ON public."UboqSignedRoundTripPackage"("consumedByImportId");

CREATE UNIQUE INDEX IF NOT EXISTS "UboqSignedRoundTripPackage_projectId_id_key"
  ON public."UboqSignedRoundTripPackage"("projectId", "id");

CREATE INDEX IF NOT EXISTS "UboqSignedRoundTripPackage_projectId_templateCode_sourceId_idx"
  ON public."UboqSignedRoundTripPackage"("projectId", "templateCode", "sourceId");

CREATE INDEX IF NOT EXISTS "UboqSignedRoundTripPackage_projectId_issuedAt_idx"
  ON public."UboqSignedRoundTripPackage"("projectId", "issuedAt");

CREATE TABLE IF NOT EXISTS public."UboqRoundTripImportSubmission" (
  "id"                      TEXT NOT NULL,
  "projectId"               TEXT NOT NULL,
  "packageId"               TEXT,
  "idempotencyKey"          TEXT NOT NULL,
  "uploadedFileSha256"      TEXT NOT NULL,
  "importFormat"            TEXT NOT NULL,
  "templateCode"            TEXT NOT NULL,
  "sourceId"                TEXT,
  "sourceVersion"           TEXT,
  "layoutDefinitionId"      TEXT,
  "layoutVersionNumber"     INTEGER,
  "layoutDefinitionHash"    TEXT,
  "conflictResolutionMode"  TEXT NOT NULL,
  "actorUserId"             TEXT NOT NULL,
  "actorRole"               TEXT NOT NULL,
  "verificationStatus"      TEXT NOT NULL,
  "failureCode"             TEXT,
  "totalRowCount"           INTEGER NOT NULL DEFAULT 0,
  "changedRowCount"         INTEGER NOT NULL DEFAULT 0,
  "nonFinancialChangeCount" INTEGER NOT NULL DEFAULT 0,
  "financialChangeCount"    INTEGER NOT NULL DEFAULT 0,
  "proposedChangesJson"     JSONB,
  "diagnosticsJson"         JSONB,
  "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UboqRoundTripImportSubmission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chk_uboq_rtimp_template_code"
    CHECK ("templateCode" IN ('T0_MASTER_CONTRACT', 'T1_PHASE_BOQ')),
  CONSTRAINT "chk_uboq_rtimp_format"
    CHECK ("importFormat" IN ('XLSX', 'JSON')),
  CONSTRAINT "chk_uboq_rtimp_uploaded_sha"
    CHECK ("uploadedFileSha256" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "chk_uboq_rtimp_idempotency_key"
    CHECK ("idempotencyKey" ~ '^[A-Za-z0-9._:-]{6,160}$'),
  CONSTRAINT "chk_uboq_rtimp_conflict_mode"
    CHECK (
      "conflictResolutionMode" IN (
        'STAGE_GOVERNED_CHANGE_PROPOSAL',
        'VERIFY_ONLY',
        'OVERWRITE_APPROVED_IN_PLACE'
      )
    ),
  CONSTRAINT "chk_uboq_rtimp_verification_status"
    CHECK (
      "verificationStatus" IN (
        'STAGED_PENDING_APPROVAL',
        'VERIFIED_NO_CHANGES',
        'REJECTED'
      )
    ),
  CONSTRAINT "chk_uboq_rtimp_counts_nonneg"
    CHECK (
      "totalRowCount" >= 0
      AND "changedRowCount" >= 0
      AND "nonFinancialChangeCount" >= 0
      AND "financialChangeCount" >= 0
    ),
  CONSTRAINT "chk_uboq_rtimp_status_invariants"
    CHECK (
      (
        "verificationStatus" = 'VERIFIED_NO_CHANGES'
        AND "packageId" IS NOT NULL
        AND "failureCode" IS NULL
        AND "changedRowCount" = 0
        AND "nonFinancialChangeCount" = 0
        AND "financialChangeCount" = 0
        AND "conflictResolutionMode" IN ('STAGE_GOVERNED_CHANGE_PROPOSAL', 'VERIFY_ONLY')
      )
      OR (
        "verificationStatus" = 'STAGED_PENDING_APPROVAL'
        AND "packageId" IS NOT NULL
        AND "failureCode" IS NULL
        AND "changedRowCount" > 0
        AND ("nonFinancialChangeCount" + "financialChangeCount") > 0
        AND "conflictResolutionMode" = 'STAGE_GOVERNED_CHANGE_PROPOSAL'
      )
      OR (
        "verificationStatus" = 'REJECTED'
        AND "failureCode" IS NOT NULL
        AND BTRIM("failureCode") <> ''
        AND "changedRowCount" = 0
      )
    ),
  CONSTRAINT "UboqRoundTripImportSubmission_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES public."Project"("id")
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "UboqRoundTripImportSubmission_projectId_packageId_fkey"
    FOREIGN KEY ("projectId", "packageId")
    REFERENCES public."UboqSignedRoundTripPackage"("projectId", "id")
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "UboqRoundTripImportSubmission_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES public."User"("id")
    ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS "UboqRoundTripImportSubmission_projectId_idempotencyKey_key"
  ON public."UboqRoundTripImportSubmission"("projectId", "idempotencyKey");

CREATE INDEX IF NOT EXISTS "UboqRoundTripImportSubmission_projectId_createdAt_idx"
  ON public."UboqRoundTripImportSubmission"("projectId", "createdAt");

CREATE INDEX IF NOT EXISTS "UboqRoundTripImportSubmission_projectId_verificationStatus_idx"
  ON public."UboqRoundTripImportSubmission"("projectId", "verificationStatus", "createdAt");

-- ============================================================================
-- 2. Role Authorization & Cryptographic Trust-Anchor Verification Helpers
-- ============================================================================

CREATE OR REPLACE FUNCTION public.uboq_actor_can_stage_roundtrip_import(
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
    'SYSTEM_ADMIN',
    'PRESIDENT',
    'VP_OPERATIONS',
    'FINANCE_DIRECTOR',
    'COMMERCIAL_DIRECTOR',
    'COST_CONTROL_MANAGER',
    'CHIEF_ESTIMATOR',
    'PROJECT_DIRECTOR',
    'DIRECTORS',
    'PROJECT_MANAGER',
    'OPERATIONS_MANAGER',
    'QUANTITY_SURVEYOR',
    'QS_ENGINEER',
    'BILLING_ENGINEER',
    'ACCOUNTANT',
    'PROJECT_ENGINEER',
    'COST_ENGINEER',
    'ESTIMATOR'
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

  IF v_role IN ('SUPER_ADMIN', 'SYSTEM_ADMIN', 'PRESIDENT', 'VP_OPERATIONS') THEN
    RETURN true;
  END IF;

  IF v_proj."managerId" = p_actor_id THEN
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

  IF v_proj_role <> ''
     AND v_proj_role NOT IN ('MEMBER', 'STANDARD', 'FULL')
     AND v_proj_role NOT IN (
       'SUPER_ADMIN',
       'SYSTEM_ADMIN',
       'PRESIDENT',
       'VP_OPERATIONS',
       'FINANCE_DIRECTOR',
       'COMMERCIAL_DIRECTOR',
       'COST_CONTROL_MANAGER',
       'CHIEF_ESTIMATOR',
       'PROJECT_DIRECTOR',
       'DIRECTORS',
       'PROJECT_MANAGER',
       'OPERATIONS_MANAGER',
       'QUANTITY_SURVEYOR',
       'QS_ENGINEER',
       'BILLING_ENGINEER',
       'ACCOUNTANT',
       'PROJECT_ENGINEER',
       'COST_ENGINEER',
       'ESTIMATOR'
     ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;
ALTER FUNCTION public.uboq_actor_can_stage_roundtrip_import(text, text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_actor_can_stage_roundtrip_import(text, text)
  FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_actor_can_stage_roundtrip_import(text, text)
  TO oserp_compat_app, oserp_migrations_owner;

CREATE OR REPLACE FUNCTION public.uboq_actor_has_commercial_roundtrip_access(
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
  IF public.uboq_actor_can_stage_roundtrip_import(p_project_id, p_actor_id) IS NOT TRUE THEN
    RETURN false;
  END IF;

  SELECT id, role
  INTO v_user
  FROM public."User"
  WHERE id = p_actor_id;

  v_role := UPPER(BTRIM(COALESCE(v_user.role, '')));
  IF v_role NOT IN (
    'SUPER_ADMIN',
    'PRESIDENT',
    'VP_OPERATIONS',
    'FINANCE_DIRECTOR',
    'COMMERCIAL_DIRECTOR',
    'COST_CONTROL_MANAGER',
    'CHIEF_ESTIMATOR',
    'PROJECT_MANAGER',
    'OPERATIONS_MANAGER',
    'QUANTITY_SURVEYOR',
    'BILLING_ENGINEER',
    'ACCOUNTANT'
  ) THEN
    RETURN false;
  END IF;

  IF v_role IN ('SUPER_ADMIN', 'PRESIDENT', 'VP_OPERATIONS') THEN
    RETURN true;
  END IF;

  SELECT id, "managerId"
  INTO v_proj
  FROM public."Project"
  WHERE id = p_project_id;

  IF v_proj."managerId" = p_actor_id THEN
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

  IF v_proj_role <> ''
     AND v_proj_role NOT IN ('MEMBER', 'STANDARD', 'FULL')
     AND v_proj_role NOT IN (
       'SUPER_ADMIN',
       'PRESIDENT',
       'VP_OPERATIONS',
       'FINANCE_DIRECTOR',
       'COMMERCIAL_DIRECTOR',
       'COST_CONTROL_MANAGER',
       'CHIEF_ESTIMATOR',
       'PROJECT_MANAGER',
       'OPERATIONS_MANAGER',
       'QUANTITY_SURVEYOR',
       'BILLING_ENGINEER',
       'ACCOUNTANT'
     ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;
ALTER FUNCTION public.uboq_actor_has_commercial_roundtrip_access(text, text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_actor_has_commercial_roundtrip_access(text, text)
  FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_actor_has_commercial_roundtrip_access(text, text)
  TO oserp_compat_app, oserp_migrations_owner;

CREATE OR REPLACE FUNCTION public.uboq_verify_roundtrip_manifest_signature(
  p_package_id text,
  p_project_id text,
  p_template_code text,
  p_source_type text,
  p_source_id text,
  p_source_version text,
  p_source_canonical_hash text,
  p_layout_mode text,
  p_layout_definition_id text,
  p_layout_version_number integer,
  p_layout_definition_hash text,
  p_row_count integer,
  p_row_identity_digest text,
  p_financial_fields_included boolean,
  p_export_format text,
  p_package_nonce text,
  p_issued_epoch_sec bigint,
  p_expires_epoch_sec bigint,
  p_expected_signature text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_secret_hex text;
  v_payload text;
  v_mac text;
BEGIN
  IF p_package_id IS NULL
     OR p_project_id IS NULL
     OR p_template_code IS NULL
     OR p_source_type IS NULL
     OR p_source_id IS NULL
     OR p_source_version IS NULL
     OR p_source_canonical_hash IS NULL
     OR p_layout_mode IS NULL
     OR p_layout_definition_hash IS NULL
     OR p_row_identity_digest IS NULL
     OR p_export_format IS NULL
     OR p_package_nonce IS NULL
     OR p_issued_epoch_sec IS NULL
     OR p_expires_epoch_sec IS NULL
     OR p_expected_signature IS NULL
     OR p_expected_signature !~ '^[0-9a-f]{64}$' THEN
    RETURN false;
  END IF;

  SELECT "secretHex"
  INTO v_secret_hex
  FROM public."_uboq_rls_trust_anchor"
  WHERE "anchorId" = 'PRIMARY';

  IF v_secret_hex IS NULL OR char_length(v_secret_hex) < 64 THEN
    RETURN false;
  END IF;

  v_payload :=
    v_secret_hex
    || '|UBOQ_ROUNDTRIP_MANIFEST_V1|'
    || p_package_id
    || '|'
    || p_project_id
    || '|'
    || UPPER(BTRIM(p_template_code))
    || '|'
    || UPPER(BTRIM(p_source_type))
    || '|'
    || p_source_id
    || '|'
    || p_source_version
    || '|'
    || LOWER(BTRIM(p_source_canonical_hash))
    || '|'
    || UPPER(BTRIM(p_layout_mode))
    || '|'
    || COALESCE(BTRIM(p_layout_definition_id), '')
    || '|'
    || COALESCE(p_layout_version_number::text, '')
    || '|'
    || LOWER(BTRIM(p_layout_definition_hash))
    || '|'
    || COALESCE(p_row_count, 0)::text
    || '|'
    || LOWER(BTRIM(p_row_identity_digest))
    || '|'
    || CASE WHEN COALESCE(p_financial_fields_included, false) THEN 'true' ELSE 'false' END
    || '|'
    || UPPER(BTRIM(p_export_format))
    || '|'
    || LOWER(BTRIM(p_package_nonce))
    || '|'
    || p_issued_epoch_sec::text
    || '|'
    || p_expires_epoch_sec::text;

  v_mac := encode(sha256(convert_to(v_payload, 'UTF8')), 'hex');
  RETURN v_mac = LOWER(BTRIM(p_expected_signature));
END;
$$;
ALTER FUNCTION public.uboq_verify_roundtrip_manifest_signature(
  text, text, text, text, text, text, text, text, text, integer, text, integer, text, boolean, text, text, bigint, bigint, text
) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_verify_roundtrip_manifest_signature(
  text, text, text, text, text, text, text, text, text, integer, text, integer, text, boolean, text, text, bigint, bigint, text
) FROM PUBLIC, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role;

CREATE OR REPLACE FUNCTION public.uboq_verify_roundtrip_call_attestation(
  p_action text,
  p_record_id text,
  p_project_id text,
  p_actor_id text,
  p_template_code text,
  p_payload_sha256 text,
  p_status_or_mode text,
  p_call_proof text
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
  IF p_action IS NULL
     OR p_record_id IS NULL
     OR p_project_id IS NULL
     OR p_actor_id IS NULL
     OR p_template_code IS NULL
     OR p_payload_sha256 IS NULL
     OR p_status_or_mode IS NULL
     OR p_call_proof IS NULL THEN
    RETURN false;
  END IF;

  SELECT "secretHex"
  INTO v_secret_hex
  FROM public."_uboq_rls_trust_anchor"
  WHERE "anchorId" = 'PRIMARY';

  IF v_secret_hex IS NULL OR char_length(v_secret_hex) < 64 THEN
    RETURN false;
  END IF;

  v_parts := string_to_array(p_call_proof, '.');
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
    || '|UBOQ_ROUNDTRIP_CALL_V1|'
    || UPPER(BTRIM(p_action))
    || '|'
    || p_record_id
    || '|'
    || p_project_id
    || '|'
    || p_actor_id
    || '|'
    || UPPER(BTRIM(p_template_code))
    || '|'
    || LOWER(BTRIM(p_payload_sha256))
    || '|'
    || UPPER(BTRIM(p_status_or_mode))
    || '|'
    || v_parts[1]
    || '|'
    || v_parts[2];

  v_expected_mac := encode(sha256(convert_to(v_payload, 'UTF8')), 'hex');
  RETURN v_expected_mac = v_parts[3];
END;
$$;
ALTER FUNCTION public.uboq_verify_roundtrip_call_attestation(
  text, text, text, text, text, text, text, text
) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_verify_roundtrip_call_attestation(
  text, text, text, text, text, text, text, text
) FROM PUBLIC, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role;

-- ============================================================================
-- 3. Privileges, FORCE RLS & Kernel-Verified Definer Guards
-- ============================================================================

REVOKE ALL ON TABLE public."UboqSignedRoundTripPackage"
  FROM PUBLIC, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role;
REVOKE ALL ON TABLE public."UboqRoundTripImportSubmission"
  FROM PUBLIC, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role;

GRANT SELECT ON TABLE public."UboqSignedRoundTripPackage" TO oserp_compat_app;
GRANT SELECT ON TABLE public."UboqRoundTripImportSubmission" TO oserp_compat_app;

GRANT SELECT, INSERT, UPDATE ON TABLE public."UboqSignedRoundTripPackage"
  TO oserp_migrations_owner;
GRANT SELECT, INSERT ON TABLE public."UboqRoundTripImportSubmission"
  TO oserp_migrations_owner;

GRANT SELECT, DELETE ON TABLE public."UboqSignedRoundTripPackage"
  TO oserp_maint_cleanup_role;
GRANT SELECT, DELETE ON TABLE public."UboqRoundTripImportSubmission"
  TO oserp_maint_cleanup_role;

ALTER TABLE public."UboqSignedRoundTripPackage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UboqSignedRoundTripPackage" FORCE ROW LEVEL SECURITY;

ALTER TABLE public."UboqRoundTripImportSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UboqRoundTripImportSubmission" FORCE ROW LEVEL SECURITY;

-- UboqSignedRoundTripPackage RLS Policies
DROP POLICY IF EXISTS rls_permissive_rtpkg_definer_all ON public."UboqSignedRoundTripPackage";
CREATE POLICY rls_permissive_rtpkg_definer_all
  ON public."UboqSignedRoundTripPackage"
  AS PERMISSIVE
  FOR ALL
  TO oserp_migrations_owner
  USING (public.uboq_check_tenant_rls("projectId"))
  WITH CHECK (public.uboq_check_tenant_rls("projectId"));

DROP POLICY IF EXISTS rls_permissive_rtpkg_maint_cleanup ON public."UboqSignedRoundTripPackage";
CREATE POLICY rls_permissive_rtpkg_maint_cleanup
  ON public."UboqSignedRoundTripPackage"
  AS PERMISSIVE
  FOR ALL
  TO oserp_maint_cleanup_role
  USING (current_setting('app.synthetic_cleanup_authorized', true) = 'on')
  WITH CHECK (false);

DROP POLICY IF EXISTS rls_permissive_rtpkg_compat_select ON public."UboqSignedRoundTripPackage";
CREATE POLICY rls_permissive_rtpkg_compat_select
  ON public."UboqSignedRoundTripPackage"
  AS PERMISSIVE
  FOR SELECT
  TO oserp_compat_app
  USING (
    public.uboq_check_tenant_rls("projectId")
    AND (
      "issuedById" = NULLIF(current_setting('app.current_user_id', true), '')
      OR public.uboq_actor_can_stage_roundtrip_import(
        "projectId",
        NULLIF(current_setting('app.current_user_id', true), '')
      )
    )
  );

DROP POLICY IF EXISTS rls_restrictive_rtpkg_compat_select ON public."UboqSignedRoundTripPackage";
CREATE POLICY rls_restrictive_rtpkg_compat_select
  ON public."UboqSignedRoundTripPackage"
  AS RESTRICTIVE
  FOR SELECT
  TO oserp_compat_app
  USING (
    public.uboq_check_tenant_rls("projectId")
    AND (
      "issuedById" = NULLIF(current_setting('app.current_user_id', true), '')
      OR public.uboq_actor_can_stage_roundtrip_import(
        "projectId",
        NULLIF(current_setting('app.current_user_id', true), '')
      )
    )
  );

DROP POLICY IF EXISTS rls_deny_compat_write_rtpkg ON public."UboqSignedRoundTripPackage";
CREATE POLICY rls_deny_compat_write_rtpkg
  ON public."UboqSignedRoundTripPackage"
  AS RESTRICTIVE
  FOR INSERT
  TO oserp_compat_app
  WITH CHECK (false);

-- UboqRoundTripImportSubmission RLS Policies
DROP POLICY IF EXISTS rls_permissive_rtimp_definer_all ON public."UboqRoundTripImportSubmission";
CREATE POLICY rls_permissive_rtimp_definer_all
  ON public."UboqRoundTripImportSubmission"
  AS PERMISSIVE
  FOR ALL
  TO oserp_migrations_owner
  USING (public.uboq_check_tenant_rls("projectId"))
  WITH CHECK (public.uboq_check_tenant_rls("projectId"));

DROP POLICY IF EXISTS rls_permissive_rtimp_maint_cleanup ON public."UboqRoundTripImportSubmission";
CREATE POLICY rls_permissive_rtimp_maint_cleanup
  ON public."UboqRoundTripImportSubmission"
  AS PERMISSIVE
  FOR ALL
  TO oserp_maint_cleanup_role
  USING (current_setting('app.synthetic_cleanup_authorized', true) = 'on')
  WITH CHECK (false);

DROP POLICY IF EXISTS rls_permissive_rtimp_compat_select ON public."UboqRoundTripImportSubmission";
CREATE POLICY rls_permissive_rtimp_compat_select
  ON public."UboqRoundTripImportSubmission"
  AS PERMISSIVE
  FOR SELECT
  TO oserp_compat_app
  USING (
    public.uboq_check_tenant_rls("projectId")
    AND (
      public.uboq_actor_has_commercial_roundtrip_access(
        "projectId",
        NULLIF(current_setting('app.current_user_id', true), '')
      )
      OR (
        "financialChangeCount" = 0
        AND (
          "actorUserId" = NULLIF(current_setting('app.current_user_id', true), '')
          OR public.uboq_actor_can_stage_roundtrip_import(
            "projectId",
            NULLIF(current_setting('app.current_user_id', true), '')
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS rls_restrictive_rtimp_compat_select ON public."UboqRoundTripImportSubmission";
CREATE POLICY rls_restrictive_rtimp_compat_select
  ON public."UboqRoundTripImportSubmission"
  AS RESTRICTIVE
  FOR SELECT
  TO oserp_compat_app
  USING (
    public.uboq_check_tenant_rls("projectId")
    AND (
      public.uboq_actor_has_commercial_roundtrip_access(
        "projectId",
        NULLIF(current_setting('app.current_user_id', true), '')
      )
      OR (
        "financialChangeCount" = 0
        AND (
          "actorUserId" = NULLIF(current_setting('app.current_user_id', true), '')
          OR public.uboq_actor_can_stage_roundtrip_import(
            "projectId",
            NULLIF(current_setting('app.current_user_id', true), '')
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS rls_deny_compat_write_rtimp ON public."UboqRoundTripImportSubmission";
CREATE POLICY rls_deny_compat_write_rtimp
  ON public."UboqRoundTripImportSubmission"
  AS RESTRICTIVE
  FOR INSERT
  TO oserp_compat_app
  WITH CHECK (false);

-- Triggers enforcing kernel current_user = 'oserp_migrations_owner' and sealing immutability
CREATE OR REPLACE FUNCTION public.uboq_guard_signed_roundtrip_package()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF current_setting('app.synthetic_cleanup_authorized', true) = 'on'
     AND pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER') THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'UBOQ_ROUNDTRIP_PACKAGE_IMMUTABLE: Signed round-trip package ledger rows cannot be deleted'
      USING ERRCODE = '42501';
  END IF;

  IF pg_has_role(session_user, 'oserp_compat_app', 'MEMBER')
     OR pg_has_role(current_user, 'oserp_compat_app', 'MEMBER')
     OR COALESCE(current_setting('app.enforce_project_rls', true), 'off') = 'on' THEN
    IF current_user <> 'oserp_migrations_owner' THEN
      RAISE EXCEPTION 'UBOQ_ROUNDTRIP_PACKAGE_DIRECT_WRITE_DENIED: Direct table write on UboqSignedRoundTripPackage is prohibited'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD."consumedByImportId" IS NOT NULL THEN
      RAISE EXCEPTION 'UBOQ_ROUNDTRIP_PACKAGE_ALREADY_CONSUMED: Consumed round-trip package % is immutable', OLD.id
        USING ERRCODE = '42501';
    END IF;

    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW."projectId" IS DISTINCT FROM OLD."projectId"
       OR NEW."templateCode" IS DISTINCT FROM OLD."templateCode"
       OR NEW."sourceType" IS DISTINCT FROM OLD."sourceType"
       OR NEW."sourceId" IS DISTINCT FROM OLD."sourceId"
       OR NEW."sourceVersion" IS DISTINCT FROM OLD."sourceVersion"
       OR NEW."sourceCanonicalHash" IS DISTINCT FROM OLD."sourceCanonicalHash"
       OR NEW."layoutMode" IS DISTINCT FROM OLD."layoutMode"
       OR NEW."layoutGroupId" IS DISTINCT FROM OLD."layoutGroupId"
       OR NEW."layoutDefinitionId" IS DISTINCT FROM OLD."layoutDefinitionId"
       OR NEW."layoutVersionNumber" IS DISTINCT FROM OLD."layoutVersionNumber"
       OR NEW."layoutDefinitionHash" IS DISTINCT FROM OLD."layoutDefinitionHash"
       OR NEW."selectedFieldsJson" IS DISTINCT FROM OLD."selectedFieldsJson"
       OR NEW."headingAliasesJson" IS DISTINCT FROM OLD."headingAliasesJson"
       OR NEW."rowCount" IS DISTINCT FROM OLD."rowCount"
       OR NEW."rowIdentityDigest" IS DISTINCT FROM OLD."rowIdentityDigest"
       OR NEW."financialFieldsIncluded" IS DISTINCT FROM OLD."financialFieldsIncluded"
       OR NEW."exportFormat" IS DISTINCT FROM OLD."exportFormat"
       OR NEW."packageNonce" IS DISTINCT FROM OLD."packageNonce"
       OR NEW."baselinePayloadSha256" IS DISTINCT FROM OLD."baselinePayloadSha256"
       OR NEW."manifestSignature" IS DISTINCT FROM OLD."manifestSignature"
       OR NEW."issuedById" IS DISTINCT FROM OLD."issuedById"
       OR NEW."issuedByRole" IS DISTINCT FROM OLD."issuedByRole"
       OR NEW."issuedAt" IS DISTINCT FROM OLD."issuedAt"
       OR NEW."expiresAt" IS DISTINCT FROM OLD."expiresAt"
       OR NEW."consumedByImportId" IS NULL
       OR NEW."consumedAt" IS NULL THEN
      RAISE EXCEPTION 'UBOQ_ROUNDTRIP_PACKAGE_IMMUTABLE: Only one-time consumption sealing is permitted on UboqSignedRoundTripPackage'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
ALTER FUNCTION public.uboq_guard_signed_roundtrip_package()
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_guard_signed_roundtrip_package()
  FROM PUBLIC, oserp_maint_cleanup_role;

DROP TRIGGER IF EXISTS trg_uboq_guard_signed_roundtrip_package ON public."UboqSignedRoundTripPackage";
CREATE TRIGGER trg_uboq_guard_signed_roundtrip_package
  BEFORE INSERT OR UPDATE OR DELETE ON public."UboqSignedRoundTripPackage"
  FOR EACH ROW
  EXECUTE FUNCTION public.uboq_guard_signed_roundtrip_package();

CREATE OR REPLACE FUNCTION public.uboq_guard_roundtrip_import_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF current_setting('app.synthetic_cleanup_authorized', true) = 'on'
     AND pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER') THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    RAISE EXCEPTION 'UBOQ_ROUNDTRIP_SUBMISSION_IMMUTABLE: UboqRoundTripImportSubmission records are append-only'
      USING ERRCODE = '42501';
  END IF;

  IF pg_has_role(session_user, 'oserp_compat_app', 'MEMBER')
     OR pg_has_role(current_user, 'oserp_compat_app', 'MEMBER')
     OR COALESCE(current_setting('app.enforce_project_rls', true), 'off') = 'on' THEN
    IF current_user <> 'oserp_migrations_owner' THEN
      RAISE EXCEPTION 'UBOQ_ROUNDTRIP_SUBMISSION_DIRECT_INSERT_DENIED: Direct table INSERT on UboqRoundTripImportSubmission is prohibited'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
ALTER FUNCTION public.uboq_guard_roundtrip_import_submission()
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_guard_roundtrip_import_submission()
  FROM PUBLIC, oserp_maint_cleanup_role;

DROP TRIGGER IF EXISTS trg_uboq_guard_roundtrip_import_submission ON public."UboqRoundTripImportSubmission";
CREATE TRIGGER trg_uboq_guard_roundtrip_import_submission
  BEFORE INSERT OR UPDATE OR DELETE ON public."UboqRoundTripImportSubmission"
  FOR EACH ROW
  EXECUTE FUNCTION public.uboq_guard_roundtrip_import_submission();

-- ============================================================================
-- 4. Attested SECURITY DEFINER Issuance & Submission Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.uboq_issue_signed_roundtrip_package(
  p_id text,
  p_project_id text,
  p_actor_id text,
  p_template_code text,
  p_source_type text,
  p_source_id text,
  p_source_version text,
  p_source_canonical_hash text,
  p_layout_mode text,
  p_layout_group_id text,
  p_layout_definition_id text,
  p_layout_version_number integer,
  p_layout_definition_hash text,
  p_selected_fields_json jsonb,
  p_heading_aliases_json jsonb,
  p_row_count integer,
  p_row_identity_digest text,
  p_financial_fields_included boolean,
  p_export_format text,
  p_package_nonce text,
  p_baseline_payload_sha256 text,
  p_manifest_signature text,
  p_issued_epoch_sec bigint,
  p_expires_epoch_sec bigint,
  p_call_proof text
)
RETURNS public."UboqSignedRoundTripPackage"
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_user record;
  v_ca record;
  v_snap record;
  v_phase_cnt integer;
  v_tpl text;
  v_fmt text;
  v_mode text;
  v_row public."UboqSignedRoundTripPackage";
BEGIN
  IF p_id IS NULL OR p_id !~ '^[A-Za-z0-9_-]{8,160}$' THEN
    RAISE EXCEPTION 'ROUNDTRIP_INVALID_PACKAGE_ID: Valid package id required'
      USING ERRCODE = '22023';
  END IF;

  IF p_project_id IS NULL
     OR public.uboq_check_tenant_rls(p_project_id) IS NOT TRUE
     OR p_actor_id IS DISTINCT FROM NULLIF(current_setting('app.current_user_id', true), '') THEN
    RAISE EXCEPTION 'ROUNDTRIP_ACTOR_CONTEXT_MISMATCH: Signed project and actor context required'
      USING ERRCODE = '42501';
  END IF;

  IF public.uboq_actor_can_stage_roundtrip_import(p_project_id, p_actor_id) IS NOT TRUE THEN
    RAISE EXCEPTION 'ROUNDTRIP_IMPORT_FORBIDDEN: Actor % is not authorized to issue signed round-trip packages on project %',
      p_actor_id, p_project_id
      USING ERRCODE = '42501';
  END IF;

  IF COALESCE(p_financial_fields_included, false) IS TRUE
     AND public.uboq_actor_has_commercial_roundtrip_access(p_project_id, p_actor_id) IS NOT TRUE THEN
    RAISE EXCEPTION 'ROUNDTRIP_FINANCIAL_FIELD_FORBIDDEN: Actor % lacks commercial access to issue financial round-trip package',
      p_actor_id
      USING ERRCODE = '42501';
  END IF;

  v_tpl := UPPER(BTRIM(COALESCE(p_template_code, '')));
  v_fmt := UPPER(BTRIM(COALESCE(p_export_format, '')));
  v_mode := UPPER(BTRIM(COALESCE(p_layout_mode, '')));

  IF v_tpl NOT IN ('T0_MASTER_CONTRACT', 'T1_PHASE_BOQ') THEN
    RAISE EXCEPTION 'ROUNDTRIP_TEMPLATE_NOT_SUPPORTED: Only ratified T0_MASTER_CONTRACT and T1_PHASE_BOQ support signed round-trip packages (got %)',
      v_tpl
      USING ERRCODE = '22023';
  END IF;

  IF public.uboq_verify_roundtrip_call_attestation(
    'ISSUE_PACKAGE',
    p_id,
    p_project_id,
    p_actor_id,
    v_tpl,
    p_baseline_payload_sha256,
    v_mode,
    p_call_proof
  ) IS NOT TRUE THEN
    RAISE EXCEPTION 'ROUNDTRIP_UNATTESTED_CALL: Valid server-minted round-trip issuance attestation required'
      USING ERRCODE = '42501';
  END IF;

  IF public.uboq_verify_roundtrip_manifest_signature(
    p_id,
    p_project_id,
    v_tpl,
    p_source_type,
    p_source_id,
    p_source_version,
    p_source_canonical_hash,
    v_mode,
    p_layout_definition_id,
    p_layout_version_number,
    p_layout_definition_hash,
    p_row_count,
    p_row_identity_digest,
    p_financial_fields_included,
    v_fmt,
    p_package_nonce,
    p_issued_epoch_sec,
    p_expires_epoch_sec,
    p_manifest_signature
  ) IS NOT TRUE THEN
    RAISE EXCEPTION 'ROUNDTRIP_SIGNATURE_INVALID: Package manifest signature failed trust-anchor verification'
      USING ERRCODE = '42501';
  END IF;

  -- Verify canonical source ownership and APPROVED status on p_project_id
  IF v_tpl = 'T0_MASTER_CONTRACT' THEN
    SELECT id, "projectId", status, "approvedAt", "approvedById"
    INTO v_ca
    FROM public."UboqContractAuthority"
    WHERE id = p_source_id
      AND "projectId" = p_project_id;

    IF v_ca.id IS NULL
       OR v_ca.status::text <> 'APPROVED'
       OR v_ca."approvedAt" IS NULL
       OR v_ca."approvedById" IS NULL THEN
      RAISE EXCEPTION 'ROUNDTRIP_APPROVED_SOURCE_NOT_FOUND: Approved UboqContractAuthority % not found on project %',
        p_source_id, p_project_id
        USING ERRCODE = '42501';
    END IF;
  ELSE
    SELECT id, "projectId", status, "approvedAt", "approvedById", "versionNumber"
    INTO v_snap
    FROM public."UboqOperationalSnapshot"
    WHERE id = p_source_id
      AND "projectId" = p_project_id;

    IF v_snap.id IS NULL
       OR v_snap.status::text <> 'APPROVED'
       OR v_snap."approvedAt" IS NULL
       OR v_snap."approvedById" IS NULL THEN
      RAISE EXCEPTION 'ROUNDTRIP_APPROVED_SOURCE_NOT_FOUND: Approved UboqOperationalSnapshot % not found on project %',
        p_source_id, p_project_id
        USING ERRCODE = '42501';
    END IF;

    SELECT count(*)::integer
    INTO v_phase_cnt
    FROM public."UboqAwardedPhaseLine"
    WHERE "projectId" = p_project_id
      AND "snapshotId" = v_snap.id;

    IF v_phase_cnt <> p_row_count THEN
      RAISE EXCEPTION 'ROUNDTRIP_ROW_LINEAGE_MISMATCH: Snapshot % phase line count (%) does not match package rowCount (%)',
        v_snap.id, v_phase_cnt, p_row_count
        USING ERRCODE = '22023';
    END IF;
  END IF;

  SELECT id, role
  INTO v_user
  FROM public."User"
  WHERE id = p_actor_id;

  INSERT INTO public."UboqSignedRoundTripPackage" (
    "id",
    "projectId",
    "templateCode",
    "sourceType",
    "sourceId",
    "sourceVersion",
    "sourceCanonicalHash",
    "layoutMode",
    "layoutGroupId",
    "layoutDefinitionId",
    "layoutVersionNumber",
    "layoutDefinitionHash",
    "selectedFieldsJson",
    "headingAliasesJson",
    "rowCount",
    "rowIdentityDigest",
    "financialFieldsIncluded",
    "exportFormat",
    "packageNonce",
    "baselinePayloadSha256",
    "manifestSignature",
    "issuedById",
    "issuedByRole",
    "issuedAt",
    "expiresAt"
  )
  VALUES (
    p_id,
    p_project_id,
    v_tpl,
    UPPER(BTRIM(p_source_type)),
    p_source_id,
    p_source_version,
    LOWER(BTRIM(p_source_canonical_hash)),
    v_mode,
    NULLIF(BTRIM(COALESCE(p_layout_group_id, '')), ''),
    NULLIF(BTRIM(COALESCE(p_layout_definition_id, '')), ''),
    p_layout_version_number,
    LOWER(BTRIM(p_layout_definition_hash)),
    p_selected_fields_json,
    p_heading_aliases_json,
    p_row_count,
    LOWER(BTRIM(p_row_identity_digest)),
    COALESCE(p_financial_fields_included, false),
    v_fmt,
    LOWER(BTRIM(p_package_nonce)),
    LOWER(BTRIM(p_baseline_payload_sha256)),
    LOWER(BTRIM(p_manifest_signature)),
    p_actor_id,
    UPPER(BTRIM(COALESCE(v_user.role, ''))),
    to_timestamp(p_issued_epoch_sec)::timestamp(3),
    to_timestamp(p_expires_epoch_sec)::timestamp(3)
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;
ALTER FUNCTION public.uboq_issue_signed_roundtrip_package(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, jsonb, jsonb, integer, text, boolean, text, text, text, text, bigint, bigint, text
) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_issue_signed_roundtrip_package(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, jsonb, jsonb, integer, text, boolean, text, text, text, text, bigint, bigint, text
) FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_issue_signed_roundtrip_package(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, jsonb, jsonb, integer, text, boolean, text, text, text, text, bigint, bigint, text
) TO oserp_compat_app;

CREATE OR REPLACE FUNCTION public.uboq_record_roundtrip_import_submission(
  p_id text,
  p_project_id text,
  p_actor_id text,
  p_package_id text,
  p_idempotency_key text,
  p_uploaded_file_sha256 text,
  p_import_format text,
  p_template_code text,
  p_source_id text,
  p_source_version text,
  p_layout_definition_id text,
  p_layout_version_number integer,
  p_layout_definition_hash text,
  p_conflict_resolution_mode text,
  p_verification_status text,
  p_failure_code text,
  p_total_row_count integer,
  p_changed_row_count integer,
  p_non_financial_change_count integer,
  p_financial_change_count integer,
  p_proposed_changes_json jsonb,
  p_diagnostics_json jsonb,
  p_call_proof text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_user record;
  v_existing public."UboqRoundTripImportSubmission";
  v_pkg public."UboqSignedRoundTripPackage";
  v_tpl text;
  v_fmt text;
  v_mode text;
  v_status text;
  v_sha text;
  v_inserted public."UboqRoundTripImportSubmission";
BEGIN
  IF p_id IS NULL OR p_id !~ '^[A-Za-z0-9_-]{8,160}$' THEN
    RAISE EXCEPTION 'ROUNDTRIP_INVALID_SUBMISSION_ID: Valid submission id required'
      USING ERRCODE = '22023';
  END IF;

  IF p_project_id IS NULL
     OR public.uboq_check_tenant_rls(p_project_id) IS NOT TRUE
     OR p_actor_id IS DISTINCT FROM NULLIF(current_setting('app.current_user_id', true), '') THEN
    RAISE EXCEPTION 'ROUNDTRIP_ACTOR_CONTEXT_MISMATCH: Signed project and actor context required'
      USING ERRCODE = '42501';
  END IF;

  v_tpl := UPPER(BTRIM(COALESCE(p_template_code, '')));
  v_fmt := UPPER(BTRIM(COALESCE(p_import_format, '')));
  v_mode := UPPER(BTRIM(COALESCE(p_conflict_resolution_mode, '')));
  v_status := UPPER(BTRIM(COALESCE(p_verification_status, '')));
  v_sha := LOWER(BTRIM(COALESCE(p_uploaded_file_sha256, '')));

  IF v_tpl NOT IN ('T0_MASTER_CONTRACT', 'T1_PHASE_BOQ') THEN
    RAISE EXCEPTION 'ROUNDTRIP_TEMPLATE_NOT_SUPPORTED: Unsupported round-trip template code (%)' , v_tpl
      USING ERRCODE = '22023';
  END IF;

  IF public.uboq_verify_roundtrip_call_attestation(
    'RECORD_SUBMISSION',
    p_id,
    p_project_id,
    p_actor_id,
    v_tpl,
    v_sha,
    v_status,
    p_call_proof
  ) IS NOT TRUE THEN
    RAISE EXCEPTION 'ROUNDTRIP_UNATTESTED_CALL: Valid server-minted round-trip submission attestation required'
      USING ERRCODE = '42501';
  END IF;

  SELECT id, role, status, "lockedUntil"
  INTO v_user
  FROM public."User"
  WHERE id = p_actor_id;

  IF v_user.id IS NULL
     OR UPPER(COALESCE(v_user.status, '')) <> 'ACTIVE'
     OR (v_user."lockedUntil" IS NOT NULL AND v_user."lockedUntil" > clock_timestamp()) THEN
    RAISE EXCEPTION 'ROUNDTRIP_INACTIVE_ACTOR: Actor % is inactive or locked', p_actor_id
      USING ERRCODE = '42501';
  END IF;

  -- Serialize concurrent idempotency checks per (projectId, idempotencyKey) without requiring UPDATE privilege on append-only table
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('UBOQ_RTIMP|' || p_project_id || '|' || p_idempotency_key, 0)
  );

  SELECT *
  INTO v_existing
  FROM public."UboqRoundTripImportSubmission"
  WHERE "projectId" = p_project_id
    AND "idempotencyKey" = p_idempotency_key;

  IF v_existing.id IS NOT NULL THEN
    IF v_existing."actorUserId" = p_actor_id
       AND v_existing."uploadedFileSha256" = v_sha
       AND COALESCE(v_existing."packageId", '') = COALESCE(NULLIF(BTRIM(COALESCE(p_package_id, '')), ''), '')
       AND v_existing."conflictResolutionMode" = v_mode THEN
      RETURN jsonb_build_object(
        'idempotentReplay', true,
        'submission', to_jsonb(v_existing)
      );
    END IF;

    RAISE EXCEPTION 'ROUNDTRIP_IDEMPOTENCY_KEY_CONFLICT: Idempotency key % already used on project % with different actor, package, or payload digest',
      p_idempotency_key, p_project_id
      USING ERRCODE = '23505';
  END IF;

  -- For accepted/staged submissions, enforce strict stage RBAC, commercial RBAC, and atomic one-time package consumption
  IF v_status IN ('VERIFIED_NO_CHANGES', 'STAGED_PENDING_APPROVAL') THEN
    IF public.uboq_actor_can_stage_roundtrip_import(p_project_id, p_actor_id) IS NOT TRUE THEN
      RAISE EXCEPTION 'ROUNDTRIP_IMPORT_FORBIDDEN: Actor % is not authorized to stage round-trip imports on project %',
        p_actor_id, p_project_id
        USING ERRCODE = '42501';
    END IF;

    IF COALESCE(p_financial_change_count, 0) > 0
       AND public.uboq_actor_has_commercial_roundtrip_access(p_project_id, p_actor_id) IS NOT TRUE THEN
      RAISE EXCEPTION 'ROUNDTRIP_FINANCIAL_FIELD_FORBIDDEN: Actor % is not authorized to modify commercial/financial BOQ or contract fields',
        p_actor_id
        USING ERRCODE = '42501';
    END IF;

    IF v_status = 'STAGED_PENDING_APPROVAL' AND v_mode <> 'STAGE_GOVERNED_CHANGE_PROPOSAL' THEN
      RAISE EXCEPTION 'ROUNDTRIP_SILENT_OVERWRITE_BLOCKED: Staged round-trip changes require explicit STAGE_GOVERNED_CHANGE_PROPOSAL mode'
        USING ERRCODE = '22023';
    END IF;

    IF p_package_id IS NULL OR BTRIM(p_package_id) = '' THEN
      RAISE EXCEPTION 'ROUNDTRIP_PACKAGE_REQUIRED: Signed packageId is mandatory for verified round-trip submission'
        USING ERRCODE = '22023';
    END IF;

    SELECT *
    INTO v_pkg
    FROM public."UboqSignedRoundTripPackage"
    WHERE id = p_package_id
      AND "projectId" = p_project_id
    FOR UPDATE;

    IF v_pkg.id IS NULL THEN
      RAISE EXCEPTION 'ROUNDTRIP_PACKAGE_NOT_FOUND: Signed package % not found on project %',
        p_package_id, p_project_id
        USING ERRCODE = '42501';
    END IF;

    IF v_pkg."consumedByImportId" IS NOT NULL THEN
      RAISE EXCEPTION 'ROUNDTRIP_PACKAGE_REPLAY_BLOCKED: Signed package % was already consumed by submission %',
        p_package_id, v_pkg."consumedByImportId"
        USING ERRCODE = '23505';
    END IF;

    IF v_pkg."expiresAt" < clock_timestamp() THEN
      RAISE EXCEPTION 'ROUNDTRIP_PACKAGE_EXPIRED: Signed package % expired at %',
        p_package_id, v_pkg."expiresAt"
        USING ERRCODE = '22023';
    END IF;

    IF v_pkg."templateCode" <> v_tpl OR v_pkg."sourceId" <> p_source_id THEN
      RAISE EXCEPTION 'ROUNDTRIP_SOURCE_IDENTITY_MISMATCH: Submission template/source does not match signed package %',
        p_package_id
        USING ERRCODE = '42501';
    END IF;
  END IF;

  INSERT INTO public."UboqRoundTripImportSubmission" (
    "id",
    "projectId",
    "packageId",
    "idempotencyKey",
    "uploadedFileSha256",
    "importFormat",
    "templateCode",
    "sourceId",
    "sourceVersion",
    "layoutDefinitionId",
    "layoutVersionNumber",
    "layoutDefinitionHash",
    "conflictResolutionMode",
    "actorUserId",
    "actorRole",
    "verificationStatus",
    "failureCode",
    "totalRowCount",
    "changedRowCount",
    "nonFinancialChangeCount",
    "financialChangeCount",
    "proposedChangesJson",
    "diagnosticsJson"
  )
  VALUES (
    p_id,
    p_project_id,
    CASE
      WHEN p_package_id IS NOT NULL
       AND EXISTS (
         SELECT 1
         FROM public."UboqSignedRoundTripPackage" kp
         WHERE kp.id = p_package_id AND kp."projectId" = p_project_id
       )
      THEN p_package_id
      ELSE NULL
    END,
    p_idempotency_key,
    v_sha,
    v_fmt,
    v_tpl,
    NULLIF(BTRIM(COALESCE(p_source_id, '')), ''),
    NULLIF(BTRIM(COALESCE(p_source_version, '')), ''),
    NULLIF(BTRIM(COALESCE(p_layout_definition_id, '')), ''),
    p_layout_version_number,
    NULLIF(LOWER(BTRIM(COALESCE(p_layout_definition_hash, ''))), ''),
    v_mode,
    p_actor_id,
    UPPER(BTRIM(COALESCE(v_user.role, ''))),
    v_status,
    NULLIF(BTRIM(COALESCE(p_failure_code, '')), ''),
    COALESCE(p_total_row_count, 0),
    COALESCE(p_changed_row_count, 0),
    COALESCE(p_non_financial_change_count, 0),
    COALESCE(p_financial_change_count, 0),
    p_proposed_changes_json,
    p_diagnostics_json
  )
  RETURNING * INTO v_inserted;

  IF v_status IN ('VERIFIED_NO_CHANGES', 'STAGED_PENDING_APPROVAL') THEN
    UPDATE public."UboqSignedRoundTripPackage"
       SET "consumedByImportId" = v_inserted.id,
           "consumedAt" = clock_timestamp()
     WHERE id = p_package_id
       AND "projectId" = p_project_id;
  END IF;

  RETURN jsonb_build_object(
    'idempotentReplay', false,
    'submission', to_jsonb(v_inserted)
  );
END;
$$;
ALTER FUNCTION public.uboq_record_roundtrip_import_submission(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, text, text, text, integer, integer, integer, integer, jsonb, jsonb, text
) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_record_roundtrip_import_submission(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, text, text, text, integer, integer, integer, integer, jsonb, jsonb, text
) FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_record_roundtrip_import_submission(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, text, text, text, integer, integer, integer, integer, jsonb, jsonb, text
) TO oserp_compat_app;
