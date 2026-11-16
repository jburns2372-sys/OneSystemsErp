# WP-3 increment 01 — T0/T1 working templates

The owner supplied independent review `OSERP-PROJ-UBOQ-001-G02-R3-INDEPENDENT-20261112` accepts the G02-R3 source/security evidence for continued isolated LOCAL development, with recorded limitations. The reviewer inspected supplied source and evidence and did not independently execute PostgreSQL. The accepted archive remains unchanged at SHA-256 `a689c9bd0311b3ad77ce11ecf2481ddb0a63a0873e37d1d9c717ae9f28977b12`. The supplied review and authorization/gate record are retained in `artifacts/uboq/wp3/increment-01/`.

## First increment

The existing UBOQ workbench links to `/projects/[id]/uboq/templates`. The builder supports T0 contract authority versions and T1 awarded phase lines, with source selection, column selection, heading changes, reordering, JSON preview and XLSX/CSV working exports. It reuses the Universal BOQ field catalog, role masking, projection and export engine. Existing ERP routes, adapters and canonical write workflows are unchanged.

`GET /api/uboq/templates?projectId=...` lists up to 100 approved sources per template and only role-permitted columns. `POST /api/uboq/templates` accepts `projectId`, `templateCode`, `sourceId`, optional `selectedFields` and `headingAliases`, and `format` (`json`, `xlsx`, `csv`). This endpoint reads within a signed, repeatable-read, read-only transaction. Project authorization and the actual database role determine visibility. Client-supplied roles, rows, grain changes, computed columns and formal-submission flags are rejected.

T0 loads exactly one approved authority ID. T1 loads exactly one approved operational snapshot, preserving each awarded line, phase and section/location reference. Draft, superseded, unbound and other-project source IDs do not fall back to a different source. T1 requests exceeding 1,000 lines fail rather than exporting a partial result. Decimal facts remain exact decimal text, including in XLSX cells. A visible amount total uses Decimal arithmetic and is absent when the amount column is not authorized/selected. Layout edits do not alter canonical facts.

This increment produces **working copies**. The hidden worksheet preserves source and line identities; it is provenance metadata, not a signature or permission to import changes. Layout persistence, configurable formulas, signed editable round trips, formal compliance/signatory and tax-basis output, PDF, pagination beyond these explicit bounds, and T2–T12 are later increments. No approval, snapshot promotion or ERP posting occurs here.

## Reproducible verification

Run from the existing `OneSystemsERP-UBOQ-001` worktree, with the existing isolated cluster and its private fixture configuration available:

```powershell
$env:WP3_BROWSER = '1'
node node_modules/tsx/dist/cli.mjs scripts/uboq/verify-wp3-increment01.ts
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/eslint/bin/eslint.js src/lib/uboq/templates/t0-t1.ts src/app/api/uboq/templates/route.ts 'src/app/projects/[id]/uboq/templates/TemplateBuilder.tsx' 'src/app/projects/[id]/uboq/templates/page.tsx'
```

The fixture harness verifies localhost:55483 and the recorded private data directory before connecting. It creates and removes only its uniquely prefixed synthetic rows. All public table contents, including the migration ledger, are hashed before setup and after cleanup. The browser harness bundles the actual client component and invokes the actual Next handlers and restricted Prisma client. Only the session DAL is stubbed; full Next application-shell/login verification is not claimed. No real business data or runtime secrets are included in the test screenshots/exports.

The final source/evidence manifest, test reports, screenshots, working-export fixtures and delta patch are retained in the increment evidence package. Completed H01/M01/H02/M02 remediation is preserved without rerun.

## Gates that remain held

- **Migration #14 historical production lineage:** exact applied SQL and authoritative chain of custody remain unresolved. Original forensic database and ledger remain unchanged. No in-place reconciliation is authorized.
- **Migration #23 transaction-ID rollover:** `xmin::text::bigint` uses a 32-bit transaction ID while `txid_current()` includes the epoch. This may fail closed after rollover. A PostgreSQL-version-supported identity mechanism or transactional ownership mechanism, delivered by a forward-only migration plus regression or documented proof, is required **before PREVIEW**. Do not edit applied #23.
- Migrations #1–#23 remain byte-for-byte unchanged. No database migration, production deployment, overall G02 closure, final acceptance or freeze is authorized by this increment.
