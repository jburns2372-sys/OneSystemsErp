# OneSystemsERP — Payroll Processing Checklist

**Document Code:** CKL-005  
**Version:** 1.0  
**Classification:** Internal — Payroll Officers, Payroll Masters, HR Officers  
**Effective Date:** June 2026  

---

## Instructions

This checklist must be completed for **every payroll period** (semi-monthly or monthly). Follow the steps in exact order — later steps depend on earlier ones being complete.

---

## Payroll Period Information

| Field | Details |
|-------|---------|
| **Period Type** | ☐ 1st-15th (A) ☐ 16th-30th/31st (B) ☐ Monthly |
| **Cutoff Dates** | From: ____________ To: ____________ |
| **Payment Due Date** | __________________________________ |
| **Project(s) Covered** | __________________________________ |
| **Prepared By** | __________________________________ |

---

## Phase 1: Pre-Computation

| # | Task | Status | Date |
|---|------|--------|------|
| 1.1 | ☐ Verify all **workers assigned** to the project(s) are in the Workers database | | |
| 1.2 | ☐ Verify worker **rate types** are correct (Monthly, Daily, Hourly, 1-Lot, Piece, Professional) | | |
| 1.3 | ☐ Verify worker **rate amounts** are current (any recent changes?) | | |
| 1.4 | ☐ Verify worker **government ID numbers** (SSS, PhilHealth, Pag-IBIG, TIN) | | |
| 1.5 | ☐ Verify worker **payment profiles** (GCash number or Bank account) | | |
| 1.6 | ☐ Check the **global deduction schedule** setting (FULL or SPLIT) | | |
| 1.7 | ☐ Review **active deduction ledgers** (loans, cash advances) for this period | | |
| 1.8 | ☐ **Create the Payroll Period** in the Payroll module | | |

---

## Phase 2: DTR Entry

| # | Task | Status | Date |
|---|------|--------|------|
| 2.1 | ☐ Collect all **Daily Time Records** from site/department heads | | |
| 2.2 | ☐ Enter DTR data for **each worker** in the payroll period: | | |
|    | — Days Worked | | |
|    | — Regular Hours | | |
|    | — Overtime Hours | | |
|    | — Absences | | |
|    | — Late / Undertime | | |
| 2.3 | ☐ Cross-reference DTR entries with **physical attendance records** | | |
| 2.4 | ☐ Verify **100%** of workers have DTR entries before proceeding | | |
| 2.5 | ☐ Flag any DTR anomalies (unusual OT, unexplained absences) for review | | |

---

## Phase 3: Payroll Computation

| # | Task | Status | Date |
|---|------|--------|------|
| 3.1 | ☐ Click **Compute Payroll** to run the Payroll Engine | | |
| 3.2 | ☐ Review computation results for each worker: | | |
|    | — Basic Pay (verify formula matches rate type) | | |
|    | — Overtime Pay (OT Hours × Hourly Rate × 1.25) | | |
|    | — Gross Pay = Basic + OT + Allowances | | |
|    | — SSS deduction (4.5% of Gross, if enabled) | | |
|    | — PhilHealth deduction (Gross × PH Rate, if enabled) | | |
|    | — Pag-IBIG deduction (Gross × Rate, max ₱200/month, if enabled) | | |
|    | — Withholding Tax (per TRAIN/CREATE brackets) | | |
|    | — Ledger Deductions (loans, cash advances) | | |
|    | — Net Pay = Gross − All Deductions | | |
| 3.3 | ☐ Verify **no worker has Net Pay ≤ 0** | | |
| 3.4 | ☐ Verify **no worker has deductions ≥ 60% of Gross** | | |

---

## Phase 4: AI Validation Review

| # | Task | Status | Date |
|---|------|--------|------|
| 4.1 | ☐ Review all **AI Payroll Validator** results | | |
| 4.2 | ☐ Resolve any **Critical Errors** (these block submission): | | |
|    | — Negative/Zero Net Pay → Adjust deductions or rates | | |
|    | — High Deductions (≥ 60% of Gross) → Review and adjust | | |
| 4.3 | ☐ Review all **Warnings** (these flag for review): | | |
|    | — Extreme Overtime (OT Pay > Basic Pay) → Verify DTR | | |
|    | — Missing Government ID Numbers → Update worker profile | | |
| 4.4 | ☐ Document resolution for every flag | | |
| 4.5 | ☐ **Submit payroll for review** (only possible after all critical errors resolved) | | |

---

## Phase 5: Review & Approval

| # | Task | Status | Date |
|---|------|--------|------|
| 5.1 | ☐ **Payroll Master** reviews the complete payroll batch | | |
| 5.2 | ☐ Payroll Master verifies totals match expected amounts | | |
| 5.3 | ☐ Payroll Master resolves any escalated issues | | |
| 5.4 | ☐ **Payroll Master approves** the payroll batch | | |
| 5.5 | ☐ **Finance Officer** reviews the approved batch | | |
| 5.6 | ☐ **Project Director** authorizes payment release | | |

---

## Phase 6: Payment Processing

| # | Task | Status | Date |
|---|------|--------|------|
| 6.1 | ☐ Verify **payment compliance** for all workers: | | |
|    | — Weekly salaried → GCash Only | | |
|    | — Semi-monthly/Monthly → Bank Transfer Only | | |
|    | — Consultants → Bank Transfer Only | | |
| 6.2 | ☐ Resolve any **ON_HOLD** workers (missing GCash/Bank info) | | |
| 6.3 | ☐ Resolve any **EXCEPTION** workers (wrong payment method selected) | | |
| 6.4 | ☐ Generate **bank transfer file** for bank-paid workers | | |
| 6.5 | ☐ Generate **GCash batch file** for GCash-paid workers | | |
| 6.6 | ☐ Process bank transfers through the banking portal | | |
| 6.7 | ☐ Process GCash transfers through the GCash portal | | |
| 6.8 | ☐ **Upload payment confirmations** to the system | | |

---

## Phase 7: Post-Processing

| # | Task | Status | Date |
|---|------|--------|------|
| 7.1 | ☐ Generate **payslips** for all workers | | |
| 7.2 | ☐ Distribute payslips to workers | | |
| 7.3 | ☐ Generate **Payroll Register** report | | |
| 7.4 | ☐ Generate **Government Deduction Summary** (SSS, PhilHealth, Pag-IBIG) | | |
| 7.5 | ☐ Generate **Tax Withholding Summary** for BIR filing | | |
| 7.6 | ☐ Generate **Payroll Cost Allocation** report by project | | |
| 7.7 | ☐ Update **deduction ledger balances** (verify completed deductions) | | |
| 7.8 | ☐ **Close the payroll period** | | |
| 7.9 | ☐ Archive all payroll documents in the Documents module | | |

---

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Payroll Officer** | | | |
| **Payroll Master** | | | |
| **Finance Officer** | | | |
| **Project Director** | | | |

---

**Payroll Processing Checklist — End of Document**  
*OneSystemsERP Training & Operations Package*  
*Document Code: CKL-005 | Version 1.0*
