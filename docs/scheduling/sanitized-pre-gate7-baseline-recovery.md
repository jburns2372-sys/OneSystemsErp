# Sanitized Pre-Gate7 Baseline Recovery

This document records the sanitization and verification of the pre-Gate 7 baseline backup to establish a clean UAT V4 environment.

## 1. Source Inventory
- **Archive:** `backups/scheduling-reconstruction-uat-v2-prechange.dump`
- **Contamination:** 435 legacy `AwardedBOQItem` records (created 2026-07-13).
- **Dependencies:** None. No `ProjectBOQVersion`, `ScheduleBOQAllocation`, or billing records referenced these items.

## 2. Sanitization Operation
- Restored isolated local container: `onesystemserp-gate7d-sanitizer`
- Executed `DELETE FROM "AwardedBOQItem"`
- **Before:** 435 rows
- **Removed:** 435 rows
- **After:** 0 rows

## 3. Sanitized Archives Created
- **Full Dump:** `backups/scheduling-reconstruction-sanitized-pre-gate7-full.dump`
  - Size: 630,562 bytes
  - SHA-256: `EA8FEFF5795AED81B8BE14EEABEDE010CA84E6DB6889993CCFF1AFE89810A1CD`
- **Data-Only Dump:** `backups/scheduling-reconstruction-sanitized-pre-gate7-data.dump`
  - Size: 183,057 bytes
  - SHA-256: `9FFBD3D570D2462D5BA6F68CC2C4B5033EDFA95E7F70E7296B3C7E7885A145BD`

## 4. Independent Verification
The full sanitized archive was restored into a third isolated container (`onesystemserp-gate7d-verify`) and audited.
- **Project Shell:** 1 (Valid)
- **Users & PBAC:** Present
- **BOQ Contamination:** 0
- **Schedule Contamination:** 0
- **Classification:** `VERIFIED_CLEAN_PRE_GATE7_BACKUP`
