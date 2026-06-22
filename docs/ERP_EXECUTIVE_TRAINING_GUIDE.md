# OneSystemsERP — Executive Training Guide

**Document Code:** TRG-008  
**Version:** 1.0  
**Classification:** Internal — Directors, Executives, Board Members  
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

### Directors (`DIRECTORS`) / Executive (`PROJECT_DIRECTOR`)

The Executive role provides **strategic portfolio-level oversight** across all active projects within the organization. Unlike the Project Director (who also holds approval authority), the Directors role focuses primarily on **monitoring, analysis, and strategic decision-making** rather than transaction-level approvals.

**Key Accountabilities:**
- Portfolio-wide financial performance monitoring
- Strategic risk assessment across all projects
- Board reporting and executive dashboard utilization
- AI-driven insights for strategic decisions
- Company-level financial health tracking
- Project Director performance monitoring
- Escalation handling for high-risk flags

**Access Level:** Full read access to all modules with emphasis on the Executive Portal.

> [!NOTE]
> This guide covers the **strategic oversight** functions. For transaction-level approval workflows (VO approval, PO approval, etc.), refer to the **Approver Training Guide (TRG-003)**.

---

## 2. Daily Responsibilities

| Time | Task | Priority |
|------|------|----------|
| **08:00** | Review **Executive Dashboard** — portfolio overview, risk alerts | 🔴 Critical |
| **08:30** | Review **AI Anomaly Summary** — CRITICAL flags across all projects | 🔴 Critical |
| **09:00** | Check **Portfolio Financial Dashboard** — contract vs. revised values | 🟡 High |
| **09:30** | Review **Cash Flow Position** — cash in vs. cash out trends | 🟡 High |
| **10:00** | Review **Project Status Reports** — milestones, delays, cost overruns | 🟡 High |
| **11:00** | Engage the **Executive AI Chatbot** for targeted analysis | 🟢 Medium |
| **02:00** | Review **Company-level Financial Summary** — P&L, balance sheet items | 🟡 High |
| **03:00** | Conduct strategic review of high-risk projects | 🟡 High |
| **Weekly** | Portfolio review meeting preparation using Executive reports | 🔴 Critical |
| **Monthly** | Board report generation and strategic planning | 🔴 Critical |
| **Quarterly** | Full portfolio performance review and strategic realignment | 🔴 Critical |

---

## 3. Modules Used by the Role

| Module | Purpose | Access |
|--------|---------|--------|
| **Executive (👑)** | Portfolio-wide dashboard, AI chatbot, financial aggregation | Full |
| **Executive > Home** | Landing page with portfolio KPIs and alerts | Full |
| **Executive > Portfolio** | Multi-project comparison and analysis | Full |
| **Executive > Company** | Organization-level financial dashboard | Full |
| **Executive > Reports** | Executive-grade reports and analytics | Full |
| **Executive > AI Center** | AI-driven insights and predictive analysis | Full |
| **Executive > Validation** | AI validation overview and compliance status | Full |
| **Projects** | Project-level details (read access) | View |
| **Finance** | Financial data access for oversight | View |
| **Reports** | System-wide report generation | Full |
| **Director Audit** | AI override queue (if also an Approver) | Full |
| **System Audit** | System-wide audit trail | View |
| **Dashboard** | Standard role-based dashboard | Full |

---

## 4. Step-by-Step Common Tasks

### 4.1 Using the Executive Dashboard

1. Navigate to **Executive (👑)** from the sidebar.
2. The **Home** page displays:

| Widget | Description |
|--------|-------------|
| **Active Projects Count** | Total number of projects currently in execution |
| **Total Original Contract** | Sum of all project original contract values |
| **Total Revised Contract** | Sum after absorbing all approved Variation Orders |
| **Total Expenditure** | Cumulative spending across all projects |
| **Budget Utilization %** | Percentage of revised budget consumed |
| **Risk Alerts** | Projects flagged for cost overrun, schedule delay, or AI anomalies |

3. Click on any project card to drill down into project-specific details.

### 4.2 Portfolio Analysis

1. Navigate to **Executive > Portfolio**.
2. The portfolio view presents:
   - **Project Comparison Table** — side-by-side financial data for all active projects
   - **Budget vs. Actual Charts** — visual comparison across projects
   - **Variation Order Impact** — cumulative VO impact per project
   - **Accomplishment Progress** — physical completion percentage per project
3. Use filters to:
   - Compare specific projects
   - Focus on a specific time period
   - Isolate cost categories (materials, labor, equipment, subcontracting)

### 4.3 Using the Executive AI Chatbot

1. Navigate to **Executive (👑)** — the chatbot is embedded in the Executive layout.
2. Click the **AI Chatbot** panel.
3. Ask strategic questions in plain English:

**Example queries:**
- *"Which project has the highest cost overrun?"*
- *"Compare the budget utilization of all active projects"*
- *"Summarize all approved Variation Orders this month"*
- *"What is the total outstanding receivable across all projects?"*
- *"Show me projects with critical delays"*
- *"What is the projected cash flow for the next 30 days?"*

4. The AI responds with data-driven answers pulled from the live system.

> [!TIP]
> The AI Chatbot is your fastest tool for ad-hoc analysis. Use it for board meetings, stakeholder calls, and strategic planning sessions.

### 4.4 Company Financial Review

1. Navigate to **Executive > Company**.
2. The company dashboard aggregates:
   - **Revenue Summary** — total billings, collections, outstanding receivables
   - **Expense Summary** — total procurement, payroll, subcontracting, overhead
   - **Net Position** — revenue minus expenses
   - **Cash Flow Trend** — monthly cash inflows vs. outflows
3. Use this data for:
   - Monthly financial reporting to the board
   - Cash flow planning and forecasting
   - Investment and expansion decisions

### 4.5 Reviewing AI Validation Summary

1. Navigate to **Executive > Validation**.
2. The validation dashboard shows:
   - **Total transactions validated** by the AI engine
   - **CRITICAL flags** — items requiring executive attention
   - **LOW risk items** — reviewed and cleared
   - **Override history** — decisions made on flagged items
3. Focus on CRITICAL flags — these may indicate:
   - Budget overruns
   - Anomalous payroll entries
   - Duplicate procurement requests
   - Suspicious Variation Order pricing

### 4.6 Generating Executive Reports

1. Navigate to **Executive > Reports** or **Reports** from the sidebar.
2. Select from executive-grade reports:

| Report | Description |
|--------|-------------|
| **Portfolio Summary** | All projects with key financial metrics |
| **Cash Flow Statement** | Cash inflows and outflows for the period |
| **Project Profitability** | Revenue vs. cost per project |
| **Variation Order Impact** | Cumulative scope change effect on budget |
| **Subcontracting Summary** | Subcontractor performance and payment status |
| **Payroll Cost Summary** | Labor costs by project and period |
| **Procurement Spend** | Material procurement totals by supplier and project |
| **Risk Assessment** | AI-generated risk scores per project |

3. Configure parameters (date range, projects, categories).
4. Generate and download as **PDF** or **Excel**.
5. Reports can be scheduled for automatic generation.

### 4.7 Using the Global Project Selector

1. In the Executive layout, use the **Global Project Selector** at the top.
2. Select a specific project to filter all Executive views to that project.
3. Select "All Projects" to return to the portfolio-wide view.

---

## 5. Required Approvals

As an Executive with oversight focus, most actions are read-only:

| Action | Requires Approval From |
|--------|----------------------|
| Viewing any report or dashboard | Self (no approval needed) |
| Downloading executive reports | Self |
| AI Chatbot queries | Self |
| Escalating AI flags to action teams | Self (notification-based) |
| Requesting system configuration changes | SUPER_ADMIN (execution) |

> [!NOTE]
> If you also hold **PROJECT_DIRECTOR** approval authority, refer to the Approver Training Guide (TRG-003) for approval-specific workflows.

---

## 6. Common Mistakes to Avoid

| ❌ Mistake | ✅ Correct Approach |
|-----------|-------------------|
| Relying solely on the AI Chatbot without verifying data | Use the chatbot for quick insights but cross-reference critical decisions with formal reports |
| Ignoring CRITICAL AI flags | Every CRITICAL flag represents a potential financial or compliance risk — escalate immediately |
| Reviewing only portfolio-level data without drilling into troubled projects | When a project shows red flags, drill down into the project-specific details |
| Making budget decisions based on Original Contract values | Always use **Revised Contract** values — these reflect approved Variation Orders |
| Not monitoring cash flow trends | Cash flow is the lifeblood of operations — review weekly at minimum |
| Delaying board report preparation | Use the Executive Dashboard for real-time data — don't wait for manual compilation |
| Overlooking subcontracting costs | Subcontracting often represents 30-50% of project costs — monitor closely |
| Not engaging with the AI validation insights | The AI catches patterns humans miss — treat its outputs as a valuable second opinion |

---

## 7. Reports the Role Must Review

| Report | Purpose | Frequency |
|--------|---------|-----------|
| **Portfolio Financial Summary** | All projects: original contract, revised contract, expenditure, variance | Weekly |
| **Cash Flow Statement** | Net cash position, inflows, outflows, projections | Weekly |
| **Project Profitability Report** | Revenue vs. cost, margin analysis per project | Monthly |
| **Variation Order Impact Report** | Cumulative scope changes, financial impact | Monthly |
| **Budget Utilization Report** | Percentage of budget consumed per project | Weekly |
| **Risk Assessment Dashboard** | AI-generated risk scores and flags | Daily |
| **Accounts Receivable Aging** | Outstanding client payments by age | Weekly |
| **Subcontracting Performance** | Subcontractor accomplishment and billing status | Monthly |
| **Payroll Cost Allocation** | Labor costs by project | Monthly |
| **Procurement Spend Analysis** | Material costs by supplier, category, and project | Monthly |
| **AI Validation Summary** | Overview of all AI-assessed transactions | Weekly |

---

## 8. Best Practices

### Strategic Oversight
- ✅ Review the **Executive Dashboard** as the **first action** every morning.
- ✅ Focus on **trends** rather than individual transactions — identify patterns of concern.
- ✅ Use the **AI Chatbot** during board meetings for live data queries.
- ✅ Schedule **weekly portfolio reviews** with Project Directors using Executive reports.

### Financial Governance
- ✅ Track **Revised Contract** growth — if it grows faster than accomplishments, scope creep is occurring.
- ✅ Monitor **cash flow projections** 30, 60, and 90 days out.
- ✅ Ensure **collections** are keeping pace with billings — aging receivables erode cash position.
- ✅ Compare **Budget Utilization %** against **Physical Completion %** — they should track proportionally.

### Risk Management
- ✅ Treat every **CRITICAL AI flag** as an action item — not just an informational alert.
- ✅ Maintain a **risk register** for projects with repeated AI anomalies.
- ✅ Escalate cost overrun trends before they become budget crises.
- ✅ Require Project Directors to present **corrective action plans** for at-risk projects.

### Reporting
- ✅ Standardize **board reporting format** using the Executive Reports module.
- ✅ Archive monthly reports in the **Documents** module for historical reference.
- ✅ Use the AI to generate **narrative summaries** of complex financial data.

---

## 9. Final Checklist

| # | Item | Status |
|---|------|--------|
| 1 | ☐ Received login credentials and verified DIRECTORS or PROJECT_DIRECTOR role |  |
| 2 | ☐ Changed default password to a strong, unique password |  |
| 3 | ☐ Navigated the Executive (👑) portal and understood all dashboard widgets |  |
| 4 | ☐ Reviewed the Portfolio Analysis view and compared at least 2 projects |  |
| 5 | ☐ Used the Executive AI Chatbot to answer at least 3 strategic questions |  |
| 6 | ☐ Reviewed the Company Financial Dashboard |  |
| 7 | ☐ Examined the AI Validation Summary for CRITICAL flags |  |
| 8 | ☐ Generated at least 3 Executive Reports (PDF/Excel) |  |
| 9 | ☐ Understood the relationship between Original Contract, Revised Contract, and VOs |  |
| 10 | ☐ Reviewed the Cash Flow Statement and understood the projection methodology |  |
| 11 | ☐ If also an Approver, completed the Approver Training Guide (TRG-003) |  |
| 12 | ☐ Signed off with SUPER_ADMIN that executive onboarding is complete |  |

---

**Executive Training Guide — End of Document**  
*OneSystemsERP Training & Operations Package*  
*Document Code: TRG-008 | Version 1.0*
