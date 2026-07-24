# Gate 7 Forensic Review
## 1. Forensic Backup
- **File**: backups/scheduling-reconstruction-uat-v2-gate7-forensic.dump
- **SHA-256**: 5e4fc64c0a302b9296e564ab789279b488ac0182a8a50e809b6b32fbd4fbc0eb

## 2. Pre-Gate 7 Backup
- **Exists**: true
- **SHA-256**: 08137077ef9a8f0eccb77d786a919b92f48188d36e4127ce1250aaa938623edf

## 3. DB Push Impact
- **Classification**: DB_PUSH_SCHEMA_DRIFT_NO_PROVEN_DATA_LOSS
- **Columns Added**: sourceProvenance

## 4. Current DB Records
- **Projects**: 2
- **BOQ Versions**: 9
- **Priced Lines**: 326
- **BOQ Locks**: 1
- **Project Schedules**: 0

## 5. 326 Persisted Lines Verification
- **Matched Lines**: 326
- **Differences**: 0

## 6. Financial Totals
- **General Requirements**: 0.00
- **Mechanical Works**: 0.00
- **Electrical Works**: 0.00
- **Grand Total**: 43106674.89
- **Differences**: -0.00

## 7. Checksums
- **Target (Historical)**: 040d59da1b76e0721c26645a74207c40b33f27c2a3df4a1c216b6340bf9f2fb7
- **A (Gate 6 Preview)**: 514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17
- **B (Manifest)**: 514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17
- **C (DB Lines)**: 514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17

## 8. Gate 6 Evidence
- **Status**: GATE_6_EVIDENCE_INCONSISTENT

## 9. Selected Recovery Path
- **Path**: PATH C — GATE 6 SOURCE REVALIDATION

## 10. Final Result
- **Result**: GATE_6_SOURCE_REVALIDATION_REQUIRED
