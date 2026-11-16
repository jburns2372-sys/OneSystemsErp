-- Forward-only G02 bounded correction. Historical migrations unchanged.
-- Protected employer/authority/proof masters never deleted or blanket-granted.
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
  v_deleted_ledger int := 0;
  v_lock record;
BEGIN
  IF pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER') IS NOT TRUE
     AND COALESCE((SELECT rolsuper FROM pg_roles WHERE rolname = session_user),false) IS NOT TRUE THEN
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

  IF current_setting('transaction_isolation') <> 'read committed' THEN RAISE EXCEPTION 'UBOQ_CLEANUP_REQUIRES_READ_COMMITTED'; END IF;
  PERFORM set_config('lock_timeout','5000ms',true);
  IF EXISTS(SELECT 1 FROM pg_constraint k WHERE k.contype='f'
    AND k.conrelid IN ('public."Employer"'::regclass,'public."EmployerPayrollAuthority"'::regclass,
      'public._company_payroll_commands'::regclass,'public._company_payroll_trust_anchor'::regclass)
    AND k.confrelid NOT IN ('public."Employer"'::regclass,'public."User"'::regclass))
  THEN RAISE EXCEPTION 'CLEANUP_PROTECTED_MASTER_DEPENDENCY_DRIFT'; END IF;
  FOR v_lock IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname NOT IN ('Employer','EmployerPayrollAuthority','_company_payroll_commands','_company_payroll_trust_anchor') ORDER BY c.relname
  LOOP EXECUTE format('LOCK TABLE public.%I IN SHARE ROW EXCLUSIVE MODE',v_lock.relname); END LOOP;
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

-- Bounded read dependency: no runtime Worker SELECT or employer enrollment privilege.
GRANT EXECUTE ON FUNCTION public.uboq_h02_ordinary_allowed(text,text,text) TO oserp_company_payroll_verifier;
CREATE FUNCTION public.uboq_h02_project_payroll_workers(p_project text,p_category text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE p record; w record; result jsonb:='[]'::jsonb;
BEGIN
 IF NOT (pg_has_role(session_user,'oserp_compat_app','MEMBER') OR pg_has_role(session_user,'oserp_legacy_app','MEMBER'))
   OR public.uboq_h02_ordinary_allowed(p_project,'PAYROLL','INSERT') IS NOT TRUE
 THEN RAISE EXCEPTION 'H02_PROJECT_PAYROLL_DENIED' USING ERRCODE='42501'; END IF;
 IF p_category NOT IN ('Weekly Salaried','Semi-Monthly','Monthly') OR p_category IS NULL
 THEN RAISE EXCEPTION 'H02_PAYROLL_CATEGORY_REQUIRED' USING ERRCODE='42501'; END IF;
 -- Serializes duplicate period checks/creation; authority revalidated after lock wait.
 SELECT id,"employerId","employerOwnershipVerifiedAt" INTO p FROM public."Project" WHERE id=p_project FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'H02_PROJECT_REQUIRED' USING ERRCODE='42501'; END IF;
 IF p."employerId" IS NOT NULL THEN
  PERFORM 1 FROM public."Employer" WHERE id=p."employerId" AND "verificationState"='VERIFIED' AND "verifiedAt" IS NOT NULL FOR SHARE;
  IF NOT FOUND OR p."employerOwnershipVerifiedAt" IS NULL THEN RAISE EXCEPTION 'H02_PROJECT_EMPLOYER_UNVERIFIED' USING ERRCODE='42501'; END IF;
 END IF;
 IF public.uboq_h02_ordinary_allowed(p_project,'PAYROLL','INSERT') IS NOT TRUE
 THEN RAISE EXCEPTION 'H02_PROJECT_PAYROLL_DENIED' USING ERRCODE='42501'; END IF;
 FOR w IN SELECT id,"employmentType","dailyRate","employerId","employerOwnershipVerifiedAt","employerOwnershipEvidenceRef"
   FROM public."Worker" WHERE "projectId"=p_project AND "payrollCategory"=p_category ORDER BY id FOR SHARE
 LOOP
  IF p."employerId" IS NULL OR (w."employerId"=p."employerId" AND w."employerOwnershipVerifiedAt" IS NOT NULL AND nullif(w."employerOwnershipEvidenceRef",'') IS NOT NULL) THEN
   result:=result||jsonb_build_array(jsonb_build_object('id',w.id,'employmentType',w."employmentType",'dailyRate',w."dailyRate"));
  END IF;
 END LOOP;
 RETURN result;
END $$;
ALTER FUNCTION public.uboq_h02_project_payroll_workers(text,text) OWNER TO oserp_company_payroll_verifier;
REVOKE ALL ON FUNCTION public.uboq_h02_project_payroll_workers(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.uboq_h02_project_payroll_workers(text,text) TO oserp_compat_app,oserp_legacy_app;

CREATE OR REPLACE FUNCTION public.company_payroll_ownership_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE old_j jsonb; j jsonb:=to_jsonb(NEW); runtime boolean; project_owner record; project_inherited boolean:=false;
BEGIN
 runtime:=public.company_payroll_runtime() OR pg_has_role(session_user,'oserp_compat_app','MEMBER') OR pg_has_role(session_user,'oserp_legacy_app','MEMBER');
 runtime:=runtime AND NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=session_user AND rolsuper);
 -- Only new signed project periods inherit verified Project evidence. No historical backfill.
 IF runtime AND TG_TABLE_NAME='PayrollPeriod' AND TG_OP='INSERT' AND j->>'projectId' IS NOT NULL THEN
  IF public.uboq_h02_ordinary_allowed(j->>'projectId','PAYROLL','INSERT') IS NOT TRUE THEN
   RAISE EXCEPTION 'H02_PROJECT_PAYROLL_DENIED' USING ERRCODE='42501'; END IF;
  SELECT id,"employerId","employerOwnershipVerifiedAt" INTO project_owner FROM public."Project" WHERE id=j->>'projectId' FOR SHARE;
  IF project_owner."employerId" IS NOT NULL THEN
   IF project_owner."employerOwnershipVerifiedAt" IS NULL OR (j->>'employerId' IS NOT NULL AND j->>'employerId' IS DISTINCT FROM project_owner."employerId")
   THEN RAISE EXCEPTION 'EMPLOYER_PROJECT_MISMATCH'; END IF;
   NEW."employerId":=project_owner."employerId";
   NEW."employerOwnershipEvidenceRef":='INHERITED_VERIFIED_PROJECT:'||project_owner.id;
   NEW."employerOwnershipVerifiedAt":=project_owner."employerOwnershipVerifiedAt";
   j:=to_jsonb(NEW); project_inherited:=true;
  END IF;
 END IF;
 IF TG_OP='UPDATE' THEN
  old_j:=to_jsonb(OLD);
  IF old_j->>'employerId' IS NOT NULL AND (
   j->>'employerId' IS DISTINCT FROM old_j->>'employerId' OR j->>'employerOwnershipEvidenceRef' IS DISTINCT FROM old_j->>'employerOwnershipEvidenceRef'
   OR j->>'employerOwnershipVerifiedAt' IS DISTINCT FROM old_j->>'employerOwnershipVerifiedAt')
  THEN RAISE EXCEPTION 'EMPLOYER_OWNERSHIP_IMMUTABLE'; END IF;
  IF runtime AND (j->>'employerId' IS DISTINCT FROM old_j->>'employerId'
   OR j->>'employerOwnershipEvidenceRef' IS DISTINCT FROM old_j->>'employerOwnershipEvidenceRef'
   OR j->>'employerOwnershipVerifiedAt' IS DISTINCT FROM old_j->>'employerOwnershipVerifiedAt') THEN RAISE EXCEPTION 'EMPLOYER_ENROLLMENT_DENIED'; END IF;
 END IF;
 IF j->>'employerId' IS NOT NULL THEN
  IF runtime AND TG_OP='INSERT' AND NOT(TG_TABLE_NAME='PayrollPeriod' AND (public.company_payroll_context() OR project_inherited)) THEN RAISE EXCEPTION 'EMPLOYER_ENROLLMENT_DENIED'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public."Employer" e WHERE e.id=j->>'employerId' AND e."verificationState"='VERIFIED' AND e."verifiedAt" IS NOT NULL)
  THEN RAISE EXCEPTION 'EMPLOYER_VERIFICATION_REQUIRED'; END IF;
  IF TG_TABLE_NAME IN ('Worker','PayrollPeriod') AND j->>'projectId' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public."Project" p WHERE p.id=j->>'projectId' AND p."employerId"=j->>'employerId' AND p."employerOwnershipVerifiedAt" IS NOT NULL) THEN RAISE EXCEPTION 'EMPLOYER_PROJECT_MISMATCH'; END IF;
 END IF;
 RETURN NEW;
END $$;
