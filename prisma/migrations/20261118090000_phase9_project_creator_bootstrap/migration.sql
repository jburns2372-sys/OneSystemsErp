-- Phase 9 only: bounded atomic project/creator bootstrap. No runtime table grants,
-- role changes, policy changes, existing assignments or financial baseline writes.
-- Requires the EXISTING trusted command owner; do not repair ownership here.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'oserp_migrations_owner'
                 AND NOT rolcanlogin AND NOT rolsuper AND rolbypassrls)
     OR pg_has_role('oserp_compat_app', 'oserp_migrations_owner', 'MEMBER') THEN
    RAISE EXCEPTION 'Phase 9 requires independently verified command ownership';
  END IF;
END $$;

GRANT SELECT ON public."User", public."Role", public."RolePermission"
  TO oserp_migrations_owner;
-- PostgreSQL requires UPDATE privilege for row-lock clauses; the command
-- never updates these IDs. This grant is confined to the existing NOLOGIN owner.
GRANT UPDATE (id) ON public."User", public."Role", public."RolePermission"
  TO oserp_migrations_owner;
GRANT INSERT (id, name, client, location, "contractNumber", "projectCategory",
              description, status, "contractAmount", "uboqGovernanceEnabled", "updatedAt")
  ON public."Project" TO oserp_migrations_owner;
GRANT INSERT (id, "projectId", "userId", "projectRole", "accessLevel", "assignedBy",
              "assignmentStatus", "updatedAt")
  ON public."ProjectUserAssignment" TO oserp_migrations_owner;

CREATE FUNCTION public.phase9_create_project_profile(
  p_project text, p_name text, p_client text, p_location text,
  p_contract_number text, p_sector text, p_description text
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_actor text := NULLIF(current_setting('app.current_user_id', true), '');
  v_version text := NULLIF(current_setting('app.current_session_version', true), '');
  v_role text;
BEGIN
  -- session_user is the login even inside SECURITY DEFINER. Neither a caller
  -- supplied role nor mutable GUCs alone confer authority.
  IF NOT pg_has_role(session_user, 'oserp_compat_app', 'MEMBER')
     OR pg_has_role(session_user, 'oserp_legacy_app', 'MEMBER')
     OR p_project IS NULL OR p_project = ''
     OR p_project IS DISTINCT FROM NULLIF(current_setting('app.current_project_id', true), '')
     OR public.uboq_verify_signed_rls_proof(p_project, v_actor, v_version,
          NULLIF(current_setting('app.current_rls_proof', true), '')) IS NOT TRUE THEN
    RAISE EXCEPTION 'Project bootstrap requires signed creator context' USING ERRCODE = '42501';
  END IF;

  -- Lock authoritative rows until commit: concurrent revocation cannot race
  -- a successful bootstrap. No dependency on a pre-existing project assignment.
  SELECT u.role INTO v_role FROM public."User" u
    WHERE u.id = v_actor AND u.status = 'ACTIVE'
      AND u."sessionVersion"::text = v_version
      AND NOT COALESCE(u."mustChangePassword", false)
      AND (u."lockedUntil" IS NULL OR u."lockedUntil" <= now())
    FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project creator session is no longer operational' USING ERRCODE = '42501';
  END IF;
  PERFORM rp.id FROM public."RolePermission" rp
    JOIN public."Role" r ON r.id = rp."roleId"
    WHERE r."roleCode" = v_role AND r."isActive"
      AND rp."moduleName" = 'PROJECT_MANAGEMENT' AND rp."canCreate"
    FOR SHARE OF rp, r;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project creator lacks create permission' USING ERRCODE = '42501';
  END IF;

  IF p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 3 AND 180
     OR p_sector IS NULL OR p_sector NOT IN ('GOVERNMENT', 'CORPORATE', 'PRIVATE')
     OR char_length(p_client) > 250 OR char_length(p_location) > 250
     OR char_length(p_contract_number) > 250 OR char_length(p_description) > 2000 THEN
    RAISE EXCEPTION 'Invalid project profile' USING ERRCODE = '22023';
  END IF;

  -- A plain INSERT intentionally rejects existing project IDs/replays. Never
  -- attach the caller to an existing workspace or accept an assignment target.
  INSERT INTO public."Project" (id, name, client, location, "contractNumber",
    "projectCategory", description, status, "contractAmount", "uboqGovernanceEnabled", "updatedAt")
  VALUES (p_project, btrim(p_name), p_client, p_location, p_contract_number,
    p_sector, p_description, 'PLANNING', 0, false, now());
  INSERT INTO public."ProjectUserAssignment" (id, "projectId", "userId", "projectRole",
    "accessLevel", "assignedBy", "assignmentStatus", "updatedAt")
  VALUES (pg_catalog.gen_random_uuid()::text, p_project, v_actor, v_role,
    'FULL', v_actor, 'active', now());
  RETURN p_project;
END;
$$;
ALTER FUNCTION public.phase9_create_project_profile(text,text,text,text,text,text,text)
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.phase9_create_project_profile(text,text,text,text,text,text,text)
  FROM PUBLIC, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT EXECUTE ON FUNCTION public.phase9_create_project_profile(text,text,text,text,text,text,text)
  TO oserp_compat_app;
