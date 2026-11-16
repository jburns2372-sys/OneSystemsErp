# OSERP-PROJ-UBOQ-001 — WP-3 Accelerated Batch D (`Phase D0` Contract Validation & `Phase D1` Signed `T0`/`T1` Round-Trip Import)

## 1. Prior Gate Acceptance, Scope & Governance Boundary
- **Batch**: WP-3 Accelerated Execution V2 — **Batch D (`Phase D0` Contract Validation & `Phase D1` Signed `T0`/`T1` Round-Trip Import Verification)** under Owner Standing Non-Production (`LOCAL`) Authorization on branch `release/oserp-proj-uboq-001` (`HEAD: 79a2c5bd3853711cf4960c5d45cff755aaf219d2`).
- **Prior Accepted Gates & Frozen Archives (Byte-Identical)**:
  - Accepted G02-R3 security/RLS baseline (`artifacts/uboq/g02-r3/independent-review-candidate.zip`, `SHA-256: a689c9bd0311b3ad77ce11ecf2481ddb0a63a0873e37d1d9c717ae9f28977b12`)
  - WP-3 Increment 01 (`artifacts/uboq/wp3/wp3-increment01-review.zip`, `SHA-256: 1bc762b963f9cb841679bc7119f83d32693fb83293f67647f526ed8fdb4be719`)
  - WP-3 Increment 02 (`artifacts/uboq/wp3/wp3-increment02-review.zip`, `SHA-256: 8b92a0fc6ff4493b1f22b6fc2defcddda85da79e84b0ca7840d0604b569eae0a`)
  - WP-3 Batch A (`T2`–`T4` + `WP3-BA-IR-01`, `artifacts/uboq/wp3/wp3-batch-a-review.zip`, `SHA-256: 6886c6737baab1d4e0923b14473aae6973b48305d177e7d1858210504da4e641`)
  - WP-3 Batch B (`T5`–`T7` + `IR-01`..`IR3-01`, `artifacts/uboq/wp3/wp3-batch-b-review.zip`, `SHA-256: 6ec8f21377150d4e80f80e8add0d1b860eb19615db76e6e7ff47a11f1f0ff68f`)
  - WP-3 Batch C (`T8`–`T10` + `IR-01`..`IR-05` + `R2-01`..`R2-03`, `artifacts/uboq/wp3/wp3-batch-c-review.zip`, `SHA-256: 666ad50c880bd0918a3e2d2b1589843b1664cc7598f8a9ac95c4c78b1609be9c`)
- **Accepted `T0`–`T10` Source Contracts Preserved Byte-for-Byte**:
  - `src/lib/uboq/field-catalog.ts`, `src/lib/uboq/template-builder.ts`, `src/lib/uboq/templates/t0-t1.ts`, `src/lib/uboq/templates/formal-t0-t1.ts`, `src/lib/uboq/templates/saved-layouts.ts`, `src/lib/uboq/templates/canonical-source-adapters.ts`, `src/app/api/uboq/templates/route.ts`, `src/app/api/uboq/templates/layouts/route.ts`, and `src/app/api/uboq/templates/formal-export/route.ts` remain **100% byte-for-byte untouched**.
  - Migrations `#1`–`#32` remain **100% byte-for-byte untouched** on disk and in `_prisma_migrations`.

---

## 2. Phase D0 — `T11` & `T12` Contract Validation (`PENDING_PROJECT_OWNER_RATIFICATION`)
- **Authoritative Audit Findings** (`artifacts/uboq/wp3/batch-d/d0-t11-t12-contract-specifications.json`):
  1. `SYSTEM_TEMPLATE_PRESETS` (`src/lib/uboq/template-builder.ts`) defines **11** ratified templates (`T0_MASTER_CONTRACT` through `T10_EXECUTIVE_MARGIN`). Neither `T11` nor `T12` exists in runtime code.
  2. `artifacts/uboq/wp3/accelerated-plan/phase1-t0-t12-crosswalk.json` explicitly flagged `T11` (`T11_VARIATION_IMPACT`) and `T12` (`T12_CHANGE_REGISTER`) as `NEEDS_CONTRACT_CLARIFICATION` (`BLOCKED_BY_OPEN_SPECIFICATION_AND_BATCH_SEQUENCING`).
  3. Batch C R2 Independent Acceptance (`OSERP-PROJ-UBOQ-001-WP3-BATCH-C-R2-ACCEPTANCE-2026-11-15`) noted in `next_gate` that `T11`/`T12` require formal Project Owner ratification before runtime slot assignment.
  4. **Conclusion**: Formal Project Owner approval of `T11_VARIATION_ORDER_REGISTER` and `T12_CASHFLOW_VARIANCE_TREASURY` is **NOT** yet present (`project_owner_formal_approval_found: false`, `ratification_status: "PENDING_PROJECT_OWNER_RATIFICATION"`).
- **Governance Enforcement**:
  - Per the explicit Batch D rule (*"If not approved, prepare exact specifications and mark them pending. Do not implement unratified template IDs"*):
    - Exact proposed contract specifications for **`T11_VARIATION_ORDER_REGISTER`** (`VARIATION_ORDER_ITEM` grain over governed `VariationOrder` + `VariationOrderItem` + `VariationOrderApproval` + `UboqAwardedPhaseLine`, strictly banning legacy `/api/projects/[id]/variation-orders/[voId]/approve/route.ts` and separating Client VOs from Subcontractor VOs) and **`T12_CASHFLOW_VARIANCE_TREASURY`** (`CASH_FLOW_PERIOD` grain reusing Batch C `loadReconciledBatchCCashFlowSchedule` + verified `UboqClientReceipt` / `AccountsPayable` / `PaymentRecord` / `Expense` / `Payroll` actuals) are published in `artifacts/uboq/wp3/batch-d/d0-t11-t12-contract-specifications.json` with an explicit Project Owner sign-off checklist (template ID strings, Option A 129-field mapping vs Option B `V2_1_R4` catalog extension, VO domain scope, and `isFormalComplianceOutput`).
    - Runtime implementation of `T11` and `T12` (Phase D2) is **deferred** until Project Owner ratification.
    - All four template API routes (`/api/uboq/templates`, `/api/uboq/templates/layouts`, `/api/uboq/templates/formal-export`, and `/api/uboq/templates/round-trip`) reject unratified `T11`/`T12` codes fail-closed (`HTTP 400`).

---

## 3. Phase D1 — Signed `T0`/`T1` Round-Trip Import Verification

### 3.1 Architecture & Reused Canonical Contracts
- **Service**: `src/lib/uboq/templates/round-trip-import.ts`
- **API Route**: `src/app/api/uboq/templates/round-trip/route.ts` (`GET` workspace state + redacted audit history; `POST` `action: "issue"` & `action: "verify_import"` supporting both `application/json` base64 and `multipart/form-data` browser `File` uploads, plus separate forensic `REJECTED` audit transactions on failed verification attempts).
- **UI**: `src/app/projects/[id]/uboq/templates/TemplateBuilder.tsx` (responsive `1440x900` desktop & `390x844` mobile **"Signed T0/T1 round-trip package & controlled re-import"** `<fieldset>` + Phase D0 pending ratification notice; zero server modules in client bundle).
- **Supported Templates**: Strictly scoped to ratified `T0_MASTER_CONTRACT` (`UboqContractAuthority` `APPROVED`) and `T1_PHASE_BOQ` (`UboqOperationalSnapshot` `APPROVED` + `UboqAwardedPhaseLine`) across `WORKING_PRESET`, `SAVED_LAYOUT`, and `FORMAL_CONTRACT` modes in both `XLSX` (`__OSERP_META` + `__OSERP_SIGNATURE` `veryHidden` sheets, genuine numeric OpenXML `<v>` cells, `0` `<f>` formula tags) and `JSON` (`OSERP_T0_T1_ROUNDTRIP_V1`) formats.

### 3.2 Nine-Gate Fail-Closed Verification Pipeline
1. **Gate 0 — Zero Silent Overwrite (`OVERWRITE_APPROVED_IN_PLACE` Blocked)**: Any request attempting in-place overwrite of live canonical records is rejected (`409 ROUNDTRIP_SILENT_OVERWRITE_BLOCKED`). Verified submissions stage an immutable `STAGED_PENDING_APPROVAL` proposal (`canonicalRecordsMutated: 0`) or confirm `VERIFIED_NO_CHANGES` (`VERIFY_ONLY`), leaving `UboqContractAuthority`, `UboqOperationalSnapshot`, `UboqAwardedPhaseLine`, `AwardedBOQItem`, and `ConsolidatedBOQItem` 100% untouched.
2. **Gate 1 — Document Security & Formula/Macro/Injection Screening**: Enforces `scanUploadedDocumentSecurity` (blocks `xl/vbaProject.bin` macros, OLE/MZ executables, XXE, zip bombs), raw OpenXML worksheet ZIP scan rejecting any `<f>` formula tag (`400 ROUNDTRIP_FORMULA_CELL_PROHIBITED`), and `inspectCellSecurity` blocking DDE/formula/adversarial prompt injection (`400 ROUNDTRIP_CELL_INJECTION_BLOCKED`).
3. **Gate 2 — Cryptographic Manifest Integrity (`_uboq_rls_trust_anchor`)**: Verifies `manifestSignature` (`SHA-256` over secret trust-anchor + pipe-delimited canonical manifest fields including `packageId`, `projectId`, `templateCode`, `sourceId`, `sourceVersion`, `sourceCanonicalHash`, `layoutDefinitionHash`, `rowCount`, `rowIdentityDigest`, `packageNonce`, `issuedEpochSec`, `expiresEpochSec`) via constant-time `crypto.timingSafeEqual` in TypeScript **and** inside PostgreSQL `public.uboq_verify_roundtrip_manifest_signature` (`403 ROUNDTRIP_SIGNATURE_INVALID` / `400 ROUNDTRIP_UNSIGNED_OR_MISSING_MANIFEST`).
4. **Gate 3 — Source, Project Identity, Expiration & Replay Ledger**: Rejects cross-project package swaps (`403 ROUNDTRIP_PROJECT_IDENTITY_MISMATCH`), unknown packages (`403 ROUNDTRIP_PACKAGE_NOT_FOUND`), expired packages (`409 ROUNDTRIP_PACKAGE_EXPIRED`), and already-consumed packages (`409 ROUNDTRIP_PACKAGE_REPLAY_BLOCKED`).
5. **Gate 4 — Concurrent Canonical Source Drift Guard**: Recomputes live `sourceCanonicalHash` over the approved `UboqContractAuthority` or `UboqOperationalSnapshot` + `UboqAwardedPhaseLine` set; rejects stale exports if the canonical baseline changed after package issuance (`409 ROUNDTRIP_SOURCE_STALE_OR_MODIFIED`).
6. **Gate 5 — Layout & Saved-Layout Version Compatibility**: Validates `layoutDefinitionHash`, exact visible column header alignment (`409 ROUNDTRIP_LAYOUT_HEADER_MISMATCH`), and `UboqTemplateDefinition` revision supersession (`409 ROUNDTRIP_LAYOUT_VERSION_SUPERSEDED` unless explicitly acknowledged).
7. **Gate 6 — Row Lineage & Immutable Identity Anchors**: Rejects added/deleted/blank rows or tampered `__OSERP_META` (`409 ROUNDTRIP_ROW_LINEAGE_TAMPERED`) and rejects edits to immutable anchors (`project_id`, `contract_id`, `tax_profile_version`, `boq_line_id`, `snapshot_id`, `snapshot_version`, `phase_code`, `section_code`, `item_code` -> `409 ROUNDTRIP_IMMUTABLE_IDENTITY_MODIFIED`).
8. **Gate 7 — Strict Commercial / Financial Field Authorization**:
   - Even when public/internal fields (`approved_qty`, `original_qty`, `unit`, `pricing_type`, `pricing_method`, `vo_reference`) are visible to `PROJECT_ENGINEER`, mutating them or any restricted pricing field (`contract_unit_rate`, `contract_line_amount`, `awarded_revenue`, `current_contract_value`, `contract_vat_basis`) requires commercial authority (`ROUNDTRIP_COMMERCIAL_FINANCIAL_ROLES` + non-narrowed project assignment, enforced in both TypeScript and PostgreSQL `uboq_actor_has_commercial_roundtrip_access` -> `403 ROUNDTRIP_FINANCIAL_FIELD_FORBIDDEN`).
   - `PROJECT_ENGINEER` can stage non-financial scope clarifications (`work_description`, `specification`, `client_po_ref`, etc.), while `SITE_ENGINEER`, `VIEWER`, and narrowed `FINANCE_DIRECTOR` (`accessLevel = VIEWER`) are denied (`403`).
   - PostgreSQL `FORCE RLS` on `UboqRoundTripImportSubmission` hides rows where `"financialChangeCount" > 0` from non-commercial roles at the SQL kernel level, reinforced by DTO redaction in `listRoundTripWorkspaceState`.
9. **Gate 8 — Deterministic Unit-Price Arithmetic & Partial-Column Safety**: Never silently recomputes `contract_line_amount`; editing `approved_qty`, `contract_unit_rate`, or `contract_line_amount` on `T1_PHASE_BOQ` requires all three columns in the layout (`409 ROUNDTRIP_PARTIAL_FINANCIAL_COLUMNS_UNSAFE`) and requires `approved_qty * contract_unit_rate == contract_line_amount` (`ROUND_HALF_UP` to 2dp) unless a commercial override justification (`>= 12` chars) is supplied (`409 ROUNDTRIP_FINANCIAL_LINE_AMOUNT_MISMATCH`).

---

## 4. Forward-Only Migration `#33` (Migrations `#1`–`#32` Preserved Byte-for-Byte)
- **Path**: `prisma/migrations/20261113220000_wp3_batch_d_signed_t0_t1_roundtrip_import/migration.sql`
- **SHA-256**: `ab6209317fa5634f682610770daaae695f9ad47bc8b2110ef56328f74d6d2e33`
- **Receipt**: `artifacts/uboq/wp3/batch-d/migration33-apply.json` (`rollback_preflight: "PASS"`, `final_ledger_count: 33`, `migrations_1_to_32_preserved_post_apply: true`).
- **Database Controls**:
  - Creates `public."UboqSignedRoundTripPackage"` and `public."UboqRoundTripImportSubmission"` with `ENABLE + FORCE ROW LEVEL SECURITY`, strict `CHECK` constraints (`templateCode IN ('T0_MASTER_CONTRACT', 'T1_PHASE_BOQ')`), and `REVOKE INSERT/UPDATE/DELETE` from `oserp_compat_app`.
  - Function-only append via attested `SECURITY DEFINER` `public.uboq_issue_signed_roundtrip_package` and `public.uboq_record_roundtrip_import_submission` (`OWNER TO oserp_migrations_owner`), verified against `"_uboq_rls_trust_anchor"` (`public.uboq_verify_roundtrip_call_attestation` + `public.uboq_verify_roundtrip_manifest_signature`) with kernel `current_user = 'oserp_migrations_owner'` triggers and **zero** reliance on caller-settable custom PostgreSQL GUCs.
  - Serializes idempotency checks via `pg_advisory_xact_lock` + `UNIQUE ("projectId", "idempotencyKey")` and seals one-time package consumption via `SELECT ... FOR UPDATE` on `UboqSignedRoundTripPackage`.

---

## 5. Remaining Release Blockers
1. **Project Owner Ratification of `T11` & `T12` (`Phase D2` Gate)**: `T11_VARIATION_ORDER_REGISTER` and `T12_CASHFLOW_VARIANCE_TREASURY` specifications are prepared and marked `PENDING_PROJECT_OWNER_RATIFICATION` (`artifacts/uboq/wp3/batch-d/d0-t11-t12-contract-specifications.json`); runtime implementation of `T11`/`T12` remains blocked until formal Project Owner approval.
2. **Governed Proposal Approval Mutation Workflow**: Phase D1 stages verified round-trip proposals (`STAGED_PENDING_APPROVAL`, `canonicalRecordsMutated: 0`); applying a staged commercial change to live canonical BOQ/Contract baselines remains gated behind formal Variation Order / Snapshot Revision approval workflows.
3. **Migration `#14` Historical Provenance Hold**: Open release-integrity hold prior to production (`Migrations #1`–`#32` preserved byte-for-byte).
4. **Migration `#23` 32-bit XID Rollover Hardening**: Required prior to `PREVIEW` promotion.
5. **External Statutory Print Layouts**: `AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED` for external agency print forms.
