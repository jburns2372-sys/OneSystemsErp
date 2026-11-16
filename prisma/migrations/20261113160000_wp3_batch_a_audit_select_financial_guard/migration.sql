-- ============================================================================
-- OSERP-PROJ-UBOQ-001 — WP-3 BATCH A TARGETED REVIEW REMEDIATION (MIGRATION #27)
-- Remediates WP3-BA-IR-01 via forward-only SQL hardening (Migrations #1-#26 untouched):
--   1. Hardens PostgreSQL SELECT RLS on public."UboqTemplateAuditEvent" via
--      event-aware public.uboq_can_read_template_audit_event(...) so non-financial
--      project roles (e.g., SITE_ENGINEER, PROJECT_ENGINEER, WAREHOUSEMAN,
--      EXTERNAL_VIEWER, and VIEWER/READ_ONLY project assignments) cannot SELECT
--      FORMAL_EXPORT_GENERATED or SYSTEM_FORMAL_PRESET audit rows containing
--      financial totals in detailsJson.
--   2. Protects PROJECT_SHARED, SYSTEM_FORMAL_PRESET, and PRIVATE formal-export
--      audit provenance rows behind active public.uboq_can_formal_export_template(...)
--      entitlement + cryptographically bound project RLS context.
--   3. Preserves authorized Finance/Commercial/Procurement/QS/Executive provenance
--      reads, non-formal layout lifecycle audit visibility, and append-only
--      audit immutability.
-- ============================================================================

-- 1. Event-aware audit SELECT authorization predicate
CREATE OR REPLACE FUNCTION public.uboq_can_read_template_audit_event(
  p_project_id text,
  p_event_type text,
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
DECLARE
  v_current_user_id text;
BEGIN
  IF pg_has_role(session_user, 'oserp_legacy_app', 'MEMBER')
     OR pg_has_role(current_user, 'oserp_legacy_app', 'MEMBER') THEN
    RETURN false;
  END IF;

  IF pg_has_role(session_user, 'oserp_compat_app', 'MEMBER')
     OR pg_has_role(current_user, 'oserp_compat_app', 'MEMBER')
     OR COALESCE(current_setting('app.enforce_project_rls', true), 'off') = 'on' THEN
    v_current_user_id := NULLIF(current_setting('app.current_user_id', true), '');
    IF p_project_id IS NULL OR v_current_user_id IS NULL THEN
      RETURN false;
    END IF;

    IF public.uboq_check_tenant_rls(p_project_id) IS NOT TRUE THEN
      RETURN false;
    END IF;

    -- Financially sensitive formal-export provenance (PROJECT_SHARED, SYSTEM_FORMAL_PRESET, and PRIVATE):
    -- strictly require active commercial/finance entitlement on the project via uboq_can_formal_export_template.
    IF UPPER(COALESCE(p_event_type, '')) = 'FORMAL_EXPORT_GENERATED'
       OR UPPER(COALESCE(p_sharing_scope, '')) = 'SYSTEM_FORMAL_PRESET' THEN
      IF public.uboq_can_formal_export_template(p_project_id, v_current_user_id) IS NOT TRUE THEN
        RETURN false;
      END IF;

      RETURN (
        p_sharing_scope IN ('PROJECT_SHARED', 'SYSTEM_FORMAL_PRESET')
        OR p_actor_user_id = v_current_user_id
        OR p_layout_owner_id = v_current_user_id
      );
    END IF;

    -- Non-formal layout lifecycle provenance (LAYOUT_CREATED, LAYOUT_VERSIONED, LAYOUT_DUPLICATED)
    RETURN (
      p_sharing_scope = 'PROJECT_SHARED'
      OR p_actor_user_id = v_current_user_id
      OR p_layout_owner_id = v_current_user_id
    );
  END IF;

  RETURN true;
END;
$$;

ALTER FUNCTION public.uboq_can_read_template_audit_event(text, text, text, text, text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_can_read_template_audit_event(text, text, text, text, text)
  FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_can_read_template_audit_event(text, text, text, text, text)
  TO oserp_compat_app;

-- 2. Harden legacy 4-arg helper so direct SQL calls on SYSTEM_FORMAL_PRESET also enforce financial role gating
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
  RETURN public.uboq_can_read_template_audit_event(
    p_project_id,
    CASE
      WHEN UPPER(COALESCE(p_sharing_scope, '')) = 'SYSTEM_FORMAL_PRESET'
      THEN 'FORMAL_EXPORT_GENERATED'
      ELSE 'LAYOUT_CREATED'
    END,
    p_sharing_scope,
    p_actor_user_id,
    p_layout_owner_id
  );
END;
$$;

ALTER FUNCTION public.uboq_can_read_template_audit(text, text, text, text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_can_read_template_audit(text, text, text, text)
  FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.uboq_can_read_template_audit(text, text, text, text)
  TO oserp_compat_app;

-- 3. Upgrade restrictive RLS policy on UboqTemplateAuditEvent to enforce event-type financial SELECT gating
ALTER TABLE public."UboqTemplateAuditEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UboqTemplateAuditEvent" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rls_restrictive_uboq_tpl_audit_tenant ON public."UboqTemplateAuditEvent";
CREATE POLICY rls_restrictive_uboq_tpl_audit_tenant ON public."UboqTemplateAuditEvent"
  AS RESTRICTIVE FOR ALL TO PUBLIC
  USING (
    public.uboq_can_read_template_audit_event(
      "projectId",
      "eventType",
      "sharingScope",
      "actorUserId",
      "layoutOwnerId"
    )
  )
  WITH CHECK (
    current_setting('app.uboq_audit_fn_active', true) = 'on'
    AND "projectId" IS NOT NULL
    AND "actorUserId" = NULLIF(current_setting('app.current_user_id', true), '')
    AND public.uboq_check_tenant_rls("projectId")
  );

-- 4. Re-assert least-privilege ACLs on UboqTemplateAuditEvent (direct INSERT/UPDATE/DELETE prohibited)
REVOKE ALL ON TABLE public."UboqTemplateAuditEvent"
  FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public."UboqTemplateAuditEvent"
  FROM oserp_compat_app;
GRANT SELECT ON TABLE public."UboqTemplateAuditEvent" TO oserp_compat_app;
