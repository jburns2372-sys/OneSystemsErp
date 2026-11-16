# OSERP-PROJ-UBOQ-001 — WP-3 Accelerated Batch D Phase D2 (`T11_VARIATION_ORDER_REGISTER` & `T12_CASHFLOW_VARIANCE_TREASURY`)

## 1. Project Owner Ratification Provenance, Prior Gates & Governance Boundary
- **Phase**: WP-3 Accelerated Execution V2 — **Batch D Phase D2 (`T11_VARIATION_ORDER_REGISTER` & `T12_CASHFLOW_VARIANCE_TREASURY`)** on branch `release/oserp-proj-uboq-001` (`HEAD: 79a2c5bd3853711cf4960c5d45cff755aaf219d2`).
- **Truthful Owner Ratification Provenance** (`artifacts/uboq/wp3/batch-d/d0-t11-t12-contract-specifications.json` & `artifacts/uboq/wp3/batch-d-d2/d0-t11-t12-contract-specifications-ratified.json`):
  - **Decision ID**: `OSERP-PROJ-UBOQ-001-WP3-BATCH-D-D0D1-ACCEPTANCE-D2-OWNER-RATIFICATION` (`2026-11-15`, `Asia/Manila`).
  - **Approval Method**: Explicit Project Owner instruction in conversation (*"i approve this all, proceed."* / *"proceed with the best reccomended approach"*); **not** a digital or electronic signature (`electronic_signature_present: false` — no electronic signature is claimed or fabricated).
  - **Pre-Ratification D0 Artifact Preserved**: `b32763c14338b0bae88bfeb9d91fcadca71a4d76cdb44f10aeee7c10ff2cdaa6`.
- **7 Prior Accepted Gate Archives Preserved Byte-for-Byte**:
  - Accepted G02-R3 baseline (`artifacts/uboq/g02-r3/independent-review-candidate.zip`, `SHA-256: a689c9bd0311b3ad77ce11ecf2481ddb0a63a0873e37d1d9c717ae9f28977b12`)
  - WP-3 Increment 01 (`artifacts/uboq/wp3/wp3-increment01-review.zip`, `SHA-256: 1bc762b963f9cb841679bc7119f83d32693fb83293f67647f526ed8fdb4be719`)
  - WP-3 Increment 02 (`artifacts/uboq/wp3/wp3-increment02-review.zip`, `SHA-256: 8b92a0fc6ff4493b1f22b6fc2defcddda85da79e84b0ca7840d0604b569eae0a`)
  - WP-3 Batch A (`artifacts/uboq/wp3/wp3-batch-a-review.zip`, `SHA-256: 6886c6737baab1d4e0923b14473aae6973b48305d177e7d1858210504da4e641`)
  - WP-3 Batch B (`artifacts/uboq/wp3/wp3-batch-b-review.zip`, `SHA-256: 6ec8f21377150d4e80f80e8add0d1b860eb19615db76e6e7ff47a11f1f0ff68f`)
  - WP-3 Batch C (`artifacts/uboq/wp3/wp3-batch-c-review.zip`, `SHA-256: 666ad50c880bd0918a3e2d2b1589843b1664cc7598f8a9ac95c4c78b1609be9c`)
  - WP-3 Batch D (`Phase D0`/`D1`, `artifacts/uboq/wp3/wp3-batch-d-review.zip`, `SHA-256: 6de9865568806160b9462a0804afb59446e89a3ee825a515dc64ce372c24af83`)
- **Migrations `#1`–`#33` Preserved Byte-for-Byte** on disk and in `_prisma_migrations`.

---

## 2. `T11_VARIATION_ORDER_REGISTER` — Approved Variation Order & Contract / Commitment Revision Register
- **Row Grain & Ratified Catalog Extension**:
  - `rowGrain`: `VARIATION_ORDER_ITEM` (`src/lib/uboq/template-builder.ts`).
  - Extends `CANONICAL_FIELD_CATALOG` (`src/lib/uboq/field-catalog.ts`) from `129` to **`134` canonical fields** (`119` Blueprint + `10` `V2_1_R3_EXTENSION` + `5` Owner-ratified `V2_1_R4_VO_EXTENSION` fields):
    1. `vo_number` (`TEXT`, `internal`, `NONE`)
    2. `vo_classification` (`ENUM`: `CLIENT_CONTRACT_VO` | `SUBCONTRACTOR_COMMITMENT_VO`, `internal`, `NONE`)
    3. `vo_approved_qty_delta` (`DECIMAL`, `internal`, `SUM_COMPATIBLE`)
    4. `vo_client_revenue_delta_amt` (`CURRENCY`, `restricted`, `SUM_ONCE`)
    5. `vo_subcon_commitment_delta_amt` (`CURRENCY`, `sensitive`, `SUM_ONCE`)
- **Strict Financial Separation & Fail-Closed Reconciliation (`loadT11VariationOrderRegisterCanonicalData`)**:
  - **Client Contract VOs (`CLIENT_CONTRACT_VO`)**: Reconciles approved client-side `VariationOrder` + `VariationOrderItem` + `VariationOrderApproval` + `VariationOrderDocument` and deduplicates mirrored `ClientVariationOrder` rows. Adjusts client-contract quantity entitlement (`approved_qty`) and contract revenue ceiling (`current_contract_value`) **only**; never alters subcontractor cost commitments.
  - **Subcontractor Commitment VOs (`SUBCONTRACTOR_COMMITMENT_VO`)**: Reconciles approved package-linked `VariationOrder` / `SubcontractorVariationOrder` rows (verified via RLS-guarded `uboq_read_project_subcontract_and_payroll_facts`) and deduplicates `SVO:...` `CommitmentLedger` mirrors across `T8`, `T9`, `T10`, `T11`, and `T12`. Adjusts subcontractor/benchmark cost commitment (`vo_subcon_commitment_delta_amt`) **only**; `vo_client_revenue_delta_amt` is strictly `0.00` and `approved_qty` / `AwardedBOQItem` client baselines remain untouched.
  - **Fail-Closed `409` Guards**:
    - `TEMPLATE_VO_SOURCE_DOCUMENT_MISSING`: Rejects approved VOs lacking supporting `VariationOrderDocument` / `VariationOrderApproval` or orphan `ClientVariationOrder` records.
    - `TEMPLATE_VO_ITEM_APPROVAL_INCOMPLETE`: Rejects approved VOs containing unapproved (`PENDING` / `DRAFT`) line items or zero approved items.
    - `TEMPLATE_VO_LINEAGE_UNVERIFIED`: Rejects VO/SVO items lacking verified `AwardedBOQItem` + approved `UboqOperationalSnapshot` (`UboqAwardedPhaseLine`) or approved `SubcontractPackage` lineage.
    - `TEMPLATE_VO_ARITHMETIC_MISMATCH`: Rejects line-item `qty_delta * unit_rate != netAmount` or header `netVariationAmount` mismatches.
    - `TEMPLATE_DUPLICATE_VO_RECOGNITION`: Rejects duplicate VO/CVO/SVO numbers, conflicting overlapping SVO/CommitmentLedger entries, or client VOs leaked into `CommitmentLedger`.
    - `TEMPLATE_UNAUTHORIZED_BOQ_VO_MUTATION`: Detects and rejects any unapproved or mismatched `AwardedBOQItem` (`approvedClientVoQuantity`, `revisedContractQuantity`, `revisedContractAmount`) tampering; prohibits legacy `/api/projects/[id]/variation-orders/[voId]/approve/route.ts` as an authority.
- **Internal ERP Formal Export (`ERP_CANONICAL_T11_FORMAL_V1`)**:
  - `isFormalComplianceOutput: true` under internal ERP contract `ERP_CANONICAL_T11_FORMAL_V1` (`externalAgencySpecStatus: 'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED'`, `inventedAgencyOrSignatoryFields: []`).
  - Rejects external statutory agency certification requests (`409 FORMAL_SPECIFICATION_NOT_DEFINED`), missing mandatory fields (`409 FORMAL_MANDATORY_FIELD_MISSING`), and open blocking validation exceptions (`409 FORMAL_OPEN_BLOCKING_EXCEPTIONS`).
  - Renders OpenXML `T11_Formal_VO_Register` with live `SUM(...)` formulas **strictly** on summable delta columns (`vo_client_revenue_delta_amt`, plus `vo_subcon_commitment_delta_amt` on executive saved layouts with attested `SensitiveExportLog`).

---

## 3. `T12_CASHFLOW_VARIANCE_TREASURY` — Treasury Cash-Flow Variance & Actual Liquidity Reconciliation
- **Row Grain & Analytical Boundary**:
  - `rowGrain`: `CASH_FLOW_PERIOD` (`isFormalComplianceOutput: false` — formal export rejected at both HTTP `400 FORMAL_TEMPLATE_CODE_NOT_SUPPORTED` and PostgreSQL trigger `uboq_guard_template_audit_event()`).
  - Reuses existing canonical cash-flow fields plus **3 safe AST derived variance columns** (`T12_SAFE_DERIVED_FORMULAS` / `T12_SAFE_DERIVED_VARIANCE_SPECS`):
    1. `receipts_variance_amt` = `actual_cash_receipts_amt - forecast_receipts_amt` (`restricted`, `SUM_DATED`)
    2. `total_forecast_cash_out_amt` = `procurement_cash_out_amt + payroll_subcon_cash_out_amt + other_cash_out_amt` (`sensitive`, `SUM_DATED`)
    3. `disbursement_variance_amt` = `actual_cash_paid_amt - total_forecast_cash_out_amt` (`sensitive`, `SUM_DATED`)
- **Forecast vs Actual Separation & `NO_SUM` Balance Policy (`loadT12CashflowVarianceTreasuryCanonicalData`)**:
  - Invokes `loadReconciledBatchCCashFlowSchedule(..., { preservePureBaselineForecastForVariance: true })` so persisted/schedule-derived forecast cash-out streams remain pure baseline forecasts while verified treasury collections (`Payment` cleared + `UboqClientReceipt` verified allocations) and verified disbursements (`AccountsPayable` paid, `PaymentRecord` paid, `Expense` paid non-accrued, `Payroll` released, deduplicated against `ProjectCostLedger`) populate actual streams.
  - **Unpaid Commitments Excluded from Actual Cash**: Unpaid `AccountsPayable`, accrued unpaid `Expense`, open `PurchaseOrder` balances, and unpaid `SubcontractPackage` / `SubcontractorVariationOrder` obligations contribute **`0.00`** to `actual_cash_paid_amt`.
  - **Strict `NO_SUM` Period Balance Policy**: `quarterly_closing_cash` (`Period Closing Cash (NO_SUM)`) and `quarterly_liquidity_gap` (`Period Liquidity Gap (NO_SUM)`) track running actual treasury liquidity without multi-period summation (`balanceAggregationPolicy: 'NO_SUM_PERIOD_ENDING_AND_PEAK_ONLY'`), with `0` `<f>` formula tags in working XLSX exports.
  - **Fail-Closed `409` Period Guards**: Rejects period gaps/overlaps (`409 TEMPLATE_CASHFLOW_PERIOD_CONTINUITY_INVALID`), out-of-window/post-cutoff cleared actuals (`409 TEMPLATE_CASHFLOW_CUTOFF_PERIOD_MISMATCH`), and duplicate client collection references across billings (`409 TEMPLATE_DUPLICATE_COLLECTION_REFERENCE`).

---

## 4. Forward-Only Migration `#34` & Security Hardening
- **Path**: `prisma/migrations/20261113230000_wp3_batch_d_d2_t11_t12_rls_and_formal_guards/migration.sql`
- **SHA-256**: `ca25baee3da255c9cf624f38ceb8ddbda6358f5f2a7990946b384836a9d8a359`
- **Receipt**: `artifacts/uboq/wp3/batch-d-d2/migration34-apply.json` (`34` applied migrations, Migrations `#1`–`#33` unchanged).
- **Database Controls**:
  - Enables & forces RLS (`ENABLE + FORCE ROW LEVEL SECURITY`) with `uboq_check_tenant_rls`, cross-project BOQ/subcontract FK rejection, and delete denial on `ClientVariationOrder` and `AIVariationOrderValidation`, and hardens cross-project BOQ FK checks on `SubcontractorVariationOrder` and `VariationOrderItem`.
  - Extends `UboqTemplateDefinition` (`uboq_guard_template_definition`) and `UboqTemplateAuditEvent` (`uboq_guard_template_audit_event`) to ratified `T11_VARIATION_ORDER_REGISTER` (`VARIATION_ORDER_ITEM`, `ERP_CANONICAL_T11_FORMAL_V1`) and `T12_CASHFLOW_VARIANCE_TREASURY` (`CASH_FLOW_PERIOD`, formal-export blocked), while keeping unratified `T11_VARIATION_IMPACT` / `T12_CHANGE_REGISTER` rejected fail-closed.
  - Enforces executive-only SQL write/export guards for `vo_subcon_commitment_delta_amt`, `total_forecast_cash_out_amt`, and `disbursement_variance_amt`, and extends HMAC-attested `public.uboq_append_sensitive_export_log` (`_uboq_rls_trust_anchor`, zero reliance on caller-settable GUCs) to `T11` and `T12`.

---

## 5. Remaining Release Restrictions (`STOPPED_AT_BATCH_D_D2_INDEPENDENT_REVIEW`)
1. **Batch D Phase D2 Independent Review Gate**: Execution is paused at `STOPPED_AT_BATCH_D_D2_INDEPENDENT_REVIEW` awaiting Independent Review of `artifacts/uboq/wp3/wp3-batch-d-d2-review.zip`.
2. **Standing Environment & Schema Holds Preserved**:
   - Isolated `LOCAL` development only (`127.0.0.1:55483`); zero `PREVIEW` or Production actions.
   - Migration `#14` historical provenance hold and Migration `#23` 32-bit XID rollover hardening hold remain active prior to `PREVIEW`/Production promotion.
   - `package.json` `build` script remains strictly compilation-only (`prisma generate && next build`; zero `prisma db push` or `--accept-data-loss`).
   - External statutory agency print templates remain `AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED`.
