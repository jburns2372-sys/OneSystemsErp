'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createFundingRequest(accountId: string, amount: number, reason: string, userId: string, periodId?: string) {
  try {
    const reqNumber = `FR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    let actualPeriodId = periodId;
    if (!actualPeriodId) {
       const recentPeriod = await prisma.payrollPeriod.findFirst();
       actualPeriodId = recentPeriod?.id || '';
    }

    await prisma.payrollFundingRequest.create({
      data: {
        fundingRequestNumber: reqNumber,
        destinationAccountId: accountId,
        totalNetPay: amount,
        estimatedCharges: 0,
        totalRequiredFunding: amount,
        availablePayrollBalance: 0,
        fundingShortage: amount,
        fundingStatus: 'PENDING',
        remarks: reason,
        preparedById: userId,
        payrollPeriodId: actualPeriodId
      }
    });

    revalidatePath(`/finance/payroll-accounts/${accountId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveFundingRequest(requestId: string) {
  try {
    const request = await prisma.payrollFundingRequest.findUnique({ where: { id: requestId } });
    if (!request || request.fundingStatus !== 'PENDING') throw new Error('Invalid or already processed request');

    const account = await prisma.payrollBankAccount.findUnique({ where: { id: request.destinationAccountId } });
    if (!account) throw new Error('Account not found');

    const newBalance = account.currentAvailableBalance + request.totalRequiredFunding;

    // Use transaction to ensure data integrity
    await prisma.$transaction([
      prisma.payrollFundingRequest.update({
        where: { id: requestId },
        data: { fundingStatus: 'APPROVED' }
      }),
      prisma.payrollBankAccount.update({
        where: { id: account.id },
        data: { currentAvailableBalance: newBalance }
      }),
      prisma.payrollBankLedger.create({
        data: {
          payrollBankAccountId: account.id,
          transactionType: 'DEPOSIT',
          amount: request.totalRequiredFunding,
          balanceAfter: newBalance,
          remarks: `Funding Deposit (Req: ${request.fundingRequestNumber})`,
          referenceId: request.id,
          createdById: 'system'
        }
      })
    ]);

    revalidatePath(`/finance/payroll-accounts/${account.id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
