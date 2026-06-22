# OneSystemsERP — Accounting & Finance Training Guide

**Document Code:** TRG-005  
**Version:** 1.0  
**Classification:** Internal — Finance Officers, Project Accountants, Cost Officers, Accountants  
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

### Finance Officer (`FINANCE_OFFICER`)
The **financial authority** of the organization within OneSystemsERP. Responsible for cash flow governance, accounts payable/receivable, supplier payment processing, petty cash management, and financial review of Variation Orders. Has full system access including Payroll.

### Project Accountant (`PROJECT_ACCOUNTANT`)
Focuses on **project-level accounting** — labor cost allocation, subcontractor billing verification, procurement financial tracking, and project-specific financial reporting.

### Cost Officer (`COST_OFFICER`)
Analyzes **cost overruns and variances** — compares original BOQ budgets against revised contracts, tracks expenditure against budget lines, and produces cost analysis reports.

### Accountant (`ACCOUNTANT`)
Handles **day-to-day bookkeeping** — voucher processing, journal entries, bank reconciliation, and financial statement preparation support.

**Access Levels Summary:**

| Role | Finance | Procurement | Payroll | Projects | Subcontracting | Reports |
|------|---------|-------------|---------|----------|----------------|---------|
| Finance Officer | Full | Full | Full | Full | Full | Full |
| Project Accountant | Full | View + PO | Full | Full | Full | Full |
| Cost Officer | Full | View | — | Full | Full | Full |
| Accountant | Full | View | Full | View | — | Full |

---

## 2. Daily Responsibilities

### Finance Officer

| Time | Task | Priority |
|------|------|----------|
| **08:00** | Review Dashboard — unpaid payables, petty cash balances, active payroll periods | 🔴 Critical |
| **08:30** | Process **Supplier Payables** — review and schedule payments | 🔴 Critical |
| **09:00** | Review **Petty Cash** accounts — check for low balances requiring replenishment | 🟡 High |
| **09:30** | Review **Variation Orders** pending "For Finance Review" | 🔴 Critical |
| **10:00** | Process **Expense Vouchers** — verify supporting receipts and approve | 🟡 High |
| **11:00** | Review **Collections** — track client payments against progress billings | 🟡 High |
| **01:00** | Process **Progress Billings** — generate client invoices from accomplishments | 🟡 High |
| **02:00** | Review **Payroll** — verify computations before payment release | 🟡 High |
| **03:00** | Review **Subcontracting invoices** — verify against accomplishment data | 🟢 Medium |
| **04:00** | Reconcile daily financial transactions | 🟡 High |

### Project Accountant

| Time | Task | Priority |
|------|------|----------|
| **08:00** | Review project-specific financial dashboards | 🔴 Critical |
| **09:00** | Reconcile labor costs against payroll allocations per project | 🟡 High |
| **10:00** | Track procurement expenditure against project budget | 🟡 High |
| **11:00** | Review subcontractor billing submissions | 🟡 High |
| **02:00** | Prepare project cost reports | 🟢 Medium |
| **04:00** | Update project financial trackers | 🟢 Medium |

### Cost Officer

| Time | Task | Priority |
|------|------|----------|
| **08:00** | Review cost overrun alerts | 🔴 Critical |
| **09:00** | Compare original BOQ vs. revised contract variances | 🟡 High |
| **10:00** | Analyze expenditure trends by cost category | 🟡 High |
| **02:00** | Prepare budget utilization reports | 🟢 Medium |

---

## 3. Modules Used by the Role

| Module | Purpose | Primary Users |
|--------|---------|---------------|
| **Finance** | AP/AR, payment processing, financial overview | All Finance roles |
| **Supplier Payables** | Track and pay supplier invoices | Finance Officer, Accountant |
| **Progress Billings** | Generate client invoices from accomplishments | Finance Officer, Billing Eng. |
| **Collections** | Track client payment receipts | Finance Officer |
| **Petty Cash** | Manage site petty cash accounts and replenishments | Finance Officer |
| **Expenses** | Log and approve operational expenses | Finance Officer, Accountant |
| **Payroll** | Review payroll computations and authorize payments | Finance Officer, Accountant |
| **Payroll Payments** | Process bank transfers and GCash disbursements | Finance Officer |
| **Procurement** | Monitor PO values and procurement spending | All Finance roles |
| **Projects** | View BOQ, contract values, revised budgets | All Finance roles |
| **Subcontracting** | Review subcontractor invoices and milestone billing | Finance Officer, Project Acct. |
| **Variation Orders** | Financial review stage of VO approval pipeline | Finance Officer |
| **Reports** | Generate all financial reports | All Finance roles |

---

## 4. Step-by-Step Common Tasks

### 4.1 Processing Supplier Payables

1. Navigate to **Supplier Payables** from the sidebar.
2. The list shows all outstanding supplier invoices grouped by status:
   - **Pending** — awaiting review
   - **Approved for Payment** — verified and queued
   - **Paid** — payment completed
   - **On Hold** — requires clarification
3. Click on a pending payable to review:
   - Verify the **PO reference** — does it match an approved Purchase Order?
   - Verify the **delivery receipt** — were the goods actually received by the Stockman?
   - Verify the **invoice amount** — does it match the PO amount?
   - Check for **deductions** (damaged goods, short deliveries)
4. If everything checks out, click **Approve for Payment**.
5. Schedule the payment date and payment method (bank transfer, check).
6. Process the payment and mark as **Paid** with the transaction reference number.

### 4.2 Reviewing a Variation Order (Finance Review Stage)

1. Navigate to **Variation Orders**.
2. Filter for VOs with status **"For Finance Review"**.
3. Click on the VO to review:

| Review Item | What to Verify |
|-------------|---------------|
| **Additive Amount** | Is the proposed additional cost reasonable and documented? |
| **Deductive Amount** | Are the deductions properly calculated? |
| **Net Financial Impact** | What is the total change to the Revised Contract? |
| **Budget Availability** | Does the project have remaining budget capacity to absorb this VO? |
| **Supporting Documentation** | Are quotations, site reports, and justifications attached? |

4. Make your decision:
   - **Approve** → The VO advances to **For PD Approval** (Project Director).
   - **Return for Revision** → Provide specific notes on what needs correction.

### 4.3 Generating Progress Billings

1. Navigate to **Progress Billings** from the sidebar.
2. Select the project and billing period.
3. The system pulls **accomplishment data** from the Accomplishments module:
   - BOQ item references
   - Quantities completed
   - Percentage of completion
4. Review each line item against the contract unit prices.
5. The system calculates:
   - `Billing Amount = Quantity Completed × Unit Price`
   - Cumulative billing vs. previous billings = current billing
6. Apply any **retention** (typically 10% of billing).
7. Generate the billing summary document.
8. Click **Submit for Approval** → routes to Project Director.

### 4.4 Managing Petty Cash Accounts

1. Navigate to **Petty Cash** from the sidebar.
2. Each project site has its own petty cash account with:
   - **Fund Balance** — current available cash
   - **Replenishment Threshold** — minimum balance before replenishment is required
   - **Transaction Log** — all disbursements and replenishments
3. To **log a petty cash disbursement**:
   - Click on the account > **+ New Transaction**
   - Enter amount, purpose, and receipt reference
   - Upload the receipt image
   - Click **Save**
4. To **request replenishment**:
   - When the balance drops below the threshold, click **Request Replenishment**
   - Attach the liquidation report (summary of all disbursements since last replenishment)
   - Submit for approval

### 4.5 Processing Expense Vouchers

1. Navigate to **Expenses** from the sidebar.
2. Review pending expense submissions:
   - Verify the **expense category** (transport, supplies, meals, etc.)
   - Verify **supporting receipts** are attached
   - Verify the amount matches the receipts
   - Confirm the **project charge** is correct
3. **Approve** or **Reject** with notes.
4. Approved expenses are added to the project cost ledger.

### 4.6 Tracking Collections

1. Navigate to **Collections** from the sidebar.
2. The system shows all progress billings that have been submitted to the client.
3. When a client payment is received:
   - Click on the billing entry
   - Click **Record Payment**
   - Enter the payment amount, date, and reference number
   - Upload the deposit slip or payment confirmation
4. The system updates the Accounts Receivable balance.

### 4.7 Reviewing Payroll Computations (Finance Review)

1. Navigate to **Payroll** from the sidebar.
2. Select the payroll period under review.
3. The payroll computation shows for each worker:

| Field | Description |
|-------|-------------|
| Basic Pay | Computed from rate type (monthly, daily, hourly) |
| Overtime Pay | OT hours × Hourly Rate × 1.25 |
| Gross Pay | Basic Pay + Overtime + Allowances |
| SSS | 4.5% of Gross (if enabled) |
| PhilHealth | Gross × PH Rate (if enabled) |
| Pag-IBIG | Gross × PAGIBIG Rate, capped at ₱200/month (if enabled) |
| Tax | TRAIN/CREATE brackets or EWT for consultants |
| Ledger Deductions | Loans, cash advances (auto-pulled) |
| Net Pay | Gross − All Deductions |

4. Verify the AI Validation status — any flagged items (negative net pay, extreme OT)?
5. If computations are correct, **Approve for Payment**.

---

## 5. Required Approvals

| Action | Role Performing | Approval Required From |
|--------|----------------|----------------------|
| Approve Supplier Payable for Payment | Finance Officer | Self (Finance authority) |
| Release Supplier Payment | Finance Officer | Self + PD for large amounts |
| Finance Review of Variation Order | Finance Officer | Self (routes to PD after) |
| Generate Progress Billing | Finance Officer | Project Director final review |
| Petty Cash Replenishment | Finance Officer | Project Director |
| Expense Voucher Approval | Finance Officer | Self (Finance authority) |
| Payroll Payment Release | Finance Officer | Project Director final authorization |
| Record Client Collection | Finance Officer | Self (supporting documents required) |

---

## 6. Common Mistakes to Avoid

| ❌ Mistake | ✅ Correct Approach |
|-----------|-------------------|
| Approving supplier payment without verifying delivery receipt | Always cross-reference the payment with the Stockman's delivery confirmation |
| Processing progress billing without current accomplishment data | Ensure accomplishment reports are submitted and reviewed before generating billings |
| Approving VO financial review without checking budget availability | Always verify the project has remaining budget capacity before approving |
| Processing payroll without reviewing AI validation flags | AI flags block submissions for negative net pay and extreme OT — review each flag |
| Recording collections without deposit proof | Always upload deposit slips or bank confirmation documents |
| Replenishing petty cash without a liquidation report | All previous disbursements must be accounted for before replenishment |
| Double-processing the same supplier invoice | Check the PO reference and delivery receipt to prevent duplicate payments |
| Charging expenses to the wrong project | Verify the project code on every transaction before submission |
| Ignoring Pag-IBIG cap (₱200/month) | The system caps automatically, but verify during split-schedule periods |
| Not reconciling daily transactions | End-of-day reconciliation prevents cumulative errors |

---

## 7. Reports the Role Must Review

| Report | Purpose | Frequency |
|--------|---------|-----------|
| **Accounts Payable Aging** | Outstanding supplier payments by age bracket | Daily |
| **Accounts Receivable Aging** | Outstanding client billings by age bracket | Weekly |
| **Cash Flow Statement** | Net cash inflows and outflows for the period | Weekly |
| **Petty Cash Liquidation** | Disbursement summary per petty cash account | Per replenishment |
| **Expense Summary** | Total expenses by category and project | Monthly |
| **Payroll Cost Summary** | Total labor costs by project and period | Semi-Monthly |
| **Budget vs. Actual** | Budget utilization and variance analysis | Weekly |
| **Variation Order Financial Impact** | Cumulative VO impact on project budget | Monthly |
| **Subcontractor Billing Summary** | Amounts billed by subcontractors vs. work completed | Monthly |
| **Collection Report** | Client payments received vs. billed | Monthly |
| **Tax Withholding Report** | Total taxes withheld by bracket | Monthly |
| **Government Deduction Summary** | SSS, PhilHealth, Pag-IBIG totals for remittance | Monthly |

---

## 8. Best Practices

### Cash Flow Management
- ✅ Process supplier payments **on schedule** — late payments damage supplier relationships and may incur penalties.
- ✅ Track collections **proactively** — follow up on overdue client payments before they age beyond 60 days.
- ✅ Maintain a **30-day cash flow projection** to anticipate shortfalls.
- ✅ Keep petty cash accounts funded but not over-funded — balance security with operational need.

### Accuracy & Compliance
- ✅ Always **three-way match**: PO → Delivery Receipt → Supplier Invoice before processing payment.
- ✅ Review government deduction calculations **before** remittance — errors can incur penalties from SSS, PhilHealth, and Pag-IBIG.
- ✅ Archive all supporting documents digitally in the **Documents** module — physical copies fade and get lost.
- ✅ Reconcile bank balances with system balances **daily**.

### Variation Order Reviews
- ✅ Focus on the **net financial impact**, not just individual line items.
- ✅ Verify that the VO has been through **PM Review** before performing Finance Review.
- ✅ Document your review notes even when approving — this creates a clear audit trail.

### Payroll
- ✅ Cross-reference payroll computations with the **Payroll Formulas Reference** document.
- ✅ Verify rate types (Monthly, Daily, Hourly, 1-Lot) are correctly assigned per worker.
- ✅ Check the AI validation status before releasing any payroll batch.

---

## 9. Final Checklist

| # | Item | Status |
|---|------|--------|
| 1 | ☐ Logged in and verified FINANCE_OFFICER (or equivalent) role |  |
| 2 | ☐ Reviewed the Finance module dashboard and understood all widgets |  |
| 3 | ☐ Successfully processed a supplier payable (review → approve → pay) |  |
| 4 | ☐ Performed a Finance Review on a Variation Order |  |
| 5 | ☐ Generated a Progress Billing from accomplishment data |  |
| 6 | ☐ Managed a Petty Cash account (disbursement + replenishment request) |  |
| 7 | ☐ Processed an Expense Voucher (review receipts → approve) |  |
| 8 | ☐ Recorded a client collection with deposit proof |  |
| 9 | ☐ Reviewed a payroll period computation (verified formulas and AI flags) |  |
| 10 | ☐ Generated at least 5 financial reports from the Reports module |  |
| 11 | ☐ Reviewed the Payroll Formulas & Validation Reference document |  |
| 12 | ☐ Verified understanding of government deduction schedules (SSS/PH/PAGIBIG) |  |
| 13 | ☐ Reconciled a daily batch of financial transactions |  |
| 14 | ☐ Signed off with Finance Manager / Project Director that onboarding is complete |  |

---

**Accounting & Finance Training Guide — End of Document**  
*OneSystemsERP Training & Operations Package*  
*Document Code: TRG-005 | Version 1.0*
