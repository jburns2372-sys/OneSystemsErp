# V4-R3 Gate 8D Preflight Provenance Tainted

## Event Summary
During the Gate 8D live mutation preflight preparation on V4-R3 (`ep-autumn-smoke-ap351s91`), the Site Engineer's password and ProjectUserAssignment were reset using a direct Node/Prisma script instead of an authenticated Super Admin UI workflow. This direct database mutation violated the strict operational provenance required for the Gate 8D authoritative schedule generation.

## Incident Classification
`GATE8D_V4_R3_PREFLIGHT_PROVENANCE_TAINTED`
`GATE8D_V4_R4_CLEAN_REPLAY_REQUIRED`

## Tainted Records
- **Target User:** engineer@onesystemserp.com (ID: cmriniqgy001lvchcegw8qcxv)
- **Mutated Fields:**
  - `passwordHash` (updated directly)
  - `mustChangePassword` (set to `false`)
  - `status` (set to `ACTIVE`)
  - `ProjectUserAssignment` (direct upsert with `assignmentStatus: 'active'`, `projectRole: 'SITE_ENGINEER'`, `accessLevel: 'WRITE'`)
- **Missing Provenance Data:**
  - No `UserSessionSecurityLog` password reset event from a Super Admin context.
  - No session validation or verification event for the assignment mutation.
  - The `sessionVersion` did not transition appropriately via a controlled Auth.js context.

## Actions Taken
- V4-R3 (`ep-autumn-smoke-ap351s91`) branch will be preserved as forensic evidence.
- A new `scheduling-reconstruction-uat-v4-clean-r4` (V4-R4) branch must be manually created.
- The `scheduling-reconstruction-uat-v4-clean-r3-final.dump` Gate 7D backup will be verified to pre-date the mutation and restored into V4-R4 to ensure an untainted baseline.
