# OneSystemsERP — Payroll Training Guide

**Document Code:** TRG-006  
**Version:** 1.0  
**Classification:** Internal — HR Officers, Payroll Officers, Payroll Masters  
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

### HR Officer (`HR_OFFICER`)
Manages the **workforce database** — worker profiles, employment records, contact information, and compliance documents. Coordinates with Payroll for worker data accuracy.

### Payroll Officer (`PAYROLL_OFFICER`)
Responsible for **payroll computation** — enters Daily Time Records (DTR), calculates wages using the Payroll Engine, applies government deductions and taxes, and generates payslips.

### Payroll Master (`PAYROLL_MASTER`)
Senior payroll authority — reviews computed payroll, resolves AI validation flags, approves payroll batches for payment, and manages the payroll payment automation pipeline.

**Access Levels Summary:**

| Role | Workers DB | Payroll | DTR Entry | Payroll Payments | Finance | Reports |
|------|-----------|---------|-----------|-----------------|---------|---------|
| HR Officer | Full | View + Edit | View | View | View | Full |
| Payroll Officer | View | Full | Full | View | View | Full |
| Payroll Master | View | Full + Approve | Full | Full | View | Full |

---

## 2. Daily Responsibilities

### Payroll Officer

| Time | Task | Priority |
|------|------|----------|
| **08:00** | Review Dashboard — active payroll periods, worker count | 🔴 Critical |
| **08:30** | Enter/verify **Daily Time Records (DTR)** for all workers | 🔴 Critical |
| **10:00** | Review DTR entries for accuracy (hours, OT, absences) | 🟡 High |
| **11:00** | Compute payroll for the current period | 🟡 High |
| **01:00** | Review **AI Payroll Validator** flags | 🔴 Critical |
| **02:00** | Resolve flagged items (negative net pay, extreme OT, missing gov IDs) | 🟡 High |
| **03:00** | Process **ledger deductions** (loans, cash advances) | 🟢 Medium |
| **04:00** | Generate payslips and prepare for review | 🟢 Medium |

### HR Officer

| Time | Task | Priority |
|------|------|----------|
| **08:00** | Review Dashboard — worker database count, system users | 🟡 High |
| **08:30** | Process **new worker registrations** — complete profiles with compliance docs | 🟡 High |
| **09:30** | Update **worker status changes** (promotions, transfers, terminations) | 🟡 High |
| **10:00** | Verify **government ID numbers** (SSS, PhilHealth, Pag-IBIG, TIN) | 🟡 High |
| **11:00** | Coordinate with Payroll on worker rate changes | 🟢 Medium |
| **02:00** | Manage worker documents (contracts, clearances, certifications) | 🟢 Medium |

### Payroll Master

| Time | Task | Priority |
|------|------|----------|
| **09:00** | Review computed payroll batches from Payroll Officers | 🔴 Critical |
| **10:00** | Resolve escalated AI validation flags | 🔴 Critical |
| **11:00** | Approve payroll batches for payment processing | 🔴 Critical |
| **01:00** | Manage **Payroll Payment Automation** — bank transfers and GCash disbursements | 🟡 High |
| **02:00** | Review payment compliance (GCash for weekly, Bank for monthly) | 🟡 High |
| **03:00** | Generate government remittance summaries (SSS, PhilHealth, Pag-IBIG) | 🟢 Medium |

---

## 3. Modules Used by the Role

| Module | Purpose | Primary Users |
|--------|---------|---------------|
| **Workers** | Worker database — profiles, rates, employment status | HR Officer |
| **Payroll** | Payroll periods, DTR entry, computation engine | Payroll Officer, Master |
| **Payroll Settings** | Configure payroll defaults, computation rules | Payroll Master |
| **Payroll Payments** | Payment automation — bank/GCash disbursement | Payroll Master |
| **Finance** | View approved payslips, payment batches | All HR/Payroll |
| **Reports** | Payroll reports, DTR summaries, deduction reports | All HR/Payroll |
| **Documents** | Worker contracts, compliance documents | HR Officer |
| **Dashboard** | Active payroll periods, worker count, user count | All HR/Payroll |

---

## 4. Step-by-Step Common Tasks

### 4.1 Registering a New Worker (HR Officer)

1. Navigate to **Workers** from the sidebar.
2. Click **+ Add Worker**.
3. Fill in the worker profile:

| Field | Description | Required |
|-------|-------------|----------|
| Full Name | Legal name as per government ID | ✅ |
| Position/Designation | Job title | ✅ |
| Rate Type | MONTHLY_SALARY, DAILY_RATE, HOURLY_RATE, ONE_LOT, PIECE_RATE, PROFESSIONAL_FEE | ✅ |
| Rate Amount | Compensation amount per the rate type | ✅ |
| Project Assignment | Which project(s) the worker is assigned to | ✅ |
| SSS Number | Social Security System ID | Recommended |
| PhilHealth Number | Philippine Health Insurance ID | Recommended |
| Pag-IBIG Number | Home Development Mutual Fund ID | Recommended |
| TIN | Tax Identification Number | Recommended |
| Bank Account | For bank-paid workers | Conditional |
| GCash Number | For GCash-paid workers | Conditional |
| Payment Method | Bank Transfer or GCash | ✅ |

4. Upload supporting documents (employment contract, IDs).
5. Click **Save**. The worker is now in the system and available for payroll assignment.

### 4.2 Creating a Payroll Period (Payroll Officer)

1. Navigate to **Payroll** from the sidebar.
2. Click **+ Create Period**.
3. Configure the period:
   - **Period Type**: Semi-Monthly (1st-15th or 16th-30th) or Monthly
   - **Cutoff Dates**: Start and end dates for the payroll period
   - **Project**: Which project this payroll covers
4. The system will automatically pull all workers assigned to the selected project.
5. Click **Create** to initialize the payroll period.

### 4.3 Entering Daily Time Records (DTR)

1. Navigate to **Payroll** > select the active period.
2. Click on a worker's row to open their DTR entry.
3. Enter the following for each workday:

| Field | Description |
|-------|-------------|
| Days Worked | Number of regular working days |
| Regular Hours | Total regular hours worked |
| Overtime Hours | Total overtime hours (OT) |
| Absences | Number of days absent |
| Late/Undertime | Hours of late arrival or early departure |

4. The system can also import DTR data from Excel uploads.
5. Click **Save DTR** for each worker.

### 4.4 Computing Payroll

1. After all DTR entries are complete, click **Compute Payroll** on the period page.
2. The **Payroll Engine** (`payrollEngine.ts`) automatically calculates:

**Basic Pay Computation by Rate Type:**

| Rate Type | Formula |
|-----------|---------|
| Monthly Salary | `Basic Pay = Monthly Salary / 2` (semi-monthly) |
| Daily Rate | `Basic Pay = Daily Rate × Days Worked` |
| Hourly Rate | `Basic Pay = Hourly Rate × Total Regular Hours` |
| 1-Lot | `Basic Pay = Contract Amount − (Contract Amount × Retention %)` |
| Piece Rate | `Basic Pay = Piece Rate` |
| Professional Fee | `Basic Pay = Professional Fee` |

**Overtime:**
```
Overtime Pay = Total OT Hours × Hourly Rate × 1.25
```

**Government Deductions (if enabled):**

| Deduction | Formula |
|-----------|---------|
| SSS | `4.5% of Gross Pay` |
| PhilHealth | `Gross Pay × Global PH Employee Rate` |
| Pag-IBIG | `Gross Pay × Global Pag-IBIG Rate`, capped at ₱200/month |

> [!NOTE]
> If the global deduction schedule is set to `SPLIT`, all government deductions are divided by 2 for the current cutoff.

**Taxation:**

| Condition | Formula |
|-----------|---------|
| Consultants / 1-Lot | `Taxable Income × Withholding Tax Rate %` |
| Monthly ≥ ₱333,333 | `₱91,770.70 + ((Taxable − 333,333) × 0.35)` |
| Monthly ≥ ₱83,333 | `₱16,770.70 + ((Taxable − 83,333) × 0.30)` |
| Monthly ≥ ₱33,333 | `₱4,270.70 + ((Taxable − 33,333) × 0.25)` |
| Monthly ≥ ₱16,667 | `₱937.50 + ((Taxable − 16,667) × 0.20)` |
| Monthly ≥ ₱10,417 | `(Taxable − 10,417) × 0.15` |
| Monthly < ₱10,417 | Exempt |

**Ledger Deductions:**
```
Deducted Amount = Min(Deduction Per Payroll, Remaining Balance)
```

3. The system generates a computed payslip for each worker.
4. Review the computation summary before proceeding.

### 4.5 AI Pre-Submission Validation

Before a payroll period can be submitted for review, the **AI Payroll Validator** runs automatically:

| Check Type | Condition | Action |
|-----------|-----------|--------|
| 🔴 **Critical** | Net Pay ≤ 0 | **Blocks submission** — deductions exceed gross pay |
| 🔴 **Critical** | Total Deductions ≥ 60% of Gross | **Blocks submission** — flags potential starvation wages |
| 🟡 **Warning** | OT Pay > Basic Pay | **Flags for review** — prompts DTR verification |
| 🟡 **Warning** | Missing Gov ID Numbers | **Flags for review** — deductions being applied without proper IDs |

> [!IMPORTANT]
> Critical errors **must be resolved** before the payroll can be submitted. You cannot bypass AI critical flags without Payroll Master intervention.

### 4.6 Payment Compliance Verification

The system enforces **payment method compliance** before disbursement:

| Worker Type | Required Payment Method | Violation Handling |
|-------------|------------------------|-------------------|
| Weekly Salaried | **GCash Only** | Non-GCash → EXCEPTION; Missing GCash # → ON_HOLD |
| Semi-Monthly / Monthly | **Bank Transfer Only** | Non-Bank → EXCEPTION; Missing Bank Acct → ON_HOLD |
| Consultants | **Bank Transfer Only** | Non-Bank → EXCEPTION; Missing Bank Acct → ON_HOLD |

### 4.7 Processing Payroll Payments (Payroll Master)

1. Navigate to **Payroll Payments > Dashboard**.
2. Select the approved payroll batch.
3. Review the payment summary:
   - Total amount for bank transfers
   - Total amount for GCash disbursements
   - Any ON_HOLD workers requiring resolution
4. Click **Process Payments** to initiate disbursement.
5. The system generates the bank file or GCash batch file.
6. Upload the payment confirmation once processing is complete.

### 4.8 Managing Worker Deduction Ledgers

1. Navigate to **Workers** > select worker > **Deduction Ledger** tab.
2. Create a new deduction entry:
   - **Type**: Loan, Cash Advance, Equipment Charge, etc.
   - **Total Amount**: Principal balance
   - **Deduction Per Payroll**: Amount to deduct each pay period
   - **Status**: ACTIVE or PAUSED
3. The Payroll Engine automatically pulls ACTIVE deductions during computation.
4. The deduction continues until `Remaining Balance = 0`.

---

## 5. Required Approvals

| Action | Role Performing | Approval Required From |
|--------|----------------|----------------------|
| Register new worker | HR Officer | Self (HR authority) |
| Create payroll period | Payroll Officer | Self |
| Compute payroll | Payroll Officer | Self |
| Submit payroll for review | Payroll Officer | Passes AI validation first |
| Approve payroll batch | Payroll Master | Self (Payroll Master authority) |
| Authorize payment release | Payroll Master | Finance Officer / Project Director |
| Override AI critical flag | Payroll Master | With documented justification |
| Modify worker rates | HR Officer | Finance Officer concurrence |
| Deactivate worker | HR Officer | Self (with documentation) |

---

## 6. Common Mistakes to Avoid

| ❌ Mistake | ✅ Correct Approach |
|-----------|-------------------|
| Entering DTR data without verifying attendance records | Cross-reference DTR with physical attendance sheets or biometric logs |
| Computing payroll before all DTR entries are complete | Ensure 100% of workers have DTR entries before running computation |
| Ignoring AI validation critical errors | Critical errors block submission for a reason — resolve each one |
| Assigning wrong rate type to a worker | Verify employment contract before setting rate type (Monthly vs. Daily vs. Hourly) |
| Forgetting to update the deduction schedule (FULL vs. SPLIT) | Check the global setting at the start of each period |
| Processing payment without GCash/Bank verification | Ensure payment profiles are verified before disbursement |
| Not reconciling previous period before starting the next | Always close and reconcile the prior period first |
| Registering workers without government ID numbers | Capture IDs during registration — missing IDs trigger AI warnings on every payroll |
| Manually overriding computed amounts | Let the engine compute — manual overrides bypass validation safeguards |
| Forgetting to upload payment confirmation | Every payment must have proof of disbursement on file |

---

## 7. Reports the Role Must Review

| Report | Purpose | Frequency |
|--------|---------|-----------|
| **Payroll Register** | Complete payroll computation per worker per period | Each period |
| **Payslip Summary** | Individual payslips for distribution | Each period |
| **DTR Summary** | Attendance, hours, and overtime per worker | Each period |
| **Government Deduction Summary** | SSS, PhilHealth, Pag-IBIG totals for remittance | Monthly |
| **Tax Withholding Summary** | Total BIR withholding taxes for filing | Monthly |
| **Deduction Ledger Report** | Outstanding loan and advance balances | Monthly |
| **Payroll Cost Allocation** | Labor costs charged per project | Each period |
| **Worker Headcount Report** | Active workers by project and position | Monthly |
| **Payment Method Distribution** | Workers by GCash vs. Bank Transfer | Each period |
| **AI Validation Log** | All AI flags and their resolution status | Each period |
| **Year-to-Date Earnings Report** | Cumulative earnings and deductions per worker | Quarterly |

---

## 8. Best Practices

### DTR & Computation
- ✅ Enter DTR data **daily** as reports come in — batch entry at period-end is error-prone.
- ✅ Use the **Excel upload** feature for large worker pools to save time.
- ✅ **Double-verify** overtime entries — extreme OT is the most common AI flag.
- ✅ Always compute payroll at least **2 days before** the payment due date to allow for review.

### Government Compliance
- ✅ Verify all workers have **SSS, PhilHealth, Pag-IBIG, and TIN** numbers.
- ✅ Remit government deductions **on time** — penalties for late remittance are costly.
- ✅ Keep records of all government remittance receipts in the **Documents** module.
- ✅ Review tax bracket assignments when workers receive rate increases.

### Payment Processing
- ✅ Verify payment method compliance **before** processing the batch.
- ✅ Keep a **master list** of verified GCash numbers and bank accounts.
- ✅ Process bank transfers and GCash separately for easier reconciliation.
- ✅ Upload payment confirmations **immediately** after processing.

### Data Integrity
- ✅ Never manually override computed amounts — if the computation seems wrong, check the inputs.
- ✅ Close each payroll period **formally** before opening the next one.
- ✅ Audit the deduction ledger quarterly to ensure completed deductions are marked as PAID.
- ✅ Archive payroll registers and payslips for at least **5 years** (regulatory requirement).

---

## 9. Final Checklist

### Payroll Officer Checklist

| # | Item | Status |
|---|------|--------|
| 1 | ☐ Logged in and verified PAYROLL_OFFICER role assignment |  |
| 2 | ☐ Reviewed the Workers database and understood worker profiles |  |
| 3 | ☐ Successfully created a payroll period |  |
| 4 | ☐ Entered DTR data for at least 5 workers |  |
| 5 | ☐ Computed payroll and reviewed the results |  |
| 6 | ☐ Reviewed and resolved AI validation flags |  |
| 7 | ☐ Studied the Payroll Formulas & Validation Reference document |  |
| 8 | ☐ Understood all 6 rate types and their computation formulas |  |
| 9 | ☐ Understood government deduction schedules (FULL vs. SPLIT) |  |
| 10 | ☐ Generated payslips for the computed period |  |
| 11 | ☐ Generated at least 3 payroll reports |  |
| 12 | ☐ Signed off with Payroll Master that onboarding is complete |  |

### HR Officer Checklist

| # | Item | Status |
|---|------|--------|
| 1 | ☐ Logged in and verified HR_OFFICER role assignment |  |
| 2 | ☐ Successfully registered a new worker with complete profile |  |
| 3 | ☐ Verified government ID number entry for at least 5 workers |  |
| 4 | ☐ Created a deduction ledger entry for a worker |  |
| 5 | ☐ Updated a worker's status (rate change, transfer, or termination) |  |
| 6 | ☐ Uploaded a worker document (contract, ID copy) |  |
| 7 | ☐ Reviewed the Worker Headcount Report |  |
| 8 | ☐ Signed off with HR Manager that onboarding is complete |  |

---

**Payroll Training Guide — End of Document**  
*OneSystemsERP Training & Operations Package*  
*Document Code: TRG-006 | Version 1.0*
