-- G02-R3 forward-only migration #17. Historical migration files remain unchanged.
-- H01: Serialize source review and snapshot publication on the immutable source row.
ALTER TABLE "UboqOperationalSnapshot" ADD COLUMN "sourceEvidenceHash" text;
CREATE FUNCTION public.uboq_source_evidence_hash(p_id text) RETURNS text
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
 SELECT encode(sha256(convert_to(jsonb_build_object(
  'source', (SELECT to_jsonb(d) FROM public."UboqSourceDocument" d WHERE id=p_id),
  'sections', COALESCE((SELECT jsonb_agg(to_jsonb(s) ORDER BY id) FROM public."UboqDocumentSection" s WHERE "sourceDocumentId"=p_id),'[]'::jsonb),
  'candidates', COALESCE((SELECT jsonb_agg(to_jsonb(c) ORDER BY id) FROM public."UboqExtractionCandidate" c WHERE "sourceDocumentId"=p_id),'[]'::jsonb)
 )::text,'UTF8')),'hex');
$$;
ALTER FUNCTION public.uboq_source_evidence_hash(text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_source_evidence_hash(text) FROM PUBLIC;

CREATE FUNCTION public.uboq_guard_review_evidence() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE d text; p text;
BEGIN
 IF current_setting('app.synthetic_cleanup_authorized',true)='on' AND
    pg_has_role(session_user,'oserp_maint_cleanup_role','MEMBER') THEN
   RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
 END IF;
 d := CASE WHEN TG_TABLE_NAME='UboqSourceDocument' THEN CASE WHEN TG_OP='INSERT' THEN NEW.id ELSE OLD.id END
           WHEN TG_OP='INSERT' THEN (to_jsonb(NEW)->>'sourceDocumentId') ELSE (to_jsonb(OLD)->>'sourceDocumentId') END;
 SELECT "projectId" INTO p FROM public."UboqSourceDocument" WHERE id=d FOR UPDATE;
 IF TG_OP='INSERT' AND TG_TABLE_NAME='UboqSourceDocument' THEN p := to_jsonb(NEW)->>'projectId'; END IF;
 IF TG_OP='INSERT' THEN
   IF public.uboq_verify_signed_rls_proof(p,current_setting('app.current_user_id',true),current_setting('app.current_session_version',true),current_setting('app.current_rls_proof',true)) IS NOT TRUE OR
      public.uboq_verify_bound_actor_for_project(p,current_setting('app.current_user_id',true),current_setting('app.current_session_version',true)) IS NOT TRUE OR
      NOT EXISTS(SELECT 1 FROM public."User" WHERE id=current_setting('app.current_user_id',true) AND upper(role) IN ('SUPER_ADMIN','SYSTEM_ADMIN','ADMIN','PRESIDENT','VP_OPERATIONS','PROJECT_DIRECTOR','DIRECTORS','PROJECT_MANAGER','OPERATIONS_MANAGER','QS_ENGINEER','QUANTITY_SURVEYOR','COST_ENGINEER','ESTIMATOR','PROJECT_ENGINEER')) THEN RAISE EXCEPTION 'UBOQ_INTAKE_ACTOR_DENIED' USING ERRCODE='42501'; END IF;
 END IF;
 IF EXISTS(SELECT 1 FROM public."UboqOperationalSnapshot" s WHERE s."approvedAt" IS NOT NULL AND
   (s."sourceDocumentId"=d OR EXISTS(SELECT 1 FROM public."UboqAwardedPhaseLine" l WHERE l."snapshotId"=s.id AND l."sourceDocumentId"=d))) THEN
   RAISE EXCEPTION 'UBOQ_APPROVED_EVIDENCE_IMMUTABLE: use a new source revision';
 END IF;
 IF TG_OP='UPDATE' AND TG_TABLE_NAME<>'UboqSourceDocument' AND (to_jsonb(NEW)->>'sourceDocumentId') IS DISTINCT FROM (to_jsonb(OLD)->>'sourceDocumentId') THEN
   RAISE EXCEPTION 'UBOQ_EVIDENCE_REPARENT_DENIED';
 END IF;
 IF TG_TABLE_NAME='UboqExtractionCandidate' THEN
   IF TG_OP<>'DELETE' AND NEW."sectionId" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public."UboqDocumentSection" WHERE id=NEW."sectionId" AND "sourceDocumentId"=d) THEN RAISE EXCEPTION 'UBOQ_CANDIDATE_SECTION_SCOPE_DENIED'; END IF;
   IF TG_OP='UPDATE' AND (to_jsonb(NEW)-ARRAY['reviewDecision','reviewedById','reviewedAt','reviewNotes','parsedJson','mappedCanonicalId']) IS DISTINCT FROM
                          (to_jsonb(OLD)-ARRAY['reviewDecision','reviewedById','reviewedAt','reviewNotes','parsedJson','mappedCanonicalId']) THEN
     RAISE EXCEPTION 'UBOQ_RAW_EVIDENCE_IMMUTABLE';
   END IF;
   IF TG_OP='UPDATE' THEN
     IF NEW."parsedJson"->'mappedFields' IS DISTINCT FROM OLD."parsedJson"->'mappedFields' THEN RAISE EXCEPTION 'UBOQ_RAW_EXTRACTION_IMMUTABLE'; END IF;
     IF NEW."reviewedById" IS DISTINCT FROM NULLIF(current_setting('app.current_user_id',true),'') OR
        public.uboq_verify_signed_rls_proof(p,NEW."reviewedById",current_setting('app.current_session_version',true),current_setting('app.current_rls_proof',true)) IS NOT TRUE OR
        public.uboq_verify_bound_actor_for_project(p,NEW."reviewedById",current_setting('app.current_session_version',true)) IS NOT TRUE OR
        NOT EXISTS(SELECT 1 FROM public."User" WHERE id=NEW."reviewedById" AND upper(role) IN
        ('SUPER_ADMIN','SYSTEM_ADMIN','ADMIN','PRESIDENT','VP_OPERATIONS','PROJECT_DIRECTOR','DIRECTORS','PROJECT_MANAGER','QS_ENGINEER','QUANTITY_SURVEYOR','COST_ENGINEER')) THEN
       RAISE EXCEPTION 'UBOQ_REVIEW_ACTOR_DENIED' USING ERRCODE='42501';
     END IF;
   END IF;
 END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
ALTER FUNCTION public.uboq_guard_review_evidence() OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_guard_review_evidence() FROM PUBLIC;
CREATE TRIGGER g02_r3_candidate_evidence BEFORE INSERT OR UPDATE OR DELETE ON "UboqExtractionCandidate" FOR EACH ROW EXECUTE FUNCTION public.uboq_guard_review_evidence();
CREATE TRIGGER g02_r3_section_evidence BEFORE INSERT OR UPDATE OR DELETE ON "UboqDocumentSection" FOR EACH ROW EXECUTE FUNCTION public.uboq_guard_review_evidence();
CREATE TRIGGER g02_r3_source_evidence BEFORE INSERT OR UPDATE OR DELETE ON "UboqSourceDocument" FOR EACH ROW EXECUTE FUNCTION public.uboq_guard_review_evidence();

CREATE FUNCTION public.uboq_seal_snapshot_evidence() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE p text;
BEGIN
 IF current_setting('app.synthetic_cleanup_authorized',true)='on' AND pg_has_role(session_user,'oserp_maint_cleanup_role','MEMBER') THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND NEW."sourceEvidenceHash" IS DISTINCT FROM OLD."sourceEvidenceHash" THEN RAISE EXCEPTION 'UBOQ_EVIDENCE_SEAL_IMMUTABLE'; END IF;
 IF NEW."sourceDocumentId" IS NULL THEN RAISE EXCEPTION 'UBOQ_SOURCE_REQUIRED'; END IF;
 SELECT "projectId" INTO p FROM public."UboqSourceDocument" WHERE id=NEW."sourceDocumentId" FOR UPDATE;
 IF p IS DISTINCT FROM NEW."projectId" THEN RAISE EXCEPTION 'UBOQ_CROSS_PROJECT_SOURCE_DENIED'; END IF;
 IF TG_OP='INSERT' THEN NEW."sourceEvidenceHash" := public.uboq_source_evidence_hash(NEW."sourceDocumentId"); END IF;
 IF TG_OP='UPDATE' AND OLD."approvedAt" IS NOT NULL AND
    (to_jsonb(NEW)-'status') IS DISTINCT FROM (to_jsonb(OLD)-'status') THEN RAISE EXCEPTION 'UBOQ_APPROVED_SNAPSHOT_IMMUTABLE'; END IF;
 IF NEW.status='APPROVED' AND (TG_OP='INSERT' OR OLD.status<>'APPROVED') THEN
   NEW."approvedAt" := clock_timestamp();
   IF NEW."approvedById" IS NULL OR NEW."approvedById"=NEW."preparedById" OR NEW."approvedById" IS DISTINCT FROM NULLIF(current_setting('app.current_user_id',true),'') OR
      public.uboq_verify_signed_rls_proof(NEW."projectId",NEW."approvedById",current_setting('app.current_session_version',true),current_setting('app.current_rls_proof',true)) IS NOT TRUE OR
      public.uboq_verify_bound_actor_for_project(NEW."projectId",NEW."approvedById",current_setting('app.current_session_version',true)) IS NOT TRUE OR
      NOT EXISTS(SELECT 1 FROM public."User" WHERE id=NEW."approvedById" AND upper(role) IN ('SUPER_ADMIN','SYSTEM_ADMIN','ADMIN','PRESIDENT','VP_OPERATIONS','PROJECT_DIRECTOR','DIRECTORS','PROJECT_MANAGER','OPERATIONS_MANAGER','FINANCE_MANAGER')) THEN RAISE EXCEPTION 'UBOQ_APPROVAL_ACTOR_DENIED' USING ERRCODE='42501'; END IF;
   IF NOT EXISTS(SELECT 1 FROM public."UboqAwardedPhaseLine" WHERE "snapshotId"=NEW.id) THEN RAISE EXCEPTION 'UBOQ_EMPTY_SNAPSHOT_DENIED'; END IF;
 END IF;
 IF NEW.status='APPROVED' AND (TG_OP='INSERT' OR OLD.status<>'APPROVED') THEN
   IF TG_OP='INSERT' THEN RAISE EXCEPTION 'UBOQ_APPROVAL_REQUIRES_STAGED_SNAPSHOT'; END IF;
   IF NEW."sourceDocumentId" IS DISTINCT FROM OLD."sourceDocumentId" OR NEW."projectId" IS DISTINCT FROM OLD."projectId" OR
      NEW."sourceEvidenceHash" IS NULL OR NEW."sourceEvidenceHash" IS DISTINCT FROM public.uboq_source_evidence_hash(NEW."sourceDocumentId") THEN
     RAISE EXCEPTION 'UBOQ_STALE_APPROVAL_EVIDENCE: regenerate draft';
   END IF;
 END IF;
 RETURN NEW;
END $$;
ALTER FUNCTION public.uboq_seal_snapshot_evidence() OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_seal_snapshot_evidence() FROM PUBLIC;
CREATE TRIGGER g02_r3_snapshot_seal BEFORE INSERT OR UPDATE ON "UboqOperationalSnapshot" FOR EACH ROW EXECUTE FUNCTION public.uboq_seal_snapshot_evidence();

CREATE FUNCTION public.uboq_validate_phase_evidence() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE s record; c record; f jsonb;
BEGIN
 IF current_setting('app.synthetic_cleanup_authorized',true)='on' AND pg_has_role(session_user,'oserp_maint_cleanup_role','MEMBER') THEN RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END; END IF;
 IF TG_OP='UPDATE' AND EXISTS(SELECT 1 FROM public."UboqOperationalSnapshot" WHERE id=OLD."snapshotId" AND "approvedAt" IS NOT NULL) AND
   (to_jsonb(NEW)-ARRAY['awardedBoqItemId','updatedAt']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['awardedBoqItemId','updatedAt']) THEN RAISE EXCEPTION 'UBOQ_APPROVED_PHASE_IMMUTABLE'; END IF;
 SELECT * INTO s FROM public."UboqOperationalSnapshot" WHERE id=CASE WHEN TG_OP='DELETE' THEN OLD."snapshotId" ELSE NEW."snapshotId" END FOR UPDATE;
 IF s."approvedAt" IS NOT NULL THEN
   IF TG_OP='DELETE' OR TG_OP='INSERT' THEN RAISE EXCEPTION 'UBOQ_APPROVED_PHASE_IMMUTABLE'; END IF;
   IF (to_jsonb(NEW)-ARRAY['awardedBoqItemId','updatedAt']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['awardedBoqItemId','updatedAt']) OR
      (OLD."awardedBoqItemId" IS NOT NULL AND NEW."awardedBoqItemId" IS DISTINCT FROM OLD."awardedBoqItemId") THEN RAISE EXCEPTION 'UBOQ_APPROVED_PHASE_IMMUTABLE'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 IF s.id IS NULL OR s."projectId" IS DISTINCT FROM NEW."projectId" OR s."sourceDocumentId" IS DISTINCT FROM NEW."sourceDocumentId" THEN RAISE EXCEPTION 'UBOQ_PHASE_SOURCE_SCOPE_DENIED'; END IF;
 SELECT * INTO c FROM public."UboqExtractionCandidate" WHERE id=NEW."extractionCandidateId";
 IF c.id IS NULL OR c."sourceDocumentId" IS DISTINCT FROM NEW."sourceDocumentId" OR c."reviewDecision" NOT IN ('HUMAN_VERIFIED','AUTO_VERIFIED_DETERMINISTIC') THEN RAISE EXCEPTION 'UBOQ_PHASE_CANDIDATE_DENIED'; END IF;
 f := COALESCE(c."parsedJson"->'effectiveCanonicalFields',c."parsedJson"->'mappedFields');
 IF NEW."approvedQty" IS DISTINCT FROM round((f->>'approved_qty')::numeric,4) OR NEW."contractUnitRate" IS DISTINCT FROM round((f->>'contract_unit_rate')::numeric,4) OR
    NEW."workDescription" IS DISTINCT FROM btrim(f->>'work_description') OR NEW."unitRaw" IS DISTINCT FROM btrim(f->>'unit') THEN RAISE EXCEPTION 'UBOQ_PHASE_REVIEW_VALUE_MISMATCH'; END IF;
 IF NEW."originalQty" IS DISTINCT FROM round(COALESCE((f->>'original_qty')::numeric,(f->>'approved_qty')::numeric),4) OR
    NEW."contractLineAmount" IS DISTINCT FROM round(COALESCE((f->>'contract_line_amount')::numeric,(f->>'approved_qty')::numeric*(f->>'contract_unit_rate')::numeric),2) OR
    NEW.specification IS DISTINCT FROM NULLIF(btrim(f->>'specification'),'') OR
    (NULLIF(f->>'item_code','') IS NOT NULL AND NEW."itemCode" IS DISTINCT FROM btrim(f->>'item_code')) THEN RAISE EXCEPTION 'UBOQ_PHASE_REVIEW_VALUE_MISMATCH'; END IF;
 RETURN NEW;
END $$;
ALTER FUNCTION public.uboq_validate_phase_evidence() OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_validate_phase_evidence() FROM PUBLIC;
CREATE TRIGGER g02_r3_phase_evidence BEFORE INSERT OR UPDATE OR DELETE ON "UboqAwardedPhaseLine" FOR EACH ROW EXECUTE FUNCTION public.uboq_validate_phase_evidence();


-- M01: Full-row, recursive incoming-FK closure, including composite FKs.
CREATE FUNCTION public.uboq_recursive_cleanup_closure(p_scope jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE result jsonb:=p_scope; before_pass jsonb; fk record; pred text; found_rows jsonb; merged jsonb;
BEGIN
 IF EXISTS(SELECT 1 FROM pg_constraint con JOIN pg_class child ON child.oid=con.conrelid JOIN pg_class parent ON parent.oid=con.confrelid JOIN pg_namespace cn ON cn.oid=child.relnamespace JOIN pg_namespace pn ON pn.oid=parent.relnamespace WHERE con.contype='f' AND pn.nspname='public' AND cn.nspname<>'public') THEN RAISE EXCEPTION 'UBOQ_CLEANUP_EXTERNAL_SCHEMA_FK_UNSUPPORTED'; END IF;
 LOOP
  before_pass:=result;
  FOR fk IN SELECT con.*,child.relname AS child_name,parent.relname AS parent_name
   FROM pg_constraint con JOIN pg_class child ON child.oid=con.conrelid JOIN pg_class parent ON parent.oid=con.confrelid
   JOIN pg_namespace ns ON ns.oid=child.relnamespace JOIN pg_namespace pn ON pn.oid=parent.relnamespace
   WHERE con.contype='f' AND ns.nspname='public' AND pn.nspname='public' ORDER BY con.oid
  LOOP
   IF NOT result ? fk.parent_name THEN CONTINUE; END IF;
   SELECT string_agg(format('to_jsonb(c)->%L <> ''null''::jsonb AND to_jsonb(c)->%L = p.payload->%L',ca.attname,ca.attname,pa.attname),' AND ' ORDER BY k.ord) INTO pred
    FROM unnest(fk.conkey,fk.confkey) WITH ORDINALITY k(child_att,parent_att,ord)
    JOIN pg_attribute ca ON ca.attrelid=fk.conrelid AND ca.attnum=k.child_att
    JOIN pg_attribute pa ON pa.attrelid=fk.confrelid AND pa.attnum=k.parent_att;
   EXECUTE format('SELECT COALESCE(jsonb_agg(DISTINCT to_jsonb(c)),''[]''::jsonb) FROM public.%I c WHERE EXISTS(SELECT 1 FROM jsonb_array_elements($1) p(payload) WHERE %s)',fk.child_name,pred)
     INTO found_rows USING result->fk.parent_name;
   IF jsonb_array_length(found_rows)=0 THEN CONTINUE; END IF;
   SELECT jsonb_agg(payload ORDER BY payload::text) INTO merged FROM (SELECT DISTINCT payload FROM jsonb_array_elements(COALESCE(result->fk.child_name,'[]'::jsonb)||found_rows) e(payload)) u;
   result:=jsonb_set(result,ARRAY[fk.child_name],merged,true);
  END LOOP;
  EXIT WHEN result=before_pass;
 END LOOP;
 RETURN result;
END $$;
ALTER FUNCTION public.uboq_recursive_cleanup_closure(jsonb) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_recursive_cleanup_closure(jsonb) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.uboq_build_synthetic_cleanup_manifest(p_project_id text)
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
     AND COALESCE((SELECT rolsuper FROM pg_roles WHERE rolname = session_user),false) IS NOT TRUE THEN
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

  SELECT jsonb_build_object('Project',jsonb_build_array(to_jsonb(p))) INTO v_scope FROM "Project" p WHERE id=p_project_id;
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
    EXECUTE format('SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY id),''[]''::jsonb) FROM %I r WHERE id::text=ANY($1)',v_tbl.tbl_name) INTO v_rows USING v_ids;
    v_scope := v_scope || jsonb_build_object(v_tbl.tbl_name,v_rows);
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

  SELECT jsonb_object_agg(key,(SELECT COALESCE(jsonb_agg(payload ORDER BY payload::text),'[]'::jsonb) FROM jsonb_array_elements(value) a(payload))) INTO v_scope FROM jsonb_each(v_scope);
  v_closure := uboq_recursive_cleanup_closure(v_scope);
  IF v_closure IS DISTINCT FROM v_scope THEN v_disqualifiers := v_disqualifiers || jsonb_build_array('DISQUALIFIED_TRANSITIVE_OR_EXTERNAL_FK_DEPENDENCY'); END IF;
  v_canonical_parts := array_append(v_canonical_parts, v_closure::text);
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
ALTER FUNCTION public.uboq_build_synthetic_cleanup_manifest(text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_build_synthetic_cleanup_manifest(text) FROM PUBLIC, oserp_compat_app, oserp_legacy_app;
GRANT EXECUTE ON FUNCTION public.uboq_build_synthetic_cleanup_manifest(text) TO oserp_maint_cleanup_role;


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
  FOR v_lock IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') ORDER BY c.relname
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
ALTER FUNCTION public.uboq_execute_verified_synthetic_cleanup(text, text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_execute_verified_synthetic_cleanup(text, text) FROM PUBLIC, oserp_compat_app, oserp_legacy_app;
GRANT EXECUTE ON FUNCTION public.uboq_execute_verified_synthetic_cleanup(text, text) TO oserp_maint_cleanup_role;

-- H02: Restore DELETE only for audited project-scoped legacy operations.
-- No grants on AP, Expense, payments, cost/resource ledgers, audit or identity tables.
CREATE FUNCTION public.uboq_authorized_legacy_delete(p_project text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
 SELECT p_project IS NOT NULL AND NOT public.uboq_is_governed_project(p_project)
 AND p_project=NULLIF(current_setting('app.current_project_id',true),'')
 AND public.uboq_verify_signed_rls_proof(p_project,current_setting('app.current_user_id',true),current_setting('app.current_session_version',true),current_setting('app.current_rls_proof',true))
 AND public.uboq_verify_bound_actor_for_project(p_project,current_setting('app.current_user_id',true),current_setting('app.current_session_version',true))
 AND EXISTS(SELECT 1 FROM public."User" WHERE id=current_setting('app.current_user_id',true) AND upper(role) IN ('SUPER_ADMIN','SYSTEM_ADMIN','ADMIN','PROJECT_MANAGER','PROJECT_DIRECTOR','OPERATIONS_MANAGER'));
$$;
ALTER FUNCTION public.uboq_authorized_legacy_delete(text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_authorized_legacy_delete(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.uboq_authorized_legacy_delete(text) TO oserp_compat_app,oserp_legacy_app;
DO $$
DECLARE r record;
BEGIN
 FOR r IN SELECT * FROM (VALUES
  ('ConsolidatedBOQItem','"projectId"'),
  ('BOQMapping','(SELECT "projectId" FROM public."ConsolidatedBOQItem" WHERE id="consolidatedBoqItemId")'),
  ('ProcurementBenchmarkItem','"projectId"'),
  ('BOQLotBreakdown','(SELECT "projectId" FROM public."AwardedBOQItem" WHERE id="boqItemId")'),
  ('Document','"projectId"'),
  ('ProjectSchedule','"projectId"'),
  ('VariationOrder','"projectId"'),
  ('VariationOrderItem','(SELECT "projectId" FROM public."VariationOrder" WHERE id="variationOrderId")'),
  ('VariationOrderDocument','(SELECT "projectId" FROM public."VariationOrder" WHERE id="variationOrderId")'),
  ('VariationOrderApproval','(SELECT "projectId" FROM public."VariationOrder" WHERE id="variationOrderId")')
 ) scope(tbl,expr)
 LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',r.tbl);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',r.tbl);
  EXECUTE format('CREATE POLICY g02_r3_legacy_access ON public.%I AS PERMISSIVE FOR ALL TO oserp_compat_app,oserp_legacy_app USING(true) WITH CHECK(true)',r.tbl);
  EXECUTE format('CREATE POLICY g02_r3_legacy_scope ON public.%I AS RESTRICTIVE FOR ALL TO oserp_compat_app,oserp_legacy_app USING(public.uboq_check_tenant_rls(%s)) WITH CHECK(public.uboq_check_tenant_rls(%s))',r.tbl,r.expr,r.expr);
  EXECUTE format('CREATE POLICY g02_r3_legacy_delete ON public.%I AS RESTRICTIVE FOR DELETE TO oserp_compat_app,oserp_legacy_app USING(public.uboq_authorized_legacy_delete(%s))',r.tbl,r.expr);
  IF r.tbl IN ('VariationOrderItem','VariationOrderDocument','VariationOrderApproval') THEN
   EXECUTE format('CREATE POLICY g02_r3_unposted_parent_delete ON public.%I AS RESTRICTIVE FOR DELETE TO oserp_compat_app,oserp_legacy_app USING (EXISTS(SELECT 1 FROM public."VariationOrder" vo WHERE vo.id="variationOrderId" AND upper(vo."currentStatus") IN (''DRAFT'',''PENDING'',''CANCELLED'',''VOID'')))',r.tbl);
  END IF;
  IF r.tbl='ConsolidatedBOQItem' THEN
   EXECUTE 'CREATE POLICY g02_r3_ungoverned_item_delete ON public."ConsolidatedBOQItem" AS RESTRICTIVE FOR DELETE TO oserp_compat_app,oserp_legacy_app USING ("isUboqResourceGoverned" IS NOT TRUE)';
  END IF;
  IF r.tbl IN ('VariationOrder','ProcurementBenchmarkItem') THEN
   EXECUTE format('CREATE POLICY g02_r3_unposted_delete ON public.%I AS RESTRICTIVE FOR DELETE TO oserp_compat_app,oserp_legacy_app USING (upper(%s) IN (''DRAFT'',''PENDING'',''CANCELLED'',''VOID''))',r.tbl,CASE WHEN r.tbl='VariationOrder' THEN '"currentStatus"' ELSE 'status' END);
  END IF;
  EXECUTE format('GRANT DELETE ON public.%I TO oserp_compat_app,oserp_legacy_app',r.tbl);
 END LOOP;
END $$;
-- H02-A/B: ordinary access uses real project ownership and stored operation permissions.
-- This is not an approval/payment/unlock workflow or an unscoped payroll context.
CREATE FUNCTION public.uboq_h02_ordinary_allowed(p_project text,p_module text,p_operation text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
 SELECT COALESCE(
 p_project IS NOT NULL AND p_module IN ('SUBCONTRACTING','PAYROLL')
 AND p_operation IN ('SELECT','INSERT','UPDATE')
 AND p_project=NULLIF(current_setting('app.current_project_id',true),'')
 AND (NOT pg_has_role(session_user,'oserp_legacy_app','MEMBER') OR NOT public.uboq_is_governed_project(p_project))
 AND (p_module<>'SUBCONTRACTING' OR p_operation='SELECT' OR NOT public.uboq_is_governed_project(p_project))
 AND public.uboq_verify_signed_rls_proof(p_project,current_setting('app.current_user_id',true),current_setting('app.current_session_version',true),current_setting('app.current_rls_proof',true))
 AND public.uboq_verify_bound_actor_for_project(p_project,current_setting('app.current_user_id',true),current_setting('app.current_session_version',true))
 AND NOT EXISTS(SELECT 1 FROM public."UserRole" ur JOIN public."Role" r ON r.id=ur."roleId"
   WHERE ur."userId"=current_setting('app.current_user_id',true) AND (r."roleCode"='GUEST_USER' OR r."roleName"='GUEST USER'))
 AND EXISTS(SELECT 1 FROM public."User" u WHERE u.id=current_setting('app.current_user_id',true) AND (
  u.role IN ('SUPER_ADMIN','SYSTEM_ADMIN') OR EXISTS(
   SELECT 1 FROM public."Role" r JOIN public."RolePermission" rp ON rp."roleId"=r.id JOIN public."Module" m ON m.id=rp."moduleId"
   WHERE r."isActive" AND m."isActive" AND rp."moduleName"=p_module AND m."moduleName"=p_module
   AND (r."roleCode"=u.role OR r."roleName"=u.role OR EXISTS(SELECT 1 FROM public."UserRole" ur WHERE ur."userId"=u.id AND ur."roleId"=r.id))
   AND CASE p_operation WHEN 'SELECT' THEN rp."canView" WHEN 'INSERT' THEN rp."canCreate" WHEN 'UPDATE' THEN rp."canEditDraft" ELSE false END
  )
 )), false);
$$;
ALTER FUNCTION public.uboq_h02_ordinary_allowed(text,text,text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_h02_ordinary_allowed(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.uboq_h02_ordinary_allowed(text,text,text) TO oserp_compat_app,oserp_legacy_app;

CREATE FUNCTION public.uboq_h02_package_write_allowed(p_id text,p_operation text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
 SELECT COALESCE((SELECT public.uboq_h02_ordinary_allowed(p."projectId",'SUBCONTRACTING',p_operation)
  AND (p_operation='SELECT' OR (p.status='DRAFT' AND NOT p."isLocked"))
  FROM public."SubcontractPackage" p WHERE p.id=p_id),false);
$$;
ALTER FUNCTION public.uboq_h02_package_write_allowed(text,text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_h02_package_write_allowed(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.uboq_h02_package_write_allowed(text,text) TO oserp_compat_app,oserp_legacy_app;

-- A NULL child project may inherit only a real, non-NULL owning period project.
-- Missing/NULL-project parents and conflicting explicit child projects remain denied.
CREATE FUNCTION public.uboq_h02_payroll_child_project(p_project text,p_period text) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
 SELECT CASE WHEN p_period IS NULL THEN p_project ELSE (
  SELECT p."projectId" FROM public."PayrollPeriod" p WHERE p.id=p_period
   AND p."projectId" IS NOT NULL AND (p_project IS NULL OR p_project=p."projectId")
 ) END;
$$;
ALTER FUNCTION public.uboq_h02_payroll_child_project(text,text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_h02_payroll_child_project(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.uboq_h02_payroll_child_project(text,text) TO oserp_compat_app,oserp_legacy_app;

-- H02 continuation: real-project, atomic draft-payroll removal. No global scope.
CREATE FUNCTION public.uboq_resolve_payroll_period_project(p_id text) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
 SELECT "projectId" FROM public."PayrollPeriod" WHERE id=p_id;
$$;
ALTER FUNCTION public.uboq_resolve_payroll_period_project(text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_resolve_payroll_period_project(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.uboq_resolve_payroll_period_project(text) TO oserp_compat_app,oserp_legacy_app;

CREATE FUNCTION public.uboq_payroll_operation_allowed(p_project text,p_operation text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
 SELECT p_project IS NOT NULL AND p_operation IN ('SELECT','DELETE')
 AND p_project=NULLIF(current_setting('app.current_project_id',true),'')
 AND (NOT pg_has_role(session_user,'oserp_legacy_app','MEMBER') OR NOT public.uboq_is_governed_project(p_project))
 AND public.uboq_verify_signed_rls_proof(p_project,current_setting('app.current_user_id',true),current_setting('app.current_session_version',true),current_setting('app.current_rls_proof',true))
 AND public.uboq_verify_bound_actor_for_project(p_project,current_setting('app.current_user_id',true),current_setting('app.current_session_version',true))
 AND EXISTS(SELECT 1 FROM public."User" u WHERE u.id=current_setting('app.current_user_id',true) AND (
   u.role IN ('SUPER_ADMIN','SYSTEM_ADMIN') OR EXISTS(
    SELECT 1 FROM public."Role" r JOIN public."RolePermission" rp ON rp."roleId"=r.id
    JOIN public."Module" m ON m.id=rp."moduleId"
    WHERE r."isActive" AND m."isActive" AND (r."roleCode"=u.role OR r."roleName"=u.role OR EXISTS(SELECT 1 FROM public."UserRole" ur WHERE ur."userId"=u.id AND ur."roleId"=r.id))
    AND (rp."moduleName"='PAYROLL' OR m."moduleName"='PAYROLL')
    AND p_operation='SELECT' AND rp."canView"
   )
 ));
$$;
ALTER FUNCTION public.uboq_payroll_operation_allowed(text,text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_payroll_operation_allowed(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.uboq_payroll_operation_allowed(text,text) TO oserp_compat_app,oserp_legacy_app;
-- H02-B: bounded ordinary writes; nullable children inherit only a verified period project.
ALTER TABLE public."PayrollPeriod" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PayrollPeriod" FORCE ROW LEVEL SECURITY;
CREATE POLICY g02_r3_payroll_read ON public."PayrollPeriod" FOR SELECT TO oserp_compat_app,oserp_legacy_app USING(public.uboq_payroll_operation_allowed("projectId",'SELECT'));
CREATE POLICY g02_r3_payroll_delete ON public."PayrollPeriod" FOR DELETE TO oserp_compat_app,oserp_legacy_app USING(public.uboq_payroll_operation_allowed("projectId",'DELETE'));
CREATE POLICY g02_r3_payroll_tenant ON public."PayrollPeriod" AS RESTRICTIVE FOR ALL TO oserp_compat_app,oserp_legacy_app USING(public.uboq_check_tenant_rls("projectId")) WITH CHECK(public.uboq_check_tenant_rls("projectId"));
CREATE POLICY g02_targets_insert ON public."PayrollPeriod" FOR INSERT TO oserp_compat_app,oserp_legacy_app WITH CHECK(public.uboq_h02_ordinary_allowed("projectId",'PAYROLL','INSERT'));
CREATE POLICY g02_targets_update ON public."PayrollPeriod" FOR UPDATE TO oserp_compat_app,oserp_legacy_app USING(public.uboq_h02_ordinary_allowed("projectId",'PAYROLL','UPDATE')) WITH CHECK(public.uboq_h02_ordinary_allowed("projectId",'PAYROLL','UPDATE'));
GRANT SELECT,INSERT,UPDATE,DELETE ON public."PayrollPeriod" TO oserp_compat_app,oserp_legacy_app;
ALTER TABLE public."Payroll" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Payroll" FORCE ROW LEVEL SECURITY;
CREATE POLICY g02_r3_payroll_read ON public."Payroll" FOR SELECT TO oserp_compat_app,oserp_legacy_app USING(public.uboq_payroll_operation_allowed(public.uboq_h02_payroll_child_project("projectId","payrollPeriodId"),'SELECT'));
CREATE POLICY g02_r3_payroll_delete ON public."Payroll" FOR DELETE TO oserp_compat_app,oserp_legacy_app USING(public.uboq_payroll_operation_allowed(public.uboq_h02_payroll_child_project("projectId","payrollPeriodId"),'DELETE'));
CREATE POLICY g02_r3_payroll_tenant ON public."Payroll" AS RESTRICTIVE FOR ALL TO oserp_compat_app,oserp_legacy_app USING(public.uboq_check_tenant_rls(public.uboq_h02_payroll_child_project("projectId","payrollPeriodId"))) WITH CHECK(public.uboq_check_tenant_rls(public.uboq_h02_payroll_child_project("projectId","payrollPeriodId")));
CREATE POLICY g02_targets_insert ON public."Payroll" FOR INSERT TO oserp_compat_app,oserp_legacy_app WITH CHECK(public.uboq_h02_ordinary_allowed(public.uboq_h02_payroll_child_project("projectId","payrollPeriodId"),'PAYROLL','INSERT'));
CREATE POLICY g02_targets_update ON public."Payroll" FOR UPDATE TO oserp_compat_app,oserp_legacy_app USING(public.uboq_h02_ordinary_allowed(public.uboq_h02_payroll_child_project("projectId","payrollPeriodId"),'PAYROLL','UPDATE')) WITH CHECK(public.uboq_h02_ordinary_allowed(public.uboq_h02_payroll_child_project("projectId","payrollPeriodId"),'PAYROLL','UPDATE'));
GRANT SELECT,INSERT,UPDATE,DELETE ON public."Payroll" TO oserp_compat_app,oserp_legacy_app;
ALTER TABLE public."DailyTimeRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DailyTimeRecord" FORCE ROW LEVEL SECURITY;
CREATE POLICY g02_r3_payroll_read ON public."DailyTimeRecord" FOR SELECT TO oserp_compat_app,oserp_legacy_app USING(public.uboq_payroll_operation_allowed(public.uboq_h02_payroll_child_project("projectId","payrollPeriodId"),'SELECT'));
CREATE POLICY g02_r3_payroll_delete ON public."DailyTimeRecord" FOR DELETE TO oserp_compat_app,oserp_legacy_app USING(public.uboq_payroll_operation_allowed(public.uboq_h02_payroll_child_project("projectId","payrollPeriodId"),'DELETE'));
CREATE POLICY g02_r3_payroll_tenant ON public."DailyTimeRecord" AS RESTRICTIVE FOR ALL TO oserp_compat_app,oserp_legacy_app USING(public.uboq_check_tenant_rls(public.uboq_h02_payroll_child_project("projectId","payrollPeriodId"))) WITH CHECK(public.uboq_check_tenant_rls(public.uboq_h02_payroll_child_project("projectId","payrollPeriodId")));
CREATE POLICY g02_targets_insert ON public."DailyTimeRecord" FOR INSERT TO oserp_compat_app,oserp_legacy_app WITH CHECK(public.uboq_h02_ordinary_allowed(public.uboq_h02_payroll_child_project("projectId","payrollPeriodId"),'PAYROLL','INSERT'));
CREATE POLICY g02_targets_update ON public."DailyTimeRecord" FOR UPDATE TO oserp_compat_app,oserp_legacy_app USING(public.uboq_h02_ordinary_allowed(public.uboq_h02_payroll_child_project("projectId","payrollPeriodId"),'PAYROLL','UPDATE')) WITH CHECK(public.uboq_h02_ordinary_allowed(public.uboq_h02_payroll_child_project("projectId","payrollPeriodId"),'PAYROLL','UPDATE'));
GRANT SELECT,INSERT,UPDATE,DELETE ON public."DailyTimeRecord" TO oserp_compat_app,oserp_legacy_app;
CREATE FUNCTION public.uboq_guard_payroll_delete() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE period_row public."PayrollPeriod"%ROWTYPE; period_id text;
BEGIN
 period_id:=CASE WHEN TG_TABLE_NAME='PayrollPeriod' THEN OLD.id ELSE to_jsonb(OLD)->>'payrollPeriodId' END;
 SELECT * INTO period_row FROM public."PayrollPeriod" WHERE id=period_id FOR UPDATE;
 IF period_row.id IS NULL OR period_row.status<>'DRAFT' OR period_row."isLocked" OR period_row."dateApproved" IS NOT NULL OR period_row."dateReleased" IS NOT NULL THEN
  RAISE EXCEPTION 'UBOQ_PAYROLL_DELETE_PROTECTED: only unlocked, unapproved DRAFT periods';
 END IF;
 IF TG_TABLE_NAME<>'PayrollPeriod' AND public.uboq_h02_payroll_child_project(to_jsonb(OLD)->>'projectId',period_id) IS DISTINCT FROM period_row."projectId" THEN RAISE EXCEPTION 'UBOQ_PAYROLL_CROSS_PROJECT_DENIED'; END IF;
 IF TG_TABLE_NAME='Payroll' AND upper(COALESCE(to_jsonb(OLD)->>'paymentStatus','')) NOT IN ('UNPAID','PENDING') THEN RAISE EXCEPTION 'UBOQ_PAYROLL_PAID_DELETE_DENIED'; END IF;
 RETURN OLD;
END $$;
ALTER FUNCTION public.uboq_guard_payroll_delete() OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_guard_payroll_delete() FROM PUBLIC;
CREATE TRIGGER g02_r3_payroll_period_delete BEFORE DELETE ON "PayrollPeriod" FOR EACH ROW EXECUTE FUNCTION public.uboq_guard_payroll_delete();
CREATE TRIGGER g02_r3_payroll_row_delete BEFORE DELETE ON "Payroll" FOR EACH ROW EXECUTE FUNCTION public.uboq_guard_payroll_delete();
CREATE TRIGGER g02_r3_dtr_delete BEFORE DELETE ON "DailyTimeRecord" FOR EACH ROW EXECUTE FUNCTION public.uboq_guard_payroll_delete();
-- SELECT FOR UPDATE needs an UPDATE column privilege and an UPDATE USING policy.
-- This lock-only policy has WITH CHECK(false); ordinary draft updates use the separate guarded policy.
GRANT UPDATE(id) ON "PayrollPeriod" TO oserp_compat_app,oserp_legacy_app;
CREATE POLICY g02_r3_payroll_lock ON "PayrollPeriod" FOR UPDATE TO oserp_compat_app,oserp_legacy_app
 USING(public.uboq_payroll_operation_allowed("projectId",'DELETE')) WITH CHECK(false);
-- Controlled H02 source correction (runtime verification pending): fixed project-scoped RPCs; no runtime table DML grants.
-- canDelete is the existing endpoint gate; canDeleteDraft does not imply it.
-- With this schema, the gate is synthesized only for real SUPER_ADMIN/SYSTEM_ADMIN.
CREATE FUNCTION public.uboq_h02_project_authorized(p_project text,p_module text,p_action text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
 SELECT COALESCE(
 p_project IS NOT NULL AND EXISTS(SELECT 1 FROM public."Project" WHERE id=p_project)
 AND p_project=NULLIF(current_setting('app.current_project_id',true),'')
 AND p_module IN ('PROJECT_ASSIGNMENT','PROJECT_MANAGEMENT','SUBCONTRACTING') AND p_action='DELETE'
 AND (p_module='PROJECT_ASSIGNMENT' OR NOT public.uboq_is_governed_project(p_project))
 AND (NOT pg_has_role(session_user,'oserp_legacy_app','MEMBER') OR NOT public.uboq_is_governed_project(p_project))
 AND public.uboq_verify_signed_rls_proof(p_project,current_setting('app.current_user_id',true),current_setting('app.current_session_version',true),current_setting('app.current_rls_proof',true))
 AND public.uboq_verify_bound_actor_for_project(p_project,current_setting('app.current_user_id',true),current_setting('app.current_session_version',true))
 AND EXISTS(SELECT 1 FROM public."User" u WHERE u.id=current_setting('app.current_user_id',true)
   AND u.role IN ('SUPER_ADMIN','SYSTEM_ADMIN')), false);
$$;
ALTER FUNCTION public.uboq_h02_project_authorized(text,text,text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_h02_project_authorized(text,text,text) FROM PUBLIC;

CREATE FUNCTION public.uboq_h02_record_project(p_kind text,p_id text) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
 SELECT "projectId" FROM public."SubcontractPackage" WHERE p_kind='PACKAGE' AND id=p_id
 UNION ALL SELECT "projectId" FROM public."JobOrder" WHERE p_kind='JOB_ORDER' AND id=p_id
 UNION ALL SELECT "projectId" FROM public."ProjectUserAssignment" WHERE p_kind='ASSIGNMENT' AND id=p_id;
$$;
ALTER FUNCTION public.uboq_h02_record_project(text,text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_h02_record_project(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.uboq_h02_record_project(text,text) TO oserp_compat_app,oserp_legacy_app;

CREATE FUNCTION public.uboq_h02_project_mutation(p_operation text,p_id text,p_data jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE v_project text; v_row jsonb; v_scope jsonb; v_programs jsonb; v_id text; v_key text;
BEGIN
 PERFORM set_config('lock_timeout','5000ms',true);
 IF p_operation='DELETE_EMPTY_PROJECT' THEN
  SELECT to_jsonb(p) INTO v_row FROM public."Project" p WHERE id=p_id FOR UPDATE;
  v_project:=v_row->>'id';
 ELSIF p_operation='DELETE_PACKAGE' THEN
  SELECT to_jsonb(p) INTO v_row FROM public."SubcontractPackage" p WHERE id=p_id FOR UPDATE;
  v_project:=v_row->>'projectId';
 ELSIF p_operation='DELETE_JOB_ORDER' THEN
  SELECT to_jsonb(p) INTO v_row FROM public."JobOrder" p WHERE id=p_id FOR UPDATE;
  v_project:=v_row->>'projectId';
 ELSIF p_operation IN ('ASSIGNMENT_UPDATE','ASSIGNMENT_DELETE') THEN
  SELECT to_jsonb(p) INTO v_row FROM public."ProjectUserAssignment" p WHERE id=p_id FOR UPDATE;
  v_project:=v_row->>'projectId';
 ELSIF p_operation='ASSIGNMENT_CREATE' THEN
  v_project:=p_data->>'projectId';
 ELSE RAISE EXCEPTION 'H02_OPERATION_NOT_ALLOWED' USING ERRCODE='42501'; END IF;
 IF v_project IS NULL THEN RAISE EXCEPTION 'H02_TARGET_NOT_FOUND' USING ERRCODE='P0002'; END IF;
 IF public.uboq_h02_project_authorized(v_project,CASE WHEN p_operation IN ('DELETE_PACKAGE','DELETE_JOB_ORDER') THEN 'SUBCONTRACTING' WHEN p_operation LIKE 'ASSIGNMENT_%' THEN 'PROJECT_ASSIGNMENT' ELSE 'PROJECT_MANAGEMENT' END,'DELETE') IS NOT TRUE THEN
  RAISE EXCEPTION 'H02_PROJECT_AUTHORIZATION_DENIED' USING ERRCODE='42501';
 END IF;
 IF p_operation='DELETE_EMPTY_PROJECT' THEN
  PERFORM id FROM public."ProjectUserAssignment" WHERE "projectId"=v_project ORDER BY id FOR UPDATE;
  SELECT COALESCE(jsonb_agg(to_jsonb(a) ORDER BY to_jsonb(a)::text),'[]'::jsonb) INTO v_programs FROM public."ProjectUserAssignment" a WHERE "projectId"=v_project;
  v_scope:=jsonb_build_object('Project',jsonb_build_array(v_row),'ProjectUserAssignment',v_programs);
  IF public.uboq_recursive_cleanup_closure(v_scope) IS DISTINCT FROM v_scope THEN RAISE EXCEPTION 'H02_PROJECT_HAS_OPERATIONAL_DEPENDENCIES'; END IF;
  DELETE FROM public."ProjectUserAssignment" WHERE "projectId"=v_project;
  DELETE FROM public."Project" WHERE id=p_id;
 ELSIF p_operation IN ('DELETE_PACKAGE','DELETE_JOB_ORDER') THEN
  IF upper(COALESCE(v_row->>'status',''))<>'DRAFT' OR COALESCE((v_row->>'isLocked')::boolean,false) OR NULLIF(v_row->>'approvedBy','') IS NOT NULL THEN RAISE EXCEPTION 'H02_PROTECTED_WORKFLOW_RECORD'; END IF;
  IF NULLIF(v_row->>'masterBoqItemId','') IS NOT NULL OR NULLIF(v_row->>'boqReferenceId','') IS NOT NULL THEN RAISE EXCEPTION 'H02_UNVERIFIED_LEGACY_BOQ_REFERENCE'; END IF;
  IF NULLIF(v_row->>'awardedBoqItemId','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public."AwardedBOQItem" WHERE id=v_row->>'awardedBoqItemId' AND "projectId"=v_project) THEN RAISE EXCEPTION 'H02_RESOURCE_LINEAGE_DENIED'; END IF;
  IF NULLIF(v_row->>'consolidatedBoqItemId','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public."ConsolidatedBOQItem" WHERE id=v_row->>'consolidatedBoqItemId' AND "projectId"=v_project AND "isUboqResourceGoverned" IS NOT TRUE) THEN RAISE EXCEPTION 'H02_RESOURCE_LINEAGE_DENIED'; END IF;
  IF p_operation='DELETE_PACKAGE' THEN
   PERFORM id FROM public."ProgramOfWorks" WHERE "packageId"=p_id ORDER BY id FOR UPDATE;
   SELECT COALESCE(jsonb_agg(to_jsonb(a) ORDER BY to_jsonb(a)::text),'[]'::jsonb) INTO v_programs FROM public."ProgramOfWorks" a WHERE "packageId"=p_id;
   v_scope:=jsonb_build_object('SubcontractPackage',jsonb_build_array(v_row),'ProgramOfWorks',v_programs);
  ELSE v_scope:=jsonb_build_object('JobOrder',jsonb_build_array(v_row)); END IF;
  IF public.uboq_recursive_cleanup_closure(v_scope) IS DISTINCT FROM v_scope THEN RAISE EXCEPTION 'H02_RECORD_HAS_OPERATIONAL_DEPENDENCIES'; END IF;
  IF p_operation='DELETE_PACKAGE' THEN
   DELETE FROM public."ProgramOfWorks" WHERE "packageId"=p_id;
   DELETE FROM public."SubcontractPackage" WHERE id=p_id;
  ELSE DELETE FROM public."JobOrder" WHERE id=p_id; END IF;
 ELSE
  IF jsonb_typeof(p_data)<>'object' THEN RAISE EXCEPTION 'H02_ASSIGNMENT_DATA_REQUIRED'; END IF;
  FOR v_key IN SELECT jsonb_object_keys(p_data) LOOP
   IF v_key NOT IN ('projectId','userId','projectRole','accessLevel','remarks','assignmentStatus') THEN RAISE EXCEPTION 'H02_ASSIGNMENT_FIELD_DENIED'; END IF;
  END LOOP;
  IF p_operation='ASSIGNMENT_DELETE' THEN
   v_scope:=jsonb_build_object('ProjectUserAssignment',jsonb_build_array(v_row));
   IF public.uboq_recursive_cleanup_closure(v_scope) IS DISTINCT FROM v_scope THEN RAISE EXCEPTION 'H02_ASSIGNMENT_HAS_DEPENDENCIES'; END IF;
   DELETE FROM public."ProjectUserAssignment" WHERE id=p_id;
  ELSIF p_operation='ASSIGNMENT_UPDATE' THEN
   IF (p_data ? 'projectId' AND p_data->>'projectId' IS DISTINCT FROM v_project) OR (p_data ? 'userId' AND p_data->>'userId' IS DISTINCT FROM v_row->>'userId') THEN RAISE EXCEPTION 'H02_ASSIGNMENT_REPARENT_DENIED'; END IF;
   UPDATE public."ProjectUserAssignment" SET
    "projectRole"=CASE WHEN p_data ? 'projectRole' THEN p_data->>'projectRole' ELSE "projectRole" END,
    "accessLevel"=CASE WHEN p_data ? 'accessLevel' THEN p_data->>'accessLevel' ELSE "accessLevel" END,
    remarks=CASE WHEN p_data ? 'remarks' THEN p_data->>'remarks' ELSE remarks END,
    "assignmentStatus"=CASE WHEN p_data ? 'assignmentStatus' THEN p_data->>'assignmentStatus' ELSE "assignmentStatus" END,
    "updatedAt"=clock_timestamp() WHERE id=p_id;
  ELSE
   IF NULLIF(p_data->>'userId','') IS NULL OR NULLIF(p_data->>'projectRole','') IS NULL OR NULLIF(p_data->>'accessLevel','') IS NULL THEN RAISE EXCEPTION 'H02_ASSIGNMENT_FIELDS_REQUIRED'; END IF;
   PERFORM id FROM public."Project" WHERE id=v_project FOR UPDATE;
   IF EXISTS(SELECT 1 FROM public."ProjectUserAssignment" WHERE "projectId"=v_project AND "userId"=p_data->>'userId') THEN RETURN jsonb_build_object('success',false,'error','User is already assigned to this project.'); END IF;
   v_id:=md5(random()::text||clock_timestamp()::text||pg_backend_pid()::text);
   INSERT INTO public."ProjectUserAssignment"(id,"projectId","userId","projectRole","accessLevel",remarks,"assignmentStatus","assignedBy","createdAt","updatedAt")
    VALUES(v_id,v_project,p_data->>'userId',p_data->>'projectRole',p_data->>'accessLevel',p_data->>'remarks',COALESCE(p_data->>'assignmentStatus','active'),current_setting('app.current_user_id',true),clock_timestamp(),clock_timestamp());
  END IF;
 END IF;
 RETURN jsonb_build_object('success',true,'id',COALESCE(v_id,p_id),'projectId',v_project);
END $$;
ALTER FUNCTION public.uboq_h02_project_mutation(text,text,jsonb) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_h02_project_mutation(text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.uboq_h02_project_mutation(text,text,jsonb) TO oserp_compat_app,oserp_legacy_app;
ALTER TABLE "SubcontractPackage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SubcontractPackage" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ProgramOfWorks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProgramOfWorks" FORCE ROW LEVEL SECURITY;
ALTER TABLE "JobOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "JobOrder" FORCE ROW LEVEL SECURITY;

-- H02-A/B: ordinary INSERT/UPDATE cannot reparent rows or publish protected workflows.
CREATE FUNCTION public.uboq_h02_guard_ordinary_write() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE j jsonb:=to_jsonb(NEW); old_j jsonb; p text; old_p text; parent_row record;
BEGIN
 IF TG_OP='UPDATE' THEN
  old_j:=to_jsonb(OLD);
  IF j->>'id' IS DISTINCT FROM old_j->>'id' THEN RAISE EXCEPTION 'H02_ORDINARY_ID_CHANGE_DENIED'; END IF;
 END IF;
 IF TG_TABLE_NAME='ProgramOfWorks' THEN
  SELECT "projectId",status,"isLocked" INTO parent_row FROM public."SubcontractPackage" WHERE id=j->>'packageId' FOR UPDATE;
  p:=parent_row."projectId";
  IF p IS NULL OR parent_row.status<>'DRAFT' OR parent_row."isLocked" THEN RAISE EXCEPTION 'H02_PACKAGE_NOT_EDITABLE'; END IF;
  IF TG_OP='UPDATE' AND j->>'packageId' IS DISTINCT FROM old_j->>'packageId' THEN RAISE EXCEPTION 'H02_ORDINARY_REPARENT_DENIED'; END IF;
 ELSIF TG_TABLE_NAME IN ('SubcontractPackage','JobOrder') THEN
  p:=j->>'projectId';
  IF TG_OP='UPDATE' AND p IS DISTINCT FROM old_j->>'projectId' THEN RAISE EXCEPTION 'H02_ORDINARY_REPARENT_DENIED'; END IF;
  IF j->>'status' IS DISTINCT FROM 'DRAFT' OR COALESCE((j->>'isLocked')::boolean,false) OR NULLIF(j->>'approvedBy','') IS NOT NULL
   OR (TG_OP='UPDATE' AND (old_j->>'status' IS DISTINCT FROM 'DRAFT' OR COALESCE((old_j->>'isLocked')::boolean,false) OR NULLIF(old_j->>'approvedBy','') IS NOT NULL)) THEN RAISE EXCEPTION 'H02_ORDINARY_WORKFLOW_DENIED'; END IF;
  IF TG_TABLE_NAME='JobOrder' AND j->>'packageId' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public."SubcontractPackage" WHERE id=j->>'packageId' AND "projectId"=p) THEN RAISE EXCEPTION 'H02_FOREIGN_PACKAGE_DENIED'; END IF;
  IF j->>'consolidatedBoqItemId' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public."ConsolidatedBOQItem" WHERE id=j->>'consolidatedBoqItemId' AND "projectId"=p AND "isUboqResourceGoverned" IS NOT TRUE) THEN RAISE EXCEPTION 'H02_FOREIGN_OR_GOVERNED_RESOURCE_DENIED'; END IF;
  IF j->>'awardedBoqItemId' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public."AwardedBOQItem" WHERE id=j->>'awardedBoqItemId' AND "projectId"=p) THEN RAISE EXCEPTION 'H02_FOREIGN_AWARDED_ITEM_DENIED'; END IF;
 ELSE
  p:=CASE WHEN TG_TABLE_NAME='PayrollPeriod' THEN j->>'projectId' ELSE public.uboq_h02_payroll_child_project(j->>'projectId',j->>'payrollPeriodId') END;
  IF p IS NULL THEN RAISE EXCEPTION 'H02_PAYROLL_OWNERSHIP_REQUIRED'; END IF;
  IF TG_OP='UPDATE' THEN
   old_p:=CASE WHEN TG_TABLE_NAME='PayrollPeriod' THEN old_j->>'projectId' ELSE public.uboq_h02_payroll_child_project(old_j->>'projectId',old_j->>'payrollPeriodId') END;
   IF p IS DISTINCT FROM old_p OR (TG_TABLE_NAME<>'PayrollPeriod' AND j->>'workerId' IS DISTINCT FROM old_j->>'workerId')
    OR (TG_TABLE_NAME<>'PayrollPeriod' AND old_j->>'payrollPeriodId' IS NOT NULL AND j->>'payrollPeriodId' IS DISTINCT FROM old_j->>'payrollPeriodId') THEN RAISE EXCEPTION 'H02_ORDINARY_REPARENT_DENIED'; END IF;
  END IF;
  IF TG_TABLE_NAME='PayrollPeriod' THEN
   IF TG_OP='INSERT' THEN
    IF NEW."createdById" IS NOT NULL AND NEW."createdById" IS DISTINCT FROM current_setting('app.current_user_id',true) THEN RAISE EXCEPTION 'H02_PAYROLL_CREATOR_DENIED'; END IF;
    NEW."createdById":=current_setting('app.current_user_id',true);
   ELSIF j->>'createdById' IS DISTINCT FROM old_j->>'createdById' THEN RAISE EXCEPTION 'H02_PAYROLL_CREATOR_DENIED'; END IF;
   IF j->>'status' IS DISTINCT FROM 'DRAFT' OR COALESCE((j->>'isLocked')::boolean,false) OR j->>'dateApproved' IS NOT NULL OR j->>'dateReleased' IS NOT NULL OR j->>'approvedById' IS NOT NULL
    OR (TG_OP='UPDATE' AND (old_j->>'status' IS DISTINCT FROM 'DRAFT' OR COALESCE((old_j->>'isLocked')::boolean,false) OR old_j->>'dateApproved' IS NOT NULL OR old_j->>'dateReleased' IS NOT NULL)) THEN RAISE EXCEPTION 'H02_PAYROLL_WORKFLOW_DENIED'; END IF;
  ELSIF j->>'payrollPeriodId' IS NOT NULL THEN
   SELECT "projectId",status,"isLocked","dateApproved","dateReleased" INTO parent_row FROM public."PayrollPeriod" WHERE id=j->>'payrollPeriodId' FOR UPDATE;
   IF parent_row."projectId" IS DISTINCT FROM p OR parent_row.status IS DISTINCT FROM 'DRAFT' OR parent_row."isLocked" OR parent_row."dateApproved" IS NOT NULL OR parent_row."dateReleased" IS NOT NULL THEN RAISE EXCEPTION 'H02_PAYROLL_WORKFLOW_DENIED'; END IF;
  END IF;
  IF TG_TABLE_NAME<>'PayrollPeriod' AND NOT EXISTS(SELECT 1 FROM public."Worker" WHERE id=j->>'workerId' AND ("projectId" IS NULL OR "projectId"=p)) THEN RAISE EXCEPTION 'H02_PAYROLL_WORKER_SCOPE_DENIED'; END IF;
  IF TG_TABLE_NAME='Payroll' AND (COALESCE(j->>'paymentStatus','') NOT IN ('PENDING','UNPAID','ON_HOLD','EXCEPTION') OR (TG_OP='UPDATE' AND COALESCE(old_j->>'paymentStatus','') NOT IN ('PENDING','UNPAID','ON_HOLD','EXCEPTION'))) THEN RAISE EXCEPTION 'H02_PAID_PAYROLL_WRITE_DENIED'; END IF;
  IF TG_TABLE_NAME='DailyTimeRecord' AND (j->>'status' IS DISTINCT FROM 'DRAFT' OR (TG_OP='UPDATE' AND old_j->>'status' IS DISTINCT FROM 'DRAFT')) THEN RAISE EXCEPTION 'H02_DTR_WORKFLOW_DENIED'; END IF;
 END IF;
 IF public.uboq_h02_ordinary_allowed(p,CASE WHEN TG_TABLE_NAME IN ('SubcontractPackage','ProgramOfWorks','JobOrder') THEN 'SUBCONTRACTING' ELSE 'PAYROLL' END,TG_OP) IS NOT TRUE THEN RAISE EXCEPTION 'H02_ORDINARY_WRITE_DENIED' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
ALTER FUNCTION public.uboq_h02_guard_ordinary_write() OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_h02_guard_ordinary_write() FROM PUBLIC;

-- H02-A: ordinary SELECT/INSERT/UPDATE only; DELETE stays on the existing fixed RPC.
CREATE POLICY g02_targets_select ON public."SubcontractPackage" FOR SELECT TO oserp_compat_app,oserp_legacy_app USING(public.uboq_h02_ordinary_allowed("projectId",'SUBCONTRACTING','SELECT'));
CREATE POLICY g02_targets_insert ON public."SubcontractPackage" FOR INSERT TO oserp_compat_app,oserp_legacy_app WITH CHECK(public.uboq_h02_ordinary_allowed("projectId",'SUBCONTRACTING','INSERT'));
CREATE POLICY g02_targets_update ON public."SubcontractPackage" FOR UPDATE TO oserp_compat_app,oserp_legacy_app USING(public.uboq_h02_ordinary_allowed("projectId",'SUBCONTRACTING','UPDATE')) WITH CHECK(public.uboq_h02_ordinary_allowed("projectId",'SUBCONTRACTING','UPDATE'));
CREATE POLICY g02_targets_tenant ON public."SubcontractPackage" AS RESTRICTIVE FOR ALL TO oserp_compat_app,oserp_legacy_app USING(public.uboq_check_tenant_rls("projectId")) WITH CHECK(public.uboq_check_tenant_rls("projectId"));
GRANT SELECT,INSERT,UPDATE ON public."SubcontractPackage" TO oserp_compat_app,oserp_legacy_app;
CREATE POLICY g02_targets_select ON public."ProgramOfWorks" FOR SELECT TO oserp_compat_app,oserp_legacy_app USING(public.uboq_h02_package_write_allowed("packageId",'SELECT'));
CREATE POLICY g02_targets_insert ON public."ProgramOfWorks" FOR INSERT TO oserp_compat_app,oserp_legacy_app WITH CHECK(public.uboq_h02_package_write_allowed("packageId",'INSERT'));
CREATE POLICY g02_targets_update ON public."ProgramOfWorks" FOR UPDATE TO oserp_compat_app,oserp_legacy_app USING(public.uboq_h02_package_write_allowed("packageId",'UPDATE')) WITH CHECK(public.uboq_h02_package_write_allowed("packageId",'UPDATE'));
CREATE POLICY g02_targets_tenant ON public."ProgramOfWorks" AS RESTRICTIVE FOR ALL TO oserp_compat_app,oserp_legacy_app USING(public.uboq_check_tenant_rls(public.uboq_h02_record_project('PACKAGE',"packageId"))) WITH CHECK(public.uboq_check_tenant_rls(public.uboq_h02_record_project('PACKAGE',"packageId")));
GRANT SELECT,INSERT,UPDATE ON public."ProgramOfWorks" TO oserp_compat_app,oserp_legacy_app;
CREATE POLICY g02_targets_select ON public."JobOrder" FOR SELECT TO oserp_compat_app,oserp_legacy_app USING(public.uboq_h02_ordinary_allowed("projectId",'SUBCONTRACTING','SELECT'));
CREATE POLICY g02_targets_insert ON public."JobOrder" FOR INSERT TO oserp_compat_app,oserp_legacy_app WITH CHECK(public.uboq_h02_ordinary_allowed("projectId",'SUBCONTRACTING','INSERT'));
CREATE POLICY g02_targets_update ON public."JobOrder" FOR UPDATE TO oserp_compat_app,oserp_legacy_app USING(public.uboq_h02_ordinary_allowed("projectId",'SUBCONTRACTING','UPDATE')) WITH CHECK(public.uboq_h02_ordinary_allowed("projectId",'SUBCONTRACTING','UPDATE'));
CREATE POLICY g02_targets_tenant ON public."JobOrder" AS RESTRICTIVE FOR ALL TO oserp_compat_app,oserp_legacy_app USING(public.uboq_check_tenant_rls("projectId")) WITH CHECK(public.uboq_check_tenant_rls("projectId"));
GRANT SELECT,INSERT,UPDATE ON public."JobOrder" TO oserp_compat_app,oserp_legacy_app;
CREATE TRIGGER g02_targets_ordinary_write BEFORE INSERT OR UPDATE ON public."SubcontractPackage" FOR EACH ROW EXECUTE FUNCTION public.uboq_h02_guard_ordinary_write();
CREATE TRIGGER g02_targets_ordinary_write BEFORE INSERT OR UPDATE ON public."ProgramOfWorks" FOR EACH ROW EXECUTE FUNCTION public.uboq_h02_guard_ordinary_write();
CREATE TRIGGER g02_targets_ordinary_write BEFORE INSERT OR UPDATE ON public."JobOrder" FOR EACH ROW EXECUTE FUNCTION public.uboq_h02_guard_ordinary_write();
CREATE TRIGGER g02_targets_ordinary_write BEFORE INSERT OR UPDATE ON public."PayrollPeriod" FOR EACH ROW EXECUTE FUNCTION public.uboq_h02_guard_ordinary_write();
CREATE TRIGGER g02_targets_ordinary_write BEFORE INSERT OR UPDATE ON public."Payroll" FOR EACH ROW EXECUTE FUNCTION public.uboq_h02_guard_ordinary_write();
CREATE TRIGGER g02_targets_ordinary_write BEFORE INSERT OR UPDATE ON public."DailyTimeRecord" FOR EACH ROW EXECUTE FUNCTION public.uboq_h02_guard_ordinary_write();
