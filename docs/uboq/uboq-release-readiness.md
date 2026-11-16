# Universal BOQ Intake (`OSERP-PROJ-UBOQ-001`) — Release-Readiness Runbook & Technical Record

**Branch:** `release/oserp-proj-uboq-001`  
**Execution Scope:** Isolated Local PostgreSQL 18.4 (`127.0.0.1:55483/oserp_h02b_local_e5e20dc14c`)  
**Stop Boundary:** **Release-Readiness Review Gate** (`previewDeployment = false`, `productionDeployment = false`, `branchMerge = false`, `finalFreeze = false`)

---

## 1. Phase 1 — Phase D2 R3 Local Acceptance Receipt

- **Disposition:** `ACCEPTED_FOR_ISOLATED_LOCAL_DEVELOPMENT` (zero Preview or Production acceptance claimed).
- **Evidence Artifact:** `artifacts/uboq/release-readiness/phase1-d2-r3-local-acceptance-receipt.json`
- **Preserved Artifacts & Baselines:**
  - **11/11** frozen review ZIP archives verified byte-intact, including:
    - `artifacts/uboq/wp3/wp3-batch-d-d2-r2-review.zip` (`6b6509fd3306624530f7a40e4c1c8f327b63f602959ea87a0608e9c80d21db47`)
    - `artifacts/uboq/wp3/wp3-batch-d-d2-r3-delta-review.zip` (`4d1df11342b59524d5a83eed26728f7269bcbbb9ac318acb28f06b118f1e18fa`)
  - **13/13** accepted `T0`–`T12` canonical template/adapter/UI source files (`artifacts/uboq/wp3/batch-d-d2-r3/r2-evidence-references.json`) preserved with zero modifications.
  - **38/38** baseline migrations (`#1`–`#38`) preserved untouched on disk and in `_prisma_migrations`.

---

## 2. Phase 2 — Migration `#14` Provenance Resolution & Preflight Gate

- **Migration:** `20261104193000_add_uboq_engine_and_g01_exc_01`
- **Disposition:** `BLOCKED_WITH_EVIDENCE` (clean isolated local DB `PASS`; any target DB holding historical divergent checksum `FAIL_CLOSED`; Preview/Production pending read-only target-ledger preflight audit).
- **Evidence Artifact:** `artifacts/uboq/release-readiness/phase2-migration14-provenance.json` (`4/4 PASS` via `scripts/uboq/verify-migration14-provenance-gate.cjs`).

### Authoritative Forensic Findings
1. **`origin/main` Baseline:** `origin/main` contains only pre-UBOQ migrations `#1`–`#13` (ending at `20260724125410_reconcile_schema_foreign_keys`). Migration `#14` has never been merged to `main`.
2. **Canonical Reviewed Lineage (`HEAD` & Isolated Local DB):** `prisma/migrations/20261104193000_add_uboq_engine_and_g01_exc_01/migration.sql` on `HEAD` (`79a2c5bd...`), the working tree, and `REVIEWED_HEAD_migration.sql` are byte-identical (`92,792` LF bytes, `SHA-256: a4accf399ceeccd246e98f659dd1057805583e61af247a1a88f6e060a8b2016e`). The isolated local PostgreSQL 18.4 database (`oserp_h02b_local_e5e20dc14c`) matches `a4accf39...` with zero drift.
3. **Quarantined Historical Dev Lineage (`testdb_uboq_001`):** Exhaustive scan of all Git object blobs and historical patch bundles confirmed **zero** repository blobs match `2b26be208ef667ceb135b97a40f0ba73cea0f45c0f5413698d5ce55daa17` or `8f860386...`. Those digests originated from an unversioned pre-commit draft applied manually to `localhost:5432/testdb_uboq_001` on `2026-11-04`, followed by an early script (`2a0d0f7`) that overwrote `_prisma_migrations.checksum` to `8f860386...` (removed in `HEAD`). No historical records were rewritten or fabricated.
4. **Pre-Deploy Read-Only Gate Protocol:** Before running `prisma migrate deploy` against any Preview or Production database, operators must run `evaluateTargetLedgerForMigration14()` (`scripts/uboq/verify-migration14-provenance-gate.cjs`), which permits **only**:
   - `ELIGIBLE_PRE_UBOQ_BASELINE` (`#1`–`#13` exact `origin/main` baseline, `#14` absent), or
   - `ELIGIBLE_CANONICAL_REVIEWED_LINEAGE` (`#14` finished cleanly with checksum `a4accf39...`),
   and fails closed (`BLOCKED_DIVERGENT_MIGRATION_14` / `BLOCKED_INCOMPLETE_OR_ROLLED_BACK_M14`) on any divergent ledger.

---

## 3. Phase 3 — Migration `#23` XID Rollover Remediation (Migration `#39`)

- **Original Migration:** `#23` (`20261113110000_g02_operation_reads_and_worker_projection`)
- **Forward-Only Remediation Migration:** `#39` (`prisma/migrations/20261116020000_uboq_release_readiness_m23_xid_rollover_hardening/migration.sql`, `12,709` LF bytes, `SHA-256: 8a59460606809aa46a835f86ec82cffb076e7b727a60aa65622b4313376fce62`)
- **Disposition:** `PASS` (`5/5 PASS` via `scripts/uboq/verify-phase3-migration23-xid-rollover.ts`, `syntheticResidueCount: 0`).
- **Evidence Artifacts:** `artifacts/uboq/release-readiness/migration39-apply.json`, `artifacts/uboq/release-readiness/phase3-migration23-xid-rollover.json`

### Technical Root Cause & Hardened Design
- **Defect in Migration `#23`:** `h02b_company_read` RLS policies on `"PayrollPeriod"`, `"Payroll"`, and `"DailyTimeRecord"` evaluated `(xmin::text::bigint = txid_current())` to allow `CREATE_PERIOD` (`VIEW = false`) to read back rows inserted within the active transaction. Because `xmin` is a 32-bit `xid` while `txid_current()` (`pg_current_xact_id()`) is a 64-bit epoch-extended XID (`epoch * 2^32 + low32`), that equality fails permanently once the PostgreSQL cluster advances past XID epoch `0` (`>= 2^32` transactions).
- **PostgreSQL 18 `VACUUM (FREEZE)` Subtlety:** In PostgreSQL 18, `VACUUM (FREEZE)` sets `HEAP_XMIN_FROZEN` in `t_infomask` while leaving the original 32-bit `t_xmin` value in the tuple header, meaning modulo-`2^32` `xmin` comparison alone has a `1-in-2^32` collision surface with ancient frozen rows.
- **Migration `#39` Fix:**
  1. Added `created_row_keys text[] NOT NULL DEFAULT '{}'::text[]` to `public._company_payroll_commands` (preserving public base table count at `252`), populated by `company_payroll_guard()` on validated `CREATE_PERIOD` `INSERT`s and cleared by `company_payroll_finish()`.
  2. Added `IMMUTABLE` helper `public.company_payroll_xmin_matches_xid8(p_tuple_xmin xid, p_current_xid8 xid8)` using PostgreSQL's native `(p_current_xid8::xid = p_tuple_xmin)` modulo-`2^32` projection (verified across epochs `0, 1, 2, 42, 1000` including `low32 = 3` and `2^32 - 1`).
  3. Replaced `(xmin::text::bigint = txid_current())` across `"PayrollPeriod"`, `"Payroll"`, and `"DailyTimeRecord"` with `public.company_payroll_created_in_current_xact(table, id, xmin)`, requiring simultaneous:
     - `company_payroll_xmin_matches_xid8(p_tuple_xmin, pg_current_xact_id())`,
     - `age(p_tuple_xmin) = 0`, and
     - verified `created_row_keys` membership in `_company_payroll_commands` bound to 64-bit `txid_current()` and 128-bit cryptographic `nonce`.
  4. Added `public.uboq_inspect_xid_rollover_health()` (`EXECUTE` restricted to `oserp_migrations_owner` and `oserp_dbo_verifier`) to audit `datfrozenxid` age, per-table `relfrozenxid` age, autovacuum configuration, and long-running transactions.

---

## 4. Phase 4 — Statutory Format Separation & Fail-Closed Guard

- **Disposition:** `PASS` (`PASS_INTERNAL_ERP_SEPARATED_EXTERNAL_STATUTORY_DISABLED`, `3/3 PASS` via `scripts/uboq/verify-phase4-statutory-formats.ts`, `syntheticResidueCount: 0`).
- **Evidence Artifact:** `artifacts/uboq/release-readiness/phase4-statutory-format-readiness.json`

### Internal ERP vs. Disabled External Statutory Formats
- **Enabled Internal ERP Formal Contracts (`POST /api/uboq/templates/formal-export`):**
  - `ERP_CANONICAL_T0_FORMAL_V1`, `ERP_CANONICAL_T1_FORMAL_V1`, `ERP_CANONICAL_T4_FORMAL_V1`, `ERP_CANONICAL_T5_FORMAL_V1`, `ERP_CANONICAL_T6_FORMAL_V1`, `ERP_CANONICAL_T11_FORMAL_V1`.
  - Every contract stamps `X-OSERP-External-Agency-Spec: AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED`, `inventedAgencyOrSignatoryFields: []`, and `statutoryCertificationClaimed: false`.
- **Disabled External Statutory Formats (`409 Conflict`):**
  - `DPWH_POW_PROGRAM_OF_WORKS` (missing official DPWH DO Program of Works / ABC cover layout & district engineering signatory/seal block)
  - `DPWH_DUPA_DETAILED_UNIT_PRICE_ANALYSIS` (missing official DPWH DUPA item print layout & statutory schedule rounding rules)
  - `DPWH_SWA_STATEMENT_OF_WORK_ACCOMPLISHED` (missing official DPWH SWA certificate form & Resident/District Engineer attestation block)
  - `DPWH_VARIATION_ORDER_AGENCY_FORM` (missing official DPWH VO/EWO agency form & statutory legal-basis endorsement block)
  - `COA_DISBURSEMENT_AND_INSPECTION_CERTIFICATE` (missing COA circular disbursement voucher & inspection witness block)
  - `BIR_EXTERNAL_TAX_CERTIFICATE_FORM` (missing BIR Form 2307 print layout & authorized tax-agent TIN signature block)
- **Working Export Route Hardening (`src/app/api/uboq/export/route.ts`):**
  - Removed silent fallback to `T1_PHASE_BOQ` on unknown or statutory `templateCode` values (`DPWH_*`, `COA_*`, `BIR_*`, etc. now fail closed with `409 EXTERNAL_STATUTORY_EXPORT_DISABLED_SPEC_ABSENT`; unknown codes return `400 TEMPLATE_CODE_NOT_SUPPORTED`).
  - Blocked `formal=true` bypass (`409 WORKING_EXPORT_FORMAL_MODE_DISABLED`) and statutory query parameters (`409`).
  - Enforced `SET TRANSACTION READ ONLY`, `APPROVED`-only canonical baseline reads, `VIEWER` assignment redaction, `SensitiveExportLog` attestation for sensitive projections (`T10_EXECUTIVE_MARGIN`, `T8`/`T9`), and non-statutory headers (`X-OSERP-Statutory-Certification: NONE_INTERNAL_ERP_ONLY`).

---

## 5. Phase 5 — Final Local Verification, Backup Readiness & Rollback Model

- **Evidence Artifacts:** `artifacts/uboq/release-readiness/phase5-final-local-verification.json`, `artifacts/uboq/release-readiness/release-readiness-checkpoint.json`
- **Build Safety:** `package.json` `scripts.build` verified strictly as `"prisma generate && next build"` with zero `prisma db push`, `--accept-data-loss`, or `migrate reset` invocations.
- **Logical Backup & Restore Readiness:** Verified PostgreSQL 18 `pg_dump` plain-SQL and custom (`-Fc`) schema archives plus `pg_restore --list` TOC validation across all `252` public base tables, RLS policies, and security functions.
- **Rollback Model:** In-place `_prisma_migrations` row deletion or `checksum`/`finished_at` mutation is permanently blocked (`42501`) by `trg_uboq_guard_prisma_migration_ledger` (Migrations `#37`/`#38`). Failed DDL transactions roll back atomically before `finished_at` is set; post-apply recovery uses pre-deployment logical backup / PITR snapshot restore or a forward-only compensating migration.
