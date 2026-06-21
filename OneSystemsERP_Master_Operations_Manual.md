# OneSystemsERP - Master User Operations Manual

**Version**: 1.0
**Target Audience**: All System Users

---

# Table of Contents
1. [Introduction to OneSystemsERP](#1-introduction-to-onesystemserp)
2. [User Roles and Access Rights](#2-user-roles-and-access-rights)
3. [Global Navigation & Interfaces](#3-global-navigation--interfaces)
4. [Module Operations: Core Management](#4-module-operations-core-management)
5. [Module Operations: Execution & Logistics](#5-module-operations-execution--logistics)
6. [Module Operations: Finance & Admin](#6-module-operations-finance--admin)
7. [Module Operations: AI & Support](#7-module-operations-ai--support)
8. [Frequently Asked Questions (FAQ)](#8-frequently-asked-questions)

---

## 1. Introduction to OneSystemsERP
OneSystemsERP is a comprehensive, AI-enhanced Project Management and Enterprise Resource Planning suite designed specifically for large-scale construction and engineering projects. It provides end-to-end visibility across procurement, finances, variation orders, site execution, and workforce management.

---

## 2. User Roles and Access Rights

The system enforces strict Role-Based Access Control (RBAC). Your assigned role dictates the modules you can view and the actions you can perform. 

### 2.1 System Administrator
*   **Role Purpose**: Maintains system integrity, configures settings, and manages users.
*   **Access Rights**: Unrestricted read/write access to **all** modules. Exclusive access to the `Users`, `Settings`, and `AI Command Center` modules.
*   **Limitations**: None.

### 2.2 Project Director / Executive
*   **Role Purpose**: High-level portfolio oversight and final financial approvals.
*   **Access Rights**: Full access to `Executive`, `Projects`, `Finance`, `Reports`, and `Variation Orders`.
*   **Special Abilities**: Holds the sole authority to give **Final Approval** to Variation Orders, which permanently updates the Project Revised Contract. Can override locked baselines.
*   **Limitations**: Blocked from altering System Users or System Settings.

### 2.3 Project Manager (PM)
*   **Role Purpose**: Day-to-day operational control of specific projects.
*   **Access Rights**: `Projects`, `Variation Orders`, `Subcontracting`, `Accomplishments`, `Documents`.
*   **Special Abilities**: Authority to **Lock the Consolidated BOQ**. Authority to draft and submit Variation Orders and participate in the middle-stages of the approval workflow.
*   **Limitations**: Cannot give final approval to VOs. Cannot issue Purchase Orders.

### 2.4 Procurement / Purchasing Officer
*   **Role Purpose**: Sourcing materials and managing supplier relationships.
*   **Access Rights**: `Procurement`, `Inventory`, `Projects` (Read-only BOQ access).
*   **Special Abilities**: Authority to generate Material Request Forms (MRFs) from locked BOQs and convert them into Purchase Orders (POs).
*   **Limitations**: Cannot request quantities exceeding the BOQ Remaining Balance. Cannot approve VOs or lock BOQs.

### 2.5 Finance Officer
*   **Role Purpose**: Cash flow management, billings, and payroll disbursement.
*   **Access Rights**: `Finance`, `Payroll`, `Accomplishments`, `Reports`.
*   **Special Abilities**: Generates Accounts Payable (for suppliers/subcontractors) and Accounts Receivable (client progress billings). Approves the financial viability of VOs during the "For Finance Review" stage.
*   **Limitations**: Cannot modify physical project accomplishments or inventory counts.

### 2.6 Warehouse Custodian
*   **Role Purpose**: Physical control of materials.
*   **Access Rights**: `Inventory`, `Material Issuance`.
*   **Special Abilities**: Receives deliveries against POs. Issues materials to the site, deducting them from inventory.
*   **Limitations**: Cannot purchase materials or view project financials.

### 2.7 Site Engineer / Supervisor
*   **Role Purpose**: Managing on-ground execution.
*   **Access Rights**: `Accomplishments`, `Equipment`, `Material Issuance` (Requesting), `Documents`.
*   **Special Abilities**: Submits daily accomplishment reports and logs equipment usage.
*   **Limitations**: Read-only access to most financial data.

---

## 3. Global Navigation & Interfaces

*   **Sidebar Navigation**: Located on the left. Click the `«` icon to collapse it for more screen space.
*   **Real-time Alerts**: The system pushes real-time notifications for pending approvals or MRF submissions.
*   **Global Fullscreen**: In data-heavy modules like the Consolidated BOQ, look for the **⛶ Maximize** button to enter Native Fullscreen Mode, removing all browser distractions.

---

## 4. Module Operations: Core Management

### 4.1 Dashboard
*   **Function**: Your daily landing page.
*   **Operations**: Displays aggregated KPIs, pending approvals specific to your role, and recent system activities.

### 4.2 Executive
*   **Function**: Portfolio-wide risk and financial tracking.
*   **Operations**: View aggregate charts of total contract values vs. revised values across all active projects. Identify projects with critical delays.

### 4.3 Projects & BOQ Management
*   **Function**: The central hub for project execution.
*   **Awarded BOQ**: The original contract baseline (Read-Only).
*   **Consolidated BOQ**: The living baseline. Automatically absorbs approved Variation Orders.
    *   *Operation - Locking BOQ*: A Project Manager must review the BOQ and click **Lock BOQ**. Once locked, Procurement is authorized to begin drawing materials.
    *   *Operation - Sorting*: The system automatically sorts original items alphabetically, but pushes any "New Additional Works" from VOs to the absolute bottom of the table, flagged with a `⚡ New via VO` badge.

### 4.4 Variation Orders
*   **Function**: Manages scope changes.
*   **Workflow**:
    1.  **Draft**: Create VO, input justifications, and add BOQ adjustments or new items.
    2.  **Submit**: Push through the approval pipeline (`For Costing` -> `PM Review` -> `Finance Review` -> `PD Approval`).
    3.  **AI Validation**: The AI runs a pre-check, assigning a Risk Rating (`CRITICAL`, `LOW`).
    4.  **Approve**: Once the Project Director approves, the system automatically calculates the Revised Contract and injects the new items into the Consolidated BOQ.

---

## 5. Module Operations: Execution & Logistics

### 5.1 Procurement (Material Requests & POs)
*   **Function**: Supply chain management securely tethered to the BOQ.
*   **Operations**:
    1.  Go to the Consolidated BOQ and select items to generate an MRF.
    2.  Input required quantities. **System Limitation**: You cannot request more than the `Remaining Balance` (Revised Qty - Delivered Qty).
    3.  Purchasing converts the MRF into a Purchase Order (PO) and sends it to the supplier.

### 5.2 Inventory & Material Issuance
*   **Function**: Tracking physical stock.
*   **Operations**:
    1.  **Receiving**: When a supplier delivers, the Warehouse Custodian logs the delivery against the PO. The BOQ `Delivered Qty` updates automatically.
    2.  **Issuance**: Site Engineers request materials from the warehouse via Material Issuance. Stock is deducted and charged to the project phase.

### 5.3 Accomplishments
*   **Function**: Tracking physical project progress.
*   **Operations**: Site engineers submit percentage-based or quantity-based progress reports against specific BOQ items. This triggers Finance to generate progress billings.

### 5.4 Subcontracting
*   **Function**: Managing third-party contractors.
*   **Operations**: Link subcontracts to specific portions of the BOQ. Subcontractors submit their own Accomplishments, which pass through a specialized approval workflow before payment.

### 5.5 Equipment
*   **Function**: Heavy machinery tracking.
*   **Operations**: Log equipment deployment locations, meter readings, fuel consumption, and scheduled maintenance. The system calculates hourly usage rates against the project budget.

---

## 6. Module Operations: Finance & Admin

### 6.1 Finance
*   **Function**: Accounts Payable and Receivable.
*   **Operations**: Generates invoices for clients based on Accomplishment reports. Generates payment vouchers for suppliers based on received Inventory.

### 6.2 Payroll
*   **Function**: Labor cost management.
*   **Operations**: Input Daily Time Records (DTR). The system calculates wages, overtime, and deductions, applying the labor cost directly to the project's financial ledger.

### 6.3 Reports & Documents
*   **Reports**: Generates downloadable PDF and Excel reports for executives.
*   **Documents**: A centralized, secure file repository. Upload blueprints, permits, and operations manuals here.

### 6.4 Users & Settings (Admin Only)
*   **Users**: Create employee accounts and assign RBAC roles.
*   **Settings**: Configure global tax rates, company details, and system-wide default behaviors.

---

## 7. Module Operations: AI & Support

### 7.1 AI Command Center
*   **Function**: The brain of the automated system.
*   **Operations**: View real-time logs of the AI agents validating Variation Orders, scanning for anomalous payroll data, and predicting supply chain delays.

### 7.2 AI ERP Assistant & Knowledge Center
*   **Function**: Your interactive co-pilot.
*   **Operations**: Navigate to the Assistant and type questions in plain English (e.g., *"Show me all pending MRFs for the VRF project"*). The Knowledge Center stores module-specific SOPs and historical project learnings.

---

## 8. Frequently Asked Questions (FAQ)

> [!TIP]
> **Q: I approved a Variation Order, but the Revised Contract didn't change.**
> A: Double-check the status. The financial payload only executes when the status is strictly set to **APPROVED** by the Project Director.
>
> **Q: Where are the new Variation items I just added?**
> A: They are located in the **BOQ Consolidation** tab. Scroll to the very bottom of the table. The system securely segregates them from original contract items.
>
> **Q: Why is the "Generate MRF" button missing?**
> A: Procurement is locked until a Project Manager officially finalizes and clicks **Lock BOQ** on the Consolidation tab.
>
> **Q: I am trying to request materials but I get an error.**
> A: You are exceeding the Remaining Balance. If the project requires more materials than originally budgeted, you must file a **Variation Order** to legally expand the BOQ baseline before the system will allow procurement.
