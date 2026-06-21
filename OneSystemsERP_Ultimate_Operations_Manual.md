# OneSystemsERP - Ultimate Master Operations Manual

**Version**: 2.0 (Complete System Roles Edition)
**Target Audience**: All System Users

---

# Table of Contents
1. [Introduction to OneSystemsERP](#1-introduction-to-onesystemserp)
2. [Complete System Roles & Access Rights](#2-complete-system-roles--access-rights)
3. [Comprehensive Module Operations](#3-comprehensive-module-operations)
   - 3.1 [Core Management Modules](#31-core-management-modules)
   - 3.2 [Execution & Logistics Modules](#32-execution--logistics-modules)
   - 3.3 [Finance & Administration Modules](#33-finance--administration-modules)
   - 3.4 [AI & Knowledge Modules](#34-ai--knowledge-modules)
4. [Frequently Asked Questions (FAQ)](#4-frequently-asked-questions)

---

## 1. Introduction to OneSystemsERP
OneSystemsERP is a comprehensive, AI-enhanced Enterprise Resource Planning suite designed for large-scale construction projects. It enforces strict Role-Based Access Control (RBAC) to ensure operational security.

---

## 2. Complete System Roles & Access Rights

The system actively manages **14 distinct roles**. Your assigned role strictly limits which modules you can view and operate.

### 2.1 SUPER ADMIN (`SUPER_ADMIN`)
*   **Modules**: ALL MODULES (Dashboard, System Roles, Procurement, Worker Database, Delivery Receiving, PO, Payroll, Finance, Inventory, Project Management, Subcontracting, Accomplishments, Equipment, Variation Orders, Reports, Documents, Knowledge Center, AI Command Center, Material Issuance, System Settings).
*   **Rights**: Unrestricted read, write, and override access globally.

### 2.2 PROJECT DIRECTOR (`PROJECT_DIRECTOR`)
*   **Modules**: ALL MODULES (Identical to Super Admin).
*   **Rights**: Executive oversight. Holds the ultimate authority to grant **Final Approval** to Variation Orders.

### 2.3 PROJECT MANAGER (`PROJECT_MANAGER`)
*   **Modules**: ALL MODULES.
*   **Rights**: Day-to-day operational control. Authority to **Lock the Consolidated BOQ**. Can draft, submit, and review Variation Orders but cannot grant final approval.

### 2.4 FINANCE OFFICER (`FINANCE_OFFICER`)
*   **Modules**: ALL MODULES.
*   **Rights**: Cash flow governance. Approves the financial viability of Variation Orders (Stage 5). Handles Accounts Payable/Receivable.

### 2.5 MATERIALS ENGINEER (`MATERIALS_ENGINEER`)
*   **Modules**: Procurement, Delivery Receiving, Purchase Order, Inventory, Project Management, Equipment, Reports, Documents, Dashboard, Material Issuance.
*   **Rights**: Evaluates material quality and oversees inventory specifications. Cannot view Payroll or System Settings.

### 2.6 PURCHASING OFFICER (`PURCHASING_OFFICER`)
*   **Modules**: Procurement, Delivery Receiving, Purchase Order, Inventory, Project Management, Reports, Documents, Dashboard.
*   **Rights**: Converts Material Request Forms (MRFs) into Purchase Orders (POs) and canvasses suppliers. Cannot issue Variation Orders.

### 2.7 STOCKMAN (`STOCKMAN`)
*   **Modules**: Procurement, Delivery Receiving, Inventory, Reports, Documents, Dashboard, Material Issuance.
*   **Rights**: Receives physical goods against POs. Cannot generate POs or view project financials.

### 2.8 PROJECT ACCOUNTANT (`PROJECT_ACCOUNTANT`)
*   **Modules**: Procurement, Purchase Order, Payroll, Finance, Inventory, Project Management, Subcontracting, Reports, Documents, Dashboard.
*   **Rights**: Focuses strictly on project-level accounting, labor cost allocation, and subcontractor billings.

### 2.9 COST OFFICER (`COST_OFFICER`)
*   **Modules**: Procurement, Finance, Project Management, Subcontracting, Accomplishments, Reports, Dashboard.
*   **Rights**: Analyzes cost overruns and compares original BOQ budgets against revised contracts.

### 2.10 SITE ENGINEER (`SITE_ENGINEER`)
*   **Modules**: Project Management, Accomplishments, Reports, Documents, Dashboard, Material Issuance.
*   **Rights**: Submits physical accomplishment reports. Draws materials from Inventory via Material Issuance. Read-only access to financials.

### 2.11 HR MANAGER (`HR_MANAGER`)
*   **Modules**: Worker Database, Payroll, Finance, Project Management, Reports, Documents, Dashboard.
*   **Rights**: Manages the workforce database and handles payroll generation from Daily Time Records (DTR).

### 2.12 CONTRACTS ADMINISTRATOR (`CONTRACTS_ADMINISTRATOR`)
*   **Modules**: Finance, Project Management, Subcontracting, Accomplishments, Variation Orders, Reports, Documents, Dashboard.
*   **Rights**: Drafts subcontracts, reviews legal justifications for Variation Orders, and tracks legal compliance.

### 2.13 EQUIPMENT MANAGER (`EQUIPMENT_MANAGER`)
*   **Modules**: Inventory, Project Management, Equipment, Reports, Documents, Dashboard.
*   **Rights**: Tracks heavy machinery, logging fuel consumption, deployment locations, and maintenance schedules.

### 2.14 GUEST USER (`GUEST_USER`)
*   **Modules**: Reports, Knowledge Center, Dashboard.
*   **Rights**: Strictly read-only overview for external auditors or stakeholders.

---

## 3. Comprehensive Module Operations

### 3.1 Core Management Modules

#### **Dashboard (`DASHBOARD`)**
*   **Function**: Landing page.
*   **Operations**: Displays aggregated KPIs, pending approvals specific to the user's role, and recent system activities.

#### **Project Management (`PROJECT_MANAGEMENT`)**
*   **Function**: Central hub for execution.
*   **Operations**:
    *   **Awarded BOQ**: View the immutable original baseline contract.
    *   **Consolidated BOQ**: View the living master list that absorbs Variation Orders.
    *   **Locking BOQ**: Project Managers click **Lock BOQ** to finalize the baseline for procurement.
    *   **Sorting Rule**: The system sorts original items alphabetically but pushes "New Additional Works" to the absolute bottom, flagged with `⚡ New via VO`.

#### **Variation Orders (`VARIATION_ORDERS`)**
*   **Function**: Scope management.
*   **Operations**:
    1.  **Draft**: Input justifications and add BOQ adjustments or new items.
    2.  **Submit**: Follow the pipeline: `For Costing` -> `PM Review` -> `Finance Review` -> `PD Approval`.
    3.  **Finalize**: Upon PD Approval, the system automatically recalculates the Revised Contract and injects new items into the BOQ.

### 3.2 Execution & Logistics Modules

#### **Procurement (`PROCUREMENT`)**
*   **Function**: Material requests.
*   **Operations**: Select items from the locked Consolidated BOQ. The system limits requests based on the `Remaining Balance`. Generates an MRF.

#### **Purchase Order (`PURCHASE_ORDER`)**
*   **Function**: Supplier engagement.
*   **Operations**: Purchasing Officers consolidate MRFs, canvas suppliers, and issue official POs.

#### **Delivery Receiving (`DELIVERY_RECEIVING`) & Inventory (`INVENTORY`)**
*   **Function**: Stock management.
*   **Operations**: Stockmen log physical deliveries against POs. Inventory counts increase automatically.

#### **Material Issuance (`MATERIAL_ISSUANCE`)**
*   **Function**: Site deployment.
*   **Operations**: Site Engineers request warehouse releases. Stock is deducted and charged to the project phase.

#### **Accomplishments (`ACCOMPLISHMENTS`)**
*   **Function**: Tracking physical progress.
*   **Operations**: Site Engineers log percentage completions against specific BOQ items to trigger billing cycles.

#### **Subcontracting (`SUBCONTRACTING`)**
*   **Function**: Third-party management.
*   **Operations**: Link contracts to BOQ scopes. Subcontractors submit independent accomplishments for payment.

#### **Equipment (`EQUIPMENT`)**
*   **Function**: Machinery tracking.
*   **Operations**: Log deployments, meter readings, and fuel usage. Costs are charged hourly against the project budget.

### 3.3 Finance & Administration Modules

#### **Worker Database (`WORKER_DATABASE`) & Payroll (`PAYROLL`)**
*   **Function**: Workforce management.
*   **Operations**: HR inputs Daily Time Records (DTR). System calculates wages and allocates labor costs to specific projects.

#### **Finance (`FINANCE`)**
*   **Function**: Cash flow governance.
*   **Operations**: Generates Accounts Payable (suppliers) and Accounts Receivable (client progress billings based on Accomplishments).

#### **System Roles (`SYSTEM_ROLES`) & Settings (`SYSTEM_SETTINGS`)**
*   **Function**: Security & config.
*   **Operations**: Super Admins assign the 14 system roles to employees and configure global tax rates and organizational data.

#### **Reports (`REPORTS`) & Documents (`DOCUMENTS`)**
*   **Function**: File management.
*   **Operations**: Upload PDFs, blueprints, and manuals into a secure, centralized vault.

### 3.4 AI & Knowledge Modules

#### **AI Command Center (`AI_COMMAND_CENTER`)**
*   **Function**: Automated oversight.
*   **Operations**: Admins monitor AI agents validating Variation Orders (assigning `CRITICAL` or `LOW` risk ratings) and flagging payroll anomalies.

#### **Knowledge Center (`KNOWLEDGE_CENTER`)**
*   **Function**: Organizational memory.
*   **Operations**: Users query the interactive **AI ERP Assistant** in plain English (e.g., *"Summarize VO #002"* or *"What is the remaining balance of wire?"*).

---

## 4. Frequently Asked Questions (FAQ)

> [!TIP]
> **Q: I am a Purchasing Officer. Why can't I approve a Variation Order?**
> A: The system enforces RBAC. Only PMs, Finance, and Project Directors are authorized in the VO pipeline.
>
> **Q: I approved a Variation Order, but the Revised Contract didn't change.**
> A: Only a `PROJECT_DIRECTOR` or `SUPER_ADMIN` can grant **Final Approval**. Until then, the financial payload remains staged.
>
> **Q: Where are the new Variation items I just added?**
> A: In the **BOQ Consolidation** tab, scroll to the absolute bottom of the table. They are segregated and labeled with a **⚡ New via VO** badge.
>
> **Q: I am trying to request materials but I get an error.**
> A: You are exceeding the Remaining Balance. To request more, you must file a **Variation Order** for "Additional Works" to expand the BOQ baseline.
