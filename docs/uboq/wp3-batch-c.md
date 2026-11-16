# OSERP-PROJ-UBOQ-001 — WP-3 Batch C Completion & R2 Final Control Hardening (`T8`–`T10`)

## 1. Scope, Prior Gate Acceptance & Template Contract Preservation
- **Batch**: WP-3 Accelerated Execution V2 — **Batch C (`T8_CASHFLOW_HALF_MONTH`, `T9_CASHFLOW_QUARTERLY`, `T10_EXECUTIVE_MARGIN`)** + **Independent-Review Remediation R1 (`WP3-BC-IR-01`–`IR-05`) & R2 Final Control Hardening (`WP3-BC-IR-R2-01`–`R2-03`)** under Owner Standing Non-Production (`LOCAL`) Authorization on branch `release/oserp-proj-uboq-001` (`HEAD: 79a2c5bd3853711cf4960c5d45cff755aaf219d2`).
- **Prior Accepted Gates & Frozen Archives (Byte-Identical)**:
  - Accepted G02-R3 security/RLS baseline (`artifacts/uboq/g02-r3/independent-review-candidate.zip`, `SHA-256: a689c9bd0311b3ad77ce11ecf2481ddb0a63a0873e37d1d9c717ae9f28977b12`)
  - WP-3 Increment 01 (`artifacts/uboq/wp3/wp3-increment01-review.zip`, `SHA-256: 1bc762b963f9cb841679bc7119f83d32693fb83293f67647f526ed8fdb4be719`)
  - WP-3 Increment 02 (`artifacts/uboq/wp3/wp3-increment02-review.zip`, `SHA-256: 8b92a0fc6ff4493b1f22b6fc2defcddda85da79e84b0ca7840d0604b569eae0a`)
  - WP-3 Batch A (`T2`–`T4` + `WP3-BA-IR-01`, `artifacts/uboq/wp3/wp3-batch-a-review.zip`, `SHA-256: 6886c6737baab1d4e0923b14473aae6973b48305d177e7d1858210504da4e641`)
  - WP-3 Batch B (`T5`–`T7` + `IR-01`..`IR-04` + `IR2-01`..`IR2-02` + `IR3-01`, `artifacts/uboq/wp3/wp3-batch-b-review.zip`, `SHA-256: 6ec8f21377150d4e80f80e8add0d1b860eb19615db76e6e7ff47a11f1f0ff68f`)
- **Authoritative Template ID Reconciliation (Zero Preset Renaming)**:
  - Per `SYSTEM_TEMPLATE_PRESETS` (`src/lib/uboq/template-builder.ts`, untouched) and `phase1-t0-t12-crosswalk.json`:
    1. **`T8_CASHFLOW_HALF_MONTH`** — *Native Half-Month Cash Flow Schedule* (`rowGrain: CASH_FLOW_PERIOD`, `isFormalComplianceOutput: false`)
    2. **`T9_CASHFLOW_QUARTERLY`** — *Quarterly Cash Flow & Liquidity Rollup* (`rowGrain: CASH_FLOW_QUARTER`, `isFormalComplianceOutput: false`)
    3. **`T10_EXECUTIVE_MARGIN`** — *Executive Profitability & EAC Forecast* (`rowGrain: PHASE_BOQ_LINE`, `isFormalComplianceOutput: false`) — delivers full **Cost Commitment** (`committed_total_ex_vat`, `incurred_against_commitment_ex_vat`, `uncommitted_direct_incurred_ex_vat`, `incurred_actual_cost_ex_vat`, `paid_disbursed_ex_vat`, `unpaid_incurred_payable_ex_vat`, `outstanding_total_obligation_ex_vat`, `commitment_open_amt`) and **Executive Five-Baseline Profitability / EAC Summary** over approved `UboqAwardedPhaseLine` scope.
  - **Strict Non-Statutory Boundary**: `T8`, `T9`, and `T10` remain governed analytical working-copy and saved-layout projections (`isFormalComplianceOutput: false`). `T11_VARIATION_IMPACT`, `T12_CHANGE_REGISTER`, and signed round-trip workbook re-import remain gated for Batch D.

---

## 2. R1 Independent-Review Remediations Preserved (`WP3-BC-IR-01` – `WP3-BC-IR-05`)
1. **`WP3-BC-IR-01` (`HIGH` — Cash Receipt Reconciliation)**: Project-wide receipt reference deduplication across approved `Billing` claims; shared receipt references fail closed (`409 TEMPLATE_DUPLICATE_COLLECTION_REFERENCE` / `TEMPLATE_COLLECTION_ALLOCATION_UNVERIFIED`) unless backed by verified `UboqClientReceipt` + matching `UboqClientReceiptAllocation` rows summing strictly to `totalReceiptAmount`.
2. **`WP3-BC-IR-02` (`HIGH` — Explicit Half-Month Period Attribution & Historical Actuals)**: Explicit `MATCHED | BEFORE_HORIZON | AFTER_HORIZON | PERIOD_GAP` classification, contiguous 1-based half-month validation (`409 TEMPLATE_CASHFLOW_PERIOD_CONTINUITY_INVALID`), fail-closed out-of-horizon transactions (`409 TEMPLATE_CASHFLOW_OUT_OF_HORIZON_TRANSACTION`), and period-by-period operational vs persisted historical actuals reconciliation.
3. **`WP3-BC-IR-03` (`HIGH` — Period-Aggregated Billing Forecast)**: Unique approved `Billing` claims (`<= asOfCutoff`) aggregate per half-month period prior to `max(PV, sum(claims))`, extending schedule horizon by one half-month collection cycle and offsetting lagged net due by already-collected cash.
4. **`WP3-BC-IR-04` (`HIGH` — Approved Executive Target Budget Lineage)**: Requires `approvedById` + `approvedAt <= asOfCutoff` and single-head `supersedesId` + `revisionNumber` lineage; reconciles project-wide vs line-level budgets without double-counting (`UNAVAILABLE_NO_APPROVED_BUDGET` when absent).
5. **`WP3-BC-IR-05` (`MEDIUM` — Numeric XLSX Serialization & Formula Safety)**: `T2`–`T10` working XLSX exports serialize numeric columns as genuine OpenXML numeric `<v>` cells (`36/36` cells `D2:L5` verified, `0` `<f>` formula tags, formula-injection neutralization on text/headers/`__OSERP_META`), preserving `T0`/`T1` round-trip copies.

---

## 3. R2 Final Control Hardening (`WP3-BC-IR-R2-01` – `WP3-BC-IR-R2-03`)

### 3.1 `WP3-BC-IR-R2-01` — Non-Spoofable Sensitive Export Audit Authority (`HIGH` — CLOSED)
- **Root Cause Remediated**: Previously, `oserp_compat_app` retained direct `INSERT` privilege on `SensitiveExportLog` and the RLS `WITH CHECK` / trigger relied on a caller-writable custom GUC (`app.uboq_sensitive_export_fn_active`), while `uboq_append_sensitive_export_log` accepted raw SQL calls without cryptographic proof of an application-delivered export payload.
- **Remediation (Forward-Only Migration `#32` + Application Routes)**:
  - **Direct `INSERT` Revoked**: `REVOKE ALL ON TABLE public."SensitiveExportLog" FROM PUBLIC, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role; GRANT SELECT ON TABLE public."SensitiveExportLog" TO oserp_compat_app;` (`has_table_privilege('oserp_compat_app', 'public."SensitiveExportLog"', 'INSERT') = false`).
  - **Zero Custom GUC Origin Proof**: Eliminated `app.uboq_sensitive_export_fn_active` completely from RLS policies, triggers, and functions. `rls_permissive_sensitive_export_log_definer_insert` (`FOR INSERT TO oserp_migrations_owner`), `rls_deny_compat_insert_sensitive_export_log` (`AS RESTRICTIVE FOR INSERT TO oserp_compat_app WITH CHECK (false)`), and `public.uboq_guard_sensitive_export_log()` enforce kernel-verified `current_user = 'oserp_migrations_owner'`.
  - **Cryptographic Payload Attestation (`_uboq_rls_trust_anchor`)**: Dropped the unattested 12-arg overload and replaced it with 14-arg `public.uboq_append_sensitive_export_log(..., p_output_sha256, p_export_proof)` verified inside `SECURITY DEFINER` `public.uboq_verify_sensitive_export_attestation(...)` against owner-private `"_uboq_rls_trust_anchor"` (`anchorId = 'PRIMARY'`). `/api/uboq/templates` and `/api/uboq/templates/layouts` pre-serialize the exact delivered HTTP bytes (`JSON`/`CSV`/`XLSX`), compute `outputSha256`, and mint `p_export_proof` (`mintSensitiveExportAttestation`) so even a signed executive with raw SQL session access cannot fabricate an approved export log.
  - **Formal Export Path Preserved (`T0`/`T1`/`T4`/`T5`/`T6`)**: Added attested `SECURITY DEFINER` `public.uboq_append_formal_sensitive_export_log(p_id, p_audit_event_id, p_data_classification, p_export_proof)` bound 1-to-1 to authoritative `UboqTemplateAuditEvent` (`FORMAL_EXPORT_GENERATED`) and its `outputSha256`, wired into `recordFormalExportProvenance` (`src/lib/uboq/templates/formal-t0-t1.ts`).

### 3.2 `WP3-BC-IR-R2-02` — Verified Client Receipt Authority & Post-Seal Immutability (`HIGH` — CLOSED)
- **Root Cause Remediated**: `UboqClientReceipt.status` previously defaulted to `'VERIFIED'`, `INSERT`/`UPDATE` RLS checked only tenant membership, and neither SQL triggers nor the adapter enforced finance verifier authority or post-verification immutability.
- **Remediation (`prisma/schema.prisma` + Migration `#32` + `canonical-source-adapters.ts`)**:
  - **Default `'DRAFT'`**: `UboqClientReceipt.status` defaults to `'DRAFT'` (`chk_uboq_client_receipt_status_enum`, `chk_uboq_client_receipt_verified_fields`, and `UboqClientReceipt_verifiedById_fkey`).
  - **Finance/Commercial Verifier Authority (`public.uboq_actor_can_verify_client_receipt`)**: Restrictive `INSERT`/`UPDATE` RLS policies and `BEFORE INSERT OR UPDATE OR DELETE` triggers (`trg_uboq_guard_client_receipt`, `trg_uboq_guard_client_receipt_allocation`) require an active, unlocked finance/commercial verifier (`SUPER_ADMIN`, `PRESIDENT`, `VP_OPERATIONS`, `FINANCE_DIRECTOR`, `COMMERCIAL_DIRECTOR`, `COST_CONTROL_MANAGER`, `ACCOUNTANT`, `BILLING_ENGINEER`) holding an active project assignment without viewer/non-finance role narrowing. Rejects `VIEWER`, `SITE_ENGINEER`, `PROJECT_MANAGER`, and narrowed assignments.
  - **Anti-Forgery & Sum Reconciliation Before Seal**: Direct `INSERT` as `'VERIFIED'` is rejected; sealing `'DRAFT' -> 'VERIFIED'` strictly binds `NEW."verifiedById" = current_user_id` (`UBOQ_CLIENT_RECEIPT_VERIFIER_FORGED` on mismatch) and requires matching approved-billing allocations (`SUM("allocatedAmount") = "totalReceiptAmount"`, `allocatedAmount = Payment.amountPaid`).
  - **Strict Post-Verification Immutability & Adapter Defense-in-Depth**: Sealed `'VERIFIED'`/`'VOID'` receipts and their `UboqClientReceiptAllocation` rows reject all `UPDATE`/`INSERT`/`DELETE` mutations (`UBOQ_CLIENT_RECEIPT_SEALED_IMMUTABLE`). `loadReconciledBatchCCashFlowSchedule` also independently validates `verifiedById` finance/commercial role + active non-narrowed assignment (`409 TEMPLATE_COLLECTION_ALLOCATION_UNVERIFIED` on failure).

### 3.3 `WP3-BC-IR-R2-03` — Executive Budget Snapshot Linkage (`MEDIUM` — CLOSED)
- **Root Cause Remediated**: An approved unbound project-wide `UboqContractorTargetBudget` (`snapshotId = NULL` and `phaseLineId = NULL`) could previously be applied across multiple approved/superseded snapshot versions on the same project.
- **Remediation (`canonical-source-adapters.ts` + Migration `#32`)**:
  - In `loadT10ExecutiveMarginCanonicalData`, queries all governed (`APPROVED` / `SUPERSEDED`) `UboqOperationalSnapshot` versions on `projectId`. An unbound project-wide target budget (`snapshotId === null && phaseLineId === null`) is accepted **only** when the project has a unique single governed snapshot (`projectGovernedSnapshots.length === 1 && projectGovernedSnapshots[0].id === snapshot.id`). When multiple approved/superseded snapshots exist, `T10` fails closed with `409 TEMPLATE_TARGET_BUDGET_ASSOCIATION_AMBIGUOUS` (`reason: 'UNBOUND_PROJECT_WIDE_BUDGET_AMBIGUOUS_ACROSS_MULTIPLE_SNAPSHOTS'`) until an approved budget explicitly binds `snapshotId`.
  - Upgraded `public.uboq_guard_target_budget_lineage()` to reject incomplete approval fields and reject binding an approved target budget to an unapproved snapshot (`UBOQ_TARGET_BUDGET_UNAPPROVED_SNAPSHOT_DENIED`).

---

## 4. Forward-Only Migrations `#30`, `#31` & `#32` (Prior `#1`–`#31` Byte-Identical)
- **Migrations `#1`–`#31` Preserved Byte-for-Byte**:
  - Migrations `#1`–`#29`: `29/29` checksums unchanged on disk and in `_prisma_migrations`.
  - Migration `#30`: `prisma/migrations/20261113190000_wp3_batch_c_t8_t10_templates_and_commitment_cashflow_rls/migration.sql` (`SHA-256: 4e99b7ab8a22793316fd1e23bf0a47c6c7b345e597d0f7e5d40cf64578724c9b`) — untouched.
  - Migration `#31`: `prisma/migrations/20261113200000_wp3_batch_c_ir_receipt_budget_and_export_audit_hardening/migration.sql` (`SHA-256: 0689880947acc2dc7cb973decf5ea4e2e45e63e9bec7e4d4f1b5cb5e01114735`) — untouched.
- **Forward-Only Migration `#32`**:
  - Path: `prisma/migrations/20261113210000_wp3_batch_c_r2_audit_receipt_and_budget_authority/migration.sql`
  - SHA-256: `087f69d4edc1ca82126d4d4d059453eb3aac322a3fd84cd780b4fb49e58f57e3`
  - Receipt: `artifacts/uboq/wp3/batch-c/migration32-apply.json` (`rollback_preflight: "PASS"`, `final_ledger_count: 32`, `migrations_1_to_31_verified: 31`, `sensitive_export_log_compat_direct_insert_granted: false`).

---

## 5. Verification Summary & Remaining Governance Holds
- **R2 Final Control Hardening Suite** (`scripts/uboq/verify-wp3-batch-c-r2-hardening.ts` -> `artifacts/uboq/wp3/batch-c/r2-targeted-tests.json`):
  - **`3/3 PASS`** (`WP3-BC-IR-R2-01`..`R2-03`), verifying signed executive `SET LOCAL` custom GUC + direct SQL `INSERT` denial, signed executive forged-attestation `uboq_append_sensitive_export_log` / `uboq_append_formal_sensitive_export_log` denial, genuine `T0`/`T1` formal + `T8`/`T9`/`T10` working export `sha256` provenance, `VIEWER`/`SITE_ENGINEER`/`PROJECT_MANAGER`/narrowed-role receipt write rejection, forged `verifiedById` & post-seal mutation rejection, valid finance split receipt preservation, and two-snapshot unbound project-wide budget `409` rejection (`249/249` public tables clean).
- **R1 Targeted IR Remediation Suite** (`scripts/uboq/verify-wp3-batch-c-ir-corrections.ts` -> `artifacts/uboq/wp3/batch-c/ir-targeted-tests.json`):
  - **`5/5 PASS`** (`WP3-BC-IR-01`..`IR-05`, `249/249` public tables clean).
- **Consolidated Batch C Regression & Browser E2E Suite** (`scripts/uboq/verify-wp3-batch-c.ts` -> `artifacts/uboq/wp3/batch-c/runtime-tests.json`):
  - **`7/7 PASS`** (`WP3-BC-01`..`WP3-BC-07`, real headless Chromium E2E across `T8`/`T9`/`T10` at `1440x900` desktop & `390x844` mobile, `36/36` numeric `D2:L5` OpenXML cells, `T0`–`T7` non-regression smoke, `249/249` public tables clean).
- **Static Validation Gate** (`artifacts/uboq/wp3/batch-c/validation-exits.json`):
  - `npx.cmd tsc --noEmit` (`0`), `npx.cmd eslint ...` (`0`), `npx.cmd prisma validate` (`0`).
- **Remaining Separate Release Holds**:
  1. **Migration `#14` Provenance Hold**: Open release-integrity hold prior to production (`Migrations #1`–`#31` untouched).
  2. **Migration `#23` 32-bit XID Rollover Hardening**: Required prior to `PREVIEW` promotion.
  3. **External Statutory Formats**: `AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED`; `T8`–`T10` remain non-statutory internal analytical outputs (`isFormalComplianceOutput: false`).
  4. **WP-3 Batch D Deferred**: `T11_VARIATION_IMPACT`, `T12_CHANGE_REGISTER`, and signed round-trip workbook re-import remain gated pending Batch C independent review acceptance.
