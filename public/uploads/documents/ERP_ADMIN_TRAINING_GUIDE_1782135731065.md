# OneSystemsERP — System Administrator Training Guide

**Document Code:** TRG-002  
**Version:** 1.0  
**Classification:** Internal — IT / Admin Staff Only  
**Effective Date:** June 2026  

---

## Table of Contents

1. [Role Description](#1-role-description)
2. [Daily Responsibilities](#2-daily-responsibilities)
3. [Modules Used by the Role](#3-modules-used-by-the-role)
4. [Step-by-Step Common Tasks](#4-step-by-step-common-tasks)
5. [Required Approvals](#5-required-approvals)
6. [Common Mistakes to Avoid](#6-common-mistakes-to-avoid)
7. [Reports the Role Must Review](#7-reports-the-role-must-review)
8. [Best Practices](#8-best-practices)
9. [Final Checklist](#9-final-checklist)

---

## 1. Role Description

### System Administrator (`SUPER_ADMIN`)

The System Administrator is the **highest-authority technical role** in OneSystemsERP. This role is responsible for the overall health, security, configuration, and user management of the entire ERP platform.

**Key Accountabilities:**
- Maintaining system integrity, uptime, and performance
- Creating and managing user accounts and RBAC role assignments
- Configuring global system settings (tax rates, company info, deduction schedules)
- Monitoring the AI Command Center and AI Validation Engine
- Managing database backups and system audit trails
- Onboarding and offboarding employees in the system
- Troubleshooting access issues and resolving system errors

**Access Level:** Unrestricted — full read/write/delete access to **all 20+ modules**.

> [!CAUTION]
> The SUPER_ADMIN role has the power to permanently alter system data, delete records, and reconfigure critical settings. Actions taken under this role are **irreversible** in most cases and are **fully logged** in the System Audit trail.

---

## 2. Daily Responsibilities

| Time Block | Task | Priority |
|-----------|------|----------|
| **08:00 AM** | Check system health — verify the application is running and responsive | 🔴 Critical |
| **08:15 AM** | Review the **System Audit** log for overnight anomalies | 🔴 Critical |
| **08:30 AM** | Check the **AI Command Center** for pending AI overrides or errors | 🟡 High |
| **09:00 AM** | Process any pending **user account requests** (new users, role changes) | 🟡 High |
| **09:30 AM** | Review and resolve **support tickets** from staff regarding access issues | 🟡 High |
| **12:00 PM** | Verify **database backup** completed successfully (if scheduled midday) | 🔴 Critical |
| **02:00 PM** | Audit **active sessions** — check for suspicious login patterns | 🟢 Medium |
| **04:00 PM** | Review **role simulation results** — test any permission changes | 🟢 Medium |
| **05:00 PM** | End-of-day **system status check** and note any unresolved issues | 🟡 High |
| **Weekly** | Run full **permissions audit** across all user accounts | 🔴 Critical |
| **Monthly** | Verify **global settings** (tax rates, deduction schedules) are current | 🟡 High |

---

## 3. Modules Used by the Role

| Module | Purpose | Access Level |
|--------|---------|--------------|
| **Dashboard** | System-wide KPI overview, AI override alerts | Full |
| **Users** | Create, edit, deactivate user accounts | Full |
| **System Roles & Permissions** | Manage RBAC role definitions and permission matrices | Full |
| **System Settings** | Configure tax rates, company info, deduction schedules | Full |
| **AI Command Center** | Monitor AI validation engine, review AI agent logs | Full |
| **System Audit** | Complete audit trail of all system actions by all users | Full |
| **Director Audit** | Review AI override requests requiring executive decision | Full |
| **Knowledge Center** | Manage organizational knowledge base articles | Full |
| **Documents** | Upload/manage system-wide templates and policies | Full |
| **Reports** | Generate all system reports for compliance and operations | Full |
| **All Other Modules** | Projects, Finance, Procurement, Payroll, etc. | Full (Override) |

---

## 4. Step-by-Step Common Tasks

### 4.1 Creating a New User Account

1. Navigate to **Users** from the sidebar.
2. Click **+ Add User**.
3. Fill in required fields:
   - **Full Name** — as it appears in official records
   - **Email Address** — unique system-wide (this is the login ID)
   - **Temporary Password** — assign a strong temporary password
   - **Role** — select from the 26 available roles (e.g., `PURCHASING_OFFICER`, `PROJECT_ACCOUNTANT`)
4. Click **Save**.
5. Notify the user of their credentials through a secure channel (in person or encrypted message).
6. Instruct the user to change their password on first login.

### 4.2 Assigning / Changing a User's Role

1. Navigate to **Users** and locate the target user.
2. Click on the user's profile.
3. In the **Role** dropdown, select the new role.
4. Click **Save Changes**.
5. The user's sidebar, dashboard, and action permissions will update **immediately** on their next page load.

> [!WARNING]
> Changing a user's role may cause them to lose access to in-progress work. Coordinate with the user before changing roles mid-project.

### 4.3 Configuring Global System Settings

1. Navigate to **Settings** from the sidebar.
2. Update any of the following global configurations:

| Setting | Description |
|---------|-------------|
| **Company Name** | Organization legal name displayed on reports and documents |
| **SSS Rate** | Social Security System employee contribution rate |
| **PhilHealth Rate** | Philippine Health Insurance employee rate |
| **Pag-IBIG Rate** | Home Development Mutual Fund employee rate |
| **Pag-IBIG Cap** | Maximum monthly Pag-IBIG deduction (default: ₱200) |
| **Deduction Schedule** | `FULL` (deduct each cutoff) or `SPLIT` (divide by 2 per cutoff) |
| **Withholding Tax Brackets** | TRAIN/CREATE tax brackets for compensation income |
| **Retention Percentage** | Default retention for 1-Lot / milestone-based contracts |

3. Click **Save Settings**.

> [!CAUTION]
> Changes to tax and deduction settings affect **all active payroll periods**. Coordinate with Finance before making changes.

### 4.4 Monitoring the AI Command Center

1. Navigate to **AI Command Center** from the sidebar.
2. Review the **Validation Log** — this shows all AI-assessed transactions:
   - **Risk Rating**: `CRITICAL` or `LOW`
   - **Transaction Type**: Variation Order, Payroll, PO, etc.
   - **Flagged Issues**: Over-budget, anomalous deductions, duplicate entries
3. For `CRITICAL` items:
   - Click the item to view full details.
   - Determine if the AI flag is valid or a false positive.
   - If valid → escalate to the Project Director for override decision.
   - If false positive → log a note and dismiss the alert.

### 4.5 Reviewing the System Audit Trail

1. Navigate to **System Audit** from the sidebar.
2. The audit log records **every action** performed by every user:
   - Who performed the action
   - What action was taken (create, update, delete, approve)
   - When the action occurred
   - What data was affected
3. Use filters to narrow by:
   - **User** — track specific user activity
   - **Date Range** — investigate a specific time period
   - **Action Type** — filter for deletions, approvals, etc.
   - **Module** — focus on a specific area (e.g., Payroll, Finance)

### 4.6 Using the Role Simulator

1. On the **Dashboard**, locate the **Role Simulator** panel (only visible to SUPER_ADMIN).
2. Select any role from the dropdown (e.g., `PURCHASING_OFFICER`).
3. The entire dashboard reconfigures to show what that role sees.
4. Navigate through the sidebar to verify that the correct modules are visible/hidden.
5. Test that buttons and actions match the expected RBAC permissions.

### 4.7 Performing a Database Backup

1. Access the server or hosting environment (Vercel, VPS, or local server).
2. Run the database backup script:
   ```
   node backup_db.js
   ```
3. Verify the backup file was created with the correct timestamp.
4. Store the backup in a secure, off-site location.
5. Log the backup in the **System Audit** notes.

### 4.8 Deactivating a User Account

1. Navigate to **Users** and locate the user.
2. Click on their profile.
3. Change their status to **Inactive** or delete the account.
4. The user will be immediately locked out on their next request.
5. Review the audit trail for any incomplete transactions under this user.

---

## 5. Required Approvals

| Action | Requires Approval From |
|--------|----------------------|
| Creating a new SUPER_ADMIN account | Existing SUPER_ADMIN or Project Director |
| Modifying global tax/deduction settings | Finance Officer + Project Director |
| Mass role reassignment (3+ users) | Project Director |
| Database restore from backup | Project Director (written authorization) |
| Resetting system data (zero data reset) | Project Director (written authorization) |
| Deactivating a Project Director account | Another SUPER_ADMIN + written HR authorization |

---

## 6. Common Mistakes to Avoid

| ❌ Mistake | ✅ Correct Approach |
|-----------|-------------------|
| Assigning SUPER_ADMIN role to too many users | Limit SUPER_ADMIN to 2-3 trusted individuals maximum |
| Changing system settings without notifying Finance | Always coordinate with Finance before tax/deduction changes |
| Ignoring AI Command Center CRITICAL alerts | Every CRITICAL alert must be reviewed and actioned within 24 hours |
| Not verifying backups | Backups must be tested quarterly by performing a test restore |
| Deleting users instead of deactivating them | Deactivate first — deletion removes audit trail linkages |
| Making role changes during peak hours | Schedule role changes for early morning or after business hours |
| Skipping the System Audit review | The audit log is your primary forensic tool — review daily |
| Using a shared admin account | Each admin must have their own SUPER_ADMIN account for accountability |

---

## 7. Reports the Role Must Review

| Report | Purpose | Frequency |
|--------|---------|-----------|
| **System Audit Log** | Complete record of all user actions | Daily |
| **AI Validation Summary** | AI-flagged anomalies across all modules | Daily |
| **User Activity Report** | Login frequency, actions per user | Weekly |
| **Role Permissions Matrix** | Current role-to-module mapping | Weekly |
| **Failed Login Report** | Potential unauthorized access attempts | Daily |
| **Database Backup Log** | Backup success/failure status | Daily |
| **AI Override Queue** | Items escalated for Director review | Daily |
| **System Error Log** | Application errors and exceptions | Daily |

---

## 8. Best Practices

### Security
- ✅ Enforce **unique accounts** for every user — never share admin credentials.
- ✅ Implement the **principle of least privilege** — assign the most restrictive role that still allows the user to perform their job.
- ✅ Conduct a full **permissions audit** every month.
- ✅ Rotate your own admin password every 90 days.
- ✅ Monitor the audit trail for **unusual patterns** (e.g., bulk deletions, after-hours access).

### System Maintenance
- ✅ Schedule daily **automated backups** and verify them.
- ✅ Keep the application and all dependencies **updated**.
- ✅ Monitor server resources (CPU, memory, disk) to prevent outages.
- ✅ Test the AI Validation Engine monthly to ensure accuracy.
- ✅ Document all configuration changes in a **change log**.

### User Management
- ✅ Process user account requests within **24 hours**.
- ✅ Deactivate accounts immediately when an employee leaves the organization.
- ✅ Brief new users on RBAC and direct them to the New User Training Guide.
- ✅ Use the **Role Simulator** before deploying role changes to production users.

### Disaster Recovery
- ✅ Maintain at least **3 backup copies** (local, cloud, off-site).
- ✅ Test backup restoration procedures **quarterly**.
- ✅ Document the complete disaster recovery procedure.
- ✅ Ensure at least **2 people** know the recovery procedure.

---

## 9. Final Checklist

Complete the following before assuming full System Administrator responsibilities:

| # | Item | Status |
|---|------|--------|
| 1 | ☐ Received SUPER_ADMIN credentials from existing administrator |  |
| 2 | ☐ Changed password and secured credentials |  |
| 3 | ☐ Reviewed the complete RBAC role matrix (14 roles, 20+ modules) |  |
| 4 | ☐ Created at least one test user and verified role restrictions |  |
| 5 | ☐ Used the Role Simulator to test 3+ different role perspectives |  |
| 6 | ☐ Reviewed and understood all Global System Settings |  |
| 7 | ☐ Navigated the AI Command Center and reviewed validation logs |  |
| 8 | ☐ Reviewed the System Audit trail for the past 7 days |  |
| 9 | ☐ Successfully performed and verified a database backup |  |
| 10 | ☐ Tested database restore procedure in a non-production environment |  |
| 11 | ☐ Documented the disaster recovery procedure |  |
| 12 | ☐ Verified that all active users have correct role assignments |  |
| 13 | ☐ Set up automated backup scheduling |  |
| 14 | ☐ Read all other role-specific training guides to understand user workflows |  |
| 15 | ☐ Signed off with Project Director that admin handover is complete |  |

> [!IMPORTANT]
> **Signature Required:** This document must be co-signed by the outgoing System Administrator (if applicable) and the Project Director. File the signed copy securely.

---

**System Administrator Training Guide — End of Document**  
*OneSystemsERP Training & Operations Package*  
*Document Code: TRG-002 | Version 1.0*
