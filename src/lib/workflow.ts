import { prisma } from '@/lib/prisma';
import { requirePermission } from './permissions';

export async function submitTransaction(
  userId: string, 
  userRole: string, 
  moduleName: string, 
  transactionId: string
) {
  await requirePermission(userId, moduleName, 'canSubmit');

  await prisma.transactionWorkflow.upsert({
    where: {
      id: `${moduleName}_${transactionId}` // using a composite-like ID for upsert or rely on composite index
    },
    update: {
      currentStatus: 'SUBMITTED',
      currentStage: 'REVIEW',
      preparedBy: userId,
      preparedByRole: userRole,
      datePrepared: new Date()
    },
    create: {
      id: `${moduleName}_${transactionId}`,
      moduleName,
      transactionId,
      preparedBy: userId,
      preparedByRole: userRole,
      currentStatus: 'SUBMITTED',
      currentStage: 'REVIEW',
      datePrepared: new Date()
    }
  });

  await logAudit(userId, userRole, moduleName, transactionId, 'SUBMIT', 'DRAFT', 'SUBMITTED');
}

export async function approveTransaction(
  userId: string,
  userRole: string,
  moduleName: string,
  transactionId: string,
  remarks?: string
) {
  await requirePermission(userId, moduleName, 'canApprove');

  let workflow = await prisma.transactionWorkflow.findFirst({
    where: { moduleName, transactionId }
  });

  if (!workflow) {
    // Dynamically create the workflow if it doesn't exist
    workflow = await prisma.transactionWorkflow.create({
      data: {
        id: `${moduleName}_${transactionId}`,
        moduleName,
        transactionId,
        preparedBy: userId, // fallback
        preparedByRole: userRole,
        currentStatus: 'SUBMITTED',
        currentStage: 'REVIEW',
        datePrepared: new Date()
      }
    });
  }
  
  // Maker-Checker-Approver Rules
  if (workflow.preparedBy === userId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
    throw new Error("Self-approval is strictly prohibited by system rules.");
  }

  await prisma.transactionWorkflow.update({
    where: { id: workflow.id },
    data: {
      currentStatus: 'APPROVED',
      currentStage: 'PAYMENT_PROCESSING', // Or LOCKED, depending on module
      approvedBy: userId,
      approvedByRole: userRole,
      dateApproved: new Date(),
      remarks
    }
  });

  await logAudit(userId, userRole, moduleName, transactionId, 'APPROVE', workflow.currentStatus, 'APPROVED', remarks);
  
  // Optionally auto-lock approved records if payment is not required
  // await lockRecord(userId, moduleName, transactionId, "Auto-locked upon approval");
}

export async function logAudit(
  userId: string | null,
  userRole: string | null,
  moduleName: string,
  transactionId: string,
  actionType: string,
  oldValue?: string,
  newValue?: string,
  remarks?: string
) {
  await prisma.auditLog.create({
    data: {
      userId,
      userRole,
      moduleName,
      transactionId,
      actionType,
      oldValue,
      newValue,
      remarks
    }
  });
}

export async function lockRecord(
  userId: string,
  moduleName: string,
  transactionId: string,
  reason?: string
) {
  await requirePermission(userId, moduleName, 'canLock');

  await prisma.lockedRecord.upsert({
    where: {
      moduleName_transactionId: {
        moduleName,
        transactionId
      }
    },
    update: {
      lockedBy: userId,
      lockedAt: new Date(),
      reason
    },
    create: {
      moduleName,
      transactionId,
      lockedBy: userId,
      reason
    }
  });
  
  await logAudit(userId, null, moduleName, transactionId, 'LOCK_RECORD', undefined, 'LOCKED', reason);
}
