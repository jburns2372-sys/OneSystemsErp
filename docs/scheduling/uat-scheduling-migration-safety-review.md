# UAT Scheduling Migration Safety Review

## Schema Diff Summary
- **Missing Tables**: 21 tables including `ScheduleBOQAllocation`, `BaselineActivation`, `ScheduleApproval`, etc.
- **Missing Enums**: 7 enums including `ProjectScheduleWorkflowStatus`, `ScheduleApprovalStage`, etc.
- **Obsolete Objects**: `ScheduleBOQMapping`
- **Destructive Changes**: `DROP TABLE ScheduleBOQMapping`

## Migration Plan

### 1. `20260714_reconcile_pre_phase3_schema_drift`
- **Purpose**: Reconcile pre-phase 3 schema drift before applying core scheduling workflow migrations
- **Affected Objects**: `BOQExtractedItem`, `SecuritySimulationArchive`, `ProjectBOQVersion`
- **Preconditions**: None
- **Data Loss Risk**: None
- **Lock Risk**: Low
- **Rollback Consideration**: Revert additive schema changes
- **Classification**: SAFE_ADDITIVE

### 2. `20260714114200_harden_schedule_baseline_activation`
- **Purpose**: Add idempotency keys and required partial uniqueness protections for baseline activation
- **Affected Objects**: `BaselineActivation`, `ProjectSchedule`, `ScheduleApproval`
- **Preconditions**: None
- **Data Loss Risk**: None
- **Lock Risk**: Low
- **Rollback Consideration**: Drop new columns and indexes
- **Classification**: SAFE_ADDITIVE

### 3. `20260714190000_phase3_baseline_workflow`
- **Purpose**: Implement Phase 3 scheduling baseline workflow, lineage, and approval schema
- **Affected Objects**: `ProjectSchedule`, `ScheduleBOQAllocation`, `ScheduleApproval`, `ScheduleBOQMapping`
- **Preconditions**: ProjectSchedule table must be empty to safely drop ScheduleBOQMapping
- **Data Loss Risk**: Zero (Precondition met: ProjectSchedule count is 0)
- **Lock Risk**: Low
- **Rollback Consideration**: Restore database from backup due to dropped table ScheduleBOQMapping
- **Classification**: SAFE_WITH_PRECONDITION

## Uniqueness Protections Verified
1. **One valid active baseline per project**: Yes (`ProjectSchedule_one_active_baseline_per_project`)
2. **One authoritative, non-invalidated BaselineActivation per schedule**: Yes (`BaselineActivation_one_authoritative_per_schedule` with `isAuthoritative = true AND invalidatedAt IS NULL`)

## Deploy Compatibility
The migration plan is fully compatible with `npx prisma migrate deploy`. `prisma db push` is not recommended.
