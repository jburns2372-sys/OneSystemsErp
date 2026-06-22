# OneSystemsERP — Purchasing Training Guide

**Document Code:** TRG-007  
**Version:** 1.0  
**Classification:** Internal — Purchasing Officers, Procurement Officers, Materials Engineers, Stockmen  
**Effective Date:** June 2026  

---

## Table of Contents

1. [Role Description](#1-role-description)
2. [Daily Responsibilities](#2-daily-responsibilities)
3. [Modules Used by the Role](#3-modules-used-by-the-role)
4. [Step-by-Step Common Tasks](#4-step-by-step-common-tasks)
5. [Required Approvals](#5-required-approvals)
6. [Common Mistakes to Avoid](#6-common-mistakes-to-avoid)
7. [Reports the Role Must Review](#7-reports-the-role-must-review)
8. [Best Practices](#8-best-practices)
9. [Final Checklist](#9-final-checklist)

---

## 1. Role Description

### Purchasing Officer (`PURCHASING_OFFICER`)
The **sourcing specialist** — converts approved Material Request Forms (MRFs) into Purchase Orders (POs) by canvassing suppliers, comparing quotations, and selecting the best offer. The Purchasing Officer manages the complete procurement cycle from requisition to PO issuance.

### Procurement Officer (`PROCUREMENT_OFFICER`)
Similar to the Purchasing Officer with expanded visibility into the procurement pipeline. Handles high-volume procurement coordination, supplier database management, and canvassing process oversight.

### Materials Engineer (`MATERIALS_ENGINEER`)
Evaluates **material quality and specifications** — reviews technical compliance of procured materials, inspects deliveries for quality conformance, and maintains the materials specification database.

### Stockman (`STOCKMAN`) / Warehouseman (`WAREHOUSEMAN`)
Manages the **physical warehouse** — receives deliveries against POs, logs materials into inventory, issues materials to the site, and maintains accurate stock counts.

**Access Levels Summary:**

| Role | MRFs | POs | Canvassing | Deliveries | Inventory | Material Issuance | Projects |
|------|------|-----|-----------|-----------|-----------|------------------|----------|
| Purchasing Officer | View + Create | Create + Edit | Full | View | View | — | View (BOQ) |
| Procurement Officer | Full | Full | Full | View | View | — | View (BOQ) |
| Materials Engineer | View | View | View | Full (Inspect) | Full | Full | View |
| Stockman | View | — | — | Full (Receive) | Full | Full | — |

---

## 2. Daily Responsibilities

### Purchasing Officer

| Time | Task | Priority |
|------|------|----------|
| **08:00** | Review Dashboard — pending MRFs to source, open canvassing, active POs | 🔴 Critical |
| **08:30** | Process new **Material Request Forms (MRFs)** — prepare for canvassing | 🔴 Critical |
| **09:00** | Conduct **supplier canvassing** — request and collect quotations | 🟡 High |
| **10:00** | Compare **supplier quotations** and prepare canvass summary | 🟡 High |
| **11:00** | Draft **Purchase Orders (POs)** from approved canvass selections | 🟡 High |
| **01:00** | Follow up on **pending deliveries** from active POs | 🟢 Medium |
| **02:00** | Update **supplier database** with new contacts and performance notes | 🟢 Medium |
| **03:00** | Coordinate with PM on upcoming material requirements | 🟢 Medium |

### Stockman / Warehouseman

| Time | Task | Priority |
|------|------|----------|
| **07:00** | Physical **inventory count** — verify overnight stock levels | 🔴 Critical |
| **08:00** | Review **expected deliveries** for the day | 🟡 High |
| **09:00** | **Receive deliveries** — inspect, count, and log against POs | 🔴 Critical |
| **10:00** | Process **Material Issuance** requests from Site Engineers | 🟡 High |
| **11:00** | Update **inventory records** — stock in/out transactions | 🟡 High |
| **01:00** | Organize and label warehouse stock | 🟢 Medium |
| **03:00** | Prepare materials for next-day issuance requests | 🟢 Medium |
| **04:00** | End-of-day **stock reconciliation** | 🟡 High |

### Materials Engineer

| Time | Task | Priority |
|------|------|----------|
| **08:00** | Review **pending deliveries** for quality inspection | 🟡 High |
| **09:00** | Inspect delivered materials for **quality conformance** | 🔴 Critical |
| **10:00** | Update **material specifications** database | 🟢 Medium |
| **11:00** | Review **inventory stock levels** and expiration dates | 🟢 Medium |
| **02:00** | Coordinate with Purchasing on material specifications for upcoming orders | 🟢 Medium |

---

## 3. Modules Used by the Role

| Module | Purpose | Primary Users |
|--------|---------|---------------|
| **Procurement** | Central procurement hub — MRFs, POs, canvassing | Purchasing Officer, Procurement Officer |
| **Material Requests** | View and process material requisitions from project teams | All Procurement roles |
| **Purchase Orders** | Create, edit, track, and manage purchase orders | Purchasing Officer, Procurement Officer |
| **Canvassing** | Supplier quotation comparison and selection | Purchasing Officer, Procurement Officer |
| **Suppliers** | Supplier database — contacts, terms, performance | Purchasing Officer, Procurement Officer |
| **Deliveries** | Log physical deliveries against POs | Stockman, Materials Engineer |
| **Inventory** | Track stock levels, locations, and valuations | All Procurement roles |
| **Inventory > Stocks** | Detailed stock in/out transaction history | Stockman |
| **Material Issuance** | Process site material requests from inventory | Stockman, Materials Engineer |
| **Projects (BOQ)** | View BOQ for procurement reference | Purchasing Officer |
| **Equipment** | Equipment-related material tracking | Materials Engineer |
| **Reports** | Procurement, inventory, and delivery reports | All roles |
| **Documents** | PO documents, delivery receipts, quotations | All roles |
| **Dashboard** | Role-specific KPIs and alerts | All roles |

---

## 4. Step-by-Step Common Tasks

### 4.1 The Complete Procurement Cycle

The procurement lifecycle in OneSystemsERP follows a strict sequence:

```
BOQ Locked → MRF Generated → Canvassing → PO Created → PO Approved → 
Delivery → Receiving → Inventory Updated → Material Issuance to Site
```

> [!IMPORTANT]
> Procurement **cannot begin** until the Project Manager locks the Consolidated BOQ. If the BOQ is unlocked, the "Generate MRF" button will not appear.

### 4.2 Generating a Material Request Form (MRF)

1. Navigate to **Material Requests** from the sidebar.
2. Click **+ New Material Request** (or use the BOQ route).
3. **BOQ Route** (recommended):
   - Go to **Projects** > select project > **BOQ Consolidation** tab
   - Check the boxes next to the materials you need
   - Click **📋 Generate MRF**
4. On the MRF drafting page:
   - For each item, enter the **Requested Quantity**
   - The system displays:
     - **BOQ Quantity** — total baseline quantity
     - **Delivered Quantity** — materials already received
     - **Remaining Balance** = BOQ Qty − Delivered Qty
   - You **cannot** request more than the Remaining Balance

> [!WARNING]
> If you need more than the Remaining Balance, you must first file a **Variation Order** for Additional Works to expand the BOQ baseline.

5. Items from Variation Orders appear at the bottom, tagged with **⚡ New via VO**.
6. Add remarks (urgency, specifications, preferred suppliers).
7. Click **Submit MRF**.
8. The MRF enters the procurement pipeline for canvassing.

### 4.3 Conducting Supplier Canvassing

1. Navigate to **Procurement > Canvassing** from the sidebar.
2. Select the MRF to canvass.
3. The system shows all items that need quotations.
4. For each item, gather quotations from **at least 3 suppliers**:
   - Click **+ Add Quotation**
   - Enter:
     - **Supplier Name** (from the supplier database or new entry)
     - **Unit Price**
     - **Delivery Lead Time**
     - **Payment Terms**
     - **Remarks** (warranty, quality certifications)
5. After all quotations are entered:
   - The system generates a **Canvass Comparison Sheet**
   - Review the comparison and select the winning supplier
6. Click **Recommend Supplier** to advance the canvass.
7. The AI Quotation Validator may flag unusually high or low prices — review these flags.

### 4.4 Creating a Purchase Order (PO)

1. Navigate to **Procurement > Purchase Orders**.
2. Click **+ Create PO**.
3. The system pulls data from the approved canvass:
   - Selected supplier
   - Item descriptions, quantities, and unit prices
   - Delivery terms
4. Review and finalize:
   - **PO Number** — auto-generated
   - **Delivery Date** — agreed schedule
   - **Payment Terms** — from supplier agreement
   - **Total Amount** — auto-calculated
5. Attach any supporting documents (quotation letters, spec sheets).
6. Click **Submit PO** for approval.
7. The PO routes to the **Project Director** (or designated approver) for final sign-off.

### 4.5 Receiving a Delivery (Stockman)

1. Navigate to **Deliveries** from the sidebar.
2. Click **+ Log New Delivery**.
3. Select the **Purchase Order** this delivery corresponds to.
4. For each item in the delivery:
   - Enter the **Quantity Received**
   - Note any **damage or shortages**
   - Enter the **Delivery Receipt (DR) number**
   - Enter the **Supplier Invoice number** (if provided)
5. The system compares received quantities against PO quantities:
   - **Full Delivery** — all PO items received in full
   - **Partial Delivery** — some items or quantities still outstanding
   - **Over-Delivery** — received more than ordered (flagged for review)
6. Click **Confirm Delivery**.
7. The system automatically:
   - Updates **Inventory** stock levels (stock increases)
   - Updates the **BOQ Delivered Quantity**
   - Creates a **Supplier Payable** entry (accounts payable)

### 4.6 Processing Material Issuance (Stockman)

1. Navigate to **Material Issuance** from the sidebar.
2. View pending issuance requests from Site Engineers.
3. For each request:
   - Verify **stock availability** — is the requested quantity in the warehouse?
   - Prepare the materials physically.
   - Click **Confirm Issuance**.
4. The system automatically:
   - **Deducts** the issued quantity from Inventory
   - **Charges** the material cost to the specified project and phase
5. If stock is insufficient:
   - Click **Partially Issue** and note the shortfall
   - Notify the PM/PE that additional procurement is needed

### 4.7 Managing the Supplier Database

1. Navigate to **Procurement > Suppliers** from the sidebar.
2. To add a new supplier:
   - Click **+ Add Supplier**
   - Enter: Company name, contact person, phone, email, address, TIN
   - Add notes on products/services offered and payment terms
3. To update an existing supplier:
   - Click on the supplier's row
   - Edit contact details, terms, or performance notes
4. Maintain supplier performance records for future canvassing reference.

### 4.8 Checking Inventory Stock Levels

1. Navigate to **Inventory** from the sidebar.
2. The main page shows current stock levels by item.
3. Navigate to **Inventory > Stocks** for detailed transaction history:
   - Stock In (from deliveries)
   - Stock Out (from material issuance)
   - Running balance
4. Use filters to narrow by:
   - Project
   - Material category
   - Stock status (available, low, depleted)

---

## 5. Required Approvals

| Action | Role Performing | Approval Required From |
|--------|----------------|----------------------|
| Submit MRF | Purchasing Officer / PM | Auto-routes to procurement pipeline |
| Complete Canvassing | Purchasing Officer | Self + PM recommendation |
| Create Purchase Order | Purchasing Officer | Project Director (final sign-off) |
| Receive Delivery | Stockman | Self (physical verification) |
| Confirm Material Issuance | Stockman | Self (verified stock) |
| Approve PO (high value) | — | Project Director |
| Override BOQ Remaining Balance | — | Requires Variation Order (PM + PD) |
| Add/Modify Supplier | Purchasing Officer | Self |

---

## 6. Common Mistakes to Avoid

| ❌ Mistake | ✅ Correct Approach |
|-----------|-------------------|
| Requesting more than the BOQ Remaining Balance | Check the balance first. If more is needed, coordinate with PM to file a Variation Order |
| Canvassing fewer than 3 suppliers | Always canvass at least 3 suppliers for transparency and best pricing |
| Creating a PO without completing the canvass process | The canvass comparison must be finalized and documented before PO creation |
| Receiving delivery without physically inspecting materials | Always physically count and inspect materials before confirming in the system |
| Issuing materials without confirming stock availability | Verify physical stock matches system stock before issuing |
| Forgetting to attach delivery receipts and invoices | Always scan and upload DRs and supplier invoices to the Documents module |
| Logging delivery against the wrong PO | Match the supplier invoice and DR number against the PO before confirming |
| Not following up on partial deliveries | Track outstanding deliveries and follow up with suppliers regularly |
| Issuing materials to the wrong project | Verify the project assignment before confirming issuance |
| Accepting over-delivery without flagging | Over-deliveries must be reported — you may be billed for unordered items |

---

## 7. Reports the Role Must Review

### Purchasing Officer

| Report | Purpose | Frequency |
|--------|---------|-----------|
| **MRF Status Report** | All MRFs by status (pending, canvassed, PO'd, delivered) | Daily |
| **Canvass Comparison Report** | Supplier quotation comparison per MRF | Per canvass |
| **PO Status Report** | Active POs by status (pending, approved, delivered, closed) | Daily |
| **Supplier Performance Report** | On-time delivery rate, quality ratings per supplier | Monthly |
| **Procurement Spend Report** | Total procurement value by period and project | Weekly |

### Stockman / Warehouseman

| Report | Purpose | Frequency |
|--------|---------|-----------|
| **Inventory Stock Level Report** | Current stock by item and location | Daily |
| **Delivery Receiving Log** | All deliveries received with quantities and PO references | Daily |
| **Material Issuance Log** | All materials issued to site with project charges | Daily |
| **Stock Variance Report** | Physical count vs. system count discrepancies | Weekly |
| **Aging Stock Report** | Materials in warehouse beyond normal holding period | Monthly |

### Materials Engineer

| Report | Purpose | Frequency |
|--------|---------|-----------|
| **Quality Inspection Report** | Materials inspected, passed, rejected | Per delivery |
| **Material Specification Compliance** | Technical conformance status | Monthly |
| **Rejected Materials Report** | Items rejected during inspection | As needed |

---

## 8. Best Practices

### Procurement Process
- ✅ Always follow the **BOQ → MRF → Canvass → PO → Delivery** sequence — no shortcuts.
- ✅ Canvass **at least 3 suppliers** for every purchase above ₱10,000.
- ✅ Document all supplier communications in the system for audit trail.
- ✅ Set delivery follow-up reminders for POs approaching their delivery dates.
- ✅ Use the AI Quotation Validator to catch pricing anomalies.

### Warehouse Operations
- ✅ Perform **physical stock counts** at the start of every day.
- ✅ Reconcile physical stock with system records **weekly**.
- ✅ Label all incoming materials with **PO number, date, and project**.
- ✅ Follow **FIFO** (First In, First Out) for material issuance.
- ✅ Maintain a clean, organized warehouse — materials must be traceable.

### Delivery Receiving
- ✅ Never sign a delivery receipt without **physically inspecting** the materials.
- ✅ Report **damage or shortages immediately** — before the delivery driver leaves.
- ✅ Photograph damaged or incorrect deliveries for evidence.
- ✅ Match delivery quantities against the PO — never accept more than ordered without authorization.

### Supplier Management
- ✅ Maintain updated supplier contact information.
- ✅ Rate supplier performance after every delivery (on-time, quality, completeness).
- ✅ Build a **preferred supplier list** based on performance data.
- ✅ Never accept gifts or incentives from suppliers — this violates procurement integrity.

---

## 9. Final Checklist

### Purchasing Officer Checklist

| # | Item | Status |
|---|------|--------|
| 1 | ☐ Logged in and verified PURCHASING_OFFICER role assignment |  |
| 2 | ☐ Navigated the Procurement dashboard and understood all KPI cards |  |
| 3 | ☐ Generated an MRF from the BOQ Consolidation tab |  |
| 4 | ☐ Conducted a canvassing exercise with at least 3 suppliers |  |
| 5 | ☐ Created a Purchase Order from a completed canvass |  |
| 6 | ☐ Reviewed the Supplier database |  |
| 7 | ☐ Understood the BOQ Remaining Balance constraint |  |
| 8 | ☐ Generated at least 3 procurement reports |  |
| 9 | ☐ Signed off with PM / Finance that procurement onboarding is complete |  |

### Stockman / Warehouseman Checklist

| # | Item | Status |
|---|------|--------|
| 1 | ☐ Logged in and verified STOCKMAN role assignment |  |
| 2 | ☐ Successfully logged a delivery against a PO |  |
| 3 | ☐ Verified inventory stock levels updated after delivery |  |
| 4 | ☐ Processed a Material Issuance request |  |
| 5 | ☐ Verified inventory stock deducted after issuance |  |
| 6 | ☐ Performed a physical stock count and reconciled with system |  |
| 7 | ☐ Reviewed the Inventory and Delivery reports |  |
| 8 | ☐ Signed off with Procurement/PM that warehouse onboarding is complete |  |

---

**Purchasing Training Guide — End of Document**  
*OneSystemsERP Training & Operations Package*  
*Document Code: TRG-007 | Version 1.0*
