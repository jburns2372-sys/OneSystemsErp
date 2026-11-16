-- ============================================================================
-- OSERP-PROJ-UBOQ-001 — WP-3 Batch B Independent Review Remediation (Migration #29)
-- Forward-only migration hardening public.uboq_guard_template_audit_event() for:
--   1. IR-02 (Historical Billing Authority):
--      - T5_ACCOMPLISHMENT_CERT and T6_PROGRESS_BILLING formal export audit events
--        must bind to a verified UboqOperationalSnapshot (@v<N>) approved on or
--        before the certificate period cutoff (Accomplishment.accomplishmentDate
--        for T5; Billing.billingPeriodTo for T6), NOT blindly to the newest
--        project snapshot.
--      - Rejects post-dated snapshots, snapshots already superseded on or before
--        the period cutoff, and snapshots lacking an APPROVED UboqContractAuthority
--        effective on or before the period cutoff.
--   2. IR-03 (Inspection Quantity Integrity):
--      - T5_ACCOMPLISHMENT_CERT formal export audit events require APPROVED
--        Inspection quantities that actually support (>=) each positive
--        AccomplishmentItem claim, with distinct non-blank lot/scope linkage
--        and zero duplicate quantity counting when multiple inspections exist.
-- Preserves Migrations #1-#28 unchanged.
-- ============================================================================

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
      'T6_PROGRESS_BILLING'
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
       OR (NEW."templateCode" = 'T6_PROGRESS_BILLING' AND NEW."contractCode" IS DISTINCT FROM 'ERP_CANONICAL_T6_FORMAL_V1') THEN
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

-- Re-assert least-privilege ACLs on UboqTemplateAuditEvent (Migration #27 SELECT RLS preserved)
REVOKE ALL ON TABLE public."UboqTemplateAuditEvent"
  FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public."UboqTemplateAuditEvent"
  FROM oserp_compat_app;
GRANT SELECT ON TABLE public."UboqTemplateAuditEvent" TO oserp_compat_app;
