'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

/**
 * A wrapper around `fetch` that automatically includes authentication headers.
 * Assumes the existence of a session cookie or similar mechanism for authentication.
 * 
 * @param url The URL to fetch.
 * @param options Standard Fetch API options.
 * @returns A promise that resolves to the `Response` object.
 */
async function fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
  // In a real application, you'd likely fetch a token from a secure cookie
  // or an auth provider and add it to the headers.
  // For this example, we're assuming the AWS backend handles auth or doesn't strictly require it
  // via headers for specific actions, but rather relies on sessionId in body if needed.
  
  const headers = new Headers(options?.headers);
  // Example for an actual auth token if you had one:
  // const token = cookies().get('authToken')?.value;
  // if (token) {
  //   headers.set('Authorization', `Bearer ${token}`);
  // }

  return fetch(url, {
    ...options,
    headers: headers,
  });
}

const AWS_BACKEND_API_BASE = process.env.AWS_BACKEND_API_BASE || (process.env.NEXT_PUBLIC_API_BASE_URL ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api` : 'http://localhost:4000/api');
const ROUTE_NAME = 'systemResetActions';

export async function resetTransactionData(confirmationText: string) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;
    const simulatedRole = cookieStore.get('simulatedRole')?.value;

    if (!sessionId) throw new Error('Unauthorized');
    const currentUser = await prisma.user.findUnique({ where: { id: sessionId }});
    const userCount = await prisma.user.count();
    if (userCount > 0 && currentUser?.role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized Action: Only SUPER_ADMIN can perform a master reset.');
    }
    
    await prisma.$transaction([
  prisma.aIValidationLog.deleteMany({}),
  prisma.auditLog.deleteMany({}),
  prisma.aIValidationEvidence.deleteMany({}),
  prisma.aIValidationFinding.deleteMany({}),
  prisma.aIDuplicatePhotoCheck.deleteMany({}),
  prisma.aIHumanReview.deleteMany({}),
  prisma.aIValidationRun.deleteMany({}),
  prisma.aIWorkerValidationResult.deleteMany({}),
  prisma.aIValidationResult.deleteMany({}),
  prisma.aIReferenceUsageLog.deleteMany({}),
  prisma.aINotification.deleteMany({}),
  prisma.aISearchLog.deleteMany({}),
  prisma.aIAuditFinding.deleteMany({}),
  prisma.aIRiskScore.deleteMany({}),
  prisma.aIValidationOverride.deleteMany({}),
  prisma.aITransactionValidation.deleteMany({}),
  prisma.notebookReferenceApprovalLog.deleteMany({}),
  prisma.notebookReferenceIndexLog.deleteMany({}),
  prisma.userLoginLog.deleteMany({}),
  prisma.paymentLog.deleteMany({}),
  prisma.payrollAuditLog.deleteMany({}),
  prisma.revisionRequest.deleteMany({}),
  prisma.lockedRecord.deleteMany({}),
  prisma.transactionWorkflow.deleteMany({}),
  prisma.quotationItem.deleteMany({}),
  prisma.supplierQuotation.deleteMany({}),
  prisma.canvassItem.deleteMany({}),
  prisma.canvassForm.deleteMany({}),
  prisma.purchaseOrderItem.deleteMany({}),
  prisma.purchaseOrder.deleteMany({}),
  prisma.materialRequestItem.deleteMany({}),
  prisma.materialRequest.deleteMany({}),
  prisma.equipmentAIValidation.deleteMany({}),
  prisma.equipmentTelemetry.deleteMany({}),
  prisma.equipmentMaintenance.deleteMany({}),
  prisma.equipmentUtilization.deleteMany({}),
  prisma.equipmentDeployment.deleteMany({}),
  prisma.equipment.deleteMany({}),
  prisma.accountsPayable.deleteMany({}),
  prisma.deliveryItem.deleteMany({}),
  prisma.delivery.deleteMany({}),
  prisma.consumptionItem.deleteMany({}),
  prisma.consumptionLog.deleteMany({}),
  prisma.returnItem.deleteMany({}),
  prisma.materialReturn.deleteMany({}),
  prisma.issuanceItem.deleteMany({}),
  prisma.materialIssuance.deleteMany({}),
  prisma.expenseApprovalLog.deleteMany({}),
  prisma.expenseAIValidation.deleteMany({}),
  prisma.expenseProofFile.deleteMany({}),
  prisma.expenseBreakdownItem.deleteMany({}),
  prisma.pettyCashExpense.deleteMany({}),
  prisma.pettyCashReplenishment.deleteMany({}),
  prisma.expense.deleteMany({}),
  prisma.pettyCashAccount.deleteMany({}),
  prisma.subcontractBilling.deleteMany({}),
  prisma.subcontractAccomplishment.deleteMany({}),
  prisma.jobOrder.deleteMany({}),
  prisma.subcontractorBOQItem.deleteMany({}),
  prisma.programOfWorks.deleteMany({}),
  prisma.subcontractPackage.deleteMany({}),
  prisma.backCharge.deleteMany({}),
  prisma.accomplishmentRecord.deleteMany({}),
  prisma.paymentRecord.deleteMany({}),
  prisma.paymentFallbackRecommendation.deleteMany({}),
  prisma.paymentException.deleteMany({}),
  prisma.paymentBatchRow.deleteMany({}),
  prisma.paymentBatch.deleteMany({}),
  prisma.payrollFundingRequest.deleteMany({}),
  prisma.payrollApproval.deleteMany({}),
  prisma.deductionLog.deleteMany({}),
  prisma.deductionLedger.deleteMany({}),
  prisma.payrollDeduction.deleteMany({}),
  prisma.payrollEarning.deleteMany({}),
  prisma.allowance.deleteMany({}),
  prisma.payroll.deleteMany({}),
  prisma.dailyTimeRecord.deleteMany({}),
  prisma.workerDocument.deleteMany({}),
  prisma.payrollPeriod.deleteMany({}),
  prisma.worker.deleteMany({}),
  prisma.projectAccomplishmentAIFinding.deleteMany({}),
  prisma.projectAccomplishmentFileVersion.deleteMany({}),
  prisma.projectAccomplishmentFile.deleteMany({}),
  prisma.bOQLotBreakdown.deleteMany({}),
  prisma.accomplishmentItem.deleteMany({}),
  prisma.accomplishment.deleteMany({}),
  prisma.inspection.deleteMany({}),
  prisma.billingDeduction.deleteMany({}),
  prisma.billingItem.deleteMany({}),
  prisma.billing.deleteMany({}),
  prisma.payment.deleteMany({}),
  prisma.aIVariationOrderValidation.deleteMany({}),
  prisma.variationOrderDocument.deleteMany({}),
  prisma.variationOrderApproval.deleteMany({}),
  prisma.variationOrderItem.deleteMany({}),
  prisma.variationOrder.deleteMany({}),
  prisma.evidenceFile.deleteMany({}),
  prisma.projectCamera.deleteMany({}),
  prisma.liveCameraSnapshot.deleteMany({}),
  prisma.bOQMapping.deleteMany({}),
  prisma.awardedBOQItem.deleteMany({}),
  prisma.consolidatedBOQItem.deleteMany({}),
  prisma.project.deleteMany({}),
  prisma.supplier.deleteMany({}),
  prisma.subcontractor.deleteMany({})
]);

    await prisma.$transaction(async (tx) => {
      // --- PHASE 1: Logs, AI Results, Activity Tracking ---
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      

      // --- PHASE 2: Transaction Workflows & Locks ---
      
      
      

      // --- PHASE 3: Canvassing & Procurement ---
      
      
      
      
      
      
      
      

      // --- PHASE 4: Delivery, Inventory & Equipment ---
      
      
      
      
      
      

      
      
      
      
      
      
      
      
      

      // --- PHASE 5: Expenses & Petty Cash ---
      
      
      
      
      
      
      
      

      // --- PHASE 6: Subcontracting ---
      
      
      
      
      
      
      
      
      

      // --- PHASE 7: Payments & Banking Transactions ---
      
      
      
      
      

      // --- PHASE 8: Payroll & HR (ALL workers deleted per user instruction) ---
      
      
      
      
      
      
      
      
      
      
        // Workers are wiped — admin can re-add manually

      // --- PHASE 9: Accomplishments, Billings, Variation Orders ---
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      

      // --- PHASE 10: Documents & Evidence ---
      
      
      

      // --- PHASE 11: Core Master Data (Projects, BOQs, Suppliers, Subcontractors) ---
      
      
      
      
      
      

      // --- PHASE 12: Seed Reference Data (Requested by User) ---
      await tx.worker.createMany({
        data: [
          { firstName: 'Sample', lastName: 'Foreman', designation: 'Foreman', workerCategory: 'SKILLED', dailyRate: 800 },
          { firstName: 'Sample', lastName: 'Mason', designation: 'Mason', workerCategory: 'SKILLED', dailyRate: 650 },
          { firstName: 'Sample', lastName: 'Carpenter', designation: 'Carpenter', workerCategory: 'SKILLED', dailyRate: 650 },
          { firstName: 'Sample', lastName: 'Helper 1', designation: 'Helper', workerCategory: 'UNSKILLED', dailyRate: 500 },
          { firstName: 'Sample', lastName: 'Helper 2', designation: 'Helper', workerCategory: 'UNSKILLED', dailyRate: 500 }
        ]
      });

      await tx.subcontractor.createMany({
        data: [
          { name: 'Sample Steel Works Subcon', businessType: 'CORPORATION', contactPerson: 'Juan Dela Cruz' },
          { name: 'Sample Painting Subcon', businessType: 'CORPORATION', contactPerson: 'Pedro Penduko' },
          { name: 'Sample Electrical Subcon', businessType: 'CORPORATION', contactPerson: 'John Doe' },
          { name: 'Sample Plumbing Subcon', businessType: 'CORPORATION', contactPerson: 'Jane Doe' },
          { name: 'Sample Tile Works Subcon', businessType: 'CORPORATION', contactPerson: 'Mario Rossi' }
        ]
      });

      await tx.supplier.createMany({
        data: [
          { name: 'Sample Hardware Supplier', contactPerson: 'Supplier Contact 1' },
          { name: 'Sample Cement Supplier', contactPerson: 'Supplier Contact 2' },
          { name: 'Sample Electrical Supplier', contactPerson: 'Supplier Contact 3' },
          { name: 'Sample Lumber Supplier', contactPerson: 'Supplier Contact 4' },
          { name: 'Sample Paints Supplier', contactPerson: 'Supplier Contact 5' }
        ]
      });

      const rolesToSeed = [
        { email: 'sample.purchasing@onesystemserp.com', name: 'Sample Purchasing', roleCode: 'PURCHASING_OFFICER' },
        { email: 'sample.finance@onesystemserp.com', name: 'Sample Finance', roleCode: 'FINANCE_OFFICER' },
        { email: 'sample.accounting@onesystemserp.com', name: 'Sample Accounting', roleCode: 'ACCOUNTING_OFFICER' },
        { email: 'sample.billing@onesystemserp.com', name: 'Sample Billing', roleCode: 'BILLING_OFFICER' },
        { email: 'sample.engineer@onesystemserp.com', name: 'Sample Site Engineer', roleCode: 'SITE_ENGINEER' }
      ];

      for (const u of rolesToSeed) {
        let user = await tx.user.findFirst({ where: { email: u.email } });
        if (!user) {
          user = await tx.user.create({
            data: {
              name: u.name,
              email: u.email,
              passwordHash: '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
              status: 'ACTIVE',
              defaultRole: u.roleCode
            }
          });
        }
        const roleRecord = await tx.role.findFirst({ where: { roleCode: u.roleCode } });
        if (roleRecord) {
          const existingUserRole = await tx.userRole.findFirst({
            where: { userId: user.id, roleId: roleRecord.id }
          });
          if (!existingUserRole) {
            await tx.userRole.create({
              data: { userId: user.id, roleId: roleRecord.id }
            });
          }
        }
      }

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
          user: { connect: { id: currentUser ? currentUser.id : "system" } },
          remarks: 'MASTER RESET: All transactional and master data wiped. Only Users, System Roles, Access Matrix, and Knowledge Base preserved.',
          moduleName: 'SYSTEM_SETTINGS',
          actionType: 'DELETE'
        }
      });
    }, {
      timeout: 60000 // Allow up to 60s for the transaction
    });

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to reset transaction data (proxy):', error);
    return { success: false, error: error.message };
  }
}

export async function getCurrentUserRole() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;
    const simulatedRole = cookieStore.get('simulatedRole')?.value;
    
    // Fast path: if UI role is simulated, return it immediately for the UI to adapt
    if (simulatedRole) {
      return simulatedRole;
    }

    // Direct database check instead of relying on external AWS proxy which fails on Vercel
    if (!sessionId) {
      return null;
    }

    const currentUser = await prisma.user.findUnique({ where: { id: sessionId }});
    
    // Emergency empty state override
    if (!currentUser) {
      const userCount = await prisma.user.count();
      if (userCount === 0) return 'SUPER_ADMIN';
    }

    return currentUser?.role || null;
  } catch (e: any) {
    console.error('Failed to get current user role (Prisma direct):', e);
    return null;
  }
}
