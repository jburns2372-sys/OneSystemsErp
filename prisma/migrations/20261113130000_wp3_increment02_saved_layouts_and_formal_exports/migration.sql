-- ============================================================================
-- OSERP-PROJ-UBOQ-001 — WP-3 INCREMENT 02 (#24, FORWARD-ONLY)
-- Persistent Project-Scoped Saved Layouts (T0/T1), Controlled Sharing,
-- Immutable Revision Lineage, and Project-Scoped Template Audit Provenance.
-- Migrations #1-#23 remain byte-for-byte unchanged.
-- ============================================================================

-- 1. Extend UboqTemplateDefinition with immutable revision lineage & controlled sharing
ALTER TABLE "UboqTemplateDefinition"
  ADD COLUMN IF NOT EXISTS "layoutGroupId" TEXT,
  ADD COLUMN IF NOT EXISTS "supersedesId" TEXT,
  ADD COLUMN IF NOT EXISTS "duplicatedFromId" TEXT,
  ADD COLUMN IF NOT EXISTS "sharingScope" TEXT NOT NULL DEFAULT 'PRIVATE',
  ADD COLUMN IF NOT EXISTS "definitionHash" TEXT,
  ADD COLUMN IF NOT EXISTS "changeSummary" TEXT;

-- Normalize any pre-existing rows prior to adding strict CHECK constraints
UPDATE "UboqTemplateDefinition"
SET "sharingScope" = 'SYSTEM_PRESET'
WHERE "isSystemPreset" = true
  AND "sharingScope" <> 'SYSTEM_PRESET';

UPDATE "UboqTemplateDefinition"
SET
  "layoutGroupId" = COALESCE("layoutGroupId", id),
  "sharingScope" = CASE
    WHEN "sharingScope" IN ('PRIVATE', 'PROJECT_SHARED') THEN "sharingScope"
    ELSE 'PRIVATE'
  END,
  "definitionHash" = COALESCE(
    "definitionHash",
    encode(
      sha256(
        convert_to(
          jsonb_build_object(
            'templateCode', "templateCode",
            'rowGrain', "rowGrain",
            'selectedFieldsJson', "selectedFieldsJson",
            'headingAliasesJson', COALESCE("headingAliasesJson", '{}'::jsonb)
          )::text,
          'UTF8'
        )
      ),
      'hex'
    )
  )
WHERE "isSystemPreset" = false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_uboq_tpl_preset_project_scope'
  ) THEN
    ALTER TABLE "UboqTemplateDefinition"
      ADD CONSTRAINT chk_uboq_tpl_preset_project_scope CHECK (
        (
          "isSystemPreset" = true
          AND "projectId" IS NULL
          AND "sharingScope" = 'SYSTEM_PRESET'
        )
        OR (
          "isSystemPreset" = false
          AND "projectId" IS NOT NULL
          AND "createdById" IS NOT NULL
          AND "layoutGroupId" IS NOT NULL
          AND char_length(btrim("layoutGroupId")) BETWEEN 1 AND 160
          AND "sharingScope" IN ('PRIVATE', 'PROJECT_SHARED')
          AND "definitionHash" ~ '^[0-9a-f]{64}$'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_uboq_tpl_version_lineage'
  ) THEN
    ALTER TABLE "UboqTemplateDefinition"
      ADD CONSTRAINT chk_uboq_tpl_version_lineage CHECK (
        ("versionNumber" = 1 AND "supersedesId" IS NULL)
        OR ("versionNumber" > 1 AND "supersedesId" IS NOT NULL AND "duplicatedFromId" IS NULL)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_uboq_tpl_name_and_summary'
  ) THEN
    ALTER TABLE "UboqTemplateDefinition"
      ADD CONSTRAINT chk_uboq_tpl_name_and_summary CHECK (
        char_length(btrim("templateName")) BETWEEN 1 AND 120
        AND ("changeSummary" IS NULL OR char_length("changeSummary") <= 240)
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "UboqTemplateDefinition_projectId_id_key"
  ON "UboqTemplateDefinition"("projectId", "id");

CREATE UNIQUE INDEX IF NOT EXISTS "UboqTemplateDefinition_projectId_layoutGroupId_versionNumbe_key"
  ON "UboqTemplateDefinition"("projectId", "layoutGroupId", "versionNumber");

CREATE INDEX IF NOT EXISTS "UboqTemplateDefinition_projectId_templateCode_layoutGroupId_idx"
  ON "UboqTemplateDefinition"("projectId", "templateCode", "layoutGroupId", "versionNumber" DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UboqTemplateDefinition_projectId_supersedesId_fkey'
  ) THEN
    ALTER TABLE "UboqTemplateDefinition"
      ADD CONSTRAINT "UboqTemplateDefinition_projectId_supersedesId_fkey"
      FOREIGN KEY ("projectId", "supersedesId")
      REFERENCES "UboqTemplateDefinition"("projectId", "id")
      ON DELETE CASCADE ON UPDATE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UboqTemplateDefinition_projectId_duplicatedFromId_fkey'
  ) THEN
    ALTER TABLE "UboqTemplateDefinition"
      ADD CONSTRAINT "UboqTemplateDefinition_projectId_duplicatedFromId_fkey"
      FOREIGN KEY ("projectId", "duplicatedFromId")
      REFERENCES "UboqTemplateDefinition"("projectId", "id")
      ON DELETE CASCADE ON UPDATE RESTRICT;
  END IF;
END $$;

-- 2. Controlled Sharing & Saved Layout Write/Read Authorization Functions
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
    'PROJECT_DIRECTOR', 'DIRECTORS', 'PROJECT_MANAGER', 'OPERATIONS_MANAGER',
    'FINANCE_MANAGER', 'QS_ENGINEER', 'QUANTITY_SURVEYOR', 'COST_ENGINEER'
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

  IF v_access IN ('VIEWER', 'VIEW_ONLY', 'READ_ONLY', 'OBSERVER', 'GUEST')
     OR v_proj_role IN ('VIEWER', 'VIEW_ONLY', 'READ_ONLY', 'OBSERVER', 'GUEST') THEN
    RETURN false;
  END IF;

  IF v_proj_role NOT IN ('', 'MEMBER', 'STANDARD', 'FULL')
     AND v_proj_role NOT IN (
       'SUPER_ADMIN', 'SYSTEM_ADMIN', 'ADMIN', 'PRESIDENT', 'VP_OPERATIONS',
       'PROJECT_DIRECTOR', 'DIRECTORS', 'PROJECT_MANAGER', 'OPERATIONS_MANAGER',
       'FINANCE_MANAGER', 'QS_ENGINEER', 'QUANTITY_SURVEYOR', 'COST_ENGINEER'
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
    'PROJECT_DIRECTOR', 'DIRECTORS', 'PROJECT_MANAGER', 'OPERATIONS_MANAGER',
    'FINANCE_MANAGER', 'QS_ENGINEER', 'QUANTITY_SURVEYOR', 'COST_ENGINEER',
    'ESTIMATOR', 'PROJECT_ENGINEER', 'SITE_ENGINEER', 'PURCHASING_MANAGER',
    'PURCHASING_OFFICER'
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

  IF v_access IN ('VIEWER', 'VIEW_ONLY', 'READ_ONLY', 'OBSERVER', 'GUEST')
     OR v_proj_role IN ('VIEWER', 'VIEW_ONLY', 'READ_ONLY', 'OBSERVER', 'GUEST') THEN
    RETURN false;
  END IF;

  IF v_proj_role NOT IN ('', 'MEMBER', 'STANDARD', 'FULL')
     AND v_proj_role NOT IN (
       'SUPER_ADMIN', 'SYSTEM_ADMIN', 'ADMIN', 'PRESIDENT', 'VP_OPERATIONS',
       'PROJECT_DIRECTOR', 'DIRECTORS', 'PROJECT_MANAGER', 'OPERATIONS_MANAGER',
       'FINANCE_MANAGER', 'QS_ENGINEER', 'QUANTITY_SURVEYOR', 'COST_ENGINEER',
       'ESTIMATOR', 'PROJECT_ENGINEER', 'SITE_ENGINEER', 'PURCHASING_MANAGER',
       'PURCHASING_OFFICER'
     ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;
ALTER FUNCTION public.uboq_can_write_template_layout(text, text, text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_can_write_template_layout(text, text, text) FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_can_write_template_layout(text, text, text) TO oserp_compat_app;

CREATE OR REPLACE FUNCTION public.uboq_can_read_template_layout(
  p_project_id text,
  p_is_system_preset boolean,
  p_sharing_scope text,
  p_created_by_id text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF p_is_system_preset IS TRUE AND p_project_id IS NULL THEN
    RETURN true;
  END IF;

  IF pg_has_role(session_user, 'oserp_legacy_app', 'MEMBER')
     OR pg_has_role(current_user, 'oserp_legacy_app', 'MEMBER') THEN
    RETURN false;
  END IF;

  IF pg_has_role(session_user, 'oserp_compat_app', 'MEMBER')
     OR pg_has_role(current_user, 'oserp_compat_app', 'MEMBER')
     OR COALESCE(current_setting('app.enforce_project_rls', true), 'off') = 'on' THEN
    RETURN (
      p_project_id IS NOT NULL
      AND public.uboq_check_tenant_rls(p_project_id)
      AND (
        p_sharing_scope = 'PROJECT_SHARED'
        OR p_created_by_id = NULLIF(current_setting('app.current_user_id', true), '')
      )
    );
  END IF;

  RETURN true;
END;
$$;
ALTER FUNCTION public.uboq_can_read_template_layout(text, boolean, text, text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_can_read_template_layout(text, boolean, text, text) FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_can_read_template_layout(text, boolean, text, text) TO oserp_compat_app;

-- 3. Immutable Revision Lineage Trigger & Least-Privilege Grants on UboqTemplateDefinition
REVOKE UPDATE, DELETE ON TABLE "UboqTemplateDefinition" FROM PUBLIC, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT SELECT, INSERT ON TABLE "UboqTemplateDefinition" TO oserp_compat_app;

ALTER TABLE "UboqTemplateDefinition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UboqTemplateDefinition" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rls_restrictive_uboq_tpl_tenant ON "UboqTemplateDefinition";
CREATE POLICY rls_restrictive_uboq_tpl_tenant ON "UboqTemplateDefinition"
  AS RESTRICTIVE FOR ALL TO PUBLIC
  USING (
    public.uboq_can_read_template_layout("projectId", "isSystemPreset", "sharingScope", "createdById")
  )
  WITH CHECK (
    "isSystemPreset" = false
    AND "projectId" IS NOT NULL
    AND "createdById" = NULLIF(current_setting('app.current_user_id', true), '')
    AND public.uboq_can_write_template_layout("projectId", "createdById", "sharingScope")
  );

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

  IF NEW."templateCode" NOT IN ('T0_MASTER_CONTRACT', 'T1_PHASE_BOQ') THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_CODE_NOT_ENABLED: Saved layouts in WP-3 Increment 02 are restricted to T0_MASTER_CONTRACT and T1_PHASE_BOQ'
      USING ERRCODE = '22023';
  END IF;

  IF (NEW."templateCode" = 'T0_MASTER_CONTRACT' AND NEW."rowGrain" <> 'CONTRACT_HEADER')
     OR (NEW."templateCode" = 'T1_PHASE_BOQ' AND NEW."rowGrain" <> 'PHASE_BOQ_LINE') THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_GRAIN_MISMATCH: Invalid rowGrain % for template %', NEW."rowGrain", NEW."templateCode"
      USING ERRCODE = '22023';
  END IF;

  IF NEW."formulaAstJson" IS NOT NULL OR NEW."groupingRulesJson" IS NOT NULL THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_UNSUPPORTED_CUSTOM_AST: Custom formula AST and grouping overrides are not enabled in Increment 02'
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

DROP TRIGGER IF EXISTS trg_uboq_template_definition_guard ON "UboqTemplateDefinition";
CREATE TRIGGER trg_uboq_template_definition_guard
  BEFORE INSERT OR UPDATE OR DELETE ON "UboqTemplateDefinition"
  FOR EACH ROW EXECUTE FUNCTION public.uboq_guard_template_definition();

-- 4. Project-Scoped Append-Only Template & Formal Export Audit Provenance Table
-- Note: Uses trigger-enforced project/layout referential integrity (mirroring SensitiveExportLog)
-- so frozen migration #17 uboq_recursive_cleanup_closure remains 100% compatible without altering #17.
CREATE TABLE IF NOT EXISTS "UboqTemplateAuditEvent" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "layoutGroupId" TEXT,
  "layoutDefinitionId" TEXT,
  "layoutVersionNumber" INTEGER,
  "layoutOwnerId" TEXT,
  "sharingScope" TEXT NOT NULL DEFAULT 'PRIVATE',
  "templateCode" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "actorRole" TEXT NOT NULL,
  "sourceId" TEXT,
  "sourceVersion" TEXT,
  "contractCode" TEXT,
  "exportFormat" TEXT,
  "outputSha256" TEXT,
  "detailsJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UboqTemplateAuditEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chk_uboq_tpl_audit_event_type" CHECK (
    "eventType" IN (
      'LAYOUT_CREATED',
      'LAYOUT_VERSIONED',
      'LAYOUT_DUPLICATED',
      'FORMAL_EXPORT_GENERATED'
    )
  ),
  CONSTRAINT "chk_uboq_tpl_audit_sharing_scope" CHECK (
    "sharingScope" IN ('PRIVATE', 'PROJECT_SHARED', 'SYSTEM_FORMAL_PRESET')
  ),
  CONSTRAINT "chk_uboq_tpl_audit_template_code" CHECK (
    "templateCode" IN ('T0_MASTER_CONTRACT', 'T1_PHASE_BOQ')
  ),
  CONSTRAINT "chk_uboq_tpl_audit_export_fields" CHECK (
    (
      "eventType" = 'FORMAL_EXPORT_GENERATED'
      AND "sourceId" IS NOT NULL
      AND "contractCode" IS NOT NULL
      AND "exportFormat" IN ('json', 'xlsx', 'csv')
      AND "outputSha256" ~ '^[0-9a-f]{64}$'
    )
    OR (
      "eventType" IN ('LAYOUT_CREATED', 'LAYOUT_VERSIONED', 'LAYOUT_DUPLICATED')
      AND "layoutGroupId" IS NOT NULL
      AND "layoutDefinitionId" IS NOT NULL
      AND "layoutVersionNumber" IS NOT NULL
      AND "layoutVersionNumber" >= 1
    )
  )
);

CREATE INDEX IF NOT EXISTS "UboqTemplateAuditEvent_projectId_createdAt_idx"
  ON "UboqTemplateAuditEvent"("projectId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "UboqTemplateAuditEvent_projectId_layoutGroupId_createdAt_idx"
  ON "UboqTemplateAuditEvent"("projectId", "layoutGroupId", "createdAt" DESC);

ALTER TABLE "UboqTemplateAuditEvent" OWNER TO oserp_migrations_owner;
REVOKE ALL ON TABLE "UboqTemplateAuditEvent" FROM PUBLIC, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT SELECT, INSERT ON TABLE "UboqTemplateAuditEvent" TO oserp_compat_app;

ALTER TABLE "UboqTemplateAuditEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UboqTemplateAuditEvent" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rls_deny_legacy_on_uboq_tpl_audit ON "UboqTemplateAuditEvent";
CREATE POLICY rls_deny_legacy_on_uboq_tpl_audit ON "UboqTemplateAuditEvent"
  AS RESTRICTIVE FOR ALL TO oserp_legacy_app
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS rls_permissive_uboq_tpl_audit_access ON "UboqTemplateAuditEvent";
CREATE POLICY rls_permissive_uboq_tpl_audit_access ON "UboqTemplateAuditEvent"
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.uboq_can_read_template_audit(
  p_project_id text,
  p_sharing_scope text,
  p_actor_user_id text,
  p_layout_owner_id text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF pg_has_role(session_user, 'oserp_legacy_app', 'MEMBER')
     OR pg_has_role(current_user, 'oserp_legacy_app', 'MEMBER') THEN
    RETURN false;
  END IF;

  IF pg_has_role(session_user, 'oserp_compat_app', 'MEMBER')
     OR pg_has_role(current_user, 'oserp_compat_app', 'MEMBER')
     OR COALESCE(current_setting('app.enforce_project_rls', true), 'off') = 'on' THEN
    RETURN (
      p_project_id IS NOT NULL
      AND public.uboq_check_tenant_rls(p_project_id)
      AND (
        p_sharing_scope IN ('PROJECT_SHARED', 'SYSTEM_FORMAL_PRESET')
        OR p_actor_user_id = NULLIF(current_setting('app.current_user_id', true), '')
        OR p_layout_owner_id = NULLIF(current_setting('app.current_user_id', true), '')
      )
    );
  END IF;

  RETURN true;
END;
$$;
ALTER FUNCTION public.uboq_can_read_template_audit(text, text, text, text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_can_read_template_audit(text, text, text, text) FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_can_read_template_audit(text, text, text, text) TO oserp_compat_app;

DROP POLICY IF EXISTS rls_restrictive_uboq_tpl_audit_tenant ON "UboqTemplateAuditEvent";
CREATE POLICY rls_restrictive_uboq_tpl_audit_tenant ON "UboqTemplateAuditEvent"
  AS RESTRICTIVE FOR ALL TO PUBLIC
  USING (
    public.uboq_can_read_template_audit("projectId", "sharingScope", "actorUserId", "layoutOwnerId")
  )
  WITH CHECK (
    "projectId" IS NOT NULL
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
  v_tpl record;
BEGIN
  IF current_setting('app.synthetic_cleanup_authorized', true) = 'on'
     AND pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER') THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    RAISE EXCEPTION 'UBOQ_TEMPLATE_AUDIT_IMMUTABLE: Template audit provenance records are append-only'
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

  IF NEW."layoutDefinitionId" IS NOT NULL THEN
    SELECT id, "projectId", "layoutGroupId", "versionNumber", "templateCode", "createdById", "sharingScope"
    INTO v_tpl
    FROM public."UboqTemplateDefinition"
    WHERE "projectId" = NEW."projectId"
      AND id = NEW."layoutDefinitionId";

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

    NEW."layoutOwnerId" := v_tpl."createdById";
    NEW."sharingScope" := v_tpl."sharingScope";
  END IF;

  RETURN NEW;
END;
$$;
ALTER FUNCTION public.uboq_guard_template_audit_event() OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_guard_template_audit_event() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_uboq_template_audit_event_guard ON "UboqTemplateAuditEvent";
CREATE TRIGGER trg_uboq_template_audit_event_guard
  BEFORE INSERT OR UPDATE OR DELETE ON "UboqTemplateAuditEvent"
  FOR EACH ROW EXECUTE FUNCTION public.uboq_guard_template_audit_event();

CREATE OR REPLACE FUNCTION public.uboq_cleanup_project_template_audit_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF current_setting('app.synthetic_cleanup_authorized', true) = 'on'
     AND pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER') THEN
    DELETE FROM public."UboqTemplateAuditEvent" WHERE "projectId" = OLD.id;
  END IF;
  RETURN OLD;
END;
$$;
ALTER FUNCTION public.uboq_cleanup_project_template_audit_events() OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_cleanup_project_template_audit_events() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_uboq_project_cleanup_template_audit ON "Project";
CREATE TRIGGER trg_uboq_project_cleanup_template_audit
  AFTER DELETE ON "Project"
  FOR EACH ROW EXECUTE FUNCTION public.uboq_cleanup_project_template_audit_events();
