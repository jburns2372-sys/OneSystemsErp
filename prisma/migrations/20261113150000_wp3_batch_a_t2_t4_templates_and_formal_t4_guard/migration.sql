-- ============================================================================
-- OSERP-PROJ-UBOQ-001 — WP-3 BATCH A (#26, FORWARD-ONLY)
-- Enable Persistent Saved Layouts for Batch A Templates:
--   - T2_CONSOLIDATED_BOQ   (rowGrain = CONSOLIDATED_WORK_ITEM, non-formal)
--   - T3_AGENCY_ESTIMATE    (rowGrain = PHASE_BOQ_LINE, non-formal)
--   - T4_RESOURCE_TAKEOFF   (rowGrain = CANONICAL_RESOURCE, formal ERP_CANONICAL_T4_FORMAL_V1)
-- Align layout/formal role gates with COMMERCIAL_RESTRICTED_ROLES (including
-- CHIEF_ESTIMATOR, PROCUREMENT_MANAGER, PROCUREMENT_OFFICER) and enforce
-- approved snapshot + approved PRR provenance on T4 formal export audit events
-- while keeping T2/T3 non-formal and T5-T12 gated until subsequent batches.
-- Migrations #1-#25 remain byte-for-byte unchanged.
-- ============================================================================

-- 1. Extend UboqTemplateAuditEvent templateCode CHECK constraint to T0-T4
ALTER TABLE "UboqTemplateAuditEvent"
  DROP CONSTRAINT IF EXISTS "chk_uboq_tpl_audit_template_code";

ALTER TABLE "UboqTemplateAuditEvent"
  ADD CONSTRAINT "chk_uboq_tpl_audit_template_code" CHECK (
    "templateCode" IN (
      'T0_MASTER_CONTRACT',
      'T1_PHASE_BOQ',
      'T2_CONSOLIDATED_BOQ',
      'T3_AGENCY_ESTIMATE',
      'T4_RESOURCE_TAKEOFF'
    )
  );

-- 2. Align Controlled Sharing & Layout Write Authorization Functions for T0-T4 Roles
CREATE OR REPLACE FUNCTION public.uboq_can_share_template_layout(
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
    'SUPER_ADMIN', 'SYSTEM_ADMIN', 'ADMIN', 'PRESIDENT', 'VP_OPERATIONS',
    'PROJECT_DIRECTOR', 'DIRECTORS', 'FINANCE_DIRECTOR', 'COMMERCIAL_DIRECTOR',
    'COST_CONTROL_MANAGER', 'CHIEF_ESTIMATOR', 'PROJECT_MANAGER',
    'OPERATIONS_MANAGER', 'FINANCE_MANAGER', 'PROCUREMENT_MANAGER',
    'PURCHASING_MANAGER', 'QS_ENGINEER', 'QUANTITY_SURVEYOR', 'COST_ENGINEER'
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

  IF v_role IN ('SUPER_ADMIN', 'SYSTEM_ADMIN', 'PRESIDENT', 'VP_OPERATIONS')
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
       'SUPER_ADMIN', 'SYSTEM_ADMIN', 'ADMIN', 'PRESIDENT', 'VP_OPERATIONS',
       'PROJECT_DIRECTOR', 'DIRECTORS', 'FINANCE_DIRECTOR', 'COMMERCIAL_DIRECTOR',
       'COST_CONTROL_MANAGER', 'CHIEF_ESTIMATOR', 'PROJECT_MANAGER',
       'OPERATIONS_MANAGER', 'FINANCE_MANAGER', 'PROCUREMENT_MANAGER',
       'PURCHASING_MANAGER', 'QS_ENGINEER', 'QUANTITY_SURVEYOR', 'COST_ENGINEER'
     ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;
ALTER FUNCTION public.uboq_can_share_template_layout(text, text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_can_share_template_layout(text, text) FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_can_share_template_layout(text, text) TO oserp_compat_app;

CREATE OR REPLACE FUNCTION public.uboq_can_write_template_layout(
  p_project_id text,
  p_actor_id text,
  p_sharing_scope text
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
  IF p_project_id IS NULL
     OR p_actor_id IS NULL
     OR p_sharing_scope NOT IN ('PRIVATE', 'PROJECT_SHARED') THEN
    RETURN false;
  END IF;

  IF p_actor_id IS DISTINCT FROM NULLIF(current_setting('app.current_user_id', true), '') THEN
    RETURN false;
  END IF;

  IF public.uboq_check_tenant_rls(p_project_id) IS NOT TRUE THEN
    RETURN false;
  END IF;

  IF p_sharing_scope = 'PROJECT_SHARED' THEN
    RETURN public.uboq_can_share_template_layout(p_project_id, p_actor_id);
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
    'SUPER_ADMIN', 'SYSTEM_ADMIN', 'ADMIN', 'PRESIDENT', 'VP_OPERATIONS',
    'PROJECT_DIRECTOR', 'DIRECTORS', 'FINANCE_DIRECTOR', 'COMMERCIAL_DIRECTOR',
    'COST_CONTROL_MANAGER', 'CHIEF_ESTIMATOR', 'PROJECT_MANAGER',
    'OPERATIONS_MANAGER', 'FINANCE_MANAGER', 'ACCOUNTANT', 'BILLING_ENGINEER',
    'QS_ENGINEER', 'QUANTITY_SURVEYOR', 'COST_ENGINEER', 'ESTIMATOR',
    'PROJECT_ENGINEER', 'SITE_ENGINEER', 'PROCUREMENT_MANAGER',
    'PURCHASING_MANAGER', 'PROCUREMENT_OFFICER', 'PURCHASING_OFFICER'
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

  IF v_role IN ('SUPER_ADMIN', 'SYSTEM_ADMIN', 'PRESIDENT', 'VP_OPERATIONS')
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
       'SUPER_ADMIN', 'SYSTEM_ADMIN', 'ADMIN', 'PRESIDENT', 'VP_OPERATIONS',
       'PROJECT_DIRECTOR', 'DIRECTORS', 'FINANCE_DIRECTOR', 'COMMERCIAL_DIRECTOR',
       'COST_CONTROL_MANAGER', 'CHIEF_ESTIMATOR', 'PROJECT_MANAGER',
       'OPERATIONS_MANAGER', 'FINANCE_MANAGER', 'ACCOUNTANT', 'BILLING_ENGINEER',
       'QS_ENGINEER', 'QUANTITY_SURVEYOR', 'COST_ENGINEER', 'ESTIMATOR',
       'PROJECT_ENGINEER', 'SITE_ENGINEER', 'PROCUREMENT_MANAGER',
       'PURCHASING_MANAGER', 'PROCUREMENT_OFFICER', 'PURCHASING_OFFICER'
     ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;
ALTER FUNCTION public.uboq_can_write_template_layout(text, text, text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_can_write_template_layout(text, text, text) FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_can_write_template_layout(text, text, text) TO oserp_compat_app;

-- 3. Enable T0-T4 in UboqTemplateDefinition Guard Trigger with Exact Row-Grain Pairing
CREATE OR REPLACE FUNCTION public.uboq_guard_template_definition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_latest record;
  v_dup_src record;
BEGIN
  IF current_setting('app.synthetic_cleanup_authorized', true) = 'on'
     AND pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER') THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_DEFINITION_IMMUTABLE: Saved layout revisions cannot be modified or deleted; create a new version instead'
      USING ERRCODE = '42501';
  END IF;

  IF NEW."isSystemPreset" IS TRUE THEN
    IF pg_has_role(session_user, 'oserp_compat_app', 'MEMBER')
       OR pg_has_role(current_user, 'oserp_compat_app', 'MEMBER')
       OR pg_has_role(session_user, 'oserp_legacy_app', 'MEMBER')
       OR pg_has_role(current_user, 'oserp_legacy_app', 'MEMBER') THEN
      RAISE EXCEPTION 'UBOQ_SYSTEM_PRESET_WRITE_DENIED: Runtime roles cannot insert global system presets'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW."templateCode" NOT IN (
    'T0_MASTER_CONTRACT',
    'T1_PHASE_BOQ',
    'T2_CONSOLIDATED_BOQ',
    'T3_AGENCY_ESTIMATE',
    'T4_RESOURCE_TAKEOFF'
  ) THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_CODE_NOT_ENABLED: Saved layouts through WP-3 Batch A are restricted to T0_MASTER_CONTRACT through T4_RESOURCE_TAKEOFF (got %)',
      COALESCE(NEW."templateCode", 'NULL')
      USING ERRCODE = '22023';
  END IF;

  IF (NEW."templateCode" = 'T0_MASTER_CONTRACT' AND NEW."rowGrain" <> 'CONTRACT_HEADER')
     OR (NEW."templateCode" = 'T1_PHASE_BOQ' AND NEW."rowGrain" <> 'PHASE_BOQ_LINE')
     OR (NEW."templateCode" = 'T2_CONSOLIDATED_BOQ' AND NEW."rowGrain" <> 'CONSOLIDATED_WORK_ITEM')
     OR (NEW."templateCode" = 'T3_AGENCY_ESTIMATE' AND NEW."rowGrain" <> 'PHASE_BOQ_LINE')
     OR (NEW."templateCode" = 'T4_RESOURCE_TAKEOFF' AND NEW."rowGrain" <> 'CANONICAL_RESOURCE') THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_GRAIN_MISMATCH: Invalid rowGrain % for template %', NEW."rowGrain", NEW."templateCode"
      USING ERRCODE = '22023';
  END IF;

  IF NEW."formulaAstJson" IS NOT NULL OR NEW."groupingRulesJson" IS NOT NULL THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_UNSUPPORTED_CUSTOM_AST: Custom formula AST and grouping overrides are not enabled in Batch A'
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(NEW."selectedFieldsJson") <> 'array'
     OR jsonb_array_length(NEW."selectedFieldsJson") < 1 THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_FIELDS_REQUIRED: selectedFieldsJson must be a non-empty JSON array'
      USING ERRCODE = '22023';
  END IF;

  IF NEW."headingAliasesJson" IS NOT NULL AND jsonb_typeof(NEW."headingAliasesJson") <> 'object' THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_HEADINGS_INVALID: headingAliasesJson must be a JSON object when provided'
      USING ERRCODE = '22023';
  END IF;

  IF public.uboq_can_write_template_layout(NEW."projectId", NEW."createdById", NEW."sharingScope") IS NOT TRUE THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_WRITE_DENIED: Actor % is not authorized to save % layout on project %',
      NEW."createdById", NEW."sharingScope", NEW."projectId"
      USING ERRCODE = '42501';
  END IF;

  -- Serialize concurrent writes within the same (projectId, layoutGroupId)
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW."projectId" || ':' || NEW."layoutGroupId", 0));

  IF NEW."versionNumber" = 1 THEN
    IF EXISTS (
      SELECT 1
      FROM public."UboqTemplateDefinition"
      WHERE "projectId" = NEW."projectId"
        AND "layoutGroupId" = NEW."layoutGroupId"
    ) THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_GROUP_ALREADY_EXISTS: layoutGroupId % already exists on project %',
        NEW."layoutGroupId", NEW."projectId"
        USING ERRCODE = '23505';
    END IF;

    IF NEW."duplicatedFromId" IS NOT NULL THEN
      SELECT id, "projectId", "templateCode", "sharingScope", "createdById"
      INTO v_dup_src
      FROM public."UboqTemplateDefinition"
      WHERE "projectId" = NEW."projectId"
        AND id = NEW."duplicatedFromId";

      IF v_dup_src.id IS NULL THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_DUPLICATE_SOURCE_NOT_FOUND: Source layout % does not exist on project %',
          NEW."duplicatedFromId", NEW."projectId"
          USING ERRCODE = 'P0002';
      END IF;

      IF v_dup_src."templateCode" IS DISTINCT FROM NEW."templateCode" THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_DUPLICATE_CODE_MISMATCH: Cannot duplicate % layout as %',
          v_dup_src."templateCode", NEW."templateCode"
          USING ERRCODE = '22023';
      END IF;

      IF v_dup_src."sharingScope" <> 'PROJECT_SHARED'
         AND v_dup_src."createdById" IS DISTINCT FROM NEW."createdById" THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_DUPLICATE_PRIVATE_DENIED: Cannot duplicate another user''s private layout'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  ELSE
    SELECT id, "versionNumber", "templateCode", "sharingScope", "createdById"
    INTO v_latest
    FROM public."UboqTemplateDefinition"
    WHERE "projectId" = NEW."projectId"
      AND "layoutGroupId" = NEW."layoutGroupId"
    ORDER BY "versionNumber" DESC
    LIMIT 1;

    IF v_latest.id IS NULL THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_BASE_GROUP_NOT_FOUND: layoutGroupId % has no prior revision on project %',
        NEW."layoutGroupId", NEW."projectId"
        USING ERRCODE = 'P0002';
    END IF;

    IF v_latest.id IS DISTINCT FROM NEW."supersedesId"
       OR NEW."versionNumber" <> (v_latest."versionNumber" + 1) THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_VERSION_CONFLICT: New revision must supersede latest head % (v%) as v%',
        v_latest.id, v_latest."versionNumber", v_latest."versionNumber" + 1
        USING ERRCODE = '23505';
    END IF;

    IF v_latest."templateCode" IS DISTINCT FROM NEW."templateCode" THEN
      RAISE EXCEPTION 'UBOQ_TEMPLATE_CODE_IMMUTABLE_ACROSS_VERSIONS: Cannot change templateCode from % to %',
        v_latest."templateCode", NEW."templateCode"
        USING ERRCODE = '22023';
    END IF;

    IF v_latest."createdById" IS DISTINCT FROM NEW."createdById" THEN
      IF v_latest."sharingScope" <> 'PROJECT_SHARED' THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_PRIVATE_OWNERSHIP_DENIED: Cannot create a revision on another user''s private layout'
          USING ERRCODE = '42501';
      END IF;
      IF public.uboq_can_share_template_layout(NEW."projectId", NEW."createdById") IS NOT TRUE THEN
        RAISE EXCEPTION 'UBOQ_TEMPLATE_SHARED_REVISION_DENIED: Actor % lacks controlled sharing authority to version shared layout %',
          NEW."createdById", NEW."layoutGroupId"
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
ALTER FUNCTION public.uboq_guard_template_definition() OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_guard_template_definition() FROM PUBLIC;

-- 4. Align Formal Export Role Gate with COMMERCIAL_RESTRICTED_ROLES (Chief Estimator & Procurement)
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
    'COST_CONTROL_MANAGER', 'COMMERCIAL_DIRECTOR', 'CHIEF_ESTIMATOR',
    'PROJECT_MANAGER', 'QUANTITY_SURVEYOR', 'PROCUREMENT_MANAGER',
    'PROCUREMENT_OFFICER', 'ACCOUNTANT', 'BILLING_ENGINEER', 'OPERATIONS_MANAGER'
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
       'COST_CONTROL_MANAGER', 'COMMERCIAL_DIRECTOR', 'CHIEF_ESTIMATOR',
       'PROJECT_MANAGER', 'QUANTITY_SURVEYOR', 'PROCUREMENT_MANAGER',
       'PROCUREMENT_OFFICER', 'ACCOUNTANT', 'BILLING_ENGINEER', 'OPERATIONS_MANAGER'
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

-- 5. Extend UboqTemplateAuditEvent Guard Trigger for T4 Formal Compliance Exports
--    (while rejecting non-formal T2/T3 on FORMAL_EXPORT_GENERATED)
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
    IF NEW."templateCode" NOT IN ('T0_MASTER_CONTRACT', 'T1_PHASE_BOQ', 'T4_RESOURCE_TAKEOFF') THEN
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
       OR (NEW."templateCode" = 'T4_RESOURCE_TAKEOFF' AND NEW."contractCode" IS DISTINCT FROM 'ERP_CANONICAL_T4_FORMAL_V1') THEN
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

-- Re-assert least-privilege ACL on UboqTemplateAuditEvent
REVOKE INSERT, UPDATE, DELETE ON TABLE "UboqTemplateAuditEvent"
  FROM PUBLIC, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT SELECT ON TABLE "UboqTemplateAuditEvent" TO oserp_compat_app;
