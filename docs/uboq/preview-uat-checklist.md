# OneSystemsERP Universal BOQ (`OSERP-PROJ-UBOQ-001`) — Preview UAT Checklist

**Environment:** Isolated Preview (`jburns2372-sys-projects/one-systems-erp` + Dedicated Preview Neon Project + Private Preview Vercel Blob Store `store_XuH1XvlM7GKo3wX9`)  
**Prerequisite:** All gates `PRE-GATE-01` through `PRE-GATE-07` in `preview-pre-deployment-gate-report.json` must be **`PASS`** prior to starting Preview UAT.

---

## 1. Pre-UAT Smoke & Security Sanity Gate

- [ ] **UAT-00.1 — Preview Access Protection:** Unauthenticated external browser request to the `*.vercel.app` Preview URL is gated by Vercel Authentication (`ssoProtection: all_except_custom_domains`), not publicly indexed.
- [ ] **UAT-00.2 — Database & Storage Isolation:** Confirm active Preview project writes land only in the dedicated Preview Neon project (`39/39` migrations parity) and dedicated private Preview Vercel Blob store (`store_XuH1XvlM7GKo3wX9` / `onesystemserp-uboq-vault-preview` under `uboq-private-vault/preview/<projectId>/<sha256>.uboqvault`), with **zero** network or credential overlap with Production.
- [ ] **UAT-00.3 — Unscoped RLS Zero-Row Check:** Verify restricted runtime logins (`oserp_preview_compat_login`, `oserp_preview_payroll_login`) have `rolsuper = false` and `rolbypassrls = false`.

---

## 2. Role-Based Functional & Financial Integrity UAT (`T0`–`T12`)

### A. Contract Intake, Snapshot Governance & `T0`–`T2` (`Quantity Surveyor` / `Commercial Director`)
- [ ] **UAT-01.1 — Immutable Source Document Upload (Vercel Blob Private Vault):** Upload a sample multi-phase BOQ `.xlsx`; verify SHA-256 hash calculation, private Vercel Blob storage URI (`uboq-vercel-blob://store_XuH1XvlM7GKo3wX9/uboq-private-vault/preview/...`), `AES-256-GCM` decryption, and byte-verified authenticated readback (while direct blob URL returns `403`).
- [ ] **UAT-01.2 — Contract Authority & Tax Profile (`T0_MASTER_CONTRACT`):** Configure VAT-inclusive government profile (`12%` VAT, `5%` Gov VAT withholding, `2%` EWT, `10%` retention) and private corporate VAT-exclusive profile; verify `T0` projection & formal export (`ERP_CANONICAL_T0_FORMAL_V1`).
- [ ] **UAT-01.3 — Multi-Phase Awarded BOQ & Consolidation (`T1_PHASE_BOQ`, `T2_CONSOLIDATED_BOQ`):** Approve operational snapshot; verify phase subtotals, UOM family normalization, and lump-sum non-consolidation guard (`TEMPLATE_UNSAFE_LUMP_SUM_CONSOLIDATION`).
- [ ] **UAT-01.4 — Signed `T0`/`T1` Round-Trip Import (`Phase D1`):** Export a signed `T0`/`T1` round-trip workbook, submit an unmodified/authorized round-trip package (`PASS`), then tamper with one cell or cross-project ID and confirm fail-closed cryptographic rejection (`409` / `403`) with zero silent overwrite of approved BOQ baselines.

### B. Agency Estimate, Resource Takeoff & Procurement Handoff (`T3`–`T4` — `Cost Control` / `Purchasing Officer`)
- [ ] **UAT-02.1 — Agency POW/DUPA Baseline (`T3_AGENCY_ESTIMATE`):** Verify internal working view renders `estimated_direct_cost`, `ocm_amount`, `contractor_profit_amt`, `estimate_vat_amt`, and `estimated_total_amount` while rejecting `T3` on `POST /api/uboq/templates/formal-export` (`400 FORMAL_TEMPLATE_CODE_NOT_SUPPORTED`).
- [ ] **UAT-02.2 — Resource Takeoff & Benchmark Balance (`T4_RESOURCE_TAKEOFF`):** Verify `resource_required_qty`, `allocated_usable_stock_qty`, `open_mr_reserved_qty`, `committed_qty`, and `resource_to_procure` reconcile with Material Requests and Purchase Orders (`ERP_CANONICAL_T4_FORMAL_V1`).

### C. Accomplishment, Progress Billing & CPM/EVM (`T5`–`T7` — `Site Engineer` / `Billing Engineer` / `PM`)
- [ ] **UAT-03.1 — Statement of Work Accomplished (`T5_ACCOMPLISHMENT_CERT`):** Log inspected physical accomplishment; verify cumulative certified quantity cannot exceed approved BOQ quantity and verify `ERP_CANONICAL_T5_FORMAL_V1` export.
- [ ] **UAT-03.2 — Progress Billing & Verified Receipt Allocation (`T6_PROGRESS_BILLING`):** Generate approved progress billing; verify gross billing, retention, advance recoupment, withholding deductions, `net_certified_due`, and anti-double-counting client receipt allocation (`UboqClientReceiptAllocation`).
- [ ] **UAT-03.3 — CPM Schedule & EVM (`T7_SCHEDULE_EVM`):** Verify `cpm_total_float`, `planned_value`, `earned_value`, `actual_cost`, `spi`, and `cpi` against baseline schedule links.

### D. Cash Flow, Executive Margin, Variation Orders & Treasury Variance (`T8`–`T12` — `Finance Officer` / `Executive Director`)
- [ ] **UAT-04.1 — Half-Month & Quarterly Cash Flow (`T8_CASHFLOW_HALF_MONTH`, `T9_CASHFLOW_QUARTERLY`):** Verify period continuity, out-of-window payment fail-closed handling, and unique billing claim aggregation per period.
- [ ] **UAT-04.2 — Executive Profitability & EAC (`T10_EXECUTIVE_MARGIN`):** Verify `target_profit`, `target_margin`, `commitment_open_amt`, `etc_uncommitted`, `forecast_eac`, and `forecast_profit` are visible to `FINANCE_DIRECTOR` / `COMMERCIAL_DIRECTOR` and **redacted** for `PROJECT_MANAGER` / `SITE_ENGINEER` / `VIEWER`, and confirm `SensitiveExportLog` records an attested `approved = true` row.
- [ ] **UAT-04.3 — Variation Order Register (`T11_VARIATION_ORDER_REGISTER`):** Verify `VARIATION_ORDER_ITEM` grain, separate client revenue delta (`vo_client_revenue_delta_amt`) vs. subcontractor commitment delta (`vo_subcon_commitment_delta_amt`), zero-value VO header-vs-item arithmetic mismatch rejection (`D2-IR-02`), subcontract package lineage validation (`D2-IR-03`), and unambiguous client-revised quantity headings (`D2-IR-05`).
- [ ] **UAT-04.4 — Cashflow Variance & Treasury (`T12_CASHFLOW_VARIANCE_TREASURY`):** Verify `actual_treasury_closing_cash` uses verified opening balance (`UboqTreasuryOpeningBalance`) when present and falls back to explicit zero-basis movement headings (never claiming available treasury liquidity without verified opening balance, `D2-IR-04`).

---

## 3. Statutory Separation, Security & Payroll Rollover Regression Checks

- [ ] **UAT-05.1 — External Statutory Export Block (`409 Conflict`):** Confirm requesting `DPWH_POW_PROGRAM_OF_WORKS`, `DPWH_DUPA_DETAILED_UNIT_PRICE_ANALYSIS`, `DPWH_SWA_STATEMENT_OF_WORK_ACCOMPLISHED`, `DPWH_VARIATION_ORDER_AGENCY_FORM`, `COA_DISBURSEMENT_AND_INSPECTION_CERTIFICATE`, or `BIR_EXTERNAL_TAX_CERTIFICATE_FORM` on both `POST /api/uboq/templates/formal-export` and `GET /api/uboq/export` returns **`409`** (`statutoryCertificationClaimed: false`), and valid internal exports include `X-OSERP-Statutory-Certification: NONE_INTERNAL_ERP_ONLY`.
- [ ] **UAT-05.2 — Cross-Project & Narrowed-Viewer PBAC/RLS Isolation:** Confirm an executive user assigned as `VIEWER` on a project has restricted/sensitive financial columns stripped on `GET /api/uboq/export` and template previews, and an unassigned user receives `403`.
- [ ] **UAT-05.3 — Company Payroll Command Lifecycle (`Migration #39`):** As `SUPER_ADMIN` / `SYSTEM_ADMIN` with `EmployerPayrollAuthority`, execute `CREATE_PERIOD`, `VIEW`, `EDIT_DRAFT`, and `DELETE_DRAFT` on `/api/payroll/company/command` in Preview and confirm `200 OK` + duplicate period `403`.

---

## 4. Preview UAT Sign-Off Exit Criteria (Before Production Gate Review)

- [ ] Zero `CRITICAL` or `HIGH` defects open across `UAT-00` through `UAT-05`.
- [ ] Zero synthetic/test fixture leakage into Production; Preview database `_prisma_migrations` remains `39/39` checksum-matched.
- [ ] Full isolated `pg_dump -Fc` -> `pg_restore` drill into a disposable database completed and verified before any Production cutover request.
- [ ] Written UAT sign-off recorded by Project Manager, Finance Director, and Project Owner.
