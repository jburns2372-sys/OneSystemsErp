# OneSystemsERP — Project Staff Training Guide

**Document Code:** TRG-004  
**Version:** 1.0  
**Classification:** Internal — Project Managers, Project Engineers, Site Engineers, Foremen  
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

This guide covers the following project-level roles:

### Project Manager (`PROJECT_MANAGER`)
The **operational owner** of the project. Controls day-to-day execution, locks the BOQ baseline, drafts Variation Orders, and reviews procurement and accomplishment reports.

### Project Engineer (`PROJECT_ENGINEER`)
Assists the PM in technical execution. Reviews site accomplishments, coordinates material requests, and monitors project timelines.

### Site Engineer (`SITE_ENGINEER`)
Manages **on-ground execution**. Submits accomplishment reports, requests material issuances from the warehouse, and logs equipment usage.

### Foreman (`FOREMAN`)
Supervises field workers and daily time records. Tracks daily site accomplishments and reports to the Site Engineer or PM.

### Billing Engineer (`BILLING_ENGINEER`)
Prepares progress billings based on accomplishment data. Coordinates with Finance for client invoice generation.

### Site Admin (`SITE_ADMIN`)
Handles administrative tasks on-site including document management, worker scheduling, and daily coordination logs.

**Access Levels Summary:**

| Role | BOQ Access | VO Access | Procurement | Accomplishments | Finance | Payroll |
|------|-----------|-----------|-------------|-----------------|---------|---------|
| Project Manager | Full + Lock | Full + Draft/Review | View | Full | View | View |
| Project Engineer | View | View | View | Full | — | — |
| Site Engineer | View | — | — | Submit | — | — |
| Foreman | — | — | — | Submit (Field) | — | — |
| Billing Engineer | View | View | — | Full | View | — |
| Site Admin | View | — | View | View | — | — |

---

## 2. Daily Responsibilities

### Project Manager

| Time | Task | Priority |
|------|------|----------|
| **08:00** | Review Dashboard — BOQ status, pending MRFs, accomplishment metrics | 🔴 Critical |
| **08:30** | Review and action pending **Material Request Forms (MRFs)** | 🟡 High |
| **09:00** | Review **Accomplishment Reports** submitted by Site Engineers | 🟡 High |
| **10:00** | Monitor **Variation Orders** in the approval pipeline | 🟡 High |
| **11:00** | Coordinate with Procurement on pending PO status | 🟢 Medium |
| **02:00** | Review **Subcontracting** progress against work packages | 🟡 High |
| **03:00** | Update project schedule and milestones | 🟢 Medium |
| **04:00** | Review **Equipment** deployment and utilization reports | 🟢 Medium |

### Site Engineer

| Time | Task | Priority |
|------|------|----------|
| **07:00** | Site inspection — verify physical progress vs. plan | 🔴 Critical |
| **09:00** | Submit **Accomplishment Reports** with quantities and photos | 🔴 Critical |
| **10:00** | Submit **Material Issuance Requests** for the day's work | 🟡 High |
| **11:00** | Log **Equipment** usage (meter readings, fuel consumption) | 🟡 High |
| **02:00** | Coordinate with Subcontractors on work package progress | 🟢 Medium |
| **04:00** | Prepare next-day material requirements | 🟢 Medium |

### Foreman

| Time | Task | Priority |
|------|------|----------|
| **06:30** | Record **worker attendance** and Daily Time Records | 🔴 Critical |
| **07:00** | Assign daily work tasks to crew | 🔴 Critical |
| **12:00** | Submit morning progress update | 🟡 High |
| **04:00** | Submit end-of-day accomplishment update | 🟡 High |
| **05:00** | Report any safety incidents or material shortages | 🔴 Critical |

---

## 3. Modules Used by the Role

### Project Manager — Full Module Access

| Module | Purpose |
|--------|---------|
| **Dashboard** | Active BOQ count, accomplishments tracked, pending MRFs |
| **Projects** | Central hub — Awarded BOQ, Consolidated BOQ, project details |
| **Variation Orders** | Draft, submit, and review scope changes |
| **Accomplishments** | Review site progress reports |
| **Material Requests** | Review and coordinate MRF submissions |
| **Procurement** | Monitor purchase order status |
| **Subcontracting** | Track subcontractor work packages and progress |
| **Equipment** | Review equipment deployment and utilization |
| **Progress Billings** | Review billing submissions before client presentation |
| **Job Orders** | Create and track internal work orders |
| **Reports** | Project-specific financial and progress reports |
| **Documents** | Upload and manage project files |
| **Knowledge Center** | Query the AI assistant for project data |

### Site Engineer — Execution-Focused

| Module | Purpose |
|--------|---------|
| **Dashboard** | Daily time records, job orders overview |
| **Accomplishments** | Submit progress reports with quantities and photos |
| **Material Issuance** | Request materials from the warehouse |
| **Equipment** | Log equipment usage, fuel, and meter readings |
| **Documents** | Upload site photos, reports, and blueprints |
| **Reports** | View project progress reports |

---

## 4. Step-by-Step Common Tasks

### 4.1 Locking the Consolidated BOQ (Project Manager Only)

> [!IMPORTANT]
> The BOQ **must be locked** before any procurement activity can begin. This establishes the procurement baseline.

1. Navigate to **Projects** > Select your active project.
2. Go to the **BOQ Consolidation** tab.
3. Review every line item carefully:
   - Item description, unit, quantity, unit price
   - Verify that all awarded items are correctly imported
4. Once verified, click the **🔒 Lock BOQ** button.
5. A confirmation dialog will appear. Click **Confirm**.
6. The BOQ is now locked. Procurement can begin generating MRFs.

### 4.2 Creating a Variation Order (Project Manager Only)

1. Navigate to **Variation Orders** from the sidebar.
2. Click **+ Create Variation Order**.
3. Fill in the header information:
   - **VO Number** — auto-generated or manual entry
   - **Project** — select the target project
   - **Reason/Justification** — provide detailed rationale for the scope change
   - **Time Impact** — estimated schedule impact in calendar days
4. Click **Add Adjustment / New Work** to add BOQ modifications:
   - **Adjustment**: Modify quantity or price of an existing BOQ item
   - **New Work**: Add entirely new items not in the original contract
5. For each item, specify:
   - Description, unit, quantity, unit price
   - Whether it is additive or deductive
6. The system automatically calculates:
   - **Additive Amount** (sum of added scope)
   - **Deductive Amount** (sum of removed scope)
   - **Net Impact** on the Revised Contract
7. Click **Submit** to enter the approval pipeline:
   - `For Costing` → `PM Review` → `Finance Review` → `PD Approval`

### 4.3 Submitting an Accomplishment Report (Site Engineer)

1. Navigate to **Accomplishments** from the sidebar.
2. Select the active project.
3. Click **+ New Accomplishment Entry**.
4. Select the **BOQ item** being reported.
5. Enter the physical progress:
   - **Quantity completed** (e.g., 50 meters of conduit installed)
   - **Percentage completion** (e.g., 75% of Task A)
6. Upload **photographic evidence** — photos of the completed work.
7. Add any **remarks** (e.g., weather delays, access issues).
8. Click **Submit**.
9. The report enters the review queue for the PM/PE.

### 4.4 Requesting Material Issuance (Site Engineer)

1. Navigate to **Material Issuance** from the sidebar.
2. Click **+ New Issuance Request**.
3. Select the **project** and **phase/area** where materials will be deployed.
4. Browse available inventory and select the required items.
5. Enter the **quantity** to be issued.
6. Add remarks (e.g., "For Floor 3 electrical rough-in").
7. Click **Submit**.
8. The warehouse (Stockman) receives the request and prepares the materials.
9. Upon physical release, the Stockman confirms issuance and stock is deducted from inventory.

### 4.5 Generating a Material Request Form — MRF (Project Manager / Engineer)

1. Navigate to **Projects** > Select project > **BOQ Consolidation** tab.
2. Use the checkboxes to select the materials you need to procure.
3. Click **📋 Generate MRF**.
4. On the MRF drafting page:
   - Enter the **requested quantity** for each item
   - The system displays the **Remaining Balance** = Revised Qty − Delivered Qty
   - You **cannot** exceed the Remaining Balance
5. Items from Variation Orders appear at the bottom, marked with **⚡ New via VO**.
6. Click **Submit MRF** to push it into the procurement pipeline.

### 4.6 Logging Equipment Usage (Site Engineer)

1. Navigate to **Equipment** from the sidebar.
2. Select **Deployments** to log where equipment is being used.
3. For each deployed unit:
   - Enter **meter readings** (start/end of shift)
   - Enter **fuel consumption** (liters/gallons)
   - Log **hours of operation**
4. Navigate to **Utilization** for the summary dashboard.
5. The system calculates hourly rates and charges them against the project budget.

### 4.7 Creating a Job Order (Project Manager)

1. Navigate to **Job Orders** from the sidebar.
2. Click **+ Create Job Order**.
3. Specify:
   - **Work description** — what needs to be done
   - **Assigned to** — subcontractor, crew, or individual
   - **Target date** — completion deadline
   - **Priority** — critical, high, medium, low
4. Attach supporting documents (drawings, specifications).
5. Click **Submit**.
6. Track progress via the **Job Orders Dashboard**.

---

## 5. Required Approvals

| Action | Role Performing | Approval Required From |
|--------|----------------|----------------------|
| Lock BOQ | Project Manager | Self (PM authority) |
| Create Variation Order | Project Manager | Auto-routed: Costing → PM → Finance → PD |
| Submit Accomplishment | Site Engineer | PM or PE review |
| Submit Material Issuance Request | Site Engineer | Warehouse (Stockman) confirmation |
| Generate MRF | PM / PE | Procurement pipeline |
| Override BOQ Lock | Project Director only | PD authority |
| Approve VO (PM Review stage) | Project Manager | Self, then routes to Finance |
| Final VO Approval | — | Project Director only |

---

## 6. Common Mistakes to Avoid

| ❌ Mistake | ✅ Correct Approach |
|-----------|-------------------|
| Forgetting to lock the BOQ before requesting procurement | The BOQ must be locked first — procurement is blocked until the baseline is established |
| Requesting materials exceeding the Remaining Balance | Check the balance first. If more is needed, file a Variation Order for Additional Works |
| Submitting accomplishments without photo evidence | Always attach photos — unsupported entries will be rejected during review |
| Logging equipment usage at the end of the week | Log equipment daily — delayed entries reduce accuracy and delay billing |
| Creating Variation Orders without proper justification | VOs require detailed written justification. "Additional work" is not sufficient |
| Expecting VO items to appear at the top of the BOQ | VO items are automatically sorted to the **bottom** of the BOQ and tagged with ⚡ |
| Submitting MRFs for the wrong project | Always verify the project selection before submitting — cross-project entries corrupt budgets |
| Not coordinating with the Stockman before submitting issuance requests | Check available stock first to avoid request rejections |

---

## 7. Reports the Role Must Review

### Project Manager

| Report | Purpose | Frequency |
|--------|---------|-----------|
| **BOQ Status Report** | Original vs. Revised quantities, procurement status | Daily |
| **Accomplishment Summary** | Physical progress across all BOQ items | Daily |
| **MRF Status Report** | Pending, approved, and completed material requests | Daily |
| **Variation Order Summary** | All VOs by status and financial impact | Weekly |
| **Subcontracting Progress** | Subcontractor accomplishment percentages | Weekly |
| **Equipment Utilization Report** | Hours, fuel, and cost per equipment unit | Weekly |
| **Project Cost Report** | Budget vs. actual across all cost categories | Weekly |

### Site Engineer

| Report | Purpose | Frequency |
|--------|---------|-----------|
| **Daily Accomplishment Log** | Your submitted progress entries | Daily |
| **Material Issuance Summary** | Materials drawn from inventory | Daily |
| **Equipment Usage Log** | Equipment hours and fuel logged | Daily |
| **Inventory Stock Levels** | Available stock for upcoming work | As needed |

---

## 8. Best Practices

### For Project Managers
- ✅ Lock the BOQ **immediately** after the awarded contract is imported and verified.
- ✅ Review accomplishments **daily** — delays in review cascade to delayed billings.
- ✅ Track VO approval progress proactively — follow up with Finance and PD if items are stalled.
- ✅ Hold weekly coordination meetings with Procurement to align material timelines.
- ✅ Use the **AI ERP Assistant** for quick project data lookups.

### For Site Engineers
- ✅ Submit accomplishments **the same day** work is completed — not the next day.
- ✅ Take **multiple photos** from different angles for each accomplishment entry.
- ✅ Verify material quantities **before** signing issuance confirmations.
- ✅ Log equipment readings at **start and end** of each shift for accuracy.

### For Foremen
- ✅ Record worker attendance **before 7:00 AM** every day.
- ✅ Report safety incidents **immediately** — do not wait for end of day.
- ✅ Verify worker headcount matches the DTR entries.
- ✅ Communicate material shortages to the Site Engineer promptly.

### General
- ✅ Always select the **correct project** before performing any action.
- ✅ Use the search/filter features to find records quickly.
- ✅ Attach supporting documents to every significant transaction.
- ✅ Report system issues to the System Administrator immediately.

---

## 9. Final Checklist

### Project Manager Checklist

| # | Item | Status |
|---|------|--------|
| 1 | ☐ Logged in and verified PROJECT_MANAGER role assignment |  |
| 2 | ☐ Reviewed and understood the BOQ Consolidation tab |  |
| 3 | ☐ Successfully locked a BOQ (or practiced in sandbox) |  |
| 4 | ☐ Created and submitted a test Variation Order |  |
| 5 | ☐ Reviewed an Accomplishment Report submitted by a Site Engineer |  |
| 6 | ☐ Generated an MRF from the BOQ Consolidation tab |  |
| 7 | ☐ Reviewed a Subcontracting work package |  |
| 8 | ☐ Navigated the Equipment and Job Orders modules |  |
| 9 | ☐ Generated and reviewed at least 3 project reports |  |
| 10 | ☐ Signed off with Project Director that onboarding is complete |  |

### Site Engineer Checklist

| # | Item | Status |
|---|------|--------|
| 1 | ☐ Logged in and verified SITE_ENGINEER role assignment |  |
| 2 | ☐ Successfully submitted a test Accomplishment Report with photos |  |
| 3 | ☐ Successfully submitted a Material Issuance Request |  |
| 4 | ☐ Logged equipment usage (meter readings and fuel) |  |
| 5 | ☐ Uploaded a document to the Documents module |  |
| 6 | ☐ Used the AI ERP Assistant for a test query |  |
| 7 | ☐ Reviewed the daily reports available for your role |  |
| 8 | ☐ Signed off with Project Manager that onboarding is complete |  |

---

**Project Staff Training Guide — End of Document**  
*OneSystemsERP Training & Operations Package*  
*Document Code: TRG-004 | Version 1.0*
