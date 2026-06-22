# OneSystemsERP — Backup and Restore Checklist

**Document Code:** CKL-008  
**Version:** 1.0  
**Classification:** Internal — System Administrators Only (CONFIDENTIAL)  
**Effective Date:** June 2026  

---

## Instructions

This checklist covers all **backup, restore, and disaster recovery** procedures for OneSystemsERP. The System Administrator is solely responsible for these operations. All backup and restore actions must be logged in the System Audit trail.

> [!CAUTION]
> Backup and restore operations affect the **entire system database**. Incorrect execution can result in **permanent data loss**. Follow every step carefully and verify at each stage.

---

## Part A: Routine Backup Procedures

### A1. Daily Backup Checklist

| # | Task | Status | Date | Time |
|---|------|--------|------|------|
| A1.1 | ☐ Verify the **automated daily backup** ran successfully | | | |
| A1.2 | ☐ Check the backup file was created with correct **timestamp** | | | |
| A1.3 | ☐ Verify the backup file **size** is consistent with recent backups | | | |
| A1.4 | ☐ Confirm the backup was stored in the **designated backup directory** | | | |
| A1.5 | ☐ Verify the backup was replicated to the **off-site/cloud location** | | | |
| A1.6 | ☐ Log the backup status in the **System Audit notes** | | | |

### A2. Weekly Backup Verification

| # | Task | Status | Date |
|---|------|--------|------|
| A2.1 | ☐ Review the **backup log** for the past 7 days — all successful? | | |
| A2.2 | ☐ Verify **3 backup copies** exist (local, cloud, off-site) | | |
| A2.3 | ☐ Check **disk space** on backup storage — sufficient for next 30 days? | | |
| A2.4 | ☐ Verify **backup retention policy** — delete backups older than the retention period | | |
| A2.5 | ☐ Document any backup **failures** and their resolution | | |

### A3. Monthly Backup Procedures

| # | Task | Status | Date |
|---|------|--------|------|
| A3.1 | ☐ Perform a **full database backup** (not incremental) | | |
| A3.2 | ☐ Create a **labeled monthly archive** backup | | |
| A3.3 | ☐ Store the monthly archive in **off-site secure storage** | | |
| A3.4 | ☐ Verify the monthly archive is **readable and complete** | | |
| A3.5 | ☐ Update the **backup inventory log** | | |

---

## Part B: Manual Backup Procedure

**When to use:** Before major system updates, configuration changes, data migrations, or as a pre-restore safety net.

| # | Step | Command / Action | Status |
|---|------|-----------------|--------|
| B1 | ☐ Notify all users that a **maintenance window** is active | (Email/Chat notification) | |
| B2 | ☐ Verify no critical **transactions are in progress** | Check active sessions | |
| B3 | ☐ Navigate to the server / hosting environment | SSH / Terminal / Dashboard | |
| B4 | ☐ Run the backup script: | `node backup_db.js` | |
| B5 | ☐ Wait for the script to complete successfully | Verify success message | |
| B6 | ☐ Verify the backup file was created: | Check backup directory | |
|    | — File exists | | |
|    | — File has correct timestamp in name | | |
|    | — File size is reasonable (compare to recent backups) | | |
| B7 | ☐ Copy the backup to **at least 2 additional locations**: | | |
|    | — Cloud storage (e.g., Google Drive, S3, Azure Blob) | | |
|    | — Off-site physical storage (USB, external drive) | | |
| B8 | ☐ Log the backup in the **Backup Inventory** | | |
| B9 | ☐ Notify users that maintenance is complete | | |

---

## Part C: Restore Procedure

> [!CAUTION]
> **Restoring a backup OVERWRITES the current database.** All data created after the backup point will be permanently lost. This action requires **written authorization from the Project Director**.

### C1. Pre-Restore Authorization

| # | Task | Status | Date |
|---|------|--------|------|
| C1.1 | ☐ Document the **reason for restore** (data corruption, accidental deletion, etc.) | | |
| C1.2 | ☐ Obtain **written authorization** from the Project Director | | |
| C1.3 | ☐ Identify the **correct backup** to restore (date, time, description) | | |
| C1.4 | ☐ Notify **all users** that the system will be unavailable during restore | | |
| C1.5 | ☐ Take a **pre-restore backup** of the current database (safety net) | | |

### C2. Restore Execution

| # | Step | Command / Action | Status |
|---|------|-----------------|--------|
| C2.1 | ☐ **Stop the application** to prevent concurrent writes | Stop the Next.js server | |
| C2.2 | ☐ Verify the **backup file** is accessible and not corrupted | Check file integrity | |
| C2.3 | ☐ Copy the backup file to the **restore directory** | File copy command | |
| C2.4 | ☐ Run the **database restore** procedure: | (Database-specific command) | |
|      | For Prisma/PostgreSQL: | `pg_restore -d database backup.sql` | |
|      | For SQLite: | Replace the database file | |
| C2.5 | ☐ Run **Prisma migrations** to verify schema is current: | `npx prisma migrate deploy` | |
| C2.6 | ☐ Run **Prisma generate** to regenerate the client: | `npx prisma generate` | |
| C2.7 | ☐ **Restart the application** | `npm run dev` or `npm start` | |

### C3. Post-Restore Verification

| # | Task | Status | Date |
|---|------|--------|------|
| C3.1 | ☐ Verify the application **starts without errors** | | |
| C3.2 | ☐ Login and verify **Dashboard loads correctly** | | |
| C3.3 | ☐ Spot-check **project data** — do project names and values match expected? | | |
| C3.4 | ☐ Spot-check **user accounts** — can users login? | | |
| C3.5 | ☐ Spot-check **financial data** — do payables and receivables match? | | |
| C3.6 | ☐ Spot-check **inventory levels** — do stock counts match expected? | | |
| C3.7 | ☐ Spot-check **payroll data** — are recent periods present? | | |
| C3.8 | ☐ Verify **AI Command Center** is operational | | |
| C3.9 | ☐ Review **System Audit trail** — is history intact up to the backup point? | | |
| C3.10 | ☐ Notify **all users** that the system is restored and available | | |
| C3.11 | ☐ Document the **restore event** completely (reason, backup used, results) | | |
| C3.12 | ☐ Notify all departments of **data rollback impact** — any transactions after the backup point must be re-entered | | |

---

## Part D: Disaster Recovery Procedure

**Use when:** Complete system failure, server crash, data center outage, or security breach.

| # | Step | Status | Notes |
|---|------|--------|-------|
| D1 | ☐ **Assess the situation** — what failed? (Server, database, network, security) | | |
| D2 | ☐ **Contain the issue** — isolate the affected systems | | |
| D3 | ☐ **Notify management** — Project Director and all department heads | | |
| D4 | ☐ **Notify all users** — system is down, estimated recovery time | | |
| D5 | ☐ **Provision a recovery environment** (new server, standby instance, etc.) | | |
| D6 | ☐ **Locate the most recent valid backup** from off-site storage | | |
| D7 | ☐ **Deploy the application** to the recovery environment | | |
| D8 | ☐ **Restore the database** from the backup (follow Part C procedures) | | |
| D9 | ☐ **Verify the restoration** (follow Part C3 post-restore checks) | | |
| D10 | ☐ **Update DNS / URLs** if the recovery environment has a new address | | |
| D11 | ☐ **Notify all users** of the new access point (if changed) | | |
| D12 | ☐ **Monitor closely** for 48 hours after recovery | | |
| D13 | ☐ Conduct a **post-mortem** — document root cause and prevention measures | | |
| D14 | ☐ **Update disaster recovery plan** based on lessons learned | | |

---

## Part E: Backup Inventory Log

| Date | Type | File Name | Size | Location 1 | Location 2 | Location 3 | Verified By |
|------|------|-----------|------|-----------|-----------|-----------|-------------|
| | ☐ Daily ☐ Monthly ☐ Manual | | | | | | |
| | ☐ Daily ☐ Monthly ☐ Manual | | | | | | |
| | ☐ Daily ☐ Monthly ☐ Manual | | | | | | |
| | ☐ Daily ☐ Monthly ☐ Manual | | | | | | |
| | ☐ Daily ☐ Monthly ☐ Manual | | | | | | |
| | ☐ Daily ☐ Monthly ☐ Manual | | | | | | |
| | ☐ Daily ☐ Monthly ☐ Manual | | | | | | |
| | ☐ Daily ☐ Monthly ☐ Manual | | | | | | |

---

## Part F: Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Primary System Admin | | | |
| Secondary System Admin | | | |
| Project Director | | | |
| Hosting Provider Support | | | |
| Database Specialist | | | |

---

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **System Administrator** | | | |
| **Project Director** | | | |

---

**Backup and Restore Checklist — End of Document**  
*OneSystemsERP Training & Operations Package*  
*Document Code: CKL-008 | Version 1.0*
