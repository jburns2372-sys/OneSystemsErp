# Phase 9 acceptance inventory

Inspected source: `f7ce05cb3041c23626ba4d3826909b4b6f1b9069` on `feat/oserp-unified-project-intake-p9`.
Execution control: [Issue #4](https://github.com/jburns2372-sys/OneSystemsErp/issues/4).
Worktree: `.worktrees/project-intake-p9`, tracking the existing origin branch, initially clean.

This is a source inventory and evidence freeze, not functional acceptance. The companion `phase9-accepted-baseline-ledger.json` pins historical receipt digests, source identities, environments and selective regression triggers. Historical evidence stays at its original location and was read without modification. Unknown validated SHAs remain null.

## Implemented versus unverified

| Scenario | Existing implementation | Missing acceptance evidence / precise delta check |
| --- | --- | --- |
| Create project without BOQ | `src/app/actions/project-intake.ts` validates profile fields and PROJECT_MANAGEMENT create grant; transaction inserts PLANNING project with zero contract amount | Exercise permitted creation and invalid inputs; assert no BOQ, authority, snapshot or approval writes |
| Creator assignment | Same transaction inserts active FULL assignment for the creator | Verify project and assignment commit together and both roll back on assignment failure; verify creator workspace access |
| Project profile | `src/app/projects/ProjectStartButton.tsx`, projects list and project detail wire profile creation and navigation | Browser check all three sectors and creation-to-workspace navigation |
| Categorized multi-file register | Document client loops selected files individually, routes CONTRACT_BOQ to structured intake and other categories to evidence endpoint; page loads project-filtered register | Mixed success/failure batch, category persistence, refresh, legacy missing-sector behavior |
| Evidence storage and scanning | Evidence POST enforces nonempty File / 25 MiB limit, invokes scanner with declared MIME, stores hash and immutable vault URI; pending classification metadata | Empty/oversized/mismatched MIME/magic rejection; verified readback; failed database insert cleanup; no baseline mutation |
| PBAC / RLS / role scope | New page/API handlers call stage authorization, document grants and project RLS session helpers | Assigned versus unassigned actor, narrowed assignment, missing DOCUMENTS grant; do not rerun unrelated RBAC suites |
| Authorized download | Download endpoint filters document by ID and project, checks download grant, verifies vault hash and project binding; attachment/no-store/nosniff response | Cross-project document ID denied; wrong vault project/hash fails closed; missing grant denied; response headers checked |
| Duplicate evidence | Existing project/hash/category lookup returns preserved ID after vault readback | Sequential replay and concurrent duplicate requests; confirm no existing object deletion on competing insert failure |
| Awarded BOQ tax profile | Client requires explicit profile from sector-specific choices | API multipart path currently defaults omitted sector/profile to CORPORATE / CORP_PH_VAT_EXCL_12; demonstrate missing/invalid/mismatched profile handling before a narrowly scoped fix |
| Draft-only staging | Client calls multipart intake; orchestrator creates DRAFT snapshots; approval is a separate action/capability | Assert multipart upload cannot approve or mutate live awarded baseline; retain human-review gate on unresolved candidates |

## Evidence reuse and limits

- All 13 accepted R2 source digests match after LF normalization. Reuse their accepted local source evidence; no template or financial-engine suite was rerun.
- The Phase 9 ten-file diff against `a850708f003798fbc237b8908330a0552beed7ec` contains no package, lockfile, Next/TypeScript config, Prisma schema/migration, `src/auth.ts`, or `src/lib/permissions.ts` changes.
- Phase 5 records six historical PASS checks. It does not establish type/build PASS for the ten new Phase 9 files.
- Phase 6 records seven readiness gates PASS for its candidate archive. Phase 7 records 19/19 Preview checks at `e753c2647e0fd5765c8c690c3b282588bb4efd17`, ready for Owner acceptance. Neither receipt establishes current Phase 9 acceptance or live environment identity.
- Issue #4 reports preserved RBAC 71/71 and Preview 6/6 PASS. Their exact validated SHA is not established by the issue, so no new environment acceptance is inferred.
- July 25 exact Production deployment SHA remains unknown. No Production inspection or operation was needed for this local batch.

## Next bounded batch

Prepare isolated dependencies without copying credentials or changing the main worktree. No worktree-local `node_modules` exists yet. Read the installed Next.js guides before application code changes. Run missing exact-source TypeScript/build checks and focused mocked intake/action tests; these are justified by the ten Phase 9 file changes and absent exact-SHA evidence. Verify that test imports cannot initialize real database/storage clients. Start with API tax-profile validation and duplicate-evidence concurrency reproduction. Do not run database migrations or broad historical suites.

Only after local checks pass, verify the exact disposable Preview identity and execute Phase 9 delta UAT. Leave PR #2 draft pending independent review and acceptance.

## Batch result

DONE: authorized worktree creation, exact SHA verification, evidence ledger and acceptance inventory.
REUSED PASS: preserved accepted source evidence, bounded to its recorded historical local scope.
NEW TESTS: none; only Git/source/digest inspection performed.
BLOCKED: no blocker to continued local development; exact-SHA build, functional UAT and Owner acceptance remain NOT VERIFIED.
NEXT: isolated dependency preparation and the missing Phase 9 checks described above.
