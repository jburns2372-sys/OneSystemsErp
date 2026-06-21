'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/permissions';
import { submitTransaction, approveTransaction } from '@/lib/workflow';

export async function createFundingRequest(periodId: string, destinationAccountId: string, userId: string) {
  try {
    const currentUser = await prisma.user.findFirst();
    if (currentUser) {
      await requirePermission(currentUser.id, 'PAYROLL', 'canSubmit');
    }

    const period = await prisma.payrollPeriod.findUnique({
      where: { id: periodId },
      include: { payrolls: true }
    });

    if (!period) throw new Error('Payroll period not found');
    if (!period.isLocked) throw new Error('Payroll must be locked before requesting funding');

    const totalNetPay = period.payrolls.reduce((sum, p) => sum + p.netPay, 0);
    // Rough estimate for transfer charges
    const estimatedCharges = 500; 
    const totalRequiredFunding = totalNetPay + estimatedCharges;

    const account = await prisma.payrollBankAccount.findUnique({
      where: { id: destinationAccountId }
    });

    if (!account) throw new Error('Destination account not found');

    const availablePayrollBalance = account.currentAvailableBalance;
    const fundingShortage = Math.max(0, totalRequiredFunding - availablePayrollBalance);

    const fundingRequestNumber = `FR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    const request = await prisma.payrollFundingRequest.create({
      data: {
        fundingRequestNumber,
        payrollPeriodId: periodId,
        destinationAccountId,
        totalNetPay,
        estimatedCharges,
        totalRequiredFunding,
        availablePayrollBalance,
        fundingShortage,
        preparedById: userId,
        fundingStatus: 'PENDING'
      }
    });

    if (currentUser) {
      await submitTransaction(currentUser.id, 'HR_OFFICER', 'PAYROLL', request.id);
    }

    revalidatePath(`/payroll/${periodId}`);
    return { success: true, requestId: request.id };
  } catch (error: any) {
    console.error('Error creating funding request:', error);
    return { success: false, error: error.message };
  }
}

export async function approveFundingRequest(requestId: string, userId: string) {
  try {
    const request = await prisma.payrollFundingRequest.findUnique({
      where: { id: requestId },
      include: { destinationAccount: true }
    });

    if (!request) throw new Error('Funding request not found');

    const currentUser = await prisma.user.findFirst();
    if (currentUser) {
      await requirePermission(currentUser.id, 'PAYROLL', 'canApprove');
      
      // Enforce Maker-Checker
      if (request.preparedById === userId && currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
        throw new Error('Self-approval is strictly prohibited. The Maker cannot be the Approver.');
      }
      
      await approveTransaction(currentUser.id, 'PROJECT_MANAGER', 'PAYROLL', request.id, 'Approved Payroll Funding');
    }

    // Update account balance
    await prisma.payrollBankAccount.update({
      where: { id: request.destinationAccountId },
      data: {
        currentAvailableBalance: { increment: request.totalRequiredFunding },
        reservedPayrollBalance: { increment: request.totalRequiredFunding }
      }
    });

    // Create Ledger
    await prisma.payrollBankLedger.create({
      data: {
        payrollBankAccountId: request.destinationAccountId,
        transactionType: 'FUNDING',
        amount: request.totalRequiredFunding,
        balanceAfter: request.destinationAccount.currentAvailableBalance + request.totalRequiredFunding,
        referenceId: request.id,
        referenceNumber: request.fundingRequestNumber,
        remarks: 'Funding Approved & Transferred',
        createdById: userId
      }
    });

    // Update Request
    await prisma.payrollFundingRequest.update({
      where: { id: requestId },
      data: {
        fundingStatus: 'FUNDED',
        approvedById: userId,
        dateFunded: new Date()
      }
    });

    revalidatePath(`/payroll/${request.payrollPeriodId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error approving funding request:', error);
    return { success: false, error: error.message };
  }
}
