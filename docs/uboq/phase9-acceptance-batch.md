# Phase 9 focused acceptance batch

Baseline: `f7ce05cb3041c23626ba4d3826909b4b6f1b9069`. Issue #4 governs this batch. All mutations are confined to `.worktrees/project-intake-p9` and its Git branch. No deployment, migration, live database write or existing assignment change was performed.

## Demonstrated defects and corrections

1. Multipart intake accepted missing/unknown tax profiles and incompatible sectors. The HTTP boundary now requires a known explicit sector/profile pair matching the stored project classification. Unclassified legacy projects must confirm classification before HTTP BOQ staging. Draft regeneration rejects incompatible overrides and can reuse a saved compatible selection. Shared engine defaults and direct server-action callers remain unchanged.
2. Concurrent evidence inserts returned an error and could delete a content-addressed object another request had committed. Unique-constraint losers now reload the winner under project RLS context, verify vault integrity and return its ID. Failed inserts retain possible orphan objects for reference-aware reconciliation; inline deletion cannot prove another request is not referencing the same bytes.
3. The shared BOQ orchestrator had the same unique-source race. Reproduced against the pinned original source with `PHASE9_COMPARE_BASELINE=1` and the concurrency test. Losers now replay the winner without staging another financial snapshot. Explicit `allowDuplicateNewRevision` behavior for an existing document remains available.
4. Two private-blob writers could both observe absence and the loser fail before database idempotency. Failed no-overwrite writes now recover only when authenticated readback verifies the expected project and SHA-256. No overwrite or unauthenticated fallback was introduced.
5. The scanner accepted a specific MIME declaration contradicting detected content. Specific mismatches now fail closed. Omitted/generic declarations and established CSV/XML/JPEG aliases remain accepted. The BOQ HTTP route now checks File identity, size and MIME before invoking the existing extraction pipeline.
6. The first build inferred the parent checkout as Turbopack's workspace root from its lockfile. That attempt was stopped. `next.config.ts` now pins `turbopack.root` to its own absolute config directory, as documented in the installed Next.js guide. Type generation passed with the isolated root; the corrected build is the applicable attempt.
7. TypeScript exposed incompatible full-client transaction types in the new document handlers/page (five call sites). `applyProjectRlsSessionVars` now requests only `Pick<Prisma.TransactionClient, '$executeRaw'>`, the sole capability its body uses. All seven source callers were inspected; the generated JavaScript is identical to the pinned baseline (`artifacts/phase9-rls-type-only.json`). RLS SQL/proof creation and authorization behavior are unchanged. No permission or authentication suite was rerun for this erased type correction.

Shared callers were identified before correction: orchestrator callers are HTTP intake, `src/app/actions/uboq/index.ts` and `scripts/uboq/run-wp2-local-verification.ts`; scanner callers include the two upload routes, universal parser and signed round-trip import; vault resolution is shared by orchestration and evidence routes. Tax arithmetic, canonical templates, schema, migrations, authentication and RBAC implementations were not changed.

## New evidence

`node --test scripts/uboq/phase9-acceptance.test.cjs`: **38/38 PASS** before dependency recovery. Raw output: `artifacts/phase9-acceptance-tests.tap`. The tests use an allowlisted TypeScript VM loader that rejects unexpected imports; database/session/authorization services are mocked and no service credentials are loaded. Vault checks exercise real local disposable files and real AES-GCM crypto with a mocked private-blob transport.

Coverage: explicit tax confirmation and regeneration; project creation/creator assignment/transaction failure; sequential and concurrent evidence/BOQ uploads; one DRAFT snapshot for duplicate initial uploads; pending human review prevents staging; immutable hash/project binding and encrypted-object tampering; evidence upload limits and scanner mismatch rejection; download authorization/attachment headers; document register scoping; multi-file UI partial success and required tax selection.

These checks prove the application control flow under isolated fixtures. They do not claim live PostgreSQL transaction/RLS semantics, live Blob transport, browser rendering or Owner acceptance. Immediate duplicate replay may return the winning source before its snapshot is finished; refresh/retry reads the persisted result without creating another snapshot.

## Reused evidence

The frozen baseline ledger retains historical T0-T12, Phase 5/6/7 and reported RBAC evidence with their source/environment limits. No historical suite was repeated. The thirteen accepted source digests were preserved. Current dependencies and the baseline lockfile are unchanged.

The initial sandboxed install encountered network permission errors. The authorized `npm ci` retry failed with `ECONNRESET` during downloads. The existing main-checkout dependency tree was inspected read-only: all 1,367 overlapping installed lock entries matched this lockfile, whose SHA-256 is `53b7702e42127f46138d5138091efef613a21c953f74294aa4a77a49aa81520c`. Dependency recovery copies that tree into this isolated worktree; no junction is used and the source tree is not modified. Partial npm installation/cache stays in local ignored artifacts.

Prisma client generation passed (6.19.3; generated into local `node_modules`, no migration). Next type generation passed. Focused ESLint on the five corrected application modules reported zero errors and seven unused-binding warnings in the orchestrator; `--max-warnings 0` therefore exited 1. All seven bindings occur in three lines confirmed identical to the pinned baseline. They are outside the corrected intake flow and were left unchanged.

The sandboxed build failed at the existing Google Fonts Inter download. A network-enabled retry compiled successfully in 43 seconds and entered type checking; it was stopped after the separate TypeScript run demonstrated the transaction-type defect. Final type/build checks apply the type-only fix. These retries respond to concrete environment/configuration/type failures and do not repeat accepted suites.

## Remaining acceptance

Type/build results and final source digests are recorded in the accompanying batch receipt after execution. `scripts/uboq/phase9-local-checks.cjs` supplies only synthetic credentials and a closed loopback database endpoint for generation/type/build commands.

Required before acceptance: independent review; real disposable PostgreSQL concurrency/RLS checks; exact-commit disposable Preview UAT for create/assign/register/upload/download/stage; private-blob transport checks; Owner sign-off. This batch does not merge PR #2 or work on Security PR #3. Failed-upload orphan reclamation must use reviewed reference-aware reconciliation, never blind inline deletion.
