# Lost B3 Database Recovery Assessment

## STAGE A — LOST DATABASE RECOVERY ASSESSMENT
- **Review Findings**: We identified the historical endpoint as `ep-blue-wave-ap23fyj1.c-7.us-east-1.aws.neon.tech`. The evidence from prior test runs confirms B3 successfully persisted to this Neon Postgres database branch.
- **Current Availability**: The endpoint `ep-blue-wave-ap23fyj1` is detached or deleted, rendering authentication impossible.
- **Source Search**: Deep searches of the current `ep-red-mountain-ap48rfat` main branch, the `ep-dry-cloud-ap2wwgug` retained old main branch, and local data (`dev.db`, JSON backups) show that `cmrjo4msn0000vc9c7s65o3lt` and associated ProjectSchedule/BOQ records are not present.
- **Conclusion**: `LOST_B3_DATABASE_NOT_RECOVERABLE`

## STAGE B — AUTHORITATIVE RECONSTRUCTION READINESS
- **Schema Presence**: The Prisma schema currently defines the required Phase 3 Baseline Workflow capabilities, activation hardening, idempotency protections, and the canonical `ProjectSchedule` structure.
- **Required Migrations**: To bring `main` to the final authoritative scheduling schema, the following migrations must be applied sequentially (without using `prisma db push`):
  1. `20260714_reconcile_pre_phase3_schema_drift`
  2. `20260714114200_harden_schedule_baseline_activation`
  3. `20260714190000_phase3_baseline_workflow`

## STAGE C — SOURCE-DATA RECOVERY PLAN
- **Recoverable Source**: We successfully located the authoritative awarded BOQ file: `pgh_files/Progress_Accomplishment_Template_Based_on_Awarded_BOQ.xlsx`.
- **Missing Source**: None.
- **Checksum Verification**: Verification is strictly possible. The recovery script evaluates against the specific historical hash `040d59da1b76e0721c26645a74207c40b33f27c2a3df4a1c216b6340bf9f2fb7`.
- **Exact Reconstruction**: 326 detail rows can be precisely reconstructed.
- **Original Awarded Amount**: The amount of 43,106,674.89 (with exact category splits of 2,700,549.00 / 23,674,716.57 / 16,731,409.32) can be independently verified.

## STAGE D — RECONSTRUCTION PLAN
1. Back up the current main database.
2. Confirm main is the designated authoritative environment.
3. Apply only reviewed, ordered Prisma migrations (`20260714_reconcile_pre_phase3_schema_drift`, `20260714114200_harden_schedule_baseline_activation`, `20260714190000_phase3_baseline_workflow`).
4. Verify all required scheduling tables, columns and indexes.
5. Restore or recreate the Project record from authoritative source documents (Start: `2026-06-12`, Completion: `2026-12-09`).
6. Import and lock the awarded BOQ using `pgh_files/Progress_Accomplishment_Template_Based_on_Awarded_BOQ.xlsx`.
7. Recalculate the BOQ checksum.
8. Require exact agreement with the historical checksum when the original source data is available (`040d59da1b76e0721c26645a74207c40b33f27c2a3df4a1c216b6340bf9f2fb7`).
9. Run schedule generation through the real application service.
10. Validate: 1 root WBS, 12 phases, 14 activities, 11 dependencies, 326 allocations, 100% BOQ coverage, 43,106,674.89 exact scheduled amount, no cycles, final phase Project Acceptance and Demobilization.
11. Perform the human-review workflow once.
12. Activate one authoritative `BL-001`.
13. Perform one idempotent retry.
14. Create one controlled draft revision.
15. Run the full final read-only acceptance audit.
16. Save durable JSON, Markdown, screenshot and Playwright evidence. *(Historical IDs like `clean-candidate-1784004755783` will not be reused).*

## STAGE E — FINAL CLASSIFICATION
LOST_B3_DATABASE_NOT_RECOVERABLE_RECONSTRUCTION_READY
