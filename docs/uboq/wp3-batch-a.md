# OSERP-PROJ-UBOQ-001 — WP-3 Batch A Completion Documentation (`T2`–`T4`)

## 1. Scope & Governance Context
- **Batch**: WP-3 Accelerated Execution V2 — **Batch A (`T2_CONSOLIDATED_BOQ`, `T3_AGENCY_ESTIMATE`, `T4_RESOURCE_TAKEOFF`)**
- **Prior Gate 0 Status**: WP-3 Increment 02 (`T0`/`T1` Saved Layouts & Formal Exports) accepted with **`INDEPENDENT SOURCE/EVIDENCE REVIEW PASS`** (`artifacts/uboq/wp3/wp3-increment02-review.zip`, SHA-256 `8b92a0fc6ff4493b1f22b6fc2defcddda85da79e84b0ca7840d0604b569eae0a`).
- **Template Contract Stability**: Existing preset IDs in `SYSTEM_TEMPLATE_PRESETS` (`src/lib/uboq/template-builder.ts`) are preserved verbatim without silent renaming:
  - `T2_CONSOLIDATED_BOQ` — *Consolidated Work Scope View* (`rowGrain: CONSOLIDATED_WORK_ITEM`, `isFormalComplianceOutput: false`)
  - `T3_AGENCY_ESTIMATE` — *Agency POW / DUPA Estimate Baseline* (`rowGrain: PHASE_BOQ_LINE`, `isFormalComplianceOutput: false`)
  - `T4_RESOURCE_TAKEOFF` — *Procurement Resource Requirement & Stock Balance* (`rowGrain: CANONICAL_RESOURCE`, `isFormalComplianceOutput: true`, formal contract `ERP_CANONICAL_T4_FORMAL_V1`)

## 2. Shared Reuse Architecture
Batch A introduces a single shared read-only canonical source adapter module (`src/lib/uboq/templates/canonical-source-adapters.ts`) and reuses existing ERP engines and routes without modifying `prisma/schema.prisma`, `src/lib/uboq/template-builder.ts`, `src/lib/uboq/field-catalog.ts`, `src/lib/uboq/security/redact-payload.ts`, or any of the three Next.js API route handlers (`/api/uboq/templates`, `/api/uboq/templates/layouts`, `/api/uboq/templates/formal-export`):
1. **`T2_CONSOLIDATED_BOQ`**:
   - Projects snapshot-scoped `UboqConsolidationGroup` + `UboqConsolidationLink` -> `UboqAwardedPhaseLine` (with deterministic read-only fallback bucketing for snapshots without pre-materialized links).
   - Enforces `specSignatureHash` match, `canConvertUom` compatibility (`Prisma.Decimal` exact UOM conversion), and `LUMP_SCOPE` isolation (never merging lump-sum items across phases).
   - Preserves exact zero-variance total reconciliation (`sum(T2.contract_line_amount) === sum(T1.contract_line_amount)`).
2. **`T3_AGENCY_ESTIMATE`**:
   - Projects `UboqAwardedPhaseLine` joined to `UboqAgencyEstimateBaseline` on an `APPROVED` `UboqOperationalSnapshot`.
   - Enforces **R1-M02 / H06** (`agency_abc` populated strictly from sourced `agencyAbcAmt`; `SOURCE_NOT_PROVIDED` lines emit `null` cost columns without fabricating contract-revenue multipliers), **TAX-01** (5% DUPA `estimate_vat_amt` kept distinct from 12% statutory `output_vat_rate`), and **VAL-10** (contingency added once without OCM double-counting).
3. **`T4_RESOURCE_TAKEOFF` & Formal Contract `ERP_CANONICAL_T4_FORMAL_V1`**:
   - Projects approved `UboqProcurementResourceRequirement` (`PRR`) + `UboqCanonicalResourceAccount` + `ConsolidatedBOQItem`/`UboqConsolidationGroup` + `MaterialRequest`/`PurchaseOrder` lineage (`mrf_id`, `supplier_po_id`) bound to an `APPROVED` `UboqOperationalSnapshot`.
   - Computes exact `Prisma.Decimal` 4dp stock and procurement balances (`stock_available_qty = max(0, allocated_usable_stock_qty + delivered_received_qty - consumed_issued_qty)`, `resource_to_procure = max(0, resource_required_qty - (allocated_usable_stock_qty + open_mr_reserved_qty + committed_qty + delivered_received_qty))`, plus explicit `overcommitted_qty_exact` metadata).
   - **Strict Financial Separation**: Uses internal `benchmarkUnitCost` / `targetResourceUnitCost` and `procurementBudget` (`INTERNAL_BENCHMARK_PRR_PROCUREMENT_BASIS`); Awarded BOQ `contract_unit_rate` and `contract_line_amount` are never loaded or mixed into `T4`.
   - Formal `ERP_CANONICAL_T4_FORMAL_V1` exports (`json`, `xlsx`, `csv`) enforce `VAL-19` (zero open `BLOCKING` exceptions), exact HTTP response byte `SHA-256 == X-OSERP-Output-Sha256 == UboqTemplateAuditEvent.outputSha256`, live Excel `SUM(...)` on `procurement_budget` (`target_resource_cost` kept `NO_SUM`), UOM-grouped subtotals on `Formal_Contract_Summary`, and `AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED` (zero invented agency/signatory fields).

## 3. Forward-Only Migration `#26` & Security Posture
- **Migration `#26`**: `prisma/migrations/20261113150000_wp3_batch_a_t2_t4_templates_and_formal_t4_guard/migration.sql`
  - Migrations `#1`–`#25` remain byte-for-byte unchanged on disk and in `_prisma_migrations`.
  - Extends `chk_uboq_tpl_audit_template_code` and `public.uboq_guard_template_definition()` to `T0`–`T4` with strict `(templateCode, rowGrain)` pairing while keeping `T5`–`T12` gated until subsequent batches.
  - Aligns `uboq_can_share_template_layout`, `uboq_can_write_template_layout`, and `uboq_can_formal_export_template` with `COMMERCIAL_RESTRICTED_ROLES` (`CHIEF_ESTIMATOR`, `PROCUREMENT_MANAGER`, `PROCUREMENT_OFFICER`), while denying field/viewer roles (`SITE_ENGINEER`, `VIEWER`, `EXTERNAL_VIEWER`) on restricted financial columns and formal exports.
  - Hardens `public.uboq_guard_template_audit_event()` so `FORMAL_EXPORT_GENERATED` rejects non-formal `T2`/`T3` (`22023`) and requires an `APPROVED` `UboqOperationalSnapshot` with `>= 1` approved `UboqProcurementResourceRequirement` and zero open `BLOCKING` exceptions for `T4_RESOURCE_TAKEOFF`.
  - Preserves least-privilege `SELECT`-only grant on `"UboqTemplateAuditEvent"` for `oserp_compat_app` (`INSERT`/`UPDATE`/`DELETE` revoked).

## 3A. Targeted Independent-Review Remediation (`WP3-BA-IR-01`)
- **Review Finding (`OSERP-PROJ-UBOQ-001-WP3-BATCH-A-IR1` / `WP3-BA-IR-01` — HIGH)**:
  - `recordFormalExportProvenance` persists `approvedLineTotal`, `procurementBudgetTotal`, `currentApprovedContractValue`, `pricingMethod`, and `contractVatBasis` inside `UboqTemplateAuditEvent.detailsJson`. Under Migration `#24`'s `public.uboq_can_read_template_audit` and `rls_restrictive_uboq_tpl_audit_tenant` `SELECT` policy, signed non-financial project actors (`SITE_ENGINEER`, `PROJECT_ENGINEER`, `WAREHOUSEMAN`, `VIEWER`, `EXTERNAL_VIEWER`) could `SELECT` `PROJECT_SHARED` and `SYSTEM_FORMAL_PRESET` audit rows, and `loadSavedLayout` returned `auditTrail` with unredacted `detailsJson`.
- **Forward-Only Migration `#27`** (`prisma/migrations/20261113160000_wp3_batch_a_audit_select_financial_guard/migration.sql`, `SHA-256: 5be3416bd1d8fbc8b63704f100681020717358692bacda99c61daa59a20c646f`):
  - Migrations `#1`–`#26` remain byte-for-byte unchanged on disk and in `_prisma_migrations`.
  - Defines `public.uboq_can_read_template_audit_event(p_project_id, p_event_type, p_sharing_scope, p_actor_user_id, p_layout_owner_id)` requiring `public.uboq_can_formal_export_template(p_project_id, v_current_user_id) IS TRUE` whenever `p_event_type = 'FORMAL_EXPORT_GENERATED'` OR `p_sharing_scope = 'SYSTEM_FORMAL_PRESET'` (protecting `PROJECT_SHARED`, `SYSTEM_FORMAL_PRESET`, and `PRIVATE` formal export audit records, including downgraded-actor historical rows).
  - Hardens legacy 4-arg `public.uboq_can_read_template_audit(...)` so `SYSTEM_FORMAL_PRESET` delegates to `'FORMAL_EXPORT_GENERATED'`.
  - Replaces `rls_restrictive_uboq_tpl_audit_tenant` on `public."UboqTemplateAuditEvent"` to bind `USING (...)` to `uboq_can_read_template_audit_event(...)` while preserving Migration `#25`'s `WITH CHECK (app.uboq_audit_fn_active = 'on')` and `SELECT`-only privilege on `oserp_compat_app`.
- **Defense-in-Depth Saved-Layout API Redaction** (`src/lib/uboq/templates/saved-layouts.ts`):
  - Adds `canReadFormalFinancialAudit` to `ActorLayoutCapabilities` (aligned 1-to-1 with `COMMERCIAL_RESTRICTED_ROLES` and `uboq_can_formal_export_template`).
  - Excludes `FORMAL_EXPORT_GENERATED` and `SYSTEM_FORMAL_PRESET` at the Prisma query layer in `loadSavedLayout` when `!caps.canReadFormalFinancialAudit`, and passes every `auditTrail` response through `sanitizeLayoutAuditTrailForActor` + `redactLayoutAuditDetailsForActor` (omitting formal export events, stripping restricted financial detail keys + `redactUboqPayloadForRole`, and filtering `selectedFields` / `headingAliases` inside `LAYOUT_CREATED`, `LAYOUT_VERSIONED`, and `LAYOUT_DUPLICATED` details via `canRoleReadField`).
- **Targeted Verification & Evidence Preservation**:
  - `scripts/uboq/verify-wp3-batch-a-corrections.ts` (`artifacts/uboq/wp3/batch-a/review-corrections-runtime.json`): **`6/6 PASS`** covering `SITE_ENGINEER` shared `T4` audit history, `VIEWER` (`EXTERNAL_VIEWER` + commercial user narrowed to `VIEWER` assignment) shared `T4` & raw-SQL `SYSTEM_FORMAL_PRESET` denial, `T0`/`T1` contractual total disclosure & downgraded-actor protection, cross-project & unsigned/forged context negatives, authorized Finance/Commercial/Procurement positives, and `T0`–`T4` output integrity.
  - Unchanged reviewed Batch A modules (`canonical-source-adapters.ts`, `t0-t1.ts`, `formal-t0-t1.ts`, `TemplateBuilder.tsx`, `page.tsx`, Migration `#26`) and initial `8/8 PASS` (`artifacts/uboq/wp3/batch-a/runtime-tests.json`) remain byte-for-byte preserved.

## 4. Remaining Release-Readiness Holds & Subsequent Batches
1. **Historical Migration `#14` Provenance Hold**: Separate release-integrity hold remains open prior to production promotion.
2. **Migration `#23` 32-bit XID Rollover Hardening**: Forward-only `txid_current()`/`pg_current_xact_id()` hardening remains required before `PREVIEW` promotion.
3. **External Agency Print Layouts**: External agency/client statutory cover sheets and signatory blocks remain recorded as `AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED`.
4. **Next WP-3 Batches**:
   - **Batch B**: `T5_ACCOMPLISHMENT_CERT`, `T6_PROGRESS_BILLING`, `T7_SCHEDULE_EVM`
   - **Batch C**: `T8_CASHFLOW_HALF_MONTH`, `T9_CASHFLOW_QUARTERLY`, `T10_EXECUTIVE_MARGIN`
   - **Batch D**: Ratified `T11`–`T12` contracts and signed round-trip workbook re-imports.

