# Payroll Computation Engine - Logic & Validation Reference

This document serves as the permanent reference for the formulas, government deduction schedules, taxation brackets, and AI validation rules natively implemented within the Payroll Engine (`payrollEngine.ts` and `payrollAiValidator.ts`).

## 1. Basic Pay & Overtime Formulas

The engine automatically adapts computation based on the worker's assigned `rateType`:

*   **Monthly Salaried (`MONTHLY_SALARY`)**
    *   `Basic Pay = Basic Monthly Salary / 2` *(Assumes semi-monthly cutoff)*
    *   `Hourly Rate = (Basic Monthly Salary / 22) / Standard Work Hours`
    *   `Overtime Pay = Total OT Hours * Hourly Rate * 1.25`
*   **Daily Rate (`DAILY_RATE`)**
    *   `Basic Pay = Daily Rate * Days Worked`
    *   `Hourly Rate = Daily Rate / Standard Work Hours`
    *   `Overtime Pay = Total OT Hours * Hourly Rate * 1.25`
*   **Hourly Rate (`HOURLY_RATE`)**
    *   `Basic Pay = Hourly Rate * Total Regular Hours`
    *   `Overtime Pay = Total OT Hours * Hourly Rate * 1.25`
*   **1-Lot / Milestones (`ONE_LOT`)**
    *   `Basic Pay = Contract Amount - (Contract Amount * Retention Percentage)`
*   **Piece Rate (`PIECE_RATE`) & Professional Fee (`PROFESSIONAL_FEE`)**
    *   `Basic Pay = Piece Rate` or `Professional Fee`

## 2. Government Deductions

Deductions are only applied if enabled in the worker's profile, and utilize the global `GovernmentSettings`.

*   **SSS:** `4.5%` of Gross Pay *(approximate simplified deduction)*.
*   **PhilHealth:** `Gross Pay * (Global PH Employee Rate)`.
*   **Pag-IBIG:** `Gross Pay * (Global Pag-IBIG Employee Rate)`, capped at `₱200` per month.
*   **Schedule Adjustments:** If the global deduction schedule is set to `SPLIT`, all calculated government deductions are divided by `2` for the current cutoff.

## 3. Taxation Formulas

*   **Taxable Income Computation:**
    `Taxable Income = Gross Pay - (SSS + PhilHealth + Pag-IBIG)`
*   **Expanded Withholding Tax (Consultants / 1-Lot):**
    `Withholding Tax = Taxable Income * (Withholding Tax Rate %)`
*   **Standard TRAIN/CREATE Compensation Brackets (if Taxable Income > ₱10,417):**
    *   `>= ₱333,333`: `₱91,770.70 + ((Taxable Income - 333,333) * 0.35)`
    *   `>= ₱83,333`: `₱16,770.70 + ((Taxable Income - 83,333) * 0.30)`
    *   `>= ₱33,333`: `₱4,270.70 + ((Taxable Income - 33,333) * 0.25)`
    *   `>= ₱16,667`: `₱937.50 + ((Taxable Income - 16,667) * 0.20)`
    *   `>= ₱10,417`: `(Taxable Income - 10,417) * 0.15`

## 4. Ledger Deductions

The system automatically pulls `ACTIVE` deduction ledgers (Loans & Cash Advances).
*   **Formula:** `Deducted Amount = Math.min(Deduction Per Payroll, Remaining Balance)`

## 5. Payment Compliance Validations

The engine automatically halts payments if compliance rules are violated:

*   **Weekly Salaried Workers:**
    *   **Rule:** Must be paid via **GCash Only**.
    *   **Violations:** Non-GCash method selected (`EXCEPTION`), missing GCash number (`ON_HOLD`), or unverified GCash profile (`ON_HOLD`).
*   **Semi-Monthly, Monthly, & Consultants:**
    *   **Rule:** Must be paid via **Bank Transfer Only**.
    *   **Violations:** Non-Bank method selected (`EXCEPTION`), missing Bank Account (`ON_HOLD`), or unverified Bank profile (`ON_HOLD`).

## 6. AI Pre-Submission Validator (`payrollAiValidator.ts`)

Before a payroll period can be submitted for review, the AI validator enforces strict logic checks to prevent financial errors:

*   **Critical Errors (Blocks Submission):**
    *   **Negative/Zero Net Pay:** Rejects if `Net Pay <= 0`. Requires manual adjustment of deductions.
    *   **High Deductions:** Rejects if `Total Deductions >= 60% of Gross Pay`. Flags to prevent starvation wages.
*   **Warnings (Flags for Review):**
    *   **Extreme Overtime:** Flags if `OT Pay > Basic Pay`. Prompts DTR verification.
    *   **Missing Gov Numbers:** Flags if a worker is being deducted for SSS, PhilHealth, or Pag-IBIG, but their profile is missing the respective ID number.
