# OneSystemsERP — Workflow Charts

**Document Code:** WFC-001  
**Version:** 1.0  
**Classification:** Internal — All Staff  
**Effective Date:** June 2026  

---

## 📋 Table of Workflow Charts

1. [Master ERP Workflow Overview](#1-master-erp-workflow-overview)
2. [Procurement Workflow](#2-procurement-workflow)
3. [Variation Order Approval Pipeline](#3-variation-order-approval-pipeline)
4. [Payroll Processing Workflow](#4-payroll-processing-workflow)
5. [Progress Billing Workflow](#5-progress-billing-workflow)
6. [Delivery & Inventory Workflow](#6-delivery--inventory-workflow)
7. [Subcontracting Workflow](#7-subcontracting-workflow)
8. [Petty Cash & Expense Workflow](#8-petty-cash--expense-workflow)
9. [User Onboarding Workflow](#9-user-onboarding-workflow)
10. [AI Validation & Override Workflow](#10-ai-validation--override-workflow)

---

## 1. Master ERP Workflow Overview

```mermaid
flowchart TD
    A["🏗️ Project Created"] --> B["📄 Awarded BOQ Imported"]
    B --> C["🔒 BOQ Locked by PM"]
    C --> D{"Scope Change Needed?"}
    D -->|Yes| E["📝 Variation Order Created"]
    D -->|No| F["📋 MRF Generated"]
    E --> G["VO Approval Pipeline"]
    G --> H["✅ VO Approved by PD"]
    H --> I["BOQ Updated with VO Items"]
    I --> F
    F --> J["🔍 Supplier Canvassing"]
    J --> K["📦 PO Created & Approved"]
    K --> L["🚚 Delivery Received"]
    L --> M["📊 Inventory Updated"]
    M --> N["🏭 Material Issued to Site"]
    N --> O["📈 Accomplishment Reported"]
    O --> P["💰 Progress Billing Generated"]
    P --> Q["✅ Billing Approved by PD"]
    Q --> R["💵 Collection from Client"]
    
    style A fill:#1a1a2e,stroke:#00f0ff,color:#fff
    style C fill:#1a1a2e,stroke:#ffd43b,color:#fff
    style H fill:#1a1a2e,stroke:#22c55e,color:#fff
    style R fill:#1a1a2e,stroke:#22c55e,color:#fff
```

**Key Principle:** Every transaction in OneSystemsERP is traceable back to the BOQ baseline. No material can be procured, no billing can be generated, and no cost can be charged without a valid BOQ reference.

---

## 2. Procurement Workflow

```mermaid
flowchart TD
    A["PM Locks Consolidated BOQ"] --> B["PM/PE Selects BOQ Items"]
    B --> C["📋 MRF Generated"]
    C --> D{"Qty ≤ Remaining Balance?"}
    D -->|No| E["❌ System Blocks Request"]
    E --> F["File Variation Order for Additional Works"]
    F --> G["VO Approved → BOQ Updated"]
    G --> B
    D -->|Yes| H["MRF Submitted to Procurement"]
    H --> I["Purchasing Officer Receives MRF"]
    I --> J["🔍 Canvass 3+ Suppliers"]
    J --> K["Compare Quotations"]
    K --> L["Select Best Supplier"]
    L --> M["📦 Create Purchase Order"]
    M --> N{"PO Value > Threshold?"}
    N -->|Yes| O["PD Approval Required"]
    N -->|No| P["PO Approved"]
    O --> P
    P --> Q["PO Sent to Supplier"]
    Q --> R["🚚 Supplier Delivers Materials"]
    R --> S["Stockman Inspects & Receives"]
    S --> T["Inventory Stock Updated"]
    T --> U["Supplier Payable Created"]
    
    style E fill:#7f1d1d,stroke:#ef4444,color:#fff
    style P fill:#14532d,stroke:#22c55e,color:#fff
    style T fill:#1e3a5f,stroke:#3b82f6,color:#fff
```

**Roles Involved:**
| Step | Role |
|------|------|
| Lock BOQ | Project Manager |
| Generate MRF | PM / PE / Purchasing Officer |
| Canvass Suppliers | Purchasing Officer |
| Create PO | Purchasing Officer |
| Approve PO | Project Director |
| Receive Delivery | Stockman |
| Inspect Quality | Materials Engineer |

---

## 3. Variation Order Approval Pipeline

```mermaid
flowchart LR
    A["📝 DRAFT"] --> B["📤 SUBMITTED"]
    B --> C["💰 FOR COSTING"]
    C --> D["👷 PM REVIEW"]
    D --> E["💵 FINANCE REVIEW"]
    E --> F["👑 PD APPROVAL"]
    F --> G{"Decision"}
    G -->|Approved| H["✅ APPROVED"]
    G -->|Rejected| I["❌ REJECTED"]
    H --> J["Revised Contract Updated"]
    J --> K["New Items Injected into BOQ"]
    K --> L["Items Tagged with ⚡ New via VO"]
    I --> A

    style A fill:#374151,stroke:#9ca3af,color:#fff
    style C fill:#7c3aed,stroke:#a78bfa,color:#fff
    style D fill:#2563eb,stroke:#60a5fa,color:#fff
    style E fill:#d97706,stroke:#fbbf24,color:#fff
    style F fill:#dc2626,stroke:#f87171,color:#fff
    style H fill:#16a34a,stroke:#4ade80,color:#fff
    style I fill:#7f1d1d,stroke:#ef4444,color:#fff
```

**Stage Details:**

| Stage | Responsible | Action |
|-------|-------------|--------|
| Draft | PM / Contracts Admin | Create VO with justification and BOQ items |
| For Costing | Cost Officer | Verify unit costs and financial calculations |
| PM Review | Project Manager | Review scope impact and recommend |
| Finance Review | Finance Officer | Verify budget availability and financial viability |
| PD Approval | Project Director | Final approval — permanently updates contract |

**AI Validation:** The AI engine assigns a Risk Rating (`CRITICAL` or `LOW`) before PD review.

---

## 4. Payroll Processing Workflow

```mermaid
flowchart TD
    A["📅 Payroll Period Created"] --> B["📝 DTR Entries Completed"]
    B --> C["⚙️ Compute Payroll"]
    C --> D["🤖 AI Validator Runs"]
    D --> E{"AI Flags?"}
    E -->|Critical Errors| F["❌ Submission Blocked"]
    F --> G["Resolve Issues"]
    G --> C
    E -->|Warnings Only| H["⚠️ Review Warnings"]
    H --> I["Submit for Review"]
    E -->|No Flags| I
    I --> J["Payroll Master Reviews"]
    J --> K["Payroll Master Approves Batch"]
    K --> L["Finance Officer Reviews"]
    L --> M["PD Authorizes Payment"]
    M --> N{"Payment Method"}
    N -->|Bank Transfer| O["🏦 Bank File Generated"]
    N -->|GCash| P["📱 GCash Batch Processed"]
    O --> Q["Payment Confirmation Uploaded"]
    P --> Q
    Q --> R["✅ Payroll Period Closed"]

    style F fill:#7f1d1d,stroke:#ef4444,color:#fff
    style H fill:#92400e,stroke:#f59e0b,color:#fff
    style R fill:#14532d,stroke:#22c55e,color:#fff
```

**Computation Formula Summary:**

| Component | Formula |
|-----------|---------|
| Gross Pay | Basic Pay + Overtime Pay + Allowances |
| Overtime | OT Hours × Hourly Rate × 1.25 |
| SSS | 4.5% of Gross |
| PhilHealth | Gross × PH Rate |
| Pag-IBIG | Gross × Rate (max ₱200/month) |
| Net Pay | Gross − Gov Deductions − Tax − Ledger Deductions |

**AI Critical Blocks:** Net Pay ≤ 0 | Deductions ≥ 60% of Gross

---

## 5. Progress Billing Workflow

```mermaid
flowchart TD
    A["👷 Site Engineer Submits Accomplishment"] --> B["📸 Photos & Evidence Attached"]
    B --> C["PM/PE Reviews Accomplishment"]
    C --> D{"Approved?"}
    D -->|No| E["Returned for Correction"]
    E --> A
    D -->|Yes| F["✅ Accomplishment Approved"]
    F --> G["Finance Generates Progress Billing"]
    G --> H["Apply Retention Percentage"]
    H --> I["Billing Summary Prepared"]
    I --> J["PD Reviews & Approves"]
    J --> K["📧 Invoice Sent to Client"]
    K --> L["Client Pays"]
    L --> M["Finance Records Collection"]
    M --> N["💵 Accounts Receivable Updated"]

    style F fill:#14532d,stroke:#22c55e,color:#fff
    style J fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style N fill:#14532d,stroke:#22c55e,color:#fff
```

**Billing Formula:**
```
Current Billing = (Cumulative Accomplishment × Unit Price) − Previous Billings
Net Billing = Current Billing − Retention (typically 10%)
```

---

## 6. Delivery & Inventory Workflow

```mermaid
flowchart TD
    A["📦 PO Sent to Supplier"] --> B["🚚 Supplier Ships Materials"]
    B --> C["Stockman Receives at Warehouse"]
    C --> D["Physical Inspection"]
    D --> E{"Condition OK?"}
    E -->|Damaged| F["📸 Document Damage"]
    F --> G["Report to Purchasing Officer"]
    G --> H["Coordinate Replacement/Credit"]
    E -->|OK| I["Log Delivery in System"]
    I --> J["Select PO → Enter Qty Received"]
    J --> K{"Full or Partial?"}
    K -->|Full| L["PO Status → Delivered"]
    K -->|Partial| M["PO Status → Partial"]
    M --> N["Track Outstanding Balance"]
    L --> O["📊 Inventory Stock Increased"]
    O --> P["BOQ Delivered Qty Updated"]
    P --> Q["💳 Supplier Payable Created"]

    subgraph "Material Issuance Flow"
        R["Site Engineer Requests Issuance"] --> S["Stockman Checks Stock"]
        S --> T{"Sufficient Stock?"}
        T -->|Yes| U["Confirm Full Issuance"]
        T -->|No| V["Partially Issue + Notify PM"]
        U --> W["📉 Inventory Stock Deducted"]
        V --> W
        W --> X["Cost Charged to Project"]
    end

    Q --> R

    style O fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style W fill:#92400e,stroke:#f59e0b,color:#fff
```

---

## 7. Subcontracting Workflow

```mermaid
flowchart TD
    A["📋 Create Subcontract Package"] --> B["Link to BOQ Scope Items"]
    B --> C["Assign Subcontractor"]
    C --> D["Define Work Package Milestones"]
    D --> E["Issue Job Order"]
    E --> F["Subcontractor Executes Work"]
    F --> G["Subcontractor Reports Accomplishment"]
    G --> H["PM/PE Verifies On-Site"]
    H --> I{"Accepted?"}
    I -->|No| J["Return for Correction"]
    J --> G
    I -->|Yes| K["✅ Accomplishment Approved"]
    K --> L["Subcontractor Submits Invoice"]
    L --> M["Finance Reviews Invoice"]
    M --> N["Contracts Admin Verifies Compliance"]
    N --> O["PD Approves Payment"]
    O --> P["💵 Payment Processed"]

    style K fill:#14532d,stroke:#22c55e,color:#fff
    style P fill:#14532d,stroke:#22c55e,color:#fff
```

---

## 8. Petty Cash & Expense Workflow

```mermaid
flowchart TD
    A["💰 Petty Cash Account Created"] --> B["Initial Fund Deposited"]
    B --> C["Site Staff Requests Cash"]
    C --> D["Custodian Disburses"]
    D --> E["📝 Log Transaction + Upload Receipt"]
    E --> F{"Balance < Threshold?"}
    F -->|No| C
    F -->|Yes| G["Prepare Liquidation Report"]
    G --> H["Request Replenishment"]
    H --> I["Finance Reviews Liquidation"]
    I --> J["PD Approves Replenishment"]
    J --> K["💵 Fund Replenished"]
    K --> C

    subgraph "Expense Voucher Flow"
        L["Staff Incurs Expense"] --> M["📄 Submit Expense Report"]
        M --> N["Upload Receipt/Invoice"]
        N --> O["Finance Reviews & Approves"]
        O --> P["Cost Charged to Project"]
    end

    style K fill:#14532d,stroke:#22c55e,color:#fff
```

---

## 9. User Onboarding Workflow

```mermaid
flowchart TD
    A["📨 HR Submits New User Request"] --> B["Admin Creates Account"]
    B --> C["Assign RBAC Role"]
    C --> D["Generate Temp Password"]
    D --> E["📧 Notify User Securely"]
    E --> F["User First Login"]
    F --> G["Change Password"]
    G --> H["Review Dashboard"]
    H --> I["Read New User Training Guide"]
    I --> J["Read Role-Specific Training Guide"]
    J --> K["Shadow Session with Colleague"]
    K --> L["Practice Core Tasks"]
    L --> M["Complete Onboarding Checklist"]
    M --> N["Supervisor Sign-Off"]
    N --> O["✅ Onboarding Complete"]

    style O fill:#14532d,stroke:#22c55e,color:#fff
```

---

## 10. AI Validation & Override Workflow

```mermaid
flowchart TD
    A["📄 Transaction Submitted"] --> B["🤖 AI Validation Engine Analyzes"]
    B --> C{"Risk Rating"}
    C -->|LOW| D["✅ Transaction Proceeds Normally"]
    C -->|CRITICAL| E["🚨 Flagged for Review"]
    E --> F["Enters Director Audit Queue"]
    F --> G["PD Reviews AI Assessment"]
    G --> H{"PD Decision"}
    H -->|Override - Accept| I["✅ Transaction Approved"]
    I --> J["Override Reason Logged"]
    H -->|Reject| K["❌ Transaction Blocked"]
    K --> L["Returned to Originator"]
    L --> M["Originator Corrects & Resubmits"]
    M --> A

    subgraph "AI Checks Include"
        N["VO Pricing Anomalies"]
        O["Payroll: Negative Net Pay"]
        P["Payroll: Excessive OT"]
        Q["Procurement: Duplicate Orders"]
        R["Budget Overrun Detection"]
    end

    style D fill:#14532d,stroke:#22c55e,color:#fff
    style E fill:#7f1d1d,stroke:#ef4444,color:#fff
    style I fill:#14532d,stroke:#22c55e,color:#fff
    style K fill:#7f1d1d,stroke:#ef4444,color:#fff
```

---

**Workflow Charts — End of Document**  
*OneSystemsERP Training & Operations Package*  
*Document Code: WFC-001 | Version 1.0*
