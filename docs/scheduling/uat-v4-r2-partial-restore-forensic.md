# V4-R2 Partial Restore Forensic

**Classification:** V4_R2_PARTIAL_RESTORE_FORENSIC_BRANCH
**Endpoint:** ep-small-butterfly-apf7myjv

## Details
- **Archive used:** `backups/scheduling-reconstruction-sanitized-pre-gate7-data.dump`
- **Archive SHA-256:** `9ffbd3d570d2462d5ba6f68cc2c4b5033edfa95e7f70e7296b3c7e7885a145bd`
- **pg_restore command:** `docker run --rm -v "${PWD}:/workspace" postgres:17 pg_restore -d DIRECT_URL --data-only --no-owner --no-privileges /workspace/backups/scheduling-reconstruction-sanitized-pre-gate7-data.dump`
- **Single transaction used:** No (`--single-transaction` was absent)
- **Exit code:** 1
- **Failure timestamp:** `2026-07-16T05:25:03Z`
- **Failing object:** `ScheduleBOQMapping`
- **Warnings and Errors:** `relation "public.ScheduleBOQMapping" does not exist`

## Committed Tables
Due to the absence of the `--single-transaction` flag, the command partially committed records before reaching the failing object:
- Project: 1 row
- User: 10 rows
- ProjectUserAssignment: 1 row
