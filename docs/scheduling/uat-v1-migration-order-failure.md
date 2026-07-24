# UAT v1 Migration Order Failure Evidence

- **Audit Timestamp**: 2026-07-15T06:31:46.861Z
- **Schema Object Count**: 211
- **ProjectSchedule Exists**: true (Rows: 0)
- **BaselineActivation Exists**: false (Rows: 0)

## Migration History
### 20260626065906_init_postgres
- **Started At**: Fri Jun 26 2026 14:59:07 GMT+0800 (China Standard Time)
- **Finished At**: Fri Jun 26 2026 14:59:11 GMT+0800 (China Standard Time)
- **Rolled Back At**: null
- **Applied Steps**: 1
- **Logs**: null

### 20260714_reconcile_pre_phase3_schema_drift
- **Started At**: Wed Jul 15 2026 14:16:30 GMT+0800 (China Standard Time)
- **Finished At**: null
- **Rolled Back At**: Wed Jul 15 2026 14:24:52 GMT+0800 (China Standard Time)
- **Applied Steps**: 0
- **Logs**: A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-re...

### 20260714_reconcile_pre_phase3_schema_drift
- **Started At**: Wed Jul 15 2026 14:24:53 GMT+0800 (China Standard Time)
- **Finished At**: Wed Jul 15 2026 14:24:53 GMT+0800 (China Standard Time)
- **Rolled Back At**: null
- **Applied Steps**: 0
- **Logs**: null

### 20260714114200_harden_schedule_baseline_activation
- **Started At**: Wed Jul 15 2026 14:25:16 GMT+0800 (China Standard Time)
- **Finished At**: null
- **Rolled Back At**: null
- **Applied Steps**: 0
- **Logs**: A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-re...

