# AA. APPROVAL WORKFLOWS MANUAL

The OneSystems ERP strictly enforces sequential statuses for all transactions to maintain a clean audit trail.

## 1. Material Request (MR) Workflow
- **Prepared By**: Site Engineer / Project Engineer
- **Status Sequence**: `DRAFT` → `FOR REVIEW` → `APPROVED` / `REJECTED`
- **Reviewed By**: Site Admin (Optional checking)
- **Approved By**: Project Manager
- **Audit Rules**: Cannot be approved if it causes a Benchmark BOQ overrun without overriding.

## 2. Purchase Order (PO) Workflow
- **Prepared By**: Purchasing Officer
- **Status Sequence**: `DRAFT` → `FOR REVIEW` → `APPROVED` / `REJECTED`
- **Reviewed By**: Purchasing Head
- **Approved By**: Project Director / Executive
- **Required Attachments**: The winning Canvass Form.
- **Audit Rules**: Cannot be approved if not linked to an Approved MR.

## 3. Delivery Receipt & Material Issuance (DR / MIS)
- **Prepared By**: Warehouseman
- **Status Sequence (DR)**: `PENDING RECEIVING` → `RECEIVED` → `VERIFIED`
- **Status Sequence (MIS)**: `REQUESTED` → `ISSUED`
- **Reviewed By**: Site Engineer (confirms quality of items)
- **Audit Rules**: MIS cannot exceed current inventory balance.

## 4. Subcontract & Job Order
- **Prepared By**: Project Manager
- **Status Sequence**: `DRAFT` → `FOR REVIEW` → `ACTIVE`
- **Approved By**: Project Director
- **Required Attachments**: Signed Subcontractor Agreement.

## 5. Variation Order (VO)
- **Prepared By**: Project Manager
- **Status Sequence**: `DRAFT` → `PENDING APPROVAL` → `APPROVED` / `REJECTED`
- **Approved By**: Project Director AND Client Representative (for Client VOs).
- **Audit Rules**: Immediately adjusts the Awarded BOQ contract baseline upon approval.

## 6. Accomplishment & Progress Billing
- **Prepared By**: Site Engineer (Accomplishment) → Finance (Billing)
- **Status Sequence**: `DRAFT` → `SUBMITTED` → `APPROVED`
- **Reviewed By**: Project Manager (Accomplishment)
- **Approved By**: Project Director
- **Required Attachments**: Photographic evidence for accomplishments.
- **Audit Rules**: Total billed cannot exceed 100% of the Awarded BOQ.

## 7. Expense Ledger & Petty Cash
- **Prepared By**: Site Admin / Requester
- **Status Sequence**: `DRAFT` → `PENDING APPROVAL` → `APPROVED`
- **Approved By**: Finance Officer
- **Required Attachments**: Official Receipt or Invoice.
- **AI Rule**: AI Validation scans the receipt photo to match amounts and flags potential duplicate expenses before Finance approves.

## 8. Payroll
- **Prepared By**: Site Admin (Uploads DTR)
- **Status Sequence**: `DRAFT` → `COMPUTED` → `FOR APPROVAL` → `APPROVED` / `DISBURSED`
- **Reviewed By**: Finance (checks computation)
- **Approved By**: Project Director (authorizes disbursement)
