# WP-3 Batch D Phase D2 R2 — Independent Review Remediation (`D2-R1-IR-01`..`D2-R1-IR-03`)

- **Project**: `OSERP-PROJ-UBOQ-001`
- **Branch / HEAD**: `release/oserp-proj-uboq-001` (`79a2c5bd3853711cf4960c5d45cff755aaf219d2`)
- **Isolated Local Database**: `127.0.0.1:55483` (`oserp_h02b_local_e5e20dc14c`, PostgreSQL 18)
- **Prior Checkpoint Archive**: `artifacts/uboq/wp3/wp3-batch-d-d2-r1-review.zip` (`SHA-256: 0a1a8a2c5202513a2f4185771ced63dc560fe6c6d0d866e9ee8d7a7785447bd2`)
- **Governance Posture**: **STOPPED AT PHASE D2 R2 INDEPENDENT REVIEW** (`independent_acceptance_claimed: false`)

---

## 1. Forward-Only Migration `#37` (`#1`–`#36` Byte-Identical)

Historical migrations `#1` through `#36` and all **9** frozen prior gate archives (`g02-r3`, `inc01`, `inc02`, `batch-a`, `batch-b`, `batch-c`, `batch-d`, `batch-d-d2`, `batch-d-d2-r1`) were preserved 100% byte-identical. One forward-only SQL migration was applied and verified on `oserp_h02b_local_e5e20dc14c`:

- **Migration `#37`** (`prisma/migrations/20261114020000_wp3_batch_d_d2_r2_migration_checksum_immutability_guard/migration.sql`, `SHA-256: 39eb48330d27e4a3b4192f970c0156045577cc4fd15e92c91133bfc6dc1564ac`):
  - Revokes `ALL` privileges on `public."_prisma_migrations"` from `PUBLIC`, `oserp_compat_app`, and `oserp_maint_cleanup_role`.
  - Creates partial unique index `uboq_prisma_migrations_finished_name_uniq` on `(migration_name) WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`.
  - Installs `BEFORE INSERT OR UPDATE OR DELETE` trigger `trg_uboq_guard_prisma_migration_ledger` (`public.uboq_guard_prisma_migration_ledger()`) blocking checksum overwrites (`42501`), in-place rollbacks (`42501`), deletions of finished migrations (`42501`), duplicate finished ledger entries (`23505`), and malformed SHA-256 checksums (`23514`), while preserving Prisma's standard forward `started_at -> finished_at` lifecycle.
  - Installs `public.uboq_verify_prisma_migration_ledger_state()` for ledger state auditing.

---

## 2. Summary of Remediations (`D2-R1-IR-01`..`D2-R1-IR-03`)

1. **`D2-R1-IR-01` (`HIGH`) — Migration Checksum Integrity**:
   - Removed the `UPDATE _prisma_migrations SET checksum = $1` re-run anti-pattern from `scripts/uboq/apply-wp3-batch-d-d2-r1-migration35.cjs` and wired both `apply-wp3-batch-d-d2-r1-migration35.cjs` and `apply-wp3-batch-d-d2-r1-migration36.cjs` (plus new `apply-wp3-batch-d-d2-r2-migration37.cjs`) through shared `scripts/uboq/migration-checksum-guard.cjs` (`verifyLedgerAgainstDisk`, `assertForwardOnlyMigrationReady`).
   - Enforced database-level immutability via Migration `#37` and live `37/37` disk-to-`_prisma_migrations` SHA-256 parity checks in both `verify-wp3-batch-d-d2-r2.ts` and `package-wp3-batch-d-d2-r2.py`.
2. **`D2-R1-IR-02` (`HIGH`) — Zero-Value Variation Order Arithmetic Reconciliation**:
   - Eliminated all conditional `!isZero()` bypasses across `VariationOrder` headers, `VariationOrderItem` lines, `UNIT_PRICE` quantity/amount rate checks, and `SubcontractorVariationOrder` rows in `loadT11VariationOrderRegisterCanonicalData`.
   - Unconditionally enforces `(additionalAmount - deductiveAmount) == netVariationAmount` on headers, `(additionalAmount - deductiveAmount) == netAmount` on items, header net + gross additive + gross deductive equality against approved item sums, `UNIT_PRICE` zero-qty vs zero-amount consistency, and `originalSubcontractAmt + proposedAdditionalAmt == revisedSubcontractAmt` on `SubcontractorVariationOrder`, while preserving balanced zero-net `COMBINED` VOs, zero-delta specification clarifications, lump-sum SVOs, and 100% deductive SVOs.
3. **`D2-R1-IR-03` (`MEDIUM`) — Revised Quantity Ambiguity**:
   - Replaced the ambiguous `!revQtyDec.isZero() || origQtyDec.isZero()` fallback with `reconcileApprovedVoItemQuantities(...)` across `T5`/`T6`, `T8`–`T10`/`T12`, and `T11`, enforcing canonical snapshot baseline parity, sequential multi-VO `preVoQty -> postVoQty` continuity (`previouslyApprovedQuantity`), signed deductive delta disambiguation (including unsigned UI deductive `currentProposedQuantity`), unconditional `revisedQuantity == postVoQty` (`409` on unpopulated `0` for additive VOs; `200` on verified 100% deductive cancellations to `0.0000`), unconditional SVO quantity reconciliation, and full 3-field `AwardedBOQItem` VO tracking reconciliation.
   - Disambiguated `T11` column headings (`Baseline Awarded BOQ Qty (NO_SUM)`, `Approved VO Item Qty Delta (NO_SUM)`, `Client Contract Revised BOQ Qty (Excl. Subcon VOs, NO_SUM)`), emitted `vo_qty_scope_basis` / `vo_item_pre_qty` / `vo_item_post_qty` in `systemMetaFields`, and blocked misleading custom heading aliases and saved layouts with `409`.

---

## 3. Consolidated Verification & Standing Release Holds

- **Runtime, Security & E2E Suite (`artifacts/uboq/wp3/batch-d-d2-r2/runtime-tests.json`)**: `8/8 PASS` (targeted `D2-R1-IR-01`..`D2-R1-IR-03` positive/negative suites + `D2-IR-01`..`D2-IR-05` regressions + `T11` formal OpenXML + `T1` signed round-trip + `T0`–`T10` smoke + esbuild/Express Chromium E2E + bounded native Next.js 16 server stack E2E), `252` public tables verified byte-for-byte identical before and after, zero synthetic residue.
- **Standing Release Holds Preserved**:
  - Phase D1 staged round-trip canonical-apply workflow gate (`canonicalRecordsMutated: 0`)
  - Migration `#14` historical lineage hold
  - Migration `#23` 32-bit XID rollover hold (`REQUIRED_BEFORE_PREVIEW`)
  - External agency statutory print specifications (`T11` formal output is internal ERP only)
  - No `PREVIEW` / Production deployment, branch merge, or final freeze authorized
