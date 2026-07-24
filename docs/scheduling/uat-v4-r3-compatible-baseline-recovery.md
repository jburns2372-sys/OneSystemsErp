# UAT V4-R3 Compatible Baseline Recovery

## Objective
Verify the empty schema-only starting state of `scheduling-reconstruction-uat-v4-clean-r3`, restore the proven V4-compatible sanitized data-only archive atomically, and confirm that the reconstructed baseline matches all requirements for the authenticated Gate 7D-R replay.

## Branch Information
- **Branch**: `scheduling-reconstruction-uat-v4-clean-r3`
- **Schema Source**: `scheduling-reconstruction-uat-v3-clean`
- **Database Endpoint**: `ep-autumn-smoke-ap351s91`

## Starting State Verification
Before any data was restored or migrations applied, a baseline zero-count verification was executed:
- **Project**: 0
- **User**: 0
- **ProjectUserAssignment**: 0
- **AwardedBOQItem**: 0
- **ProjectSchedule**, **ScheduleWBS**, **ScheduleActivity**, etc.: 0
- **Status**: `V4_R3_SCHEMA_ONLY_STARTING_STATE_VERIFIED`

## Physical Archive Verification
- **Archive**: `backups/scheduling-reconstruction-sanitized-pre-gate7-data-v4-compatible.dump`
- **SHA-256**: `ec17472e01640b100efdc0f3b09c3ba62cd8a7ea14d93142f60d2fc393f2ebac`
- **Size**: 182,551 bytes
- **Excluded Objects**: `ScheduleBOQMapping`, `neon_auth` schema, `_prisma_migrations`
- **Status**: `V4_COMPATIBLE_SANITIZED_DATA_ARCHIVE_RECONFIRMED`

## Atomic Data-Only Restore
The archive was restored using the following exact parameters via `DIRECT_URL`:
- `--data-only`
- `--no-owner`
- `--no-privileges`
- `--exit-on-error`
- `--single-transaction`

The restore process exited with code `0`. The transaction committed completely on the first attempt with no errors, partial data, missing table errors, or constraint errors.
- **Status**: `V4_R3_COMPATIBLE_DATA_RESTORE_SUCCEEDED`

## Restored Baseline Verification
After the data was restored, the verification script proved the integrity of the data:
- **Project Shell**: `PGH_AWARDED BILL OF QUANTITY` exists.
- **Required Users**: 10 essential accounts exist.
- **Project User Assignments**: Only the `SUPER_ADMIN` (J BURNS) is assigned to the target project. No other roles have initial access.
- **All other transactional data**: Counted precisely at 0 (BOQ Versions, AwardedBOQItems, Scheduling child orphans, reconstruction events).

## Prisma and Auth.js Verification
Because the schema-only branch did not copy the original `_prisma_migrations` table, the 6 required V4 migrations were synchronized manually using `npx prisma migrate resolve --applied`.
- `npx prisma migrate status` confirms 100% synchronization.
- `npx prisma validate` confirms valid Prisma configuration.
- `npx prisma generate` completed successfully.
- Auth.js login verification logic confirmed the existence and correct schema alignment for the manager, director, and engineer accounts.

## Final Classification
**GATE_7D_R_V4_R3_CLEAN_BASELINE_READY**
