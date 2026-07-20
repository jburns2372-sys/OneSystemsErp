# Forensic Evidence: V4-R1 Run

## Overview
This document serves as immutable forensic evidence for the V4-R1 reconstruction run, which achieved the correct financial totals (326 rows, PHP 43,106,674.89, Checksum `514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17`) but suffered from invalid provenance.

## Details

- **BOQ Version ID**: cmrn10y9q0000vcow2groeygi
- **Project ID**: cmrirhhw30000ic0406v47smb
- **Row Count**: 326
- **Category Totals**:
  - General Requirements: PHP 2,700,549.00
  - Mechanical Works: PHP 23,674,716.57
  - Electrical Works: PHP 16,731,409.32
- **Grand Total**: PHP 43,106,674.89
- **Checksum**: 514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17
- **Technical Approver ID**: cmrinimix001avchckwzmfxsu (Project Manager)
- **Final Approver ID**: cmrinimix001avchckwzmfxsu (Project Manager instead of Director due to testing artifact)
- **Super Admin Lock Actor ID**: cmqiy15bq0000vc1cq1f3zg6j (Super Admin instead of Project Director)
- **Direct Email Modification**: `true`. The Super Admin email was forced to lowercase directly in the database to bypass the case-sensitivity bug in the login route.

## Timestamps

- **Committed At**: 2026-07-16T04:46:19.255Z
- **Approved At**: 2026-07-16T04:46:29.662Z
- **Locked At**: 2026-07-16T04:46:45.719Z

## Classification
`V4_R1_FINANCIALLY_VALID_PROVENANCE_INVALID`
