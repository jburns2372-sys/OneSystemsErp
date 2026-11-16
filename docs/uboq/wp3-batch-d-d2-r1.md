# WP-3 Batch D Phase D2 R1 — Independent Review Remediation (`D2-IR-01`..`D2-IR-05`)

- **Project**: `OSERP-PROJ-UBOQ-001`
- **Branch / HEAD**: `release/oserp-proj-uboq-001` (`79a2c5bd3853711cf4960c5d45cff755aaf219d2`)
- **Isolated Local Database**: `127.0.0.1:55483` (`oserp_h02b_local_e5e20dc14c`, PostgreSQL 18)
- **Prior Review Reference**: `OSERP_WP3_BatchD_D2_Independent_Review_2026-11-15.md` (`CHANGES REQUIRED — NOT YET ACCEPTED`)
- **Governance Posture**: **STOPPED AT PHASE D2 R1 INDEPENDENT REVIEW** (`independent_acceptance_claimed: false`)

---

## 1. Forward-Only Migrations Applied (`#1`–`#34` Byte-Identical)

Applied historical migrations `#1` through `#34` (including Migration `#34` `ca25baee3da255c9cf624f38ceb8ddbda6358f5f2a7990946b384836a9d8a359`) and all 8 prior gate archives were preserved 100% byte-identical. Two forward-only SQL migrations were applied and verified on `oserp_h02b_local_e5e20dc14c`:

1. **Migration `#35`** (`prisma/migrations/20261114000000_wp3_batch_d_d2_r1_ir_rls_and_lineage_hardening/migration.sql`, `SHA-256: 416a397e531259641ead7bb8dc8a17c4be848884bc4dccdd220aea550501445e`):
   - Drops permissive `FOR ALL TO PUBLIC USING (true)` policies on `ClientVariationOrder` and `AIVariationOrderValidation` and scopes operational RLS policies strictly to `TO oserp_compat_app`.
   - Introduces cryptographic `_uboq_rls_trust_anchor` synthetic-cleanup transaction proof (`uboq_authorize_verified_synthetic_cleanup_tx` + `uboq_is_verified_synthetic_cleanup_project`) inside `uboq_execute_verified_synthetic_cleanup` and restricts `oserp_maint_cleanup_role` `SELECT`/`DELETE` policies strictly to verified synthetic projects (`^SYNTH-UBOQ-TEST-` + `"Project"."isSyntheticTestFixture" = true`).
   - Adds `SECURITY DEFINER` `uboq_inspect_subcontract_package_lineage` and enforces cross-project subcontract-package / BOQ ownership at PostgreSQL `WITH CHECK` write time on `VariationOrder` and `SubcontractorVariationOrder`.
   - Creates governed `UboqTreasuryOpeningBalance` (`252nd` public table) with `ENABLE` + `FORCE ROW LEVEL SECURITY`, executive-only write policy, and `trg_uboq_guard_treasury_opening_balance` sealing `VERIFIED` rows against mutation.
2. **Migration `#36`** (`prisma/migrations/20261114010000_wp3_batch_d_d2_r1_subcon_vo_and_export_log_policy_scope/migration.sql`, `SHA-256: 69faed9e29874500c7a0fb9a19b80c0d0a36a4d088dd8045382ca6344d240288`):
   - Scopes `SubcontractorVariationOrder.rls_restrictive_tenant_scope` and `SensitiveExportLog.rls_permissive_sensitive_export_log_select` strictly to `TO oserp_compat_app` and revokes direct `EXECUTE` on `uboq_authorize_verified_synthetic_cleanup_tx(text, text)` from `oserp_maint_cleanup_role`.

---

## 2. Summary of Remediations (`D2-IR-01`..`D2-IR-05`)

- **`D2-IR-01` (`HIGH`) — Maintenance-Role RLS & Unspoofable Cleanup Proof**:
  Eliminated permissive `PUBLIC` policies on VO/treasury tables and bound `oserp_maint_cleanup_role` `SELECT`/`DELETE` access to unspoofable HMAC-SHA256 transaction proofs minted exclusively inside `uboq_execute_verified_synthetic_cleanup`. Caller-set `set_config` GUCs, non-synthetic projects, and cross-project deletes fail closed.
- **`D2-IR-02` (`HIGH`) — Approved `T11` Header-vs-Items Arithmetic Reconciliation**:
  Removed the `!headerNetDec.eq(0)` bypass in `loadT11VariationOrderRegisterCanonicalData`. `VariationOrder.netVariationAmount` (including `0.00`), `additionalAmount`, and `deductiveAmount` are unconditionally reconciled against approved `VariationOrderItem` deltas (`409` on zero-header/non-zero-item mismatch, non-zero-header/zero-item mismatch, or header add/deduct inconsistency; `200` on genuine balanced zero-net scope swaps).
- **`D2-IR-03` (`HIGH`) — Subcontract VO Package Authority & BOQ/Snapshot Lineage**:
  Required verified `APPROVED` `SubcontractPackage` association (`originalSubcontractId` on `SubcontractorVariationOrder`, `subcontractPackageId` on subcontract `VariationOrder`; free-text `reason` never substitutes) and package-to-`AwardedBOQItem` / consolidated-group allocation consistency across **all** actor roles (executive and non-executive), failing closed at SQL write time (`42501`) and adapter read time (`409`).
- **`D2-IR-04` (`MEDIUM`) — `T12` Treasury Opening Balance & Zero-Basis Semantics**:
  Reconciles `VERIFIED` `UboqTreasuryOpeningBalance` aligned to the first schedule period start (`<=` cutoff) when available (including positive and negative/overdrawn starting positions), fails closed (`409`) on `DRAFT` or misaligned opening records, and defaults to explicit zero-basis cumulative net project cash movement labels (`NO_SUM`, `0` `<f>` tags) with `409` anti-misrepresentation guards on custom aliases and saved layout names when opening cash is absent.
- **`D2-IR-05` (`MEDIUM`) — Bounded Native Next.js 16 Local Server E2E**:
  Retained the esbuild + Express Chromium E2E harness (`WP3-BDD2-R1-06`) and added a live native Next.js 16 (`next dev --webpack`) E2E check (`WP3-BDD2-R1-07`) exercising `src/proxy.ts` middleware (`401`/`307` unauthenticated, `403`/`307` `mustChangePassword`, security headers), NextAuth v5 Credentials login & JWE session cookies, RSC `page.tsx` rendering, `T11` formal XLSX download, `T12` nonformal `400` block, and live `403` rejections for `VIEWER` and foreign-project actors.

---

## 3. Consolidated Verification & Standing Release Holds

- **Runtime & E2E Suite (`artifacts/uboq/wp3/batch-d-d2-r1/runtime-tests.json`)**: `7/7 PASS`, `252` public tables verified identical before and after (`fbf0a0b50398cc4c88a26eea422a3f102208794321d7e7e08663f54a1a4801cb`), zero synthetic test residue.
- **Standing Release Holds Preserved**:
  - Phase D1 staged round-trip canonical-apply workflow gate (`canonicalRecordsMutated: 0`)
  - Migration `#14` historical lineage hold
  - Migration `#23` 32-bit XID rollover hold (`REQUIRED_BEFORE_PREVIEW`)
  - External agency statutory print specifications (`T11` formal output is internal ERP only)
  - No `PREVIEW` / Production deployment, branch merge, or final freeze authorized
