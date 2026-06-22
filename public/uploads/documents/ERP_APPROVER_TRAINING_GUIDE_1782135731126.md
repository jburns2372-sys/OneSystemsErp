# OneSystemsERP — Approver Training Guide

**Document Code:** TRG-003  
**Version:** 1.0  
**Classification:** Internal — Project Directors, Executives, and Designated Approvers  
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

### Project Director / Executive Approver (`PROJECT_DIRECTOR`)

The Approver role encompasses **Project Directors**, **Directors**, and other designated executives who hold the authority to **grant or deny final approval** on financial, procurement, and scope-change transactions within OneSystemsERP.

**Key Accountabilities:**
- **Final Approval** of Variation Orders — the only role that can permanently update the Revised Contract
- Approval of high-value Purchase Orders
- Approval or override of AI-flagged anomalies via the Director Audit Queue
- Portfolio-wide financial oversight and risk assessment
- Authorization of BOQ lock overrides
- Review and approval of progress billings for client submission
- Oversight of subcontracting invoices and milestone payments

**Access Level:** Full access to all modules with emphasis on approval workflows.

> [!IMPORTANT]
> As an Approver, your digital approval in OneSystemsERP carries the same legal and financial weight as a physical signature. Every approval action is permanently recorded in the System Audit trail with your identity, timestamp, and IP address.

---

## 2. Daily Responsibilities

| Time Block | Task | Priority |
|-----------|------|----------|
| **08:00 AM** | Review **Dashboard** — check AI overrides pending, total active projects, outstanding liabilities | 🔴 Critical |
| **08:30 AM** | Process the **Director Audit Queue** — review AI-flagged items requiring executive decision | 🔴 Critical |
| **09:00 AM** | Review **Variation Orders** with status "For PD Approval" | 🔴 Critical |
| **09:30 AM** | Review **Purchase Orders** awaiting executive sign-off | 🟡 High |
| **10:00 AM** | Review **Progress Billings** ready for client submission | 🟡 High |
| **10:30 AM** | Review **Subcontract invoices** awaiting approval | 🟡 High |
| **02:00 PM** | Check the **Executive Portfolio Dashboard** for project-wide financial health | 🟡 High |
| **03:00 PM** | Review **Payroll payment batches** for final release authorization | 🟡 High |
| **04:00 PM** | End-of-day review of **Supplier Payables** for payment scheduling | 🟢 Medium |
| **Weekly** | Review **Financial Summary Reports** across all projects | 🔴 Critical |
| **Monthly** | Portfolio review — budget vs. actual analysis, risk assessment | 🔴 Critical |

---

## 3. Modules Used by the Role

| Module | Purpose | Access Level |
|--------|---------|--------------|
| **Dashboard** | AI overrides pending, total projects, budget, liabilities | Full |
| **Executive (👑)** | Portfolio-wide financial aggregation and risk alerts | Full |
| **Variation Orders** | Review and grant Final Approval to scope changes | Full + Approve |
| **Director Audit** | AI override queue — approve or reject AI-flagged items | Full + Override |
| **Projects** | BOQ review, lock override, project status | Full |
| **Finance** | Accounts Payable/Receivable, payment approvals | Full |
| **Procurement** | High-value PO approvals | Full |
| **Progress Billings** | Client billing review and approval | Full |
| **Subcontracting** | Subcontract invoice and milestone approvals | Full |
| **Payroll** | Payroll batch final release | View + Approve |
| **Reports** | All financial, project, and compliance reports | Full |
| **System Audit** | Full audit trail review | View |

---

## 4. Step-by-Step Common Tasks

### 4.1 Approving a Variation Order (Final Approval)

This is the **most critical approval** in the system. It permanently modifies the project's Revised Contract.

1. Navigate to the **Variation Orders** module.
2. Filter for VOs with status **"For PD Approval"**.
3. Click on the VO to open the detail view.
4. Review the following sections carefully:

| Section | What to Verify |
|---------|---------------|
| **Justification** | Is the reason for the scope change valid and well-documented? |
| **BOQ Adjustments** | Are the additive/deductive quantities reasonable? |
| **Financial Impact** | Review the Additive Amount and Deductive Amount. What is the net impact? |
| **AI Risk Rating** | Is it rated `CRITICAL` or `LOW`? If `CRITICAL`, extra scrutiny is required. |
| **PM Review** | Has the Project Manager reviewed and recommended? |
| **Finance Review** | Has the Finance Officer confirmed budget availability? |

5. Make your decision:
   - **APPROVE** → Click **Approve**. The system will:
     - Automatically update the **Revised Contract** amount
     - Inject new items into the **Consolidated BOQ** (flagged with ⚡ New via VO)
     - Unlock the items for procurement
   - **REJECT** → Click **Reject** and provide a detailed reason. The VO returns to draft status.

> [!CAUTION]
> Once a VO is approved, its financial impact is **permanent** and immediately recalculates the entire project budget. This action cannot be undone.

### 4.2 Reviewing the Director Audit Queue (AI Overrides)

1. Navigate to **Director Audit** from the sidebar.
2. The queue shows all transactions flagged by the AI Validation Engine:
   - **Variation Orders** with `CRITICAL` risk ratings
   - **Payroll entries** with anomalous deductions or extreme overtime
   - **Procurement** items flagging potential duplicate orders or over-budget requests
3. For each item:
   - Click to view the **full AI assessment** and supporting data.
   - **Override (Approve)** → You accept the transaction despite the AI flag. Document your reasoning.
   - **Reject** → The transaction is blocked and returned to the originator for correction.

### 4.3 Reviewing Progress Billings

1. Navigate to **Progress Billings**.
2. Select the project and billing period.
3. Review:
   - **Accomplishment percentages** — do they match physical site reality?
   - **BOQ item references** — are the correct items being billed?
   - **Supporting documents** — are photos and site reports attached?
4. If satisfied, click **Approve for Client Submission**.
5. Finance will generate the official invoice.

### 4.4 Reviewing Purchase Orders for Approval

1. Navigate to **Procurement > Purchase Orders**.
2. Filter for POs with status **"Pending Approval"**.
3. Review:
   - **Total PO Value** — is it within budget?
   - **Supplier selection** — was proper canvassing done?
   - **Linked MRF** — is the PO traceable to an approved Material Request?
   - **BOQ Reference** — are the materials within the BOQ Remaining Balance?
4. **Approve** or **Return for Revision** with notes.

### 4.5 Using the Executive Portfolio Dashboard

1. Navigate to **Executive (👑)** from the sidebar.
2. The portfolio dashboard provides:
   - **Aggregate contract values** vs. revised values across all active projects
   - **Project risk indicators** — projects with critical delays or cost overruns
   - **Financial health charts** — revenue vs. expenses, cash flow projections
   - **AI Chatbot** — ask questions like *"Which project has the highest cost overrun?"*
3. Use this dashboard for strategic decision-making and board reporting.

### 4.6 Approving Payroll Payment Batches

1. Navigate to **Payroll** or **Payroll Payments > Dashboard**.
2. Review the payment batch summary:
   - Total disbursement amount
   - Number of workers included
   - AI validation status (any flagged entries)
3. Verify that the Finance Officer has completed the financial review.
4. Click **Authorize Payment Release**.

### 4.7 Overriding a BOQ Lock

1. Navigate to **Projects** and select the target project.
2. Go to the **BOQ Consolidation** tab.
3. If the BOQ is locked and modifications are needed:
   - Click **Override Lock** (only visible to PROJECT_DIRECTOR and SUPER_ADMIN).
   - Provide a justification for the override.
   - The BOQ returns to editable state.
4. After modifications, the PM must re-lock the BOQ.

---

## 5. Required Approvals

As the highest operational approver, the Project Director's actions are subject to minimal additional approval:

| Action | Requires Approval From |
|--------|----------------------|
| Variation Order Final Approval | Self (PROJECT_DIRECTOR has final authority) |
| PO Approval (above threshold) | Self, with Finance Officer concurrence |
| Payroll Release | Self, after Finance Officer review |
| BOQ Lock Override | Self (documented justification required) |
| AI Override Decision | Self (all overrides are permanently logged) |
| System Data Reset | SUPER_ADMIN + written authorization |
| Changes to System Configuration | SUPER_ADMIN (executed) + Director (authorized) |

---

## 6. Common Mistakes to Avoid

| ❌ Mistake | ✅ Correct Approach |
|-----------|-------------------|
| Approving VOs without reading the AI Risk Rating | Always check the AI assessment first — `CRITICAL` items require extra scrutiny |
| Rubber-stamping approvals without reviewing supporting documents | Every approval must include a review of justifications, photos, and financial impact |
| Ignoring the Director Audit Queue | AI flags exist for a reason — review the queue daily |
| Approving a VO that hasn't completed all prior stages | Verify that PM Review and Finance Review are both completed before granting Final Approval |
| Approving POs without verifying supplier canvassing | At least 3 supplier quotations should be canvassed for transparency |
| Delaying approvals beyond 48 hours | Delays cascade — procurement, billing, and payroll all depend on timely approvals |
| Approving payroll without checking AI anomaly flags | AI flags extreme overtime and negative net pay — these require human verification |
| Not documenting override justifications | Every override must have a written reason — regulators and auditors will check |

---

## 7. Reports the Role Must Review

| Report | Purpose | Frequency |
|--------|---------|-----------|
| **Executive Financial Summary** | Portfolio-wide budget vs. actual, revenue vs. cost | Weekly |
| **Variation Order Status Report** | All VOs by status, financial impact summary | Weekly |
| **AI Anomaly Report** | All AI-flagged transactions and their resolution status | Daily |
| **Progress Billing Summary** | Billing status per project, amounts billed vs. collected | Weekly |
| **Supplier Payables Aging Report** | Outstanding amounts owed to suppliers by age | Weekly |
| **Payroll Disbursement Summary** | Total payroll by project, by period | Semi-Monthly |
| **Project Cost Overrun Report** | Projects exceeding budget thresholds | Weekly |
| **Cash Flow Projection** | Projected cash inflows and outflows | Weekly |
| **Subcontracting Progress Report** | Subcontractor accomplishments and payment status | Weekly |

---

## 8. Best Practices

### Decision Making
- ✅ **Never approve on mobile without full review** — use a desktop for comprehensive data review.
- ✅ **Cross-reference** AI ratings with your own professional judgment.
- ✅ **Question unusually low-risk AI ratings** — false negatives are as dangerous as false positives.
- ✅ **Set a personal approval SLA** — target 24-hour turnaround on all pending approvals.

### Financial Governance
- ✅ Review the **Revised Contract** after every VO approval to confirm the correct recalculation.
- ✅ Compare **Original Contract** vs. **Revised Contract** monthly to track scope creep.
- ✅ Require **written justifications** for all Variation Orders — verbal approvals are not valid.
- ✅ Hold monthly **portfolio review meetings** using the Executive Dashboard data.

### Audit Trail
- ✅ Every override and approval should have a **documented reason**.
- ✅ Periodically review your own **audit trail** to confirm all entries are expected.
- ✅ Retain all supporting documents (emails, letters, site reports) in the **Documents** module.

### Delegation
- ✅ If you will be unavailable, notify the SUPER_ADMIN to temporarily assign approval authority to a Deputy Director.
- ✅ Never share your login credentials — even for delegation purposes.

---

## 9. Final Checklist

Complete the following before exercising full approval authority:

| # | Item | Status |
|---|------|--------|
| 1 | ☐ Received login credentials and verified PROJECT_DIRECTOR role assignment |  |
| 2 | ☐ Changed default password to a strong, unique password |  |
| 3 | ☐ Reviewed the complete Variation Order approval pipeline (5 stages) |  |
| 4 | ☐ Successfully reviewed and approved a test Variation Order |  |
| 5 | ☐ Navigated the Executive Portfolio Dashboard and understood all charts |  |
| 6 | ☐ Reviewed the Director Audit Queue and processed at least one test override |  |
| 7 | ☐ Reviewed the Progress Billings module and approved a test billing |  |
| 8 | ☐ Reviewed the AI Command Center and understood risk rating methodology |  |
| 9 | ☐ Confirmed understanding that VO Final Approval is irreversible |  |
| 10 | ☐ Reviewed at least 3 financial reports from the Reports module |  |
| 11 | ☐ Established a delegation plan for periods of absence |  |
| 12 | ☐ Signed off with SUPER_ADMIN that approver onboarding is complete |  |

> [!IMPORTANT]
> **Signature Required:** This document must be signed by the Project Director and filed with the System Administrator. Your signature acknowledges that you understand the financial and legal implications of your approval authority.

---

**Approver Training Guide — End of Document**  
*OneSystemsERP Training & Operations Package*  
*Document Code: TRG-003 | Version 1.0*
