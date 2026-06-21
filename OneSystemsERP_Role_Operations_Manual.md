# OneSystemsERP - Role-Based User Operations Manual

Welcome to the **OneSystemsERP Project Management System**. Because OneSystemsERP enforces strict data security and operational integrity, the system dynamically restricts access and capabilities based on your assigned user role.

This manual is structured by **User Roles**. Please locate your role below to understand your access rights, system limitations, and your specific daily operational workflows.

---

## 1. Project Manager (PM)

As a Project Manager, you are the operational owner of the project's execution and initial financial adjustments.

**Access Rights:**
*   Full view access to the **Projects** dashboard and BOQ tabs.
*   Authority to **Lock the Consolidated BOQ** to establish the procurement baseline.
*   Authority to **Draft and Submit Variation Orders**.
*   Authority to **Review** Variation Orders (Stage 4 in the approval pipeline).
*   View access to Knowledge Center, Documents, and Accomplishments.

**Limitations:**
*   Cannot independently give Final Approval to a Variation Order (requires Project Director).
*   Cannot generate or approve Purchase Orders (reserved for Procurement/Finance).
*   Cannot process Payroll or issue payments.

### Workflows for Project Managers:
**A. Locking the BOQ**
1. Navigate to **Projects** > Select your active project.
2. Go to the **BOQ Consolidation** tab.
3. Review the items. Once verified, click the **Lock BOQ** button. *Note: Procurement cannot begin until you lock this BOQ.*

**B. Initiating a Variation Order**
1. In your project, go to the **Variation Orders** tab and click **+ Create Variation Order**.
2. Define the reason, justifications, and time impact. 
3. Click **Add Adjustment/New Work** to modify existing BOQ items or add entirely new works.
4. Submit the VO for Costing and PM Review.

---

## 2. Project Director / Executive

The Project Director holds ultimate executive authority over project baselines and financial approvals.

**Access Rights:**
*   Access to the **Executive (👑)** module for portfolio-wide financial aggregation and risk alerts.
*   Ultimate **Approval Authority** for Variation Orders.
*   Override authority on locked BOQs.
*   Full visibility into Finance, Procurement, and Subcontracting dashboards.

**Limitations:**
*   Generally does not draft MRFs or VOs directly (delegated to PMs or Site Engineers).
*   Cannot modify system roles or global settings (reserved for Administrators).

### Workflows for Project Directors:
**A. Final Approval of Variation Orders**
1. Navigate to the **Variation Orders** module.
2. Filter for VOs with the status **For PD Approval**.
3. Review the **AI Risk Rating**. If the AI has flagged the VO as `CRITICAL`, proceed with caution and review the pricing justifications.
4. Change the status to **APPROVED**. 
    > [!IMPORTANT]
    > *Automated Action:* Approving the VO automatically updates the Project's Revised Contract and seamlessly injects the new items into the living Consolidated BOQ.

---

## 3. Purchasing Officer (Procurement)

Purchasing Officers bridge the gap between the project's requirements and external suppliers.

**Access Rights:**
*   Authority to generate **Material Request Forms (MRFs)** directly from the locked BOQ.
*   Access to the **Procurement** module to manage Purchase Orders (POs) and canvass suppliers.
*   Access to the **Inventory** module to track incoming deliveries against POs.

**Limitations:**
*   **Cannot request materials that exceed the BOQ balance.** The system will actively block requests that surpass the allowed threshold.
*   Cannot Lock the BOQ or approve Variation Orders.
*   Cannot view Executive financial dashboards or Payroll data.

### Workflows for Purchasing Officers:
**A. Generating a Material Request (MRF)**
1. Go to a Project and open the **BOQ Consolidation** tab.
2. Use the checkboxes to select the required materials and click **📋 Generate MRF**.
3. On the drafting page, input the requested quantities. The system displays the *Remaining Balance* for strict reference.
4. *Tip:* Items generated from Variation Orders are safely sorted at the bottom of the list and marked with a **⚡ New via VO** badge.
5. Submit the MRF to transition it into the formal Procurement pipeline.

---

## 4. Finance Officer

The Finance role governs cash flow, billings, and labor costs.

**Access Rights:**
*   Access to the **Finance** module (Accounts Payable & Receivable).
*   Access to **Payroll** to process salary disbursements based on approved Daily Time Records (DTR).
*   Authority to review Variation Orders during the **For Finance Review** stage (verifying budget availability).

**Limitations:**
*   Cannot alter physical project accomplishments or BOQ items.
*   Cannot alter the Inventory counts directly.

### Workflows for Finance Officers:
**A. Reviewing Financial Impact of VOs**
1. Open a Variation Order pending **For Finance Review**.
2. Verify the `Additive Amount` and `Deductive Amount`.
3. Approve the stage to push it to the Project Director.

**B. Processing Progress Billings**
1. Navigate to the **Finance** module.
2. Review the site **Accomplishments** submitted by the Site Engineers.
3. Generate an Accounts Receivable invoice based on the percentage of completion against the BOQ.

---

## 5. Site Engineer (Execution & Logistics)

Site Engineers manage the physical reality of the project on the ground.

**Access Rights:**
*   Access to submit **Accomplishments** (progress reports).
*   Access to the **Material Issuance** module to draw materials from Inventory to the specific project phase.
*   Access to the **Equipment** module to log heavy machinery usage and fuel consumption.
*   Access to **Subcontracting** to monitor third-party contractor progress.

**Limitations:**
*   Cannot approve MRFs or POs.
*   Cannot approve Variation Orders.
*   Cannot process financial payments.

### Workflows for Site Engineers:
**A. Material Issuance**
1. Go to **Material Issuance**.
2. Request the release of delivered inventory (e.g., pulling 50 meters of THHN wire from the warehouse to Floor 3).
3. The system deducts the stock from Inventory and charges the cost code to the project.

**B. Submitting Accomplishments**
1. Go to the **Accomplishments** module.
2. Select an active BOQ item and input the physical progress (e.g., "Installed 20 units of VRF AC").
3. Upload photographic evidence to the **Documents** module and link it to the report.

---

## 6. System Administrator

Administrators configure the environment and maintain the AI systems.

**Access Rights:**
*   Unrestricted access to all modules via the `MASTER_ADMIN` override.
*   Exclusive access to **Users** and **Settings**.
*   Exclusive access to the **AI Command Center**.

**Limitations:**
*   None.

### Workflows for Administrators:
**A. Role Assignment**
1. Navigate to the **Users** module.
2. When onboarding a new employee, assign their specific Role (e.g., `PURCHASING_OFFICER`). The system will automatically restrict their navigation and button-level permissions globally.

**B. AI Command Center Oversight**
1. Open the **AI Command Center**.
2. Monitor the logs to ensure the AI validation engine is correctly assessing Variation Orders and flagging anomalies. You can force-restart AI validation jobs from here if necessary.

---

## 7. Global Tools (Available to All Roles)

Regardless of your role, you have access to:
*   **AI ERP Assistant (💬)**: A natural-language chatbot. You can ask it to search for documents, summarize a Variation Order, or check inventory balances simply by typing your question.
*   **Documents (📂)**: A centralized repository where you can upload and download system files, including this exact manual!
