import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateComprehensiveContent(sop: any) {
  return `
### 1.0 OBJECTIVE
This Standard Operating Procedure (SOP) formally defines the end-to-end workflow and operational protocols for **${sop.title}** within the OneSystems ERP Command Center. The primary objective is to establish a secure, auditable, and AI-validated process that eliminates data fragmentation and ensures full regulatory and corporate compliance.

### 2.0 SCOPE
This document applies to all active projects and affects all personnel assigned to the **${sop.relatedModule}** module, including but not limited to Project Managers, Site Engineers, Financial Controllers, and Executive Approvers. This procedure governs both manual inputs and AI-assisted automation within the module.

### 3.0 ROLES & RESPONSIBILITIES
- **Initiator (e.g., Site Engineer / Officer):** Responsible for the accurate encoding of primary data, ensuring physical proofs (receipts, photos, documents) are attached prior to submission.
- **Reviewer (e.g., Project Manager / Department Head):** Responsible for technical verification, verifying that the request aligns with the locked baseline BOQ and Schedule.
- **Approver (e.g., Executive / Director):** Provides final financial or strategic authorization. Their digital signature releases the transaction into the general ledger or active execution pipeline.
- **AI Executive Assistant:** Acts as the primary auditor, continuously running programmed heuristics to block anomalies before they reach human reviewers.

### 4.0 STEP-BY-STEP PROCEDURE

#### 4.1 Preparation & Data Entry
1. The Initiator logs into the ERP via the secure PBAC portal.
2. Navigate to the **${sop.relatedModule}** Command Center dashboard.
3. Initiate a new transaction. All mandatory fields must be completed.
4. Attach any required evidentiary documents (e.g., PDFs, Site Photos). 
5. Submit the transaction for System Validation.

#### 4.2 System Audit & AI Validation
1. Upon submission, the AI engine intercepts the payload.
2. The system cross-references the transaction against the active Bill of Quantities (BOQ) and Project Schedule.
3. If anomalies are detected (e.g., over-budget, duplicate files, unauthorized access), the transaction is flagged and halted.
4. If no anomalies exist, the status is automatically advanced to "PENDING REVIEW".

#### 4.3 Review & Approval Workflow
1. The designated Reviewer is notified via the ERP Dashboard.
2. The Reviewer validates the technical parameters of the transaction.
3. Once reviewed, the transaction escalates to the Final Approver.
4. The Final Approver executes their digital signature.
5. The transaction becomes **LOCKED** and is officially logged into the immutable Audit Trail.

### 5.0 EXCEPTIONS & OVERRIDES
Under specific emergency circumstances, AI blocking rules can be overridden. 
- Overrides require **Executive-level** privileges.
- The overriding user must submit a written justification of at least 50 words.
- All overrides trigger an immediate automated email to the Board of Directors and are permanently tagged as "HIGH RISK" in the Audit Ledger.

---
*Document Control: This is a system-enforced SOP. Any deviations from this electronic workflow constitute a breach of company protocol.*
`;
}

const sopsData = [
  { title: 'Project Data & BOQ Uploading Protocol', relatedModule: 'Project Data', tags: 'Projects, BOQ, Initialization' },
  { title: 'Material Request Form (MRF) Submission', relatedModule: 'Procurement', tags: 'MRF, Materials, Requisition' },
  { title: 'Canvassing & Quotation Analysis', relatedModule: 'Procurement', tags: 'Canvass, Quotation, Bidding' },
  { title: 'Purchase Order (PO) Processing & Approval', relatedModule: 'Procurement', tags: 'PO, Purchasing, Approval' },
  { title: 'Site Delivery & Receiving Inspection', relatedModule: 'Inventory', tags: 'Delivery, Receiving, Warehouse' },
  { title: 'Material Issuance & Site Returns', relatedModule: 'Inventory', tags: 'Issuance, Returns, Warehouse' },
  { title: 'Accounts Payable (AP) Vouchering', relatedModule: 'Finance', tags: 'Payables, APV, Accounting' },
  { title: 'Payment Disbursement Protocol', relatedModule: 'Finance', tags: 'Payments, Disbursements, Checks' },
  { title: 'Expense Ledger Management', relatedModule: 'Finance', tags: 'Expenses, Ledgers, Petty Cash' },
  { title: 'Payroll, DTR & Geofencing Rules', relatedModule: 'Payroll', tags: 'Payroll, Timekeeping, DTR' },
  { title: 'Subcontracting & Work Packages', relatedModule: 'Subcontracting', tags: 'Subcontractors, Packages, Awards' },
  { title: 'Job Order Execution', relatedModule: 'Job Orders', tags: 'Job Orders, Execution, Tasks' },
  { title: 'Variation Orders (VO) & Change Management', relatedModule: 'Variation Orders', tags: 'VO, Changes, Scope' },
  { title: 'Project Scheduling & Gantt Management', relatedModule: 'Scheduling', tags: 'Schedule, Gantt, Timeline' },
  { title: 'Site Accomplishments & Progress Tracking', relatedModule: 'Accomplishments', tags: 'Accomplishment, Progress, Tracking' },
  { title: 'Client Progress Billing', relatedModule: 'Billing', tags: 'Billing, Invoicing, Receivables' },
  { title: 'System Reports & Analytics Generation', relatedModule: 'Reports', tags: 'Reports, Analytics, BI' },
  { title: 'Document Management & Notebook Indexing', relatedModule: 'Documents', tags: 'Documents, Plans, Indexing' },
  { title: 'User Roles & PBAC Administration', relatedModule: 'Access Control', tags: 'Users, RBAC, PBAC' },
  { title: 'Equipment & Fleet Maintenance', relatedModule: 'Equipment', tags: 'Equipment, Maintenance, Fleet' },
  { title: 'AI Validation Rules & Overrides', relatedModule: 'AI Command Center', tags: 'AI, Validations, Overrides' }
];

async function main() {
  console.log('Clearing existing SOPs...');
  await prisma.knowledgeRecord.deleteMany({
    where: { documentType: 'SOP' }
  });

  console.log('Seeding Comprehensive Standard Operating Procedures...');
  
  let count = 0;
  for (const sop of sopsData) {
    
    // Create a concise summary for the table view
    const conciseSummary = `Standard operational guideline enforcing system-wide procedures and AI validations for ${sop.relatedModule}.`;
    
    // Generate the massive comprehensive markdown content
    const comprehensiveContent = generateComprehensiveContent(sop);

    await prisma.knowledgeRecord.create({
      data: {
        title: sop.title,
        description: comprehensiveContent,
        notebookType: 'Standard',
        relatedModule: sop.relatedModule,
        documentType: 'SOP',
        status: 'Approved',
        owner: 'System Admin',
        preparedBy: 'AI Implementation Team',
        reviewedBy: 'Executive Committee',
        approvedBy: 'Board of Directors',
        version: 'v1.0',
        tags: sop.tags,
        summary: conciseSummary
      }
    });
    count++;
  }

  console.log(`Successfully seeded ${count} COMPREHENSIVE SOPs into the Knowledge Center!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
