-- ============================================================================
-- OSERP-PROJ-UBOQ-001 — G02 REMEDIATION & SECURITY HARDENING MIGRATION
-- Remediates H03, H05, H06, H07, H08, H09 while preserving all G01-EXC-01 invariants
-- ============================================================================

-- 1. H05 / H06 Staging Isolation & Evidenced Agency Estimate Columns
ALTER TABLE "UboqOperationalSnapshot"
  ADD COLUMN IF NOT EXISTS "sourceDocumentId" TEXT,
  ADD COLUMN IF NOT EXISTS "stagedConsolidationJson" JSONB,
  ADD COLUMN IF NOT EXISTS "stagedTakeoffsJson" JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UboqOperationalSnapshot_sourceDocumentId_fkey'
  ) THEN
    ALTER TABLE "UboqOperationalSnapshot"
      ADD CONSTRAINT "UboqOperationalSnapshot_sourceDocumentId_fkey"
      FOREIGN KEY ("sourceDocumentId") REFERENCES "UboqSourceDocument"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "UboqAwardedPhaseLine"
  ALTER COLUMN "awardedBoqItemId" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "agencyEstimateStatus" TEXT NOT NULL DEFAULT 'SOURCE_NOT_PROVIDED';

-- 2. H08 Passwordless Role Hardening (Clear any static credentials on application/cleanup group roles)
ALTER ROLE oserp_migrations_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE BYPASSRLS;
ALTER ROLE oserp_compat_app NOLOGIN PASSWORD NULL NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
ALTER ROLE oserp_legacy_app NOLOGIN PASSWORD NULL NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
ALTER ROLE oserp_maint_cleanup_role NOLOGIN PASSWORD NULL NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;

-- Ensure newly added columns/tables/sequences have proper grants & revocations
GRANT USAGE ON SCHEMA public TO oserp_migrations_owner, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO oserp_migrations_owner, oserp_compat_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO oserp_migrations_owner, oserp_compat_app, oserp_legacy_app;
REVOKE ALL ON
  "UboqSourceDocument",
  "UboqDocumentSection",
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
  "UboqResourceLedgerEntry",
  "UboqTemplateDefinition",
  "UboqScheduleActivityLink",
  "UboqCashFlowPeriod",
  "UboqValidationException"
FROM oserp_legacy_app;

-- 3. H03 Project-ID Resolver Helpers (Return projectId string only; zero business payload)
CREATE OR REPLACE FUNCTION uboq_resolve_payable_project(p_payable_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT uboq_resolve_po_id_project(ap."poId")
  FROM "AccountsPayable" ap
  WHERE ap.id = p_payable_id;
$$;
ALTER FUNCTION uboq_resolve_payable_project(text) OWNER TO oserp_migrations_owner;

CREATE OR REPLACE FUNCTION uboq_resolve_snapshot_project(p_snapshot_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT "projectId"
  FROM "UboqOperationalSnapshot"
  WHERE id = p_snapshot_id;
$$;
ALTER FUNCTION uboq_resolve_snapshot_project(text) OWNER TO oserp_migrations_owner;

-- 4. H03 / H07 DB-Grounded Non-Forgeable Actor + Project Access Verification
-- Never trusts mutable GUC strings like app.current_user_global_admin or app.current_user_role!
CREATE OR REPLACE FUNCTION uboq_verify_bound_actor_for_project(
  p_project_id text,
  p_user_id text,
  p_session_version text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN p_project_id IS NULL OR p_user_id IS NULL OR p_session_version IS NULL THEN false
    ELSE EXISTS (
      SELECT 1
      FROM "User" u
      JOIN "Project" p ON p.id = p_project_id
      WHERE u.id = p_user_id
        AND UPPER(COALESCE(u.status, '')) = 'ACTIVE'
        AND u."sessionVersion"::text = p_session_version
        AND (u."lockedUntil" IS NULL OR u."lockedUntil" <= NOW())
        AND COALESCE(u."mustChangePassword", false) = false
        AND (
          UPPER(COALESCE(u.role, '')) IN ('SUPER_ADMIN', 'SYSTEM_ADMIN', 'PRESIDENT', 'VP_OPERATIONS')
          OR p."managerId" = u.id
          OR EXISTS (
            SELECT 1
            FROM "ProjectUserAssignment" pua
            WHERE pua."userId" = u.id
              AND pua."projectId" = p_project_id
              AND UPPER(COALESCE(pua."assignmentStatus", '')) = 'ACTIVE'
          )
        )
    )
  END;
$$;
ALTER FUNCTION uboq_verify_bound_actor_for_project(text, text, text) OWNER TO oserp_migrations_owner;

-- 5. H03 / H07 Hardened Tenant RLS Predicate (SECURITY INVOKER)
-- Enforces strict single-project transaction scope + DB-verified active user/PBAC assignment.
-- Mutable GUCs app.current_user_global_admin and app.current_user_role are COMPLETELY IGNORED.
CREATE OR REPLACE FUNCTION uboq_check_tenant_rls(p_project_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN (
      pg_has_role(current_user, 'oserp_compat_app', 'MEMBER')
      OR COALESCE(current_setting('app.enforce_project_rls', true), 'off') = 'on'
    )
    THEN (
      p_project_id IS NOT NULL
      AND p_project_id = NULLIF(current_setting('app.current_project_id', true), '')
      AND uboq_verify_bound_actor_for_project(
        p_project_id,
        NULLIF(current_setting('app.current_user_id', true), ''),
        NULLIF(current_setting('app.current_session_version', true), '')
      )
    )
    WHEN pg_has_role(current_user, 'oserp_legacy_app', 'MEMBER')
    THEN (
      p_project_id IS NOT NULL
      AND p_project_id = NULLIF(current_setting('app.current_project_id', true), '')
      AND NOT uboq_is_governed_project(p_project_id)
    )
    ELSE true
  END;
$$;
ALTER FUNCTION uboq_check_tenant_rls(text) OWNER TO oserp_migrations_owner;

-- 6. H07 Disable Unverified uboq_sync_consolidated_snapshot & Replace With DB-Verified Promotion RPC
CREATE OR REPLACE FUNCTION uboq_sync_consolidated_snapshot(
  p_consolidated_id text,
  p_quantity double precision,
  p_revised_quantity double precision,
  p_unit_cost double precision,
  p_total_cost double precision,
  p_is_governed boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'UBOQ_DIRECT_SYNC_FORBIDDEN: Direct caller-supplied ConsolidatedBOQItem sync is prohibited (H07). Use uboq_promote_approved_consolidated_group.'
    USING ERRCODE = '42501';
END;
$$;
ALTER FUNCTION uboq_sync_consolidated_snapshot(text, double precision, double precision, double precision, double precision, boolean) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION uboq_sync_consolidated_snapshot(text, double precision, double precision, double precision, double precision, boolean) FROM PUBLIC, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role;

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
     OR NOT uboq_verify_bound_actor_for_project(v_snap."projectId", v_actor_id, v_sess_ver) THEN
    RAISE EXCEPTION 'UBOQ_PROMOTE_ACTOR_UNAUTHORIZED: Bound DB actor (%) is not verified approver for project %', v_actor_id, v_snap."projectId"
      USING ERRCODE = '42501';
  END IF;

  SELECT UPPER(COALESCE(role, ''))
  INTO v_actor_role
  FROM "User"
  WHERE id = v_actor_id;

  IF v_actor_role NOT IN (
    'PROJECT_MANAGER', 'PROJECT_DIRECTOR', 'COST_ENGINEER', 'FINANCE_MANAGER',
    'VP_OPERATIONS', 'PRESIDENT', 'SYSTEM_ADMIN', 'SUPER_ADMIN'
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

-- 7. Harden Synthetic Cleanup Role Membership Check & BOQMapping Cleanup
CREATE OR REPLACE FUNCTION uboq_execute_verified_synthetic_cleanup(p_project_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_synth boolean;
  v_deleted_ledger int := 0;
BEGIN
  IF NOT pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER')
     AND NOT pg_has_role(current_user, 'oserp_maint_cleanup_role', 'MEMBER')
     AND NOT (SELECT rolsuper FROM pg_roles WHERE rolname = session_user) THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_ROLE_DENIED: Only oserp_maint_cleanup_role may execute synthetic cleanup (session_user=%)', session_user
      USING ERRCODE = '42501';
  END IF;

  IF p_project_id IS NULL OR p_project_id !~ '^SYNTH-UBOQ-TEST-' THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_PREFIX_REJECTED: Project id % does not match ^SYNTH-UBOQ-TEST- namespace', p_project_id
      USING ERRCODE = 'P0001';
  END IF;

  SELECT COALESCE("isSyntheticTestFixture", false)
  INTO v_is_synth
  FROM "Project"
  WHERE id = p_project_id;

  IF v_is_synth IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_NOT_SYNTHETIC: Project % is missing isSyntheticTestFixture=true', p_project_id
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
  DELETE FROM "Accomplishment" WHERE "projectId" = p_project_id;
  DELETE FROM "Billing" WHERE "projectId" = p_project_id;
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
    'deletedLedgerRows', v_deleted_ledger
  );
END;
$$;
ALTER FUNCTION uboq_execute_verified_synthetic_cleanup(text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION uboq_execute_verified_synthetic_cleanup(text) FROM PUBLIC, oserp_compat_app, oserp_legacy_app;
GRANT EXECUTE ON FUNCTION uboq_execute_verified_synthetic_cleanup(text) TO oserp_maint_cleanup_role;
