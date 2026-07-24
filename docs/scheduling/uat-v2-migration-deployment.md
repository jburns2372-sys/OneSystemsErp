# UAT V2 Migration Deployment (Updated)

## Branch Identity
- Branch Name: `scheduling-reconstruction-uat-v2`
- Parent Branch: `main`
- Database: `neondb`
- Role: `neondb_owner`
- Endpoint prefix: `ep-rapid-base-apec3cyh-pooler`

## Pre-Change Backup
- Backup File Size: 649,821 bytes
- Archive Objects: 1,084
- SHA-256: `7926F66D6C9BB5A3E8D83053965897058E0B9485A50B44AF5D24C0AACF5C7257`

## First Deployment Attempt (Failed)
- Start Timestamp: 07/15/2026 15:11:25
- Finish Timestamp: 07/15/2026 15:11:41
- Exit Code: 1
- Order: 1. `20260714_reconcile_pre_phase3_schema_drift` (Failed)
- Database error code: 42601 (ERROR: syntax error at or near "\")
- Resolution: The failed migration was resolved as rolled back on 2026-07-15T07:26:07.106Z.

## Second Deployment Attempt (Successful)
- Start Timestamp: 07/15/2026 15:26:25
- Finish Timestamp: 07/15/2026 15:26:44
- Exit Code: 0
- Order:
  1. `20260714_reconcile_pre_phase3_schema_drift`
  2. `20260714190000_phase3_baseline_workflow`
  3. `20260714200000_harden_schedule_baseline_activation`

## Final Validation
- `npx prisma migrate status`: Database schema is up to date!
- `npx prisma validate`: Valid
- The final schemas matching the approved chain were completely successfully deployed on UAT V2 without any unresolved pending migrations.
