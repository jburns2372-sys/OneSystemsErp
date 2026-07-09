// @ts-nocheck
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient(); // Adjust path as needed for your backend structure
import fs from 'fs';
import path from 'path';

const router = Router();

// NOTE: In a real AWS environment, process.cwd() for file paths (dbPath, backupDir, uploadsDir)
// would need to be adjusted to point to persistent storage like S3, EFS, or a designated
// writable directory in a Lambda environment, as local file system might not be persistent
// or suitable for database files.

router.post('/resetTransactionData', async (req, res) => {
  try {
    const { confirmationText, sessionId } = req.body; // sessionId expected from proxy

    if (confirmationText !== 'RESET TRANSACTION DATA ONLY') {
      return res.status(400).json({ success: false, error: 'Invalid confirmation text.' });
    }

    let currentUser = null;
    if (sessionId) {
      currentUser = await prisma.user.findUnique({ where: { id: sessionId }});
    } else {
      // Fallback for development if session not present, find any user for testing
      // In a production AWS backend, you'd likely reject unauthenticated requests or
      // get user info from an auth token (e.g., from Cognito).
      currentUser = await prisma.user.findFirst();
    }

    if (!currentUser) throw new Error('User not found');

    if (currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized Action: Only SUPER_ADMIN can perform a master reset.');
    }

    // 1. Create a Backup First
    // IMPORTANT: Adjust paths for AWS environment. This assumes local file system.
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const backupDir = path.join(process.cwd(), 'prisma', 'backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    if (fs.existsSync(dbPath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `dev_backup_${timestamp}.db`);
      fs.copyFileSync(dbPath, backupPath);
      console.log(`Database backup created at ${backupPath}`);
    }

    // ============================================================================
    // STRICTLY PROTECTED TABLES (NEVER deleted by master reset):
    //   User, UserRole, SystemRole, Role, RolePermission, Module,
    //   WorkflowTemplate, WorkflowStep, RoleConflictRule,
    //   AIValidationRule, AIModulePrompt,
    //   KnowledgeRecord, KnowledgeReference, KnowledgeAuditTrail,
    //   KnowledgeRuleReference, KnowledgeRuleAuditLog,
    //   NotebookReference, NotebookReferenceVersion, NotebookReferenceModule,
    //   NotebookReferenceRole, NotebookReferenceProject,
    //   AINotebookReference,
    //   DocumentTemplate,
    //   GovernmentSettings, SSSTable, BIRWithholdingTaxTable,
    //   PayrollCutoffSetting,
    //   PayrollBankAccount, PayrollBankLedger, PaymentProvider, ReceivingBank
    // ============================================================================
    // EVERYTHING ELSE is wiped to give a true zero-data fresh start.
    // ============================================================================

    // 2. Perform the deletions in dependency-safe bottom-up order
    await prisma.$transaction(async (tx) => {
      // --- PHASE 1: Logs, AI Results, Activity Tracking ---
      await tx.aIValidationLog.deleteMany({});
      await tx.auditLog.deleteMany({});
      await tx.aIValidationEvidence.deleteMany({});
      await tx.aIValidationFinding.deleteMany({});
      await tx.aIDuplicatePhotoCheck.deleteMany({});
      await tx.aIHumanReview.deleteMany({});
      await tx.aIValidationRun.deleteMany({});
      await tx.aIWorkerValidationResult.deleteMany({});
      await tx.aIValidationResult.deleteMany({});
      await tx.aIReferenceUsageLog.deleteMany({});
      await tx.aINotification.deleteMany({});
      await tx.aISearchLog.deleteMany({});
      await tx.aIAuditFinding.deleteMany({});
      await tx.aIRiskScore.deleteMany({});
      await tx.aIValidationOverride.deleteMany({});
      await tx.aITransactionValidation.deleteMany({});
      await tx.notebookReferenceApprovalLog.deleteMany({});
      await tx.notebookReferenceIndexLog.deleteMany({});
      await tx.userLoginLog.deleteMany({});
      await tx.paymentLog.deleteMany({});
      await tx.payrollAuditLog.deleteMany({});

      // --- PHASE 2: Transaction Workflows & Locks ---
      await tx.revisionRequest.deleteMany({});
      await tx.lockedRecord.deleteMany({});
      await tx.transactionWorkflow.deleteMany({});

      // --- PHASE 3: Canvassing & Procurement ---
      await tx.quotationItem.deleteMany({});
      await tx.supplierQuotation.deleteMany({});
      await tx.canvassItem.deleteMany({});
      await tx.canvassForm.deleteMany({});
      await tx.purchaseOrderItem.deleteMany({});
      await tx.purchaseOrder.deleteMany({});
      await tx.materialRequestItem.deleteMany({});
      await tx.materialRequest.deleteMany({});

      // --- PHASE 4: Delivery, Inventory & Equipment ---
      await tx.equipmentAIValidation.deleteMany({});
      await tx.equipmentTelemetry.deleteMany({});
      await tx.equipmentMaintenance.deleteMany({});
      await tx.equipmentUtilization.deleteMany({});
      await tx.equipmentDeployment.deleteMany({});
      await tx.equipment.deleteMany({});

      await tx.accountsPayable.deleteMany({});
      await tx.deliveryItem.deleteMany({});
      await tx.delivery.deleteMany({});
      await tx.consumptionItem.deleteMany({});
      await tx.consumptionLog.deleteMany({});
      await tx.returnItem.deleteMany({});
      await tx.materialReturn.deleteMany({});
      await tx.issuanceItem.deleteMany({});
      await tx.materialIssuance.deleteMany({});

      // --- PHASE 5: Expenses & Petty Cash ---
      await tx.expenseApprovalLog.deleteMany({});
      await tx.expenseAIValidation.deleteMany({});
      await tx.expenseProofFile.deleteMany({});
      await tx.expenseBreakdownItem.deleteMany({});
      await tx.pettyCashExpense.deleteMany({});
      await tx.pettyCashReplenishment.deleteMany({});
      await tx.expense.deleteMany({});
      await tx.pettyCashAccount.deleteMany({});

      // --- PHASE 6: Subcontracting ---
      await tx.subcontractBilling.deleteMany({});
      await tx.subcontractAccomplishment.deleteMany({});
      await tx.jobOrder.deleteMany({});
      await tx.subcontractorBOQItem.deleteMany({});
      await tx.programOfWorks.deleteMany({});
      await tx.subcontractPackage.deleteMany({});
      await tx.backCharge.deleteMany({});
      await tx.accomplishmentRecord.deleteMany({});
      await tx.paymentRecord.deleteMany({});

      // --- PHASE 7: Payments & Banking Transactions ---
      await tx.paymentFallbackRecommendation.deleteMany({});
      await tx.paymentException.deleteMany({});
      await tx.paymentBatchRow.deleteMany({});
      await tx.paymentBatch.deleteMany({});
      await tx.payrollFundingRequest.deleteMany({});

      // --- PHASE 8: Payroll & HR (ALL workers deleted per user instruction) ---
      await tx.payrollApproval.deleteMany({});
      await tx.deductionLog.deleteMany({});
      await tx.deductionLedger.deleteMany({});
      await tx.payrollDeduction.deleteMany({});
      await tx.payrollEarning.deleteMany({});
      await tx.allowance.deleteMany({});
      await tx.payroll.deleteMany({});
      await tx.dailyTimeRecord.deleteMany({});
      await tx.workerDocument.deleteMany({});
      await tx.payrollPeriod.deleteMany({});
      await tx.worker.deleteMany({});  // Workers are wiped — admin can re-add manually

      // --- PHASE 9: Accomplishments, Billings, Variation Orders ---
      await tx.projectAccomplishmentAIFinding.deleteMany({});
      await tx.projectAccomplishmentFileVersion.deleteMany({});
      await tx.projectAccomplishmentFile.deleteMany({});
      await tx.bOQLotBreakdown.deleteMany({});
      await tx.accomplishmentItem.deleteMany({});
      await tx.accomplishment.deleteMany({});
      await tx.inspection.deleteMany({});
      await tx.billingDeduction.deleteMany({});
      await tx.billingItem.deleteMany({});
      await tx.billing.deleteMany({});
      await tx.payment.deleteMany({});
      await tx.aIVariationOrderValidation.deleteMany({});
      await tx.variationOrderDocument.deleteMany({});
      await tx.variationOrderApproval.deleteMany({});
      await tx.variationOrderItem.deleteMany({});
      await tx.variationOrder.deleteMany({});

      // --- PHASE 10: Documents & Evidence ---
      await tx.evidenceFile.deleteMany({});
      await tx.projectCamera.deleteMany({});
      await tx.liveCameraSnapshot.deleteMany({});

      // --- PHASE 11: Core Master Data (Projects, BOQs, Suppliers, Subcontractors) ---
      await tx.bOQMapping.deleteMany({});
      await tx.awardedBOQItem.deleteMany({});
      await tx.consolidatedBOQItem.deleteMany({});
      await tx.project.deleteMany({});
      await tx.supplier.deleteMany({});
      await tx.subcontractor.deleteMany({});

      // ============================================================================
      // PROTECTED (NOT deleted):
      //   User, UserRole, SystemRole, Role, RolePermission, Module,
      //   WorkflowTemplate, WorkflowStep, RoleConflictRule,
      //   AIValidationRule, AIModulePrompt,
      //   KnowledgeRecord, KnowledgeReference, KnowledgeAuditTrail,
      //   KnowledgeRuleReference, KnowledgeRuleAuditLog,
      //   NotebookReference*, AINotebookReference,
      //   DocumentTemplate,
      //   GovernmentSettings, SSSTable, BIRWithholdingTaxTable,
      //   PayrollCutoffSetting,
      //   PayrollBankAccount, PayrollBankLedger, PaymentProvider, ReceivingBank
      // ============================================================================

      // Log the reset action
      await tx.auditLog.create({
        data: {
          user: { connect: { id: currentUser.id } },
          remarks: 'MASTER RESET: All transactional and master data wiped. Only Users, System Roles, Access Matrix, and Knowledge Base preserved.',
          moduleName: 'SYSTEM_SETTINGS',
          actionType: 'DELETE'
        }
      });
    }, {
      timeout: 60000 // Allow up to 60s for the transaction
    });

    // 3. Clear all physical uploaded files
    // IMPORTANT: Adjust paths for AWS environment. This assumes local file system.
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const clearFolder = (dirPath: string) => {
        if (!fs.existsSync(dirPath)) return;
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.isDirectory()) {
            if (entry.name === 'documents') continue; // PROTECT Centralized Documents
            clearFolder(fullPath);
          } else {
            fs.unlinkSync(fullPath);
          }
        }
      };
      clearFolder(uploadsDir);
      console.log('Cleared all uploaded files.');
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to reset transaction data:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/getCurrentUserRole', async (req, res) => {
  try {
    const { sessionId } = req.body; // sessionId expected from proxy

    if (!sessionId) return res.json({ success: true, role: null });
    const currentUser = await prisma.user.findUnique({ where: { id: sessionId }});
    return res.json({ success: true, role: currentUser?.role || null });
  } catch (e: any) {
    console.error('Failed to get current user role:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

export default router;