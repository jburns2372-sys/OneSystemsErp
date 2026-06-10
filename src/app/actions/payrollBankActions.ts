'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createPayrollAccount(data: any, userId: string) {
  try {
    const account = await prisma.payrollBankAccount.create({
      data: {
        bankName: data.bankName,
        bankBranch: data.bankBranch,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        currency: data.currency,
        beginningBalance: data.beginningBalance,
        currentAvailableBalance: data.beginningBalance,
        createdById: userId,
        status: 'ACTIVE'
      }
    });

    // Create opening ledger entry
    if (data.beginningBalance > 0) {
      await prisma.payrollBankLedger.create({
        data: {
          payrollBankAccountId: account.id,
          transactionType: 'DEPOSIT',
          amount: data.beginningBalance,
          balanceAfter: data.beginningBalance,
          remarks: 'Opening Balance',
          createdById: userId
        }
      });
    }

    revalidatePath('/finance/payroll-accounts');
    return { success: true, accountId: account.id };
  } catch (error: any) {
    console.error('Error creating payroll account:', error);
    return { success: false, error: error.message };
  }
}
