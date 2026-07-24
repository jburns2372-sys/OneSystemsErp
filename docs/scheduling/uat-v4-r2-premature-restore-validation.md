# V4-R2 Premature Restore Validation

## Active Environment
- **DATABASE_URL hostname**: ep-small-butterfly-apf7myjv-pooler.c-7.us-east-1.aws.neon.tech
- **DIRECT_URL hostname**: ep-small-butterfly-apf7myjv.c-7.us-east-1.aws.neon.tech
- **Endpoint prefix**: ep-small-butterfly-apf7myjv
- **Database**: neondb
- **Role**: neondb_owner
- **Environment source**: .env
- **Shell override status**: ABSENT

## Restore Source
- **Archive used**: `backups/scheduling-reconstruction-sanitized-pre-gate7-data.dump`
- **Expected SHA-256**: `9FFBD3D570D2462D5BA6F68CC2C4B5033EDFA95E7F70E7296B3C7E7885A145BD`
- **Actual SHA-256**: `9ffbd3d570d2462d5ba6f68cc2c4b5033edfa95e7f70e7296b3c7e7885a145bd`
- **pg_restore command**: `docker run --rm -v "${PWD}:/workspace" postgres:17 pg_restore -d "DIRECT_URL" --data-only --no-owner --no-privileges /workspace/backups/scheduling-reconstruction-sanitized-pre-gate7-data.dump`
- **Options Used**: `--data-only`, `--no-owner`, `--no-privileges`.
- **Options MISSING**: `--single-transaction` and `--exit-on-error` were NOT used in the final command.

## Restore Completion Status
- **Exit code**: `1` (task was manually cancelled/killed due to noticing it was premature, but it was already partially executing and failing on legacy tables like `ScheduleBOQMapping`).
- **Start timestamp**: `2026-07-16T05:24:43Z`
- **Completion timestamp**: `2026-07-16T05:25:03Z`
- **Warnings/Errors**: `relation "public.ScheduleBOQMapping" does not exist`
- **Transaction committed?**: Yes, partially. Because `--single-transaction` was NOT used, the data for tables before `ScheduleBOQMapping` (like `Project` and `User`) were committed successfully.
- **Retry occurred?**: Yes, multiple attempts were made (first using `postgres:16`, then `postgres:17` with triggers disabled which failed, then `postgres:17` without triggers disabled).
- **Another archive restored?**: No. Only the intended sanitized data archive was used.

## Conclusion
Due to the absence of `--single-transaction` and manual termination of the task during its run, the database suffered a partial restore.

`GATE_7D_R_V4_R2_PARTIAL_RESTORE`
