# Procurement & Inventory Module - Logic & Validation Reference

This document serves as the permanent reference for the formulas, VAT logic, inventory validation rules, and numbering sequences utilized across the Procurement Module (Purchase Orders, Deliveries, Payables, and Material Issuances/Returns).

## 1. Purchase Order (PO) Computations
When a Material Request Form (MRF) is processed into a Purchase Order (`poActions.ts`), the system applies automated computations based on the Supplier's profile:

*   **Total Amount Formula:**
    `Total Amount = Sum of (Quantity * Unit Cost)` for all items assigned to that specific supplier.
*   **VAT Logic (If Supplier is Vatable):**
    *   *The system strictly uses the standard BIR formula (Gross / 1.12).*
    *   `Net Amount = Total Amount / 1.12`
    *   `VAT Amount = Total Amount - Net Amount`
*   **Non-Vatable Supplier:**
    *   `Net Amount = Total Amount`
    *   `VAT Amount = 0`
*   **Sequence Numbering:**
    *   `PO-[Year]-[4-digit Sequence]` (e.g., PO-2024-0012)

## 2. Delivery Processing & Accounts Payable
When deliveries are encoded and approved (`deliveryActions.ts`):

*   **Stockman Discrepancy Checks:**
    *   The system compares the `Physical Quantity` against the `DR Quantity`.
    *   If `Physical !== DR`, the system triggers an `isMismatch` flag and automatically generates auditing notes (e.g., *"Missing 5 of Cement (Reason: Damaged)"*).
*   **Accountant Approval & Inventory Sync:**
    *   Upon approval, the system increments the `deliveredQty` inside the Consolidated BOQ masterlist, physically injecting it into inventory.
*   **Automated Payables (Voucher) Generation:**
    *   The system recalculates the final payable using the *actual delivered quantity* and the approved *PO Unit Cost*.
    *   **Due Date Formula:** The system parses the supplier's `paymentTerms` text (e.g., "30 Days") via Regex `/(\d+)/`, extracting the integer and calculating:
        `Due Date = Delivery Date + extracted Term Days`
    *   **Voucher Numbering:** `PV-[Year]-[4-digit Sequence]`

## 3. Material Issuance (MIS) Validations
When materials are requested by foremen for field use (`issuanceActions.ts`):

*   **Eligibility Check:**
    *   Only items with a positive physical balance (`deliveredQty > consumedQty`) can be requested.
*   **Hard Lock on Approval:**
    *   Before the Accountant can release the slip, the system recalculates: `Available = deliveredQty - consumedQty`.
    *   If `Requested Qty > Available`, the transaction is blocked with an error.
*   **Inventory Deduction:**
    *   Upon approval, the system increments the `consumedQty` in the masterlist, physically withdrawing it from available stock.
*   **Sequence Numbering:**
    *   `MIS-[Year]-[4-digit Sequence]`

## 4. Material Returns (MRS) Processing
When foremen return unused or salvaged materials (`returnActions.ts`):

*   **Condition-Based Re-entry:**
    *   The system strictly checks the logged condition of the returned item.
    *   If `Condition === "GOOD"`, the system *decrements* the `consumedQty` in the BOQ masterlist, successfully returning the item back to available physical inventory.
    *   Defective or damaged returns are logged for auditing but do not replenish available inventory.
*   **Sequence Numbering:**
    *   `MRS-[Year]-[4-digit Sequence]`
