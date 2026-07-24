# UAT V2 Generated SQL Repair

## Root Cause
The Node-based SQL generator (`scripts/build_migration_v2.js`) used the escape sequence `\\n` when building the SQL string (`lines.join('\\n')`). This caused literal backslash-n (`\n`) character sequences to be written to the generated `migration.sql` instead of structural newline characters. This resulted in PostgreSQL failing to parse the migration with a `syntax error at or near "\"`.

## Generator File and Defect
- **File**: `scripts/build_migration_v2.js`
- **Defect Line**: `fsOut.writeFileSync('prisma/migrations/20260714_reconcile_pre_phase3_schema_drift/migration.sql', lines.join('\\n'));`

## Corrected Escaping Behavior
- The `join` delimiter was corrected to use the actual newline character `\n`: `lines.join('\n')`.
- This ensures structural lines are correctly delineated without emitting literal backslashes into the text body.

## Escape Counts
- **Before**: > 200 literal `\n` sequences where structural newlines were intended.
- **After**: 0 literal `\n` sequences. All 647 lines are delineated properly.

## Semantic Diff Result
The corrected SQL output contains no semantic changes compared to the formally approved source change. The only difference is valid SQL formatting and actual line breaks.

- Same intended tables, columns, types, nullability, defaults, foreign keys, indexes
- Same compatibility assertions
- Same exception behavior and helper-function cleanup
- Same migration order

## Failed Migration History Row
```json
{
  "id": "0d48f112-2e7a-4f0c-8529-73ef05a07627",
  "migration_name": "20260714_reconcile_pre_phase3_schema_drift",
  "finished_at": null,
  "applied_steps_count": 0,
  "logs": "A migration failed to apply... Database error code: 42601 Database error: ERROR: syntax error at or near \"\\\""
}
```

## Resolve --rolled-back Result
Command: `npx prisma migrate resolve --rolled-back 20260714_reconcile_pre_phase3_schema_drift`
Result: `Migration 20260714_reconcile_pre_phase3_schema_drift marked as rolled back.`
The database row was updated to set `rolled_back_at: 2026-07-15T07:26:07.106Z`.

## Successful Migration Order
Command: `npx prisma migrate deploy`
1. `20260714_reconcile_pre_phase3_schema_drift`
2. `20260714190000_phase3_baseline_workflow`
3. `20260714200000_harden_schedule_baseline_activation`

## Final Schema Verification
`npx prisma migrate status`: Database schema is up to date!
`npx prisma validate`: The schema at prisma\schema.prisma is valid 🚀

## Final Row Counts
- ProjectSchedule: 0
- BaselineActivation: 0
- ScheduleReviewComment: 0
- ScheduleApproval: 0
- ScheduleWBS: 0
- ScheduleActivity: 0
- ScheduleDependency: 0
- ScheduleBOQAllocation: 0

## Backup SHA-256
`7926F66D6C9BB5A3E8D83053965897058E0B9485A50B44AF5D24C0AACF5C7257`

## Acceptance State
Confirmed that no acceptance data was created. The scheduling tables remain completely empty.
