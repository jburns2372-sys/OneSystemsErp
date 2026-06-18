'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export async function resetTransactionData(confirmationText: string) {
  if (confirmationText !== 'RESET TRANSACTION DATA ONLY') {
    throw new Error('Invalid confirmation text.');
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  
  if (!sessionId) {
    throw new Error('Not authenticated');
  }

  const currentUser = await prisma.user.findUnique({ where: { id: sessionId }});
  if (!currentUser) throw new Error('User not found');

  if (currentUser.role !== 'SYSTEM_ADMIN') {
    throw new Error('Unauthorized Action: Only SYSTEM_ADMIN can perform a master reset.');
  }

  try {
    // 1. Create a Backup First
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

    // 2. Perform the deletions in bottom-up order inside a transaction
    await prisma.$transaction(async (tx) => {
      // AI & Activity Logs
      await tx.aIValidationLog.deleteMany({});
      await tx.auditLog.deleteMany({});
      await tx.aIValidationEvidence.deleteMany({});
      await tx.aIValidationFinding.deleteMany({});
      await tx.aIDuplicatePhotoCheck.deleteMany({});
      await tx.aIHumanReview.deleteMany({});
      await tx.aIValidationRun.deleteMany({});
      await tx.aIWorkerValidationResult.deleteMany({});
      await tx.aIValidationResult.deleteMany({});

      // Subcontracting (Transactional)
      await tx.subcontractBilling.deleteMany({});
      await tx.subcontractAccomplishment.deleteMany({});
      await tx.jobOrder.deleteMany({});
      // Keep SubcontractPackage and SubcontractorBOQItem? 
      // Safe to delete if they are considered transactional for the project execution.
      await tx.subcontractPackage.deleteMany({});
      await tx.subcontractorBOQItem.deleteMany({});
      await tx.backCharge.deleteMany({});
      await tx.accomplishmentRecord.deleteMany({});
      await tx.paymentRecord.deleteMany({});

      // Banking and Payments
      await tx.paymentFallbackRecommendation.deleteMany({});
      await tx.paymentException.deleteMany({});
      await tx.paymentBatchRow.deleteMany({});
      await tx.paymentBatch.deleteMany({});
      await tx.payrollFundingRequest.deleteMany({});
      await tx.paymentLog.deleteMany({});
      // Do NOT delete Banks/Providers as they are static config layout data
      // await tx.payrollBankLedger.deleteMany({});
      // await tx.payrollBankAccount.deleteMany({});
      // await tx.receivingBank.deleteMany({});
      // await tx.paymentProvider.deleteMany({});

      // KNOWLEDGE BASE (Rules, SOPs, AI rules) MUST BE PRESERVED. DO NOT DELETE.
      // await tx.knowledgeAuditTrail.deleteMany({});
      // await tx.knowledgeReference.deleteMany({});
      // await tx.knowledgeRecord.deleteMany({});

      // Payroll & HR Transactions
      await tx.payrollAuditLog.deleteMany({});
      await tx.payrollApproval.deleteMany({});
      await tx.deductionLog.deleteMany({});
      await tx.deductionLedger.deleteMany({});
      await tx.payrollDeduction.deleteMany({});
      await tx.payrollEarning.deleteMany({});
      await tx.payroll.deleteMany({});
      await tx.dailyTimeRecord.deleteMany({});
      // Keep payrollPeriod and workerDocument

      // Petty Cash Transactions
      await tx.pettyCashExpense.deleteMany({});
      await tx.pettyCashReplenishment.deleteMany({});
      // Keep Accounts

      // Expenses
      await tx.expenseApprovalLog.deleteMany({});
      await tx.expenseAIValidation.deleteMany({});
      await tx.expenseProofFile.deleteMany({});
      await tx.expenseBreakdownItem.deleteMany({});
      await tx.expense.deleteMany({});

      // Procurement & Inventory Transactions
      await tx.accountsPayable.deleteMany({});
      await tx.deliveryItem.deleteMany({});
      await tx.delivery.deleteMany({});
      await tx.consumptionItem.deleteMany({});
      await tx.consumptionLog.deleteMany({});
      await tx.returnItem.deleteMany({});
      await tx.materialReturn.deleteMany({});
      await tx.issuanceItem.deleteMany({});
      await tx.materialIssuance.deleteMany({});
      await tx.purchaseOrderItem.deleteMany({});
      await tx.purchaseOrder.deleteMany({});
      await tx.materialRequestItem.deleteMany({});
      await tx.materialRequest.deleteMany({});

      // Project Accomplishment, Billing, & Variation Orders
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
      
      // Variation Orders (New Models)
      await tx.aIVariationOrderValidation.deleteMany({});
      await tx.variationOrderDocument.deleteMany({});
      await tx.variationOrderApproval.deleteMany({});
      await tx.variationOrderItem.deleteMany({});
      await tx.variationOrder.deleteMany({});

      await tx.evidenceFile.deleteMany({});
      await tx.projectCamera.deleteMany({});
      await tx.liveCameraSnapshot.deleteMany({});
      
      // DO NOT delete DocumentTemplate, Document, Project, BOQMapping, AwardedBOQItem, ConsolidatedBOQItem!
      // These are FOUNDATIONAL data that define the UI and project structure.

      // Finally, log this massive reset action into AuditLog
      await tx.auditLog.create({
        data: {
          user: { connect: { id: currentUser.id } },
          remarks: 'ZERO_DATA_RESET: Transactional data has been successfully cleared via System Reset.',
          moduleName: 'SYSTEM_SETTINGS',
          actionType: 'DELETE'
        }
      });
    }, {
      timeout: 30000 // Allow up to 30s for the transaction
    });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to reset transaction data:', error);
    return { success: false, error: error.message };
  }
}

export async function getCurrentUserRole() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;
    if (!sessionId) return null;
    const currentUser = await prisma.user.findUnique({ where: { id: sessionId }});
    return currentUser?.role || null;
  } catch (e) {
    return null;
  }
}
