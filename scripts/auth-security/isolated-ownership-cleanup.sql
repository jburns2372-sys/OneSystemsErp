-- Included by isolated-ownership-bootstrap.psql, INSIDE its transaction, after
-- RESET ROLE. Administrator must be authorized to revoke each recorded grantor's
-- membership. RESTRICT deliberately fails rather than cascading unrelated grants.
DO $cleanup$
DECLARE g record;
BEGIN
  IF current_database()<>'oserp_uboq_preview'
     OR current_setting('neon.project_id',true) IS DISTINCT FROM 'long-recipe-20782583'
     OR current_setting('neon.branch_id',true) IS DISTINCT FROM 'br-shy-thunder-bchgx7m8'
     OR current_setting('neon.endpoint_id',true) IS DISTINCT FROM 'ep-dry-meadow-bc7x6os3'
     OR current_user<>session_user OR session_user='neondb_owner'
  THEN RAISE EXCEPTION 'ISOLATED_ADMIN_CLEANUP_REQUIRED'; END IF;
  FOR g IN
    SELECT r.rolname, grantor.rolname AS grantor
    FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid
    JOIN pg_roles member ON member.oid=m.member
    JOIN pg_roles grantor ON grantor.oid=m.grantor
    WHERE member.rolname='neondb_owner' AND r.rolname IN
      ('oserp_auth_owner','oserp_preview_auth_service','oserp_preview_delivery_service',
       'oserp_preview_migrate_admin')
    -- Remove self-issued dependent grants before creator/admin grants; remove
    -- the table-owner membership last. Capture actual grantors, including the
    -- bootstrap grantor used automatically for roles created by CREATEROLE.
    ORDER BY (r.rolname='oserp_preview_migrate_admin'),r.rolname,
             (grantor.rolname='neondb_owner') DESC,grantor.rolname
  LOOP
    EXECUTE format('REVOKE %I FROM neondb_owner GRANTED BY %I RESTRICT',g.rolname,g.grantor);
  END LOOP;
  IF pg_has_role('neondb_owner','oserp_preview_migrate_admin','MEMBER')
     OR pg_has_role('neondb_owner','oserp_auth_owner','MEMBER')
     OR pg_has_role('neondb_owner','oserp_preview_auth_service','MEMBER')
     OR pg_has_role('neondb_owner','oserp_preview_delivery_service','MEMBER')
  THEN RAISE EXCEPTION 'TEMPORARY_MEMBERSHIP_CLEANUP_INCOMPLETE'; END IF;
END $cleanup$;
