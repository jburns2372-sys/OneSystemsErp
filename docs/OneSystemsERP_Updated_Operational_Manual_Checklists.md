# X. STANDARD OPERATING PROCEDURES (SOP) & CHECKLISTS

## OneSystems ERP - Standard Operating Procedures

1. **New Project Setup**: Project Manager creates project → Sets contract amount → Assigns users → Uploads Awarded BOQ → Uploads Procurement BOQ.
2. **New User Onboarding**: System Admin creates user → Assigns primary role → Project Manager assigns PBAC project context.
3. **Role Assignment**: Managed via `/users` and the specific Project details page.
4. **BOQ Upload**: Excel template uploaded → Validated for sum mismatch → Locked by Admin.
5. **Procurement Processing**: Site Engineer drafts MR → PM Approves → Purchasing creates Canvass → Generates PO.
6. **Supplier Quotation Processing**: At least 3 quotations attached to the Canvass → Lowest bidder selected unless justified otherwise.
7. **Purchase Order Processing**: Draft PO → Review against Benchmark BOQ → Approve by Director.
8. **Delivery & Receiving**: Guard logs entry → Warehouseman verifies quantity/quality against PO → Creates DR.
9. **Material Issuance**: Foreman requests items → Warehouseman issues via MIS → Inventory is deducted.
10. **Expense Encoding**: Staff logs direct expense → Attaches receipt → Tags BOQ item → Finance reviews and approves.
11. **Petty Cash Replenishment**: Custodian logs expenses → Balances drop below trigger → Submits Replenishment to Finance.
12. **Subcontract Creation**: PM drafts scope linked to Benchmark BOQ → Director approves.
13. **Job Order Creation**: Simplified subcontract for minor works → PM approves.
14. **Variation Order Processing**: Site identifies deviation → Drafts VO → Director and Client approve → Baseline updates.
15. **Accomplishment Update**: Site Engineer logs % complete → Uploads photo evidence → PM approves.
16. **Billing Preparation**: Finance aggregates approved accomplishments → Computes retention → Generates Billing statement.
17. **Payroll Processing**: Site Admin uploads DTRs → System computes wages & deductions → Director approves → Funds transferred.
18. **DTR Upload**: Mandatory daily/weekly Excel upload.
19. **Executive Report Generation**: Automatically generated real-time on Executive Dashboard. AI summary on demand.
20. **Monthly Closing**: Finance locks Expense Ledgers for the prior month.
21. **Backup and Restore**: Hosted database (Neon/PostgreSQL) managed automatically via continuous backups.
22. **User Access Review**: Quarterly review of active PBAC assignments.

---

# Y. CHECKLISTS

### 1. Project Setup Checklist
- [ ] Project Created with correct dates and contract amount
- [ ] Project Director and Manager assigned
- [ ] Awarded BOQ uploaded and locked
- [ ] Procurement Benchmark BOQ uploaded and locked
- [ ] Schedule Gantt chart generated
- [ ] Project Status set to ACTIVE

### 2. BOQ Upload Checklist
- [ ] Excel matches exact contract structure
- [ ] Sum of items matches total contract amount
- [ ] Benchmark quantities verified against value engineering targets

### 3. Procurement Checklist
- [ ] Material Request linked to correct Benchmark BOQ
- [ ] MR approved by Project Manager
- [ ] Minimum 3 supplier quotations attached (Canvass)
- [ ] PO generated and reviewed against budget
- [ ] PO approved by Director/Head

### 4. Delivery & Issuance Checklist
- [ ] Delivery received matches PO specifications
- [ ] Photographic evidence of delivery uploaded
- [ ] Issuance slip signed by receiving foreman

### 5. Expense Ledger Checklist
- [ ] Expense correctly categorized (Direct vs Indirect)
- [ ] Tagged to correct BOQ item (if direct)
- [ ] Clear photo of official receipt attached
- [ ] Reviewed and approved by Finance

### 6. Payroll & DTR Checklist
- [ ] All active workers have registered daily rates
- [ ] DTRs for the period completely uploaded
- [ ] Statutory deductions (SSS, PhilHealth) applied if enabled
- [ ] Payroll approved prior to cutoff

### 7. Subcontract & Job Order Checklist
- [ ] Scope drawn strictly from Procurement Benchmark BOQ
- [ ] Subcontractor signed contract attached
- [ ] Downpayment/Retention rules configured
- [ ] Variation Orders properly documented before payment

### 8. Billing & Executive Review Checklist
- [ ] Accomplishments have matching photographic evidence
- [ ] AI Validation shows no severe duplicate claims
- [ ] Previous billings properly deducted
- [ ] Executive dashboard shows accurate profitability margin
