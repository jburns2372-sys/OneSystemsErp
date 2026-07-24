
# Pre-Gate 7 Physical Backup Audit

**Archive File:** `backups/scheduling-reconstruction-uat-v2-prechange.dump`
**Size:** 649821 bytes
**SHA-256:** `7926F66D6C9BB5A3E8D83053965897058E0B9485A50B44AF5D24C0AACF5C7257`
**Object Count:** 1073

## Restore Command
```bash
docker exec onesystemserp-gate7d-backup-audit pg_restore -U postgres -d gate7d_backup_audit --no-owner --no-privileges --exit-on-error --single-transaction /workspace/backups/scheduling-reconstruction-uat-v2-prechange.dump
```

## Baseline Verification
- Project Shell: Exists
- PBAC Exists: Yes
- Required Actors:
  - director@onesystemserp.com: PROJECT_DIRECTOR
  - manager@onesystemserp.com: PROJECT_MANAGER
  - engineer@onesystemserp.com: SITE_ENGINEER

## BOQ Contamination
- ProjectBOQVersion (Target): 0
- AwardedBOQItem (Global): 435
- Orphan AwardedBOQItems: 435
- Variance Approvals: 0

## Schedule Contamination
- Global Schedules: 0
- Target Schedules: 0
- Activities, Dependencies, Allocations: 0

## Audit History
- Total Reconstruction Audits: 0
- Gate 7/8 Audits: 0

## Final Classification
**PRE_GATE7_BACKUP_CONTAMINATED_BY_BOQ_RECORDS**
    