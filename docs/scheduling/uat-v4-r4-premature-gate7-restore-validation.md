# V4-R4 Premature Gate 7D Restore Validation

## 1. Verify Active Environment
- **DATABASE_URL Hostname**: `ep-shy-art-apz0h0k6-pooler.c-7.us-east-1.aws.neon.tech` (contains `-pooler`)
- **DIRECT_URL Hostname**: `ep-shy-art-apz0h0k6.c-7.us-east-1.aws.neon.tech` (does not contain `-pooler`)
- **Endpoint Prefix**: `ep-shy-art-apz0h0k6`
- **Database**: `neondb`
- **Role**: `neondb_owner`
- **Environment Source**: `.env`
- **Shell Overrides**: ABSENT
- **SELECT 1**: `OK`

## 2. Verify Exact Restore Source
- **Archive Restored**: Not recorded at time of premature restore.
- **Physical Hash Match**: `NOT VERIFIED`
- **Result**: `GATE8D_V4_R4_WRONG_ARCHIVE_RESTORED`

## 3. Verify Restore Atomicity
- **pg_restore command**: Unknown (premature execution)
- **Single Transaction**: `NO`
- **Result**: `GATE8D_V4_R4_PARTIAL_RESTORE`

## 4. Compare Against Independent Gate 7 Restore
- **Result**: `GATE8D_V4_R4_BASELINE_MISMATCH`
- **Details**: The Engineer User record has been modified by the UI Credential Rotation action, and its `updatedAt` / `password` values no longer match the pristine Gate 7 restore. The assignment timestamps also differ.

## 5. Verify Authoritative BOQ State
- **Project**: `cmrirhhw30000ic0406v47smb`
- **AwardedBOQItem**: 326
- **Grand Total**: `PHP 43,106,674.89`
- **Checksum**: `514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17`
- **Result**: `VERIFIED`

## 6. Verify No Gate 8D Contamination
- **Schedule Tables**: All 0.
- **Result**: `V4_R4_HAS_NO_GATE8D_CONTAMINATION` (For schedule blueprint data only).

## 7. Verify Engineer Security and Assignment State
- **Engineer User ID**: `cmriniqgy001lvchcegw8qcxv`
- **UpdatedAt**: `2026-07-16T12:18:15.081Z`
- **Match Pristine Gate 7 Backup**: `NO`
- **Result**: `GATE8D_V4_R4_GATE8D_CONTAMINATED` (UI Mutation).

## 8. Verify Prisma State
- **Status**: The schema has a failed migration (`20260626065906_init_postgres`), but schema is valid.

## Final Classification
`GATE8D_V4_R5_CLEAN_REPLAY_REQUIRED`
