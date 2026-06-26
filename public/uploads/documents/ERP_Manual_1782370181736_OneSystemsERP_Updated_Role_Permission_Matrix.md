# Z. USER ROLES AND PERMISSION MATRIX

This document outlines the default roles and permission matrices implemented in the OneSystems ERP. The PBAC (Project-Based Access Control) system ensures that users only have these permissions *within their assigned projects*.

## 1. Role Definitions

| Role | Purpose | PBAC Level | Notes |
|------|---------|------------|-------|
| **SUPER_ADMIN** | Global system control | Global | Bypasses all PBAC restrictions. Can access System Settings. |
| **SYSTEM_ADMIN** | Application administration | Global | Can manage users and roles. |
| **DIRECTORS** | Executive oversight | Assigned Projects | Full read access. Approves POs, Variations, Payroll. |
| **PROJECT_MANAGER** | Daily project operations | Assigned Projects | Approves MRs, Accomplishments. Logs VOs. |
| **PROJECT_ENGINEER**| Site engineering | Assigned Projects | Creates MRs, logs Accomplishments. |
| **FINANCE_OFFICER** | Accounting and ledgers | Assigned Projects | Approves Expenses, manages Petty Cash, generates Billings. |
| **PURCHASING** | Procurement operations | Global / Assigned | Canvasses suppliers, issues POs. |
| **WAREHOUSEMAN** | Inventory control | Assigned Projects | Receives Deliveries, issues Materials (MIS). |
| **SITE_ADMIN** | Site clerical | Assigned Projects | Encodes DTRs, logs Petty Cash. |
| **GUEST_USER** | External transparency | Assigned Projects | STRICTLY VIEW-ONLY across all assigned modules. |

## 2. Module Permission Matrix

*(V = View, C = Create, E = Edit, D = Delete, A = Approve)*

| Module | SUPER_ADMIN | DIRECTORS | PROJECT_MANAGER | FINANCE | PURCHASING | WAREHOUSE | GUEST_USER |
|--------|-------------|-----------|-----------------|---------|------------|-----------|------------|
| **Dashboard** | V, C, E, D, A | V | V | V | V | V | V |
| **Executive View**| V | V | - | - | - | - | V |
| **Projects** | V, C, E, D, A | V | V | V | V | V | V |
| **Awarded BOQ** | V, C, E, D, A | V | V | V | V | V | V |
| **Benchmark BOQ** | V, C, E, D, A | V | V, C, E | V | V | V | V |
| **Mat. Request** | V, C, E, D, A | V, A | V, C, E, A | V | V | V | V |
| **Purchasing** | V, C, E, D, A | V, A | V | V | V, C, E | V | V |
| **Deliveries** | V, C, E, D, A | V | V | V | V | V, C, E | V |
| **Issuances** | V, C, E, D, A | V | V | V | V | V, C, E | V |
| **Expenses** | V, C, E, D, A | V | V | V, C, E, A| V | V | V |
| **Petty Cash** | V, C, E, D, A | V | V | V, A | V | V | V |
| **Accomplishments**| V, C, E, D, A | V | V, A | V | V | V | V |
| **Billings** | V, C, E, D, A | V, A | V | V, C, E | V | V | V |
| **Subcontracting** | V, C, E, D, A | V, A | V, C, E | V | V | V | V |
| **Payroll & DTR** | V, C, E, D, A | V, A | V | V | V | V | V |
| **AI Command** | V, C, E, D, A | V | V | V | V | V | - |

## 3. Strict Guest User Policy

The **GUEST_USER** role is programmatically locked down in the backend (`src/lib/permissions.ts`).
Even if the frontend mistakenly displays a "Create" or "Save" button to a Guest User, the Server Actions will reject the request. 

**Blocked Actions for Guest Users:**
- `canCreate`, `canEdit`, `canUpdate`, `canDelete`
- `canSubmit`, `canApprove`, `canReject`, `canCancel`
- `canUpload`, `canImport`, `canGenerate`, `canProcess`, `canPost`, `canPay`
- `canManageUsers`, `canManageRoles`, `canResetData`
- `canRunWriteAIAction`, `canOverrideAIValidation`
