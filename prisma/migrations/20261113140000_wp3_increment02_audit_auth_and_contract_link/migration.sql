-- ============================================================================
-- OSERP-PROJ-UBOQ-001 — WP-3 Increment 02 Independent Review Remediation (#25)
-- Forward-only migration #25. Historical migrations #1-#24 remain immutable.
-- Scope:
--   1. WP3-02-IR-01 (HIGH): Revoke direct INSERT on UboqTemplateAuditEvent from
--      oserp_compat_app and enforce least-privilege, operation-specific SQL
--      authorization verifying bound actor identity, authoritative User.role,
--      formal-export / layout-write entitlement, VAL-19 blocker gate, and
--      approved source/layout linkage.
--   2. WP3-02-IR-03 (MEDIUM): Add explicit nullable contractAuthorityId relation
--      on UboqOperationalSnapshot with same-project & approved-authority guards
--      so T1 formal exports never guess or imply unverified contract linkage.
-- ============================================================================

-- 1. Explicit Snapshot-to-Contract Authority Association (WP3-02-IR-03)
ALTER TABLE "UboqOperationalSnapshot"
  ADD COLUMN IF NOT EXISTS "contractAuthorityId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UboqOperationalSnapshot_contractAuthorityId_fkey'
  ) THEN
    ALTER TABLE "UboqOperationalSnapshot"
      ADD CONSTRAINT "UboqOperationalSnapshot_contractAuthorityId_fkey"
      FOREIGN KEY ("contractAuthorityId") REFERENCES "UboqContractAuthority"("id")
      ON DELETE RESTRICT ON UPDATE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "UboqOperationalSnapshot_projectId_contractAuthorityId_idx"
  ON "UboqOperationalSnapshot"("projectId", "contractAuthorityId");

CREATE OR REPLACE FUNCTION public.uboq_guard_snapshot_contract_authority()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_ca record;
BEGIN
  IF current_setting('app.synthetic_cleanup_authorized', true) = 'on'
     AND pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER') THEN
    RETURN NEW;
  END IF;

  IF NEW."contractAuthorityId" IS NOT NULL THEN
    SELECT id, "projectId", status, "approvedAt", "approvedById"
    INTO v_ca
    FROM public."UboqContractAuthority"
    WHERE id = NEW."contractAuthorityId";

    IF v_ca.id IS NULL OR v_ca."projectId" IS DISTINCT FROM NEW."projectId" THEN
      RAISE EXCEPTION 'UBOQ_CROSS_PROJECT_CONTRACT_AUTHORITY_DENIED: Linked UboqContractAuthority % does not belong to project %',
        NEW."contractAuthorityId", NEW."projectId"
        USING ERRCODE = '42501';
    END IF;

    IF NEW.status = 'APPROVED'
       AND (v_ca.status <> 'APPROVED' OR v_ca."approvedAt" IS NULL OR v_ca."approvedById" IS NULL) THEN
      RAISE EXCEPTION 'UBOQ_UNAPPROVED_CONTRACT_AUTHORITY_DENIED: Approved snapshot % cannot bind unapproved UboqContractAuthority %',
        NEW.id, NEW."contractAuthorityId"
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
ALTER FUNCTION public.uboq_guard_snapshot_contract_authority() OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_guard_snapshot_contract_authority() FROM PUBLIC;

DROP TRIGGER IF EXISTS a01_uboq_snapshot_contract_authority_scope ON "UboqOperationalSnapshot";
CREATE TRIGGER a01_uboq_snapshot_contract_authority_scope
  BEFORE INSERT OR UPDATE ON "UboqOperationalSnapshot"
  FOR EACH ROW EXECUTE FUNCTION public.uboq_guard_snapshot_contract_authority();

-- 2. Least-Privilege Table ACL & Operation-Specific Audit Authorization (WP3-02-IR-01)
REVOKE ALL ON TABLE "UboqTemplateAuditEvent"
  FROM PUBLIC, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT SELECT ON TABLE "UboqTemplateAuditEvent" TO oserp_compat_app;

CREATE OR REPLACE FUNCTION public.uboq_can_formal_export_template(
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
    'SUPER_ADMIN', 'PRESIDENT', 'VP_OPERATIONS', 'FINANCE_DIRECTOR',
    'COST_CONTROL_MANAGER', 'COMMERCIAL_DIRECTOR', 'PROJECT_MANAGER',
    'QUANTITY_SURVEYOR', 'ACCOUNTANT', 'BILLING_ENGINEER', 'OPERATIONS_MANAGER'
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

  IF v_role IN ('SUPER_ADMIN', 'PRESIDENT', 'VP_OPERATIONS')
     OR v_proj."managerId" = p_actor_id THEN
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
       'SUPER_ADMIN', 'PRESIDENT', 'VP_OPERATIONS', 'FINANCE_DIRECTOR',
       'COST_CONTROL_MANAGER', 'COMMERCIAL_DIRECTOR', 'PROJECT_MANAGER',
       'QUANTITY_SURVEYOR', 'ACCOUNTANT', 'BILLING_ENGINEER', 'OPERATIONS_MANAGER'
     ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;
ALTER FUNCTION public.uboq_can_formal_export_template(text, text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_can_formal_export_template(text, text)
  FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_can_formal_export_template(text, text) TO oserp_compat_app;

DROP POLICY IF EXISTS rls_restrictive_uboq_tpl_audit_tenant ON "UboqTemplateAuditEvent";
CREATE POLICY rls_restrictive_uboq_tpl_audit_tenant ON "UboqTemplateAuditEvent"
  AS RESTRICTIVE FOR ALL TO PUBLIC
  USING (
    public.uboq_can_read_template_audit("projectId", "sharingScope", "actorUserId", "layoutOwnerId")
  )
  WITH CHECK (
    current_setting('app.uboq_audit_fn_active', true) = 'on'
    AND "projectId" IS NOT NULL
    AND "actorUserId" = NULLIF(current_setting('app.current_user_id', true), '')
    AND public.uboq_check_tenant_rls("projectId")
  );

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
    IF public.uboq_can_formal_export_template(NEW."projectId", NEW."actorUserId") IS NOT TRUE THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_FORMAL_EXPORT_DENIED: Actor % lacks formal export entitlement on project %',
        NEW."actorUserId", NEW."projectId"
        USING ERRCODE = '42501';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public."UboqValidationException"
      WHERE "projectId" = NEW."projectId"
        AND status = 'OPEN'
        AND severity = 'BLOCKING'
    ) THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_BLOCKING_EXCEPTIONS: Formal export audit blocked while OPEN BLOCKING exceptions exist on project %',
        NEW."projectId"
        USING ERRCODE = 'P0001';
    END IF;

    IF (NEW."templateCode" = 'T0_MASTER_CONTRACT' AND NEW."contractCode" IS DISTINCT FROM 'ERP_CANONICAL_T0_FORMAL_V1')
       OR (NEW."templateCode" = 'T1_PHASE_BOQ' AND NEW."contractCode" IS DISTINCT FROM 'ERP_CANONICAL_T1_FORMAL_V1') THEN
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
         OR v_ca.status <> 'APPROVED'
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
    ELSE
      SELECT id, "projectId", status, "versionNumber", "approvedAt", "approvedById", "contractAuthorityId"
      INTO v_snap
      FROM public."UboqOperationalSnapshot"
      WHERE id = NEW."sourceId"
        AND "projectId" = NEW."projectId";

      IF v_snap.id IS NULL
         OR v_snap.status <> 'APPROVED'
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
           OR v_ca.status <> 'APPROVED'
           OR v_ca."approvedAt" IS NULL
           OR v_ca."approvedById" IS NULL THEN
          RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_UNAPPROVED_LINKED_CONTRACT: Linked contract authority % on snapshot % is not APPROVED',
            v_snap."contractAuthorityId", v_snap.id
            USING ERRCODE = 'P0001';
        END IF;
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

CREATE OR REPLACE FUNCTION public.uboq_append_template_audit_event(
  p_id text,
  p_project_id text,
  p_layout_group_id text,
  p_layout_definition_id text,
  p_layout_version_number integer,
  p_layout_owner_id text,
  p_sharing_scope text,
  p_template_code text,
  p_event_type text,
  p_actor_user_id text,
  p_actor_role text,
  p_source_id text DEFAULT NULL,
  p_source_version text DEFAULT NULL,
  p_contract_code text DEFAULT NULL,
  p_export_format text DEFAULT NULL,
  p_output_sha256 text DEFAULT NULL,
  p_details_json jsonb DEFAULT NULL
)
RETURNS public."UboqTemplateAuditEvent"
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_row public."UboqTemplateAuditEvent";
BEGIN
  IF p_id IS NULL OR p_id !~ '^[A-Za-z0-9_-]{8,160}$' THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_INVALID_ID: Valid audit event id required'
      USING ERRCODE = '22023';
  END IF;

  PERFORM set_config('app.uboq_audit_fn_active', 'on', true);
  BEGIN
    INSERT INTO public."UboqTemplateAuditEvent" (
      "id",
      "projectId",
      "layoutGroupId",
      "layoutDefinitionId",
      "layoutVersionNumber",
      "layoutOwnerId",
      "sharingScope",
      "templateCode",
      "eventType",
      "actorUserId",
      "actorRole",
      "sourceId",
      "sourceVersion",
      "contractCode",
      "exportFormat",
      "outputSha256",
      "detailsJson"
    )
    VALUES (
      p_id,
      p_project_id,
      p_layout_group_id,
      p_layout_definition_id,
      p_layout_version_number,
      p_layout_owner_id,
      p_sharing_scope,
      p_template_code,
      p_event_type,
      p_actor_user_id,
      p_actor_role,
      p_source_id,
      p_source_version,
      p_contract_code,
      p_export_format,
      p_output_sha256,
      p_details_json
    )
    RETURNING * INTO v_row;

    PERFORM set_config('app.uboq_audit_fn_active', 'off', true);
  EXCEPTION
    WHEN OTHERS THEN
      PERFORM set_config('app.uboq_audit_fn_active', 'off', true);
      RAISE;
  END;

  RETURN v_row;
END;
$$;
ALTER FUNCTION public.uboq_append_template_audit_event(
  text, text, text, text, integer, text, text, text, text, text, text, text, text, text, text, text, jsonb
) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_append_template_audit_event(
  text, text, text, text, integer, text, text, text, text, text, text, text, text, text, text, text, jsonb
) FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_append_template_audit_event(
  text, text, text, text, integer, text, text, text, text, text, text, text, text, text, text, text, jsonb
) TO oserp_compat_app;
