# OneSystemsERP — Quick Reference Cards

**Document Code:** QRC-001  
**Version:** 1.0  
**Classification:** Internal — All Staff  
**Effective Date:** June 2026  

---

## 📋 Table of Quick Reference Cards

1. [Dashboard & Navigation](#1-dashboard--navigation)
2. [Projects & BOQ Management](#2-projects--boq-management)
3. [Variation Orders](#3-variation-orders)
4. [Procurement & Material Requests](#4-procurement--material-requests)
5. [Deliveries & Inventory](#5-deliveries--inventory)
6. [Material Issuance](#6-material-issuance)
7. [Accomplishments & Progress Billings](#7-accomplishments--progress-billings)
8. [Subcontracting](#8-subcontracting)
9. [Payroll & Workers](#9-payroll--workers)
10. [Finance & Payments](#10-finance--payments)
11. [Equipment Management](#11-equipment-management)
12. [Petty Cash & Expenses](#12-petty-cash--expenses)
13. [AI & Knowledge Center](#13-ai--knowledge-center)
14. [Administration & Settings](#14-administration--settings)

---

## 1. Dashboard & Navigation

| Action | Steps |
|--------|-------|
| **Access Dashboard** | Login → Auto-redirected to role-specific Dashboard |
| **Collapse Sidebar** | Click the `«` icon on the left sidebar |
| **Switch Projects** | Use the project selector dropdown in the header |
| **View Notifications** | Check the notification bell icon in the top bar |
| **Access AI Assistant** | Click 💬 in the sidebar or bottom-right corner |
| **Fullscreen Mode** | Click ⛶ Maximize in data-heavy tables |
| **Role Simulator** | Dashboard → Role Simulator panel (SUPER_ADMIN only) |

---

## 2. Projects & BOQ Management

| Action | Steps |
|--------|-------|
| **View Projects** | Sidebar → Projects |
| **Create Project** | Projects → + New Project → Fill details → Save |
| **View Awarded BOQ** | Projects → [Project] → Awarded BOQ tab |
| **View Consolidated BOQ** | Projects → [Project] → BOQ Consolidation tab |
| **Lock BOQ** | BOQ Consolidation → Review items → 🔒 Lock BOQ → Confirm |
| **Assign Project Manager** | Projects → [Project] → Assign Manager |
| **View BOQ Remaining Balance** | BOQ Consolidation → Check "Remaining" column per item |

> **Remember:** Procurement is blocked until the BOQ is locked!

---

## 3. Variation Orders

| Action | Steps |
|--------|-------|
| **View All VOs** | Sidebar → Variation Orders |
| **Create VO** | Variation Orders → + Create → Fill details → Add items → Submit |
| **Add BOQ Adjustment** | Inside VO → Add Adjustment → Modify existing item qty/price |
| **Add New Work** | Inside VO → Add New Work → Enter new item details |
| **Submit VO** | VO Draft → Submit → Routes through pipeline |
| **PM Review** | Filter "For PM Review" → Review → Approve/Return |
| **Finance Review** | Filter "For Finance Review" → Verify budget → Approve/Return |
| **PD Final Approval** | Filter "For PD Approval" → Review AI rating → Approve/Reject |

**Approval Pipeline:** `Draft → For Costing → PM Review → Finance Review → PD Approval → APPROVED`

---

## 4. Procurement & Material Requests

| Action | Steps |
|--------|-------|
| **Generate MRF from BOQ** | Projects → BOQ Consolidation → Select items → 📋 Generate MRF |
| **Create MRF manually** | Material Requests → + New → Select items → Enter qty → Submit |
| **Start Canvassing** | Procurement → Canvassing → Select MRF → Add quotations (min 3) |
| **Compare Quotations** | Canvassing → View Canvass Sheet → Compare → Select winner |
| **Create PO** | Procurement → Purchase Orders → + Create PO → Fill details → Submit |
| **View Suppliers** | Procurement → Suppliers |
| **Add Supplier** | Suppliers → + Add Supplier → Enter details → Save |

> **Remember:** You cannot request more than the BOQ Remaining Balance!

---

## 5. Deliveries & Inventory

| Action | Steps |
|--------|-------|
| **Log Delivery** | Deliveries → + New → Select PO → Enter received qty → Confirm |
| **Check Inventory** | Sidebar → Inventory |
| **View Stock History** | Inventory → Stocks → View in/out transactions |
| **Track Delivery Status** | Deliveries → Filter by PO → View status |
| **Report Damage/Shortage** | During delivery log → Note damage → Upload photos |

> **Automation:** Confirming a delivery auto-updates Inventory and creates a Supplier Payable.

---

## 6. Material Issuance

| Action | Steps |
|--------|-------|
| **Request Issuance** | Material Issuance → + New Request → Select items → Enter qty → Submit |
| **Process Issuance** | Material Issuance → View pending → Verify stock → Confirm Issuance |
| **Partial Issue** | If stock insufficient → Partially Issue → Note shortfall |

> **Automation:** Confirming issuance auto-deducts Inventory and charges cost to the project.

---

## 7. Accomplishments & Progress Billings

| Action | Steps |
|--------|-------|
| **Submit Accomplishment** | Accomplishments → Select project → + New → Select BOQ item → Enter progress → Upload photos → Submit |
| **Review Accomplishments** | Accomplishments → Filter by project → Review entries |
| **Generate Progress Billing** | Progress Billings → Select project/period → Review → Generate |
| **Apply Retention** | During billing generation → Enter retention % |
| **Submit for Approval** | Progress Billings → Submit for Approval → Routes to PD |

---

## 8. Subcontracting

| Action | Steps |
|--------|-------|
| **View Subcontractors** | Subcontracting → Subcontractors |
| **Create Subcontract** | Subcontracting → Create → Use wizard → Link to BOQ → Submit |
| **View Work Packages** | Subcontracting → Packages → Select package |
| **Track Progress** | Subcontracting → Progress Hub |
| **Process Invoice** | Subcontracting → Invoice → Review → Approve |
| **View Dashboard** | Subcontracting → Dashboard |

---

## 9. Payroll & Workers

| Action | Steps |
|--------|-------|
| **Add Worker** | Workers → + Add Worker → Fill profile → Save |
| **Create Payroll Period** | Payroll → + Create Period → Set dates/project → Create |
| **Enter DTR** | Payroll → [Period] → Click worker → Enter hours/OT/absences → Save |
| **Compute Payroll** | Payroll → [Period] → Compute Payroll |
| **Review AI Flags** | After computation → Review flagged items → Resolve |
| **Generate Payslips** | Payroll → [Period] → Generate Payslips |
| **Process Payment** | Payroll Payments → Dashboard → Select batch → Process |
| **Manage Deductions** | Workers → [Worker] → Deduction Ledger → Add/Edit |

**Rate Types:** Monthly, Daily, Hourly, 1-Lot, Piece Rate, Professional Fee

---

## 10. Finance & Payments

| Action | Steps |
|--------|-------|
| **View Finance Dashboard** | Sidebar → Finance |
| **Process Supplier Payment** | Supplier Payables → Select payable → Verify → Approve → Pay |
| **Record Collection** | Collections → Select billing → Record Payment → Upload proof |
| **View Approved Payslips** | Finance → Approved Payslips |
| **Manage Payment Batches** | Finance → Payment Batches |
| **View Payroll Accounts** | Finance → Payroll Accounts |

---

## 11. Equipment Management

| Action | Steps |
|--------|-------|
| **View Equipment Registry** | Equipment → Registry |
| **Log Deployment** | Equipment → Deployments → + New → Enter details → Save |
| **Record Meter Reading** | Equipment → [Unit] → Enter meter reading → Save |
| **Log Fuel Consumption** | Equipment → [Unit] → Enter fuel qty → Save |
| **Track Utilization** | Equipment → Utilization → View hourly rates |
| **Schedule Maintenance** | Equipment → Maintenance → + New → Set schedule |
| **View Fleet Map** | Equipment → Fleet Map |
| **View FMS Dashboard** | Equipment → FMS Dashboard |

---

## 12. Petty Cash & Expenses

| Action | Steps |
|--------|-------|
| **View Petty Cash Accounts** | Sidebar → Petty Cash |
| **Log Disbursement** | Petty Cash → [Account] → + New Transaction → Enter amount → Upload receipt → Save |
| **Request Replenishment** | Petty Cash → [Account] → Request Replenishment → Attach liquidation → Submit |
| **Log Expense** | Expenses → + Log Expense → Fill details → Upload receipt → Submit |
| **Approve Expense** | Expenses → Review pending → Verify receipts → Approve/Reject |

---

## 13. AI & Knowledge Center

| Action | Steps |
|--------|-------|
| **AI ERP Assistant** | Sidebar → Knowledge Center → Type question in chat → Get answer |
| **AI Command Center** | Sidebar → AI Command Center → View validation logs |
| **AI Payroll Assistant** | Payroll → AI Payroll Assistant → Ask payroll questions |
| **Executive AI Chatbot** | Executive (👑) → AI Chatbot → Ask strategic questions |
| **AI Risk Ratings** | Variation Orders → View AI Risk Rating (CRITICAL/LOW) |
| **Director Audit Queue** | Director Audit → Review AI-flagged items → Override/Reject |

**Example AI queries:**
- *"What is the remaining balance of wire?"*
- *"Show me all pending MRFs"*
- *"Summarize VO #002"*
- *"Which project has the highest cost overrun?"*

---

## 14. Administration & Settings

| Action | Steps |
|--------|-------|
| **Manage Users** | Sidebar → Users → Add/Edit/Deactivate |
| **Assign Roles** | Users → [User] → Change Role dropdown → Save |
| **System Settings** | Sidebar → Settings → Edit tax rates, company info → Save |
| **View Audit Trail** | Sidebar → System Audit → Filter by user/date/action |
| **Manage Permissions** | Admin → Permissions → View/Edit role matrices |
| **View User Roles** | Admin → User Roles → View role definitions |
| **Upload Documents** | Sidebar → Documents → Upload → Add description → Submit |
| **Generate Reports** | Sidebar → Reports → Select type → Configure → Generate |

---

## 🔐 Role-Module Access Matrix (Quick Reference)

| Module | SUPER ADMIN | PROJ DIR | PROJ MGR | FINANCE | PURCH | STOCKMAN | SITE ENG | HR | ACCTANT | COST | GUEST |
|--------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Projects | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | — |
| Variation Orders | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | — |
| Procurement | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | — |
| Purchase Orders | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ | — | — |
| Deliveries | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — |
| Inventory | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | — | — |
| Material Issuance | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | — | — | — | — |
| Accomplishments | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | — | — | ✅ | — |
| Subcontracting | ✅ | ✅ | ✅ | ✅ | — | — | — | — | ✅ | ✅ | — |
| Equipment | ✅ | ✅ | ✅ | — | — | — | ✅ | — | — | — | — |
| Payroll | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ | — | — | — |
| Finance | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ | ✅ | ✅ | — |
| Workers | ✅ | ✅ | ✅ | — | — | — | — | ✅ | — | — | — |
| Reports | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Documents | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| Knowledge Center | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ |
| AI Command Center | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | — |
| System Settings | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | — |
| System Roles | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | — |

---

**Quick Reference Cards — End of Document**  
*OneSystemsERP Training & Operations Package*  
*Document Code: QRC-001 | Version 1.0*
