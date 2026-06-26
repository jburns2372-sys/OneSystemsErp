# Deployment & Database Safety Rules

## Standard Operation: Safe Git Pushes & Builds
- **Never include destructive database commands in the build script**. 
- The `package.json` `build` script MUST ONLY compile the application (e.g., `"build": "prisma generate && next build"`).
- DO NOT use `prisma db push` or `--accept-data-loss` in the standard build script, as this will wipe or corrupt production data when the platform (like Vercel or Netlify) auto-deploys from GitHub.
- Pushing functional code to GitHub is 100% safe as long as the build pipeline does not force schema mutations on the live database.
- Schema changes in production should be handled manually or via explicitly reviewed migration scripts (`prisma migrate deploy`), never implicitly via `npm run build`.

# Operational and User Manual (OneSystems ERP)

This guide outlines the daily, weekly, and monthly operational expectations for each major role within the OneSystems ERP.

## 1. Project Manager (PM)
- **Role Purpose**: Responsible for executing the project within the limits of the Procurement Benchmark BOQ and Awarded BOQ.
- **Daily Tasks**:
  - Review and approve Material Requests (MRs).
  - Review Daily Time Records (DTRs) and worker deployment.
  - Monitor daily accomplishments logged by Site Engineers.
- **Weekly Tasks**:
  - Review AI-generated schedule risk alerts.
  - Update Gantt Chart / Project Schedule.
  - Approve Job Order payments.
- **Monthly Tasks**:
  - Review and validate Progress Billings against actual site condition.
  - Prepare justification for any Subcontractor or Client Variation Orders.
- **Best Practices**:
  - Do not let MRs sit unapproved; this bottlenecks Purchasing.
  - Keep the active project selected in the top bar to avoid creating records in the wrong workspace.

## 2. Project Engineer / Site Engineer
- **Role Purpose**: Managing site execution, requesting materials, and logging physical progress.
- **Daily Tasks**:
  - Draft MRs based on the site's immediate needs, explicitly selecting the correct Benchmark BOQ item to draw from.
  - Log Accomplishments and upload timestamped photos.
- **Common Mistakes**:
  - Requesting items without checking the remaining Benchmark BOQ balance. The system will block requests if the balance is zero unless an override is authorized.
- **Best Practices**:
  - Upload clear photos for accomplishments. The AI validation engine will reject blurry or irrelevant photos, delaying billing.

## 3. Purchasing Officer
- **Role Purpose**: Canvassing suppliers and issuing Purchase Orders (POs).
- **Daily Tasks**:
  - Monitor approved MRs on the dashboard.
  - Input supplier quotations into the Canvass module.
  - Generate Draft POs for the lowest bidder.
- **Common Mistakes**:
  - Forgetting to attach the Canvass PDF to the PO, causing the Director to reject the PO during review.

## 4. Site Admin / Site Accountant
- **Role Purpose**: Managing site petty cash, DTRs, and direct expenses.
- **Daily Tasks**:
  - Upload daily attendance (DTRs) via Excel.
  - Encode direct expenses (e.g., fuel, supplies) and upload receipt photos.
  - Dispense and log Petty Cash.
- **Weekly Tasks**:
  - Submit Petty Cash Replenishment requests before the fund hits zero.
- **Monthly Tasks**:
  - Generate the Payroll Register for PM approval.
- **Best Practices**:
  - Always tag expenses to a BOQ item. Untagged expenses fall into "Overhead" and skew project profitability reports.

## 5. Finance Officer
- **Role Purpose**: Managing accounts payable, billing the client, and maintaining the corporate ledger.
- **Daily Tasks**:
  - Approve direct Expense logs. (Rely on AI validation to catch duplicates).
  - Record supplier payables upon warehouse Delivery Receipt (DR) confirmation.
- **Weekly/Monthly Tasks**:
  - Process Progress Billings generated from the Accomplishments module.
  - Approve Payroll disbursements.

## 6. Executive / Project Director
- **Role Purpose**: Multi-project oversight, high-level approval, and profitability monitoring.
- **Daily Tasks**:
  - Review the Executive Dashboard.
  - Approve high-value POs and Subcontracts.
- **Weekly Tasks**:
  - Run the AI RAG Command Center to generate a weekly health summary report.
- **Best Practices**:
  - Pay attention to the AI Risk Alerts widget. It will automatically flag projects that are spending faster than they are accomplishing.
