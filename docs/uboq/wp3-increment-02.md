# WP-3 increment 02 — persistent saved layouts and formal T0/T1 export contracts

WP-3 Increment 02 extends the locally verified WP-3 Increment 01 working-copy T0/T1 template builder without altering completed WP-1, WP-2, G02-R3, or WP-3 Increment 01 runtime/evidence contracts. Historical migrations `#1`–`#23`, applied Increment 02 migration `#24` (`bfc43cdb1d4d638edf5d38d80451019b3eb925cf6f03c4ffe46143941018aac8`), the accepted G02-R3 review archive (`a689c9bd0311b3ad77ce11ecf2481ddb0a63a0873e37d1d9c717ae9f28977b12`), and the WP-3 Increment 01 review archive (`1bc762b963f9cb841679bc7119f83d32693fb83293f67647f526ed8fdb4be719`) remain byte-for-byte unchanged.

## A. Persistent project-scoped saved layouts

Forward-only migrations `#24` (`20261113130000_wp3_increment02_saved_layouts_and_formal_exports`) and `#25` (`20261113140000_wp3_increment02_audit_auth_and_contract_link`) harden `UboqTemplateDefinition`, `UboqTemplateAuditEvent`, and `UboqOperationalSnapshot`:

- **Immutable revision lineage:** Each saved layout group shares a project-scoped `layoutGroupId`. Initial creation writes `versionNumber = 1` (`supersedesId = NULL`). Editing a saved layout inserts a new immutable revision (`versionNumber = N + 1`, `supersedesId = head.id`) while preserving every historical revision intact and loadable.
- **Duplication:** Any visible saved layout revision can be duplicated into a new `layoutGroupId` at `versionNumber = 1` with `duplicatedFromId` bound by a same-project composite foreign key `(projectId, duplicatedFromId)`.
- **Controlled sharing & visibility:** Layouts carry `sharingScope` (`PRIVATE` or `PROJECT_SHARED`). `PRIVATE` layouts are readable only by `createdById` (enforced both in PostgreSQL `FORCE ROW LEVEL SECURITY` via `uboq_can_read_template_layout` and in TypeScript). `PROJECT_SHARED` layouts are readable by authorized members of the same project (with role-restricted financial columns automatically masked for non-financial viewers during working-copy load/preview), and may be published or versioned only by controlled-sharing roles (`uboq_can_share_template_layout`). Read-only/`VIEWER` project assignments cannot create, version, or duplicate layouts.
- **Least-privilege append-only audit authorization (`WP3-02-IR-01`):** Direct `INSERT`, `UPDATE`, and `DELETE` on `UboqTemplateAuditEvent` are revoked from `oserp_compat_app` (`SELECT` only). Append-only provenance creation executes exclusively through `public.uboq_append_template_audit_event(...)` coupled with `rls_restrictive_uboq_tpl_audit_tenant` and `trg_uboq_template_audit_event_guard`, which verify:
  - Signed RLS actor binding (`app.current_user_id` and `uboq_check_tenant_rls(projectId)`);
  - Authoritative active `User.role` matching `actorRole` (preventing role forgery);
  - Operation-specific write entitlement (`uboq_can_write_template_layout` + revision lineage/uniqueness for layout lifecycle events; `uboq_can_formal_export_template` + `VAL-19` zero-open-BLOCKING gate + `APPROVED` `UboqContractAuthority` / `UboqOperationalSnapshot` verification for `FORMAL_EXPORT_GENERATED`).

## B. Formal T0/T1 export contracts

`GET/POST /api/uboq/templates/formal-export` implements the validated generic ERP formal contracts using existing canonical source tables:

- `ERP_CANONICAL_T0_FORMAL_V1` (`T0_MASTER_CONTRACT`, `CONTRACT_HEADER`): Sourced directly from an `APPROVED` `UboqContractAuthority` (`contractAssociationStatus = DIRECT_CONTRACT_AUTHORITY_SOURCE`) and its linked `UboqTaxPricingProfile`. Preserves original contractual award amount (`awardedRevenue` / `awardedRevenueExVat`), `currentContractValue`, `pricingMethod`, `contractVatBasis`, `taxProfileVersion`, and contractual reference identifiers.
- `ERP_CANONICAL_T1_FORMAL_V1` (`T1_PHASE_BOQ`, `PHASE_BOQ_LINE`): Sourced from an `APPROVED` `UboqOperationalSnapshot` and its `UboqAwardedPhaseLine` rows. Preserves distinct phase/section/pay-item lines (never collapsing multi-phase items), exact 4dp `originalQty`, `approvedQty`, and `contractUnitRate`, line-level `pricingType`, and authoritative 2dp `contractLineAmount` (never overwritten by `qty * rate`; diagnostic delta recorded separately).
- **Evidence-backed `T1` contract association (`WP3-02-IR-03`):** `T1_PHASE_BOQ` never guesses or picks the newest project `UboqContractAuthority` by timestamp. Contractual pricing/VAT context is populated **only** when `UboqOperationalSnapshot.contractAuthorityId` explicitly binds a same-project `APPROVED` `UboqContractAuthority` (`VERIFIED_SNAPSHOT_CONTRACT_AUTHORITY`, enforced at DB level by `a01_uboq_snapshot_contract_authority_scope`). When `contractAuthorityId IS NULL`, contractual authority fields are explicitly omitted (`null`) and classified as `UNLINKED_MULTIPLE_PROJECT_CONTRACTS`, `UNLINKED_NO_SNAPSHOT_CONTRACT_BINDING`, or `UNLINKED_NO_APPROVED_PROJECT_CONTRACT` (`pricingMethod = LINE_PRICING_TYPE_GOVERNED`, `contractVatBasis = UNLINKED_TO_CONTRACT_AUTHORITY`). Requests supplying an unverified, mismatched, or unapproved `contractAuthorityId` fail closed (`409`).
- **Exact-byte output SHA-256 & provenance (`WP3-02-IR-02`):** For all three formats (`json`, `xlsx`, `csv`), `outputSha256` is computed over the exact UTF-8 / binary HTTP response bytes delivered to the caller. For `json`, `provenance: { auditEventId, digestAlgorithm: 'SHA-256', digestHeader: 'X-OSERP-Output-Sha256' }` is embedded prior to `Buffer.from(JSON.stringify(jsonPayload), 'utf8')` without a recursive digest-in-body, guaranteeing `SHA-256(HTTP body bytes) === X-OSERP-Output-Sha256 === UboqTemplateAuditEvent.outputSha256`. Detached CSV exports carry provenance via HTTP headers and `UboqTemplateAuditEvent` (assess sidecar manifest requirements before any external agency offline CSV exchange).
- **Formulas, totals, compliance (`VAL-19`), and missing external specs:** Phase subtotals and grand totals use `Prisma.Decimal`. Formal XLSX writes numeric cells, a live Excel `SUM(...)` formula, `Formal_Contract_Summary`, and `veryHidden` `__OSERP_META` lineage. Open `BLOCKING` `UboqValidationException` rows block export (`409`). Because no external statutory/agency layout or signatory specification exists in the repository, zero agency/signatory fields are invented and `AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED` is recorded explicitly.
- **Read-only source isolation:** Canonical reads execute inside `SET TRANSACTION READ ONLY` (`RepeatableRead`) under signed RLS context (`withUboqRlsContext`), followed by an append-only audit transaction writing `UboqTemplateAuditEvent` (via `uboq_append_template_audit_event`), `SensitiveExportLog`, and `AuditLog`.

## C. Reconciled T0–T12 template roadmap names (before WP-3 Increment 03)

Template codes in `SYSTEM_TEMPLATE_PRESETS` (`src/lib/uboq/template-builder.ts`) remain unchanged and govern subsequent increments without renaming accepted contracts:

| Code | Accepted Template Name | Row Grain | Status |
| :--- | :--- | :--- | :--- |
| `T0_MASTER_CONTRACT` | Contract & Authority Summary | `CONTRACT_HEADER` | WP-3 Inc 01 (working) + Inc 02 (saved layouts & formal generic) |
| `T1_PHASE_BOQ` | Awarded Multi-Phase Contract BOQ | `PHASE_BOQ_LINE` | WP-3 Inc 01 (working) + Inc 02 (saved layouts & formal generic) |
| `T2_CONSOLIDATED_BOQ` | Consolidated Work Scope View | `CONSOLIDATED_WORK_ITEM` | Deferred to WP-3 Increment 03+ |
| `T3_AGENCY_ESTIMATE` | Agency POW / DUPA Estimate Baseline | `PHASE_BOQ_LINE` | Deferred to WP-3 Increment 03+ |
| `T4_RESOURCE_TAKEOFF` | Procurement Resource Requirement & Stock Balance | `CANONICAL_RESOURCE` | Deferred to WP-3 Increment 03+ |
| `T5_ACCOMPLISHMENT_CERT` .. `T10_EXECUTIVE_MARGIN` | SWA, Progress Billing, CPM/EVM, Half-Month & Quarterly Cash Flow, Executive Margin | Per preset catalog | Deferred to subsequent WP-3 increments |
| `T11`–`T12` | Reserved roadmap slots (not yet allocated in `SYSTEM_TEMPLATE_PRESETS`) | Pending specification | Require explicit owner contract definition before allocation |

## Reproducible verification

Run from `OneSystemsERP-UBOQ-001` against the isolated local PostgreSQL cluster (`127.0.0.1:55483`):

```powershell
node scripts/uboq/apply-wp3-increment02-migration24.cjs
node scripts/uboq/apply-wp3-increment02-migration25.cjs
node node_modules/tsx/dist/cli.mjs scripts/uboq/verify-wp3-increment02-corrections.ts
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/eslint/bin/eslint.js src/lib/uboq/templates/saved-layouts.ts src/lib/uboq/templates/formal-t0-t1.ts src/app/api/uboq/templates/layouts/route.ts src/app/api/uboq/templates/formal-export/route.ts "src/app/projects/[id]/uboq/templates/TemplateBuilder.tsx" "src/app/projects/[id]/uboq/templates/page.tsx" scripts/uboq/verify-wp3-increment02.ts scripts/uboq/verify-wp3-increment02-corrections.ts
```

## Held gates and deferred increments

- **Historical migration `#14` lineage hold:** Remains an open release-integrity hold on historical production lineage; original database and ledger remain untouched.
- **Migration `#23` transaction-ID rollover hardening (required before PREVIEW):** Policy predicates in applied `#23` compare 32-bit `xmin::text::bigint` against 64-bit epoch-qualified `txid_current()`, which will fail closed once XID epoch > 0. A forward-only rollover-safe replacement plus regression proof is required **before PREVIEW**; `#1`–`#24` remain unedited.
- **Future WP-3 increments:** Templates `T2`–`T12` (`T2_CONSOLIDATED_BOQ`, `T3_AGENCY_ESTIMATE`, `T4_RESOURCE_TAKEOFF`, `T5`–`T10`, and reserved `T11`–`T12`) and signed/validated round-trip re-imports remain deferred.
