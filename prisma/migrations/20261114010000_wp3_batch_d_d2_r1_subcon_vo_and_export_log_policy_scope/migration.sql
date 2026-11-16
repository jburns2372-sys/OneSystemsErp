-- ============================================================================
-- OSERP-PROJ-UBOQ-001 — WP-3 Batch D Phase D2 R1 Forward-Only Migration #36
-- SubcontractorVariationOrder & SensitiveExportLog PUBLIC Policy Scope Tightening
-- and Procedure-Only Synthetic Cleanup Token Enforcement
-- ============================================================================
-- Preserves Migrations #1–#35 byte-for-byte without modification.
-- 1. Replaces legacy TO PUBLIC restrictive policy rls_restrictive_tenant_scope on
--    SubcontractorVariationOrder with TO oserp_compat_app (matching ClientVariationOrder
--    and AIVariationOrderValidation), so oserp_maint_cleanup_role evaluates its
--    dedicated rls_permissive_maint_cleanup + rls_restrictive_maint_cleanup_scope
--    policies cleanly without invoking app-only helper functions.
-- 2. Scopes rls_permissive_sensitive_export_log_select on SensitiveExportLog from
--    TO PUBLIC to TO oserp_compat_app so oserp_maint_cleanup_role cannot bypass
--    cleanup authorization on SELECT of SensitiveExportLog either.
-- 3. Revokes direct EXECUTE on uboq_authorize_verified_synthetic_cleanup_tx(text, text)
--    from oserp_maint_cleanup_role so cleanup proofs are minted exclusively inside
--    uboq_execute_verified_synthetic_cleanup(text, text).
-- ============================================================================

DROP POLICY IF EXISTS rls_restrictive_tenant_scope ON public."SubcontractorVariationOrder";
CREATE POLICY rls_restrictive_tenant_scope
  ON public."SubcontractorVariationOrder"
  AS RESTRICTIVE
  FOR ALL
  TO oserp_compat_app
  USING (
    public.uboq_check_tenant_rls(
      public.uboq_resolve_subcontractor_vo_project("projectId", "originalSubcontractId")
    )
  )
  WITH CHECK (
    public.uboq_check_tenant_rls(
      public.uboq_resolve_subcontractor_vo_project("projectId", "originalSubcontractId")
    )
  );

DROP POLICY IF EXISTS rls_permissive_sensitive_export_log_select ON public."SensitiveExportLog";
CREATE POLICY rls_permissive_sensitive_export_log_select
  ON public."SensitiveExportLog"
  AS PERMISSIVE
  FOR SELECT
  TO oserp_compat_app
  USING (true);

REVOKE ALL ON FUNCTION public.uboq_authorize_verified_synthetic_cleanup_tx(text, text)
  FROM PUBLIC, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role;

GRANT EXECUTE ON FUNCTION public.uboq_authorize_verified_synthetic_cleanup_tx(text, text)
  TO oserp_migrations_owner;
