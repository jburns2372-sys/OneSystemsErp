# A. COVER PAGE

## OneSystems ERP - Comprehensive Operational Manual
**Version**: 2.5 (Current Build)  
**Date Generated**: June 25, 2026  
**Prepared for**: OneSystems Integration Philippines, Inc.  
**Purpose of the Manual**: To provide complete operating, administrative, and management instructions for the OneSystems ERP application, reflecting the latest multi-project handling, AI features, procurement pipelines, and Project-Based Access Controls (PBAC).  
**Confidentiality Notice**: This document contains proprietary information regarding the workflows, schemas, and AI-integrations of OneSystems Integration Philippines, Inc. Unauthorized distribution is prohibited.

---

# B. TABLE OF CONTENTS

1. Executive Summary
2. System Overview
3. Module-by-Module Operational Guide
4. Project Setup Manual
5. Multi-Project Management
6. User Roles and Permissions Manual
7. Awarded BOQ Manual
8. Procurement Benchmark BOQ / Forecast BOQ Manual
9. Procurement Operations Manual
10. Subcontracting and Job Order Manual
11. Variation Order Manual
12. Project Scheduling Manual
13. Accomplishment and Billing Manual
14. Expense Ledger and Actual Cost Monitoring
15. Payroll and Workers Manual
16. Accounting and Finance Manual
17. Executive Dashboard Manual
18. AI Features Manual
19. File Management and Document Viewer Manual
20. Reports and Printable Forms Manual
21. System Administration Manual

---

# C. EXECUTIVE SUMMARY

The OneSystems ERP system is a comprehensive, centralized platform built to modernize construction and infrastructure project management. It addresses the critical need for **multi-project control** through robust **Project-Based Access Control (PBAC)**, ensuring data isolation and operational security across concurrent projects.

The system tightly controls construction project monitoring, enforcing a strict separation between the **Awarded BOQ** (the contractual baseline) and the **Procurement Benchmark BOQ / Forecast BOQ** (the internal cost-control target). This dual-BOQ approach anchors the entire procurement lifecycle, driving expenses, subcontractor management, job orders, and material issuances against predetermined budgetary limits. 

The ERP features extensive billing and accomplishment tracking, payroll management, and executive reporting. It is augmented throughout by **AI-assisted validation**—leveraging advanced models to analyze procurement risks, automate scheduling, flag budget overruns, and generate real-time executive summaries. 

---

# D. SYSTEM OVERVIEW

The OneSystems ERP acts as the operational nerve center for the enterprise. 

1. **Purpose of the App**: To provide end-to-end operational, financial, and logistical tracking from the day a project is awarded to its final billing and handover.
2. **Main Users**: System Administrators, Project Directors, Project Managers, Purchasing Officers, Finance/Accounting teams, Site Admins, and Executive leadership.
3. **Core Modules**: Dashboard, AI Command Center, Projects, Procurement, Inventory, Material Issuance, Finance, Subcontracting, Accomplishments, Scheduling, Payroll, Equipment, Variation Orders, Reports, Documents, Knowledge Center, System Roles & Users.
4. **System Workflow**: 
   - A project is created.
   - The Awarded BOQ is encoded.
   - The internal Procurement Benchmark BOQ is established.
   - Operations begin: Material Requests (MR) and Purchase Orders (PO) consume the Benchmark BOQ.
   - Deliveries and Issuances transfer materials to site.
   - Accomplishments are logged against the Awarded BOQ, driving Billing.
   - Payroll and Direct Expenses are logged against specific projects and BOQ items.
5. **Data Flow**: Every cost (materials, labor, subcontracts) is tagged to a specific project and BOQ item. This enables real-time comparison of Actual Expenses versus the Awarded Contract (profitability) and against the internal Benchmark (operational efficiency).

---

# E. MODULE-BY-MODULE OPERATIONAL GUIDE

### 1. Dashboard (`/`)
- **Purpose**: A high-level overview of active projects, pending approvals, and urgent tasks.
- **Access**: All users (filtered by Project-Based Access).
- **Usage**: Automatically aggregates data relevant to the logged-in user. Executives see portfolio summaries; site engineers see site-specific metrics.

### 2. Executive View (`/executive/home`)
- **Purpose**: C-Suite multi-project portfolio overview.
- **Access**: `DIRECTORS`, `SUPER_ADMIN`.
- **Usage**: View aggregated contract amounts, cost to date, profitability, and AI-generated risk alerts across all active projects. 

### 3. Projects (`/projects`)
- **Purpose**: To manage the project directory, locations, and global statuses.
- **Access**: `PROJECT_MANAGEMENT` permission.
- **Usage**: Use this to create new projects, set VAT rates, and define retention limits. 

### 4. AI Command Center (`/ai-command-center`)
- **Purpose**: Direct interaction with the ERP's underlying AI RAG (Retrieval-Augmented Generation) engine.
- **Usage**: Users can type queries like "Show me all delayed POs for Project X". The AI will fetch live database records, generate charts, and summarize findings.

### 5. Procurement (`/procurement`)
- **Purpose**: Manages MRs, Canvasses, and POs.
- **Usage**: Site engineers create MRs linked to Benchmark BOQs. Purchasing creates Canvasses and issues POs.
- **Best Practice**: Never issue a PO without a corresponding approved MR and Benchmark BOQ allocation.

### 6. Inventory & Material Issuance (`/inventory`, `/material-issuance`)
- **Purpose**: Track received items (Deliveries) and release them to the site (Issuances).
- **Usage**: Warehousemen log Delivery Receipts against POs, then issue materials to foremen/subcontractors using Material Issuance Slips (MIS).

### 7. Finance & Expenses (`/finance`, `/expenses`)
- **Purpose**: Log direct expenses, petty cash, and manage supplier payables.
- **Access**: `FINANCE` and `PETTY_CASH` permissions.
- **Usage**: Log receipts, upload proof files, and route for approval. 

### 8. Subcontracting & Job Orders (`/subcontracting`, `/job-orders`)
- **Purpose**: Issue sub-packages and small job orders (e.g., painting, masonry) based on the Benchmark BOQ.
- **Usage**: Create contracts, process subcontractor billings, and apply retention rules.

### 9. Accomplishments & Billing (`/accomplishments`, `/progress-billings`)
- **Purpose**: Track physical progress and submit client billings.
- **Usage**: Log % complete against the Awarded BOQ. Upload photographic evidence. Finance converts approved accomplishments into Progress Billings.

### 10. Scheduling (`/scheduling`)
- **Purpose**: Gantt and PERT/CPM charts.
- **Usage**: Link activities to Awarded BOQ items. Update progress to track critical path delays. AI can assist in generating schedules from BOQ data.

### 11. Payroll & Workers (`/payroll`, `/workers`)
- **Purpose**: Manage the daily/weekly workforce, DTRs, and wage calculations.
- **Usage**: Encode workers, log daily attendance, generate payroll registers, and allocate labor costs to projects.

### 12. Equipment & Variation Orders (`/equipment`, `/variation-orders`)
- **Purpose**: Track fleet trips, equipment deployment, and changes to the contractual scope.
- **Usage**: Log VOs. Additive/Deductive VOs immediately adjust the Awarded Contract baseline and require high-level approval.

---

# F. PROJECT SETUP MANUAL

To initiate a new project, follow these strict sequential steps:

1. **Create Project**: Navigate to `/projects`. Click "New Project". Enter Name, Location, Contract Amount, VAT rules, and Dates.
2. **Assign Project Users**: Navigate to the Project Details > Users. Assign specific staff to the project (this drives the PBAC system).
3. **Upload Awarded BOQ**: Navigate to the Project > BOQ. Upload the finalized contract BOQ. This establishes the revenue baseline. **Lock** this once approved.
4. **Upload Procurement Benchmark BOQ**: Upload the internal cost-control BOQ. This dictates operational spending limits. **Lock** this once finalized.
5. **Set Schedule**: Navigate to Scheduling to map BOQ items to timeline activities.
6. **Activate**: The Project Manager validates the setup and updates the status to `ACTIVE`.

---

# G. MULTI-PROJECT MANAGEMENT

The ERP operates on a strict **Project-Based Access Control (PBAC)** architecture.

1. **Project-Level Data Separation**: Every MR, PO, Expense, and DTR is strictly tagged with a `projectId`. 
2. **Active Context**: Users assigned to multiple projects must select their "Active Project Workspace" from the top navigation bar. 
3. **Filtering**: The system automatically injects the active `projectId` into all database queries, completely isolating the current view from other projects.
4. **Cross-Project Contamination Prevention**: Users cannot select a BOQ item from Project A when creating an MR for Project B. The dropdowns are intrinsically filtered by PBAC.

---

# H. USER ROLES AND PERMISSIONS MANUAL

The ERP utilizes an aggregated, module-by-module permission matrix.

1. **SUPER_ADMIN / SYSTEM_ADMIN**: Full global bypass. Can view and edit all projects and access System Administration routes.
2. **PROJECT_DIRECTOR / EXECUTIVES**: Full read access across all assigned projects. Has high-level approval authority for Variation Orders and Payroll.
3. **PROJECT_MANAGER**: Full operational control within assigned projects. Can approve MRs, Accomplishments, and Job Orders.
4. **FINANCE / ACCOUNTING**: Access to Expense ledgers, petty cash, and supplier payables. Cannot alter BOQs.
5. **PURCHASING_OFFICER**: Access to Canvass and PO modules. Cannot approve their own POs.
6. **GUEST_USER**: 
   - **CRITICAL RESTRICTION**: The Guest User is **STRICTLY VIEW-ONLY**.
   - Allowed: Viewing dashboards, logs, reports, and read-only tables.
   - Prohibited: Creating, editing, deleting, approving, rejecting, uploading, exporting, and executing AI actions. 
   - Implementation: The backend explicitly strips all write-privileges (`canCreate: false`, `canEdit: false`, etc.) dynamically if the user has this role.

---

# I. AWARDED BOQ MANUAL

1. **Purpose**: Represents the legal contract between the company and the Client.
2. **Uploading**: Use the Excel import feature in the BOQ module. Ensure Item Code, Description, Unit, Quantity, and Unit Price match the contract exactly.
3. **Billing Relevance**: Progress Billings compute revenue recognized based purely on the Awarded BOQ.
4. **Locking**: Once uploaded and verified, the Awarded BOQ must be locked by an Administrator. It cannot be altered except via official Variation Orders.

---

# J. PROCUREMENT BENCHMARK BOQ / FORECAST BOQ MANUAL

1. **Purpose**: Represents the internal, value-engineered budget. This is what the Purchasing team uses to buy materials.
2. **Difference from Awarded**: The Benchmark BOQ may consolidate similar items, optimize quantities (factoring in wastage), or utilize alternative materials, aiming for a cost lower than the Awarded BOQ to secure a profit margin.
3. **Operational Impact**: Material Requests (MR) and Subcontracts *must* draw from the Benchmark BOQ. If a requested quantity exceeds the remaining Benchmark quantity, the system will flag an overrun and require executive override.

---

# K. PROCUREMENT OPERATIONS MANUAL

1. **Material Request (MR)**: Initiated by Site Engineers. Must link to a Benchmark BOQ item. Approved by Project Manager.
2. **Canvass**: Purchasing receives the MR and encodes supplier quotations.
3. **Purchase Order (PO)**: Generated from the winning Canvass. Approved by Purchasing Head or Director (depending on amount).
4. **Delivery Receipt (DR)**: Warehouse receives the items, verifying against the PO. Updates Inventory.
5. **Material Issuance (MIS)**: Warehouse issues materials to the site foreman for installation, officially moving the asset from inventory to an consumed project expense.

---

# L. SUBCONTRACTING AND JOB ORDER MANUAL

1. **Subcontract Package**: For large scopes (e.g., full electrical works). Linked to the Benchmark BOQ. Involves contract amounts, retention, and progress billings.
2. **Job Orders**: For small, fast scopes (e.g., patch painting). Simplified workflow, usually paid upon 100% completion without complex retention.
3. **Approval Workflow**: Subcontracts require Director-level approval. Job orders can typically be approved by the Project Manager.

---

# M. VARIATION ORDER MANUAL

1. **Client Variation Orders**: Changes requested by the client. Directly modifies the Awarded BOQ baseline (Additive or Deductive).
2. **Subcontractor Variation Orders**: Changes to a subcontractor's scope. Modifies the internal committed cost but does not necessarily change the client's Awarded BOQ.
3. **Approval**: Requires comprehensive justification, cost breakdowns, and Executive approval due to the immediate impact on project profitability.

---

# N. PROJECT SCHEDULING MANUAL

1. **Gantt / PERT**: The ERP features interactive scheduling interfaces.
2. **Dependencies**: Link activities (Finish-to-Start, etc.) to calculate the Critical Path.
3. **Progress Updates**: As Accomplishments are logged in the BOQ, the Schedule module visually updates the % complete for linked activities, throwing AI alerts if the activity falls behind the target date.

---

# O. ACCOMPLISHMENT AND BILLING MANUAL

1. **Logging Accomplishment**: Site Engineers input installed quantities against Awarded BOQ items.
2. **Evidence**: Mandatory photo uploads are required for significant accomplishments.
3. **AI Validation**: The system can analyze uploaded photos against the expected scope to assign an AI Confidence Score, flagging potential over-claims.
4. **Billing Preparation**: The Finance module aggregates all approved accomplishments in a given period to generate the official Progress Billing document, deducting previous billings and retention.

---

# P. EXPENSE LEDGER AND ACTUAL COST MONITORING

1. **Encoding**: All non-PO direct costs (e.g., equipment rental, field purchases) are logged in the Expense Ledger.
2. **Tagging**: Every expense must be tagged to a Project and a Consolidated BOQ Item.
3. **Profitability**: The Executive Dashboard continuously compares `Actual Costs (PO Deliveries + Expenses + Payroll)` against the `Awarded Contract Value` to calculate real-time gross profit.

---

# Q. PAYROLL AND WORKERS MANUAL

1. **Worker Database**: Centralized registry of all personnel, tracking daily rates, deductions, and payment methods (GCash, Bank).
2. **DTR**: Daily Time Records are encoded by the Site Admin. Tracks Regular hours, Overtime, and Lates.
3. **Payroll Generation**: The system processes DTRs for a given cut-off period, applies statutory deductions (SSS, PhilHealth), and generates the final Payroll Register.

---

# R. ACCOUNTING AND FINANCE MANUAL

1. **Supplier Payables**: The system automatically tracks liabilities generated from approved Delivery Receipts.
2. **Petty Cash**: Site Admins maintain an imprest petty cash fund. Expenses are logged, and Replenishment Requests are routed to Finance when the fund drops below the trigger threshold.

---

# S. EXECUTIVE DASHBOARD MANUAL

1. **Access**: Exclusively for `DIRECTORS` and `SUPER_ADMIN`.
2. **Features**: High-level visual widgets showing total Portfolio Value, Aggregated Profitability, Severe Schedule Delays, and pending high-value PO approvals.
3. **AI Summaries**: Executives can trigger the AI to read the entire week's logs and generate a one-page natural language summary of project health.

---

# T. AI FEATURES MANUAL

1. **AI RAG Command Center**: Conversational interface for querying database metrics.
2. **AI Validation**: Automatically scans MRs and Expenses for duplicate entries, budget overruns, or suspicious pricing.
3. **Human Review Rule**: **CRITICAL**: The ERP operates on a strict "Human-in-the-Loop" architecture. AI output is strictly assistive. No AI action can permanently alter financial ledgers or approve POs without explicit human validation.

---

# U. FILE MANAGEMENT AND DOCUMENT VIEWER MANUAL

1. **Uploads**: Files can be attached to Expenses, Accomplishments, and MRs.
2. **Viewer**: The ERP features a built-in document viewer, including an Excel viewer capable of rendering `.xlsx` files as-is without requiring local software.
3. **Security**: Documents inherit the PBAC rules of their parent project.

---

# V. REPORTS AND PRINTABLE FORMS MANUAL

The ERP generates standard, printable PDF reports for:
- Purchase Orders (PO)
- Material Request (MR) Slips
- Material Issuance Slips (MIS)
- Delivery Receipts (DR)
- Subcontractor Billings
- Job Order Contracts
- Executive Profitability Summaries

---

# W. SYSTEM ADMINISTRATION MANUAL

1. **User Management**: Creating users and assigning primary roles (`/users`).
2. **PBAC Setup**: Assigning users to specific projects and defining their project-level access in the Project Users tab.
3. **Role Definitions**: Administrators can modify the raw boolean flags (e.g., `canView`, `canApprove`) per role in the System Roles module.
4. **Environment**: Ensure `OPENAI_API_KEY` and `GEMINI_API_KEY` are configured in Vercel for AI features to function correctly.
