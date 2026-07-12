'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60;

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
