-- ============================================================================
-- OSERP-PROJ-UBOQ-001 — G02-R1 FINAL TARGETED SECURITY, PROVENANCE & CLEANUP HARDENING
-- Remediates R1-H01, R1-H02, R1-H03, R1-M02 via forward-only migration (#16)
-- ============================================================================

-- 1. R1-H01 & R1-M02: Extraction-Candidate-to-PhaseLine Provenance FK & Nullable Sourced ABC/EDC
ALTER TABLE "UboqAwardedPhaseLine"
  ADD COLUMN IF NOT EXISTS "extractionCandidateId" TEXT;

CREATE INDEX IF NOT EXISTS "UboqAwardedPhaseLine_extractionCandidateId_idx"
  ON "UboqAwardedPhaseLine"("extractionCandidateId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UboqAwardedPhaseLine_extractionCandidateId_fkey'
  ) THEN
    ALTER TABLE "UboqAwardedPhaseLine"
      ADD CONSTRAINT "UboqAwardedPhaseLine_extractionCandidateId_fkey"
      FOREIGN KEY ("extractionCandidateId") REFERENCES "UboqExtractionCandidate"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "UboqAgencyEstimateBaseline"
  ALTER COLUMN "agencyEdcAmt" DROP NOT NULL,
  ALTER COLUMN "agencyEdcAmt" DROP DEFAULT,
  ALTER COLUMN "agencyAbcAmt" DROP NOT NULL,
  ALTER COLUMN "agencyAbcAmt" DROP DEFAULT;

-- 2. R1-H02: Owner-Private Cryptographic Trust Anchor & Non-Forgeable Session Binding
CREATE TABLE IF NOT EXISTS "_uboq_rls_trust_anchor" (
  "anchorId" TEXT PRIMARY KEY,
  "secretHex" TEXT NOT NULL CHECK (char_length("secretHex") >= 64),
  "rotatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "_uboq_rls_trust_anchor" OWNER TO oserp_migrations_owner;
ALTER TABLE "_uboq_rls_trust_anchor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_uboq_rls_trust_anchor" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "_uboq_rls_trust_anchor" FROM PUBLIC, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role;

CREATE OR REPLACE FUNCTION uboq_has_active_project_assignment(
  p_project_id text,
  p_user_id text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN p_project_id IS NULL OR p_user_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1
      FROM "ProjectUserAssignment" pua
      WHERE pua."projectId" = p_project_id
        AND pua."userId" = p_user_id
        AND UPPER(COALESCE(pua."assignmentStatus", '')) = 'ACTIVE'
    )
  END;
$$;
ALTER FUNCTION uboq_has_active_project_assignment(text, text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION uboq_has_active_project_assignment(text, text) FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION uboq_has_active_project_assignment(text, text) TO oserp_compat_app;

-- Verifies server-minted SHA-256 MAC over (secretHex | projectId | userId | sessionVersion | issuedEpochSec | nonceHex).
-- Defeats direct SQL mutable-GUC impersonation (set_config of app.current_user_id / app.current_session_version / app.current_project_id).
CREATE OR REPLACE FUNCTION uboq_verify_signed_rls_proof(
  p_project_id text,
  p_user_id text,
  p_session_version text,
  p_proof text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_secret_hex text;
  v_parts text[];
  v_issued_sec bigint;
  v_now_sec bigint;
  v_expected_mac text;
BEGIN
  IF p_project_id IS NULL OR p_user_id IS NULL OR p_session_version IS NULL OR p_proof IS NULL THEN
    RETURN false;
  END IF;

  SELECT "secretHex"
  INTO v_secret_hex
  FROM "_uboq_rls_trust_anchor"
  WHERE "anchorId" = 'PRIMARY';

  IF v_secret_hex IS NULL OR char_length(v_secret_hex) < 64 THEN
    RETURN false;
  END IF;

  v_parts := string_to_array(p_proof, '.');
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

  v_expected_mac := encode(
    sha256(
      convert_to(
        v_secret_hex || '|UBOQ_RLS_V1|' || p_project_id || '|' || p_user_id || '|' || p_session_version || '|' || v_parts[1] || '|' || v_parts[2],
        'UTF8'
      )
    ),
    'hex'
  );

  RETURN v_expected_mac = v_parts[3];
END;
$$;
ALTER FUNCTION uboq_verify_signed_rls_proof(text, text, text, text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION uboq_verify_signed_rls_proof(text, text, text, text) FROM PUBLIC, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION uboq_verify_signed_rls_proof(text, text, text, text) TO oserp_compat_app, oserp_legacy_app;

-- Upgrade tenant RLS predicate to require cryptographic proof + DB-verified active actor/assignment
-- Evaluates oserp_legacy_app containment FIRST so legacy rollback connections never invoke compat session proof,
-- while oserp_compat_app / enforced RLS sessions strictly require both signed proof and active DB actor verification.
CREATE OR REPLACE FUNCTION uboq_check_tenant_rls(p_project_id text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF pg_has_role(session_user, 'oserp_legacy_app', 'MEMBER')
     OR pg_has_role(current_user, 'oserp_legacy_app', 'MEMBER') THEN
    RETURN (
      p_project_id IS NOT NULL
      AND p_project_id = NULLIF(current_setting('app.current_project_id', true), '')
      AND NOT uboq_is_governed_project(p_project_id)
    );
  END IF;

  IF pg_has_role(session_user, 'oserp_compat_app', 'MEMBER')
     OR pg_has_role(current_user, 'oserp_compat_app', 'MEMBER')
     OR COALESCE(current_setting('app.enforce_project_rls', true), 'off') = 'on' THEN
    RETURN (
      p_project_id IS NOT NULL
      AND p_project_id = NULLIF(current_setting('app.current_project_id', true), '')
      AND uboq_verify_signed_rls_proof(
        p_project_id,
        NULLIF(current_setting('app.current_user_id', true), ''),
        NULLIF(current_setting('app.current_session_version', true), ''),
        NULLIF(current_setting('app.current_rls_proof', true), '')
      )
      AND uboq_verify_bound_actor_for_project(
        p_project_id,
        NULLIF(current_setting('app.current_user_id', true), ''),
        NULLIF(current_setting('app.current_session_version', true), '')
      )
    );
  END IF;

  RETURN true;
END;
$$;
ALTER FUNCTION uboq_check_tenant_rls(text) OWNER TO oserp_migrations_owner;

-- Upgrade promotion RPC to also enforce cryptographic proof against GUC actor impersonation
CREATE OR REPLACE FUNCTION uboq_promote_approved_consolidated_group(
  p_snapshot_id text,
  p_consolidation_group_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_snap record;
  v_grp record;
  v_actor_id text := NULLIF(current_setting('app.current_user_id', true), '');
  v_sess_ver text := NULLIF(current_setting('app.current_session_version', true), '');
  v_ctx_proj text := NULLIF(current_setting('app.current_project_id', true), '');
  v_rls_proof text := NULLIF(current_setting('app.current_rls_proof', true), '');
  v_actor_role text;
  v_pending_reviews int := 0;
  v_open_blockers int := 0;
BEGIN
  IF pg_has_role(session_user, 'oserp_legacy_app', 'MEMBER') OR pg_has_role(current_user, 'oserp_legacy_app', 'MEMBER') THEN
    RAISE EXCEPTION 'UBOQ_LEGACY_ROLE_DENIED: oserp_legacy_app cannot promote UBOQ snapshots'
      USING ERRCODE = '42501';
  END IF;

  SELECT id, "projectId", "sourceDocumentId", status, "preparedById", "approvedById"
  INTO v_snap
  FROM "UboqOperationalSnapshot"
  WHERE id = p_snapshot_id;

  IF v_snap.id IS NULL THEN
    RAISE EXCEPTION 'UBOQ_PROMOTE_SNAPSHOT_NOT_FOUND: Snapshot % does not exist', p_snapshot_id
      USING ERRCODE = 'P0002';
  END IF;

  SELECT id, "projectId", "consolidatedBoqItemId", "totalApprovedQty", "weightedUnitRate", "totalContractAmount"
  INTO v_grp
  FROM "UboqConsolidationGroup"
  WHERE id = p_consolidation_group_id;

  IF v_grp.id IS NULL OR v_grp."projectId" IS DISTINCT FROM v_snap."projectId" THEN
    RAISE EXCEPTION 'UBOQ_PROMOTE_CROSS_PROJECT_DENIED: ConsolidationGroup % does not belong to Snapshot % project', p_consolidation_group_id, p_snapshot_id
      USING ERRCODE = '42501';
  END IF;

  IF v_ctx_proj IS DISTINCT FROM v_snap."projectId" THEN
    RAISE EXCEPTION 'UBOQ_PROMOTE_TENANT_SCOPE_MISMATCH: Bound app.current_project_id (%) != snapshot project (%)', v_ctx_proj, v_snap."projectId"
      USING ERRCODE = '42501';
  END IF;

  IF v_snap.status <> 'APPROVED' OR v_snap."approvedById" IS NULL THEN
    RAISE EXCEPTION 'UBOQ_PROMOTE_UNAPPROVED_SNAPSHOT: Snapshot % is in status % (must be APPROVED)', p_snapshot_id, v_snap.status
      USING ERRCODE = 'P0001';
  END IF;

  IF v_snap."approvedById" = v_snap."preparedById" THEN
    RAISE EXCEPTION 'UBOQ_PROMOTE_SOD_VIOLATION: Snapshot % preparer cannot equal approver', p_snapshot_id
      USING ERRCODE = '42501';
  END IF;

  IF v_actor_id IS DISTINCT FROM v_snap."approvedById"
     OR NOT uboq_verify_signed_rls_proof(v_snap."projectId", v_actor_id, v_sess_ver, v_rls_proof)
     OR NOT uboq_verify_bound_actor_for_project(v_snap."projectId", v_actor_id, v_sess_ver) THEN
    RAISE EXCEPTION 'UBOQ_PROMOTE_ACTOR_UNAUTHORIZED: Bound DB actor (%) lacks verified cryptographic session proof or approver authority for project %', v_actor_id, v_snap."projectId"
      USING ERRCODE = '42501';
  END IF;

  SELECT UPPER(COALESCE(role, ''))
  INTO v_actor_role
  FROM "User"
  WHERE id = v_actor_id;

  IF v_actor_role NOT IN (
    'PROJECT_MANAGER', 'PROJECT_DIRECTOR', 'DIRECTORS', 'OPERATIONS_MANAGER', 'ADMIN',
    'COST_ENGINEER', 'FINANCE_MANAGER', 'VP_OPERATIONS', 'PRESIDENT', 'SYSTEM_ADMIN', 'SUPER_ADMIN'
  ) THEN
    RAISE EXCEPTION 'UBOQ_PROMOTE_STAGE_RBAC_DENIED: Role % lacks snapshot promotion authority', v_actor_role
      USING ERRCODE = '42501';
  END IF;

  SELECT COUNT(*)
  INTO v_pending_reviews
  FROM "UboqExtractionCandidate" ec
  WHERE (
    ec."sourceDocumentId" = v_snap."sourceDocumentId"
    OR ec."sourceDocumentId" IN (
      SELECT DISTINCT "sourceDocumentId"
      FROM "UboqAwardedPhaseLine"
      WHERE "snapshotId" = v_snap.id AND "sourceDocumentId" IS NOT NULL
    )
  )
  AND ec."requiresHumanReview" = true
  AND ec."reviewDecision" = 'PENDING_HUMAN_REVIEW';

  IF v_pending_reviews > 0 THEN
    RAISE EXCEPTION 'UBOQ_PROMOTE_PENDING_HUMAN_REVIEW: Snapshot % has % unresolved human-review candidate(s)', p_snapshot_id, v_pending_reviews
      USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(*)
  INTO v_open_blockers
  FROM "UboqValidationException"
  WHERE "projectId" = v_snap."projectId"
    AND status = 'OPEN'
    AND severity = 'BLOCKING';

  IF v_open_blockers > 0 THEN
    RAISE EXCEPTION 'UBOQ_PROMOTE_OPEN_BLOCKING_EXCEPTIONS: Project % has % open BLOCKING exception(s)', v_snap."projectId", v_open_blockers
      USING ERRCODE = 'P0001';
  END IF;

  PERFORM set_config('app.uboq_snapshot_sync', 'on', true);
  UPDATE "ConsolidatedBOQItem"
  SET
    "quantity" = v_grp."totalApprovedQty"::double precision,
    "revisedQuantity" = v_grp."totalApprovedQty"::double precision,
    "unitCost" = v_grp."weightedUnitRate"::double precision,
    "totalCost" = v_grp."totalContractAmount"::double precision,
    "revisedTotalCost" = v_grp."totalContractAmount"::double precision,
    "isUboqResourceGoverned" = true,
    "updatedAt" = NOW()
  WHERE id = v_grp."consolidatedBoqItemId"
    AND "projectId" = v_snap."projectId";
  PERFORM set_config('app.uboq_snapshot_sync', 'off', true);
END;
$$;
ALTER FUNCTION uboq_promote_approved_consolidated_group(text, text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION uboq_promote_approved_consolidated_group(text, text) FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION uboq_promote_approved_consolidated_group(text, text) TO oserp_compat_app;

-- 3. R1-H02: Replace Blanket Schema Grants With Explicit Least-Privilege Table Grants & Auth RLS
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO oserp_migrations_owner;

DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    REVOKE ALL ON TABLE "_prisma_migrations" FROM PUBLIC, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role;
  END IF;
END $$;

-- 3a. Read-only SELECT on identity, RBAC, PBAC, policy & statutory reference tables (ZERO runtime INSERT/UPDATE/DELETE)
GRANT SELECT ON TABLE
  "User",
  "SystemRole",
  "Role",
  "UserRole",
  "Module",
  "RolePermission",
  "RoleConflictRule",
  "ProjectUserAssignment",
  "ValidationSettings",
  "GovernmentSettings",
  "SSSTable",
  "BIRWithholdingTaxTable",
  "PayrollCutoffSetting",
  "NotebookReference",
  "NotebookReferenceVersion",
  "NotebookReferenceModule",
  "NotebookReferenceRole",
  "NotebookReferenceProject",
  "AINotebookReference",
  "AIValidationRule",
  "AIModulePrompt",
  "AIConfiguration",
  "WorkflowTemplate",
  "WorkflowStep",
  "DocumentTemplate",
  "KnowledgeRecord",
  "KnowledgeReference",
  "KnowledgeRuleReference"
TO oserp_compat_app, oserp_legacy_app;

-- Enforce tenant-scoped FORCE RLS on ProjectUserAssignment (zero cross-project or unbound assignment enumeration)
ALTER TABLE "ProjectUserAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectUserAssignment" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_permissive_pua_select ON "ProjectUserAssignment";
CREATE POLICY rls_permissive_pua_select ON "ProjectUserAssignment"
  AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);
DROP POLICY IF EXISTS rls_restrictive_pua_tenant ON "ProjectUserAssignment";
CREATE POLICY rls_restrictive_pua_tenant ON "ProjectUserAssignment"
  AS RESTRICTIVE FOR ALL TO PUBLIC
  USING (uboq_check_tenant_rls("projectId"))
  WITH CHECK (false);

-- 3b. Append-only SELECT, INSERT on audit, security log, immutable L0/L1 vault & UBOQ resource ledger tables
GRANT SELECT, INSERT ON TABLE
  "AuditLog",
  "ValidationAuditLog",
  "PayrollAuditLog",
  "UserLoginLog",
  "UserSessionSecurityLog",
  "AIQuerySecurityLog",
  "FileSecurityLog",
  "SensitiveExportLog",
  "SecurityEvent",
  "ExecutiveAccessLog",
  "ExecutiveAlertLog",
  "AIValidationLog",
  "ExpenseApprovalLog",
  "ScheduleWorkflowTransition",
  "ScheduleGenerationAudit",
  "WorkbookExtractionAudit"
TO oserp_compat_app, oserp_legacy_app;

GRANT SELECT, INSERT ON TABLE
  "UboqSourceDocument",
  "UboqDocumentSection",
  "UboqResourceLedgerEntry"
TO oserp_compat_app;

-- 3c. UBOQ governed staging & snapshot tables: SELECT, INSERT, UPDATE ONLY for oserp_compat_app (ZERO DELETE; ZERO legacy access)
GRANT SELECT, INSERT, UPDATE ON TABLE
  "UboqExtractionCandidate",
  "UboqTaxPricingProfile",
  "UboqContractAuthority",
  "UboqOperationalSnapshot",
  "UboqAwardedPhaseLine",
  "UboqConsolidationGroup",
  "UboqConsolidationLink",
  "UboqAgencyEstimateBaseline",
  "UboqContractorTargetBudget",
  "UboqCanonicalResourceAccount",
  "UboqProcurementResourceRequirement",
  "UboqResourceWorkItemAllocation",
  "UboqStockLotEvidence",
  "UboqTemplateDefinition",
  "UboqScheduleActivityLink",
  "UboqCashFlowPeriod",
  "UboqValidationException"
TO oserp_compat_app;

-- 3d. Operational ERP project/BOQ/procurement/inventory/finance tables (governed by FORCE RLS + trigger guards; ZERO DELETE on headers/ledgers)
GRANT SELECT, INSERT, UPDATE ON TABLE
  "Project",
  "Supplier",
  "AwardedBOQItem",
  "BOQLotBreakdown",
  "ConsolidatedBOQItem",
  "ProcurementBenchmarkItem",
  "BOQMapping",
  "MaterialRequest",
  "MaterialRequestItem",
  "PurchaseOrder",
  "PurchaseOrderItem",
  "Delivery",
  "DeliveryItem",
  "AccountsPayable",
  "MaterialIssuance",
  "IssuanceItem",
  "MaterialReturn",
  "ReturnItem",
  "ConsumptionLog",
  "ConsumptionItem",
  "Expense",
  "ExpenseBreakdownItem",
  "ExpenseProofFile",
  "ExpenseAIValidation",
  "ProjectCostLedger",
  "CommitmentLedger",
  "Accomplishment",
  "AccomplishmentItem",
  "Inspection",
  "Billing",
  "BillingItem",
  "BillingDeduction",
  "Payment",
  "VariationOrder",
  "VariationOrderItem",
  "VariationOrderDocument",
  "VariationOrderApproval",
  "Document",
  "ProjectSchedule",
  "ScheduleWBS",
  "ScheduleActivity",
  "ScheduleDependency",
  "ScheduleMilestone",
  "ScheduleBOQAllocation",
  "SchedulePOWMapping",
  "ScheduleProgressUpdate",
  "ScheduleDelayRecord",
  "ScheduleRecoveryPlan",
  "ScheduleRevisionRequest",
  "ScheduleApproval",
  "ScheduleReviewComment",
  "BaselineActivation",
  "FinancialDataWaiver",
  "ScheduleRevisionReason",
  "TransactionWorkflow",
  "LockedRecord",
  "RevisionRequest",
  "PaymentLog",
  "AITransactionValidation",
  "AIValidationRecord",
  "AIValidationOverride",
  "AIRiskScore",
  "AIAuditFinding",
  "AISearchLog",
  "AINotification",
  "AIReferenceUsageLog",
  "NotebookReferenceApprovalLog",
  "NotebookReferenceIndexLog",
  "KnowledgeAuditTrail",
  "KnowledgeRuleAuditLog"
TO oserp_compat_app, oserp_legacy_app;

-- Draft canvass editing tables (where canvass.ts replaces draft quotation items under FORCE RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  "CanvassForm",
  "CanvassItem",
  "SupplierQuotation",
  "QuotationItem"
TO oserp_compat_app, oserp_legacy_app;

-- Read-only Project lookup for maintenance cleanup role (all deletions gated strictly through manifest-verified SECURITY DEFINER RPC)
GRANT SELECT ON TABLE "Project" TO oserp_maint_cleanup_role;

-- 4. R1-H03: Transitive Dependency-Closure Manifest & Verified Synthetic Cleanup
CREATE OR REPLACE FUNCTION uboq_build_synthetic_cleanup_manifest(p_project_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
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
  v_tbl record;
  v_ids text[];
  v_dyn_cnt bigint;
  v_eligible boolean := true;
  v_manifest_hash text;
BEGIN
  IF NOT pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER')
     AND NOT pg_has_role(current_user, 'oserp_maint_cleanup_role', 'MEMBER')
     AND NOT (SELECT rolsuper FROM pg_roles WHERE rolname = session_user) THEN
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

  -- Enumerate deterministic sorted IDs for every in-scope transitive descendant table
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
        ('Document', format('SELECT ARRAY(SELECT id::text FROM "Document" WHERE "projectId" = %L ORDER BY id)', p_project_id))
    ) AS t(tbl_name, sql_q)
  LOOP
    EXECUTE v_tbl.sql_q INTO v_ids;
    v_counts := v_counts || jsonb_build_object(v_tbl.tbl_name, COALESCE(array_length(v_ids, 1), 0));
    v_canonical_parts := array_append(
      v_canonical_parts,
      v_tbl.tbl_name || ':' || COALESCE(array_to_string(v_ids, ','), '')
    );
  END LOOP;

  -- Financial & Posted Record Disqualifiers: Refuse if ANY paid/settled/posted AP or approved/paid Expense exists
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

  -- Cross-Project Foreign Reference Disqualifiers
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

  -- Dynamic Out-of-Scope Project FK Introspection (Billing, Payroll, Worker, PettyCash, Subcontract, ScheduleWorkflowTransition, etc.)
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
        'UboqTemplateDefinition', 'UboqCashFlowPeriod', 'UboqValidationException',
        'MaterialRequest', 'CanvassForm', 'MaterialIssuance', 'MaterialReturn',
        'ConsumptionLog', 'Expense', 'ProjectCostLedger', 'CommitmentLedger',
        'VariationOrder', 'Document'
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

  v_eligible := (jsonb_array_length(v_disqualifiers) = 0);
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
ALTER FUNCTION uboq_build_synthetic_cleanup_manifest(text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION uboq_build_synthetic_cleanup_manifest(text) FROM PUBLIC, oserp_compat_app, oserp_legacy_app;
GRANT EXECUTE ON FUNCTION uboq_build_synthetic_cleanup_manifest(text) TO oserp_maint_cleanup_role;

-- Disable legacy 1-argument unmanifested cleanup signature unconditionally (R1-H03)
CREATE OR REPLACE FUNCTION uboq_execute_verified_synthetic_cleanup(p_project_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'UBOQ_CLEANUP_MANIFEST_REQUIRED: Unmanifested synthetic cleanup is disabled (R1-H03). Compute dry-run manifest via uboq_build_synthetic_cleanup_manifest(project_id) and pass expected_manifest_sha256.'
    USING ERRCODE = 'P0001';
END;
$$;
ALTER FUNCTION uboq_execute_verified_synthetic_cleanup(text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION uboq_execute_verified_synthetic_cleanup(text) FROM PUBLIC, oserp_compat_app, oserp_legacy_app;
GRANT EXECUTE ON FUNCTION uboq_execute_verified_synthetic_cleanup(text) TO oserp_maint_cleanup_role;

-- Manifest-bound verified synthetic cleanup (recomputes live closure under FOR UPDATE lock immediately before deletion)
CREATE OR REPLACE FUNCTION uboq_execute_verified_synthetic_cleanup(
  p_project_id text,
  p_expected_manifest_sha256 text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_locked_id text;
  v_live_manifest jsonb;
  v_live_hash text;
  v_deleted_ledger int := 0;
BEGIN
  IF NOT pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER')
     AND NOT pg_has_role(current_user, 'oserp_maint_cleanup_role', 'MEMBER')
     AND NOT (SELECT rolsuper FROM pg_roles WHERE rolname = session_user) THEN
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

  -- Lock target Project row to prevent concurrent state changes during manifest verification + deletion
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

  PERFORM set_config('app.synthetic_cleanup_authorized', 'on', true);

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

  RETURN jsonb_build_object(
    'cleanedProjectId', p_project_id,
    'verifiedManifestSha256', v_live_hash,
    'deletedLedgerRows', v_deleted_ledger,
    'closureCounts', v_live_manifest->'closureCounts'
  );
END;
$$;
ALTER FUNCTION uboq_execute_verified_synthetic_cleanup(text, text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION uboq_execute_verified_synthetic_cleanup(text, text) FROM PUBLIC, oserp_compat_app, oserp_legacy_app;
GRANT EXECUTE ON FUNCTION uboq_execute_verified_synthetic_cleanup(text, text) TO oserp_maint_cleanup_role;

