# Finance & Cash Management Module - Logic & Validation Reference

This document serves as the permanent reference for the formulas, validation criteria, VAT logic, and strict compliance controls utilized across the Finance Module (Accounts Payable, Accounts Receivable, Petty Cash, and General Ledger Expenses).

## 1. Accounts Payable (AP) & Supplier Disbursements
When processing payments for Accounts Payable Vouchers (`financeActions.ts`), the system applies automated business logic to prevent overpayment and track post-dated checks:

*   **Payment Status Automation:**
    *   **PAID:** `Total Paid >= Payable Amount` and `Payment Date >= Due Date`
    *   **PARTIALLY PAID:** `Total Paid < Payable Amount`
    *   **ACCRUED (Post-Dated):** If the Voucher's `Due Date` is strictly *after* the encoded `Payment Date`, the system automatically classifies the payment as `ACCRUED` to accurately reflect uncashed post-dated checks.
*   **VAT Recalculation (Vatable Suppliers):**
    *   When logging the payment into the General Ledger, the system splits the raw payment amount using the BIR formula:
    *   `Net Amount = Paid Amount / 1.12`
    *   `VAT Amount = Paid Amount - Net Amount`
*   **General Ledger (GL) Integration:**
    *   Upon payment, an `Expense` record is automatically spawned and mapped to the Project, directly linking the breakdown items to the specific BOQ items delivered.

## 2. Accounts Receivable (AR) & Client Collections
When receiving payments against Approved Progress Billings (`collectionService.ts`), the system strictly controls the balances:

*   **Overpayment Lock:**
    *   The system calculates `Current Total Paid + New Amount Paid`.
    *   If this exceeds `Net Amount Due + 0.01`, the system rigidly blocks the transaction to prevent accounting anomalies.
*   **Floating-Point Precision Fix:**
    *   To prevent infinite decimal bugs when closing out billings, the system checks: `Math.abs(New Total Paid - Net Amount Due) < 0.01`. If true, the status successfully locks as `PAID`.
    *   Otherwise, if `New Total Paid > 0`, it defaults to `PARTIALLY_PAID`.

## 3. Petty Cash Fund Management
The Petty Cash system enforces strict real-time balance tracking and automated liquidation grouping (`pettyCashActions.ts`):

*   **Disbursement Validation:**
    *   Before any cash is disbursed, the system verifies `Amount <= Current Balance`. Any transaction exceeding the physical fund on hand is immediately blocked.
    *   Upon disbursement, the system immediately deducts the amount from the active `Current Balance`.
*   **Billable Expense Integration:**
    *   If a petty cash expense is marked as "Billable to Project," the system automatically dual-logs it into the main Project General Ledger without requiring double data entry.
*   **Replenishment & Liquidation Cycle:**
    *   **Drafting:** Expenses are grouped and locked into a `PCR` (Petty Cash Replenishment) request.
    *   **Rejection:** If a replenishment is rejected, all linked expenses are automatically unlinked and reverted to `PENDING` so they can be re-evaluated.
    *   **Release & Restoration:** Once the replenished cash is physically released to the custodian, all underlying expenses are permanently locked as `LIQUIDATED`, and the account's `Current Balance` is automatically incremented by the requested amount, restoring the fund.
