'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { validateTransactionWithAI } from './aiValidationActions';

export async function createPettyCashAccount(data: {
  accountName: string;
  department?: string;
  fundLimit: number;
  replenishmentTrigger?: number;
  projectId?: string;
  custodianId: string;
  approverId?: string;
  reviewerId?: string;
}) {
  try {
    const account = await prisma.pettyCashAccount.create({
      data: {
        accountName: data.accountName,
        department: data.department || null,
        fundLimit: data.fundLimit,
        replenishmentTrigger: data.replenishmentTrigger || null,
        currentBalance: data.fundLimit, // Initial balance is the full limit
        projectId: data.projectId || null,
        custodianId: data.custodianId,
        approverId: data.approverId || null,
        reviewerId: data.reviewerId || null,
      }
    });
    revalidatePath('/petty-cash');
    return { success: true, account };
  } catch (error: any) {
    console.error('Error creating PC account:', error);
    return { success: false, error: error.message };
  }
}

export async function updatePettyCashAccount(id: string, data: {
  accountName: string;
  fundLimit: number;
  projectId?: string;
  custodianId: string;
}) {
  try {
    const account = await prisma.pettyCashAccount.update({
      where: { id },
      data: {
        accountName: data.accountName,
        fundLimit: data.fundLimit,
        projectId: data.projectId || null,
        custodianId: data.custodianId,
      }
    });
    revalidatePath('/petty-cash');
    return { success: true, account };
  } catch (error: any) {
    console.error('Error updating PC account:', error);
    return { success: false, error: error.message };
  }
}

export async function logPettyCashExpense(data: {
  accountId: string;
  date: Date;
  payee: string;
  purpose: string;
  category: string;
  amount: number;
  isVat: boolean;
  netAmount: number;
  vatAmount: number;
  billingEligibility: string;
  receiptNumber?: string;
  attachmentUrl?: string;
  isNoReceipt: boolean;
  remarks?: string;
  // If it should sync to Expense
  createGeneralExpense?: boolean;
  projectId?: string;
  issuedById?: string;
}) {
  try {
    // === AI VALIDATION INTERCEPTOR ===
    const validation = await validateTransactionWithAI(
      'Expense Ledger', // using Expense Ledger since policies usually cover all expenses
      {
        action: 'Log Petty Cash Expense',
        payee: data.payee,
        purpose: data.purpose,
        category: data.category,
        amount: data.amount,
        hasReceipt: !data.isNoReceipt
      },
      data.issuedById || 'unknown',
      'USER' // Default role for now
    );

    if (validation.validationStatus === 'BLOCKING ISSUE') {
      return { 
        success: false, 
        error: `AI Blocked Transaction: ${validation.findings}`,
        validationLogId: validation.validationLogId 
      };
    }
    // =================================

    await prisma.$transaction(async (tx) => {
      // 1. Get the account and check balance
      const account = await tx.pettyCashAccount.findUnique({ where: { id: data.accountId } });
      if (!account) throw new Error('Account not found');
      if (account.currentBalance < data.amount) throw new Error('Insufficient petty cash balance');

      // 2. Optional: Create General Expense entry if billable to project
      let generalExpenseId = null;
      if (data.createGeneralExpense && data.projectId && data.issuedById) {
        const genExp = await tx.expense.create({
          data: {
            project: { connect: { id: data.projectId } },
            receiptRef: `PC-${Date.now()}`,
            date: data.date,
            category: data.category,
            description: data.purpose,
            loggedBy: { connect: { id: data.issuedById } },
            supplierName: data.payee,
            netAmount: data.netAmount,
            vatAmount: data.vatAmount,
            amount: data.amount,
            isAccrued: false,
            breakdownItems: {
              create: [{
                description: data.purpose,
                quantity: 1,
                unit: 'lot',
                unitCost: data.netAmount,
                totalCost: data.netAmount,
                supplierName: data.payee
              }]
            }
          }
        });
        generalExpenseId = genExp.id;
      }

      // 3. Create Petty Cash Expense
      const pcExpense = await tx.pettyCashExpense.create({
        data: {
          account: { connect: { id: data.accountId } },
          date: data.date,
          payee: data.payee,
          purpose: data.purpose,
          category: data.category,
          amount: data.amount,
          isVat: data.isVat,
          netAmount: data.netAmount,
          vatAmount: data.vatAmount,
          billingEligibility: data.billingEligibility,
          receiptNumber: data.receiptNumber || null,
          attachmentUrl: data.attachmentUrl || null,
          isNoReceipt: data.isNoReceipt,
          remarks: data.remarks || null,
          status: 'PENDING',
          ...(generalExpenseId ? { expense: { connect: { id: generalExpenseId } } } : {})
        }
      });

      // 4. Update Account Balance
      await tx.pettyCashAccount.update({
        where: { id: data.accountId },
        data: { currentBalance: { decrement: data.amount } }
      });
    });

    revalidatePath(`/petty-cash/${data.accountId}`, 'page');
    return { success: true };
  } catch (error: any) {
    console.error('Error logging PC expense:', error);
    return { success: false, error: error.message };
  }
}

export async function createPettyCashReplenishment(accountId: string, expenseIds: string[]) {
  try {
    return await prisma.$transaction(async (tx) => {
      const account = await tx.pettyCashAccount.findUnique({ where: { id: accountId } });
      if (!account) throw new Error('Account not found');

      // Verify all expenses are valid and PENDING
      const expenses = await tx.pettyCashExpense.findMany({
        where: {
          id: { in: expenseIds },
          accountId: accountId,
          status: 'PENDING',
          replenishmentId: null
        }
      });

      if (expenses.length !== expenseIds.length) {
        throw new Error('Some expenses are invalid or already replenished.');
      }

      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

      // Create the Replenishment Request
      const req = await tx.pettyCashReplenishment.create({
        data: {
          accountId,
          requestNumber: `PCR-${Date.now()}`,
          status: 'DRAFT',
          fundLimit: account.fundLimit,
          beginningBalance: account.fundLimit, // Typically it's replenished back to fund limit
          totalExpenses: totalExpenses,
          cashOnHand: account.currentBalance,
          amountRequested: totalExpenses, // Usually request exactly what was spent
        }
      });

      // Link expenses to this replenishment
      await tx.pettyCashExpense.updateMany({
        where: { id: { in: expenseIds } },
        data: { replenishmentId: req.id }
      });

      return { success: true, req };
    });
  } catch (error: any) {
    console.error('Error creating PC replenishment:', error);
    return { success: false, error: error.message };
  }
}

export async function submitPettyCashReplenishment(id: string) {
  try {
    await prisma.pettyCashReplenishment.update({
      where: { id },
      data: { status: 'SUBMITTED' }
    });
    revalidatePath('/petty-cash');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function processPettyCashReplenishment(
  id: string, 
  action: 'APPROVE' | 'REJECT', 
  reviewerRemarks?: string,
  approverId?: string
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const req = await tx.pettyCashReplenishment.findUnique({ where: { id } });
      if (!req) throw new Error('Request not found');

      const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      
      const updated = await tx.pettyCashReplenishment.update({
        where: { id },
        data: {
          status,
          reviewerAction: action,
          reviewerRemarks: reviewerRemarks || null,
          approverId: approverId || null,
          approvalDate: action === 'APPROVE' ? new Date() : null,
        }
      });

      // If rejected, unlink the expenses so they can be grouped again
      if (action === 'REJECT') {
        await tx.pettyCashExpense.updateMany({
          where: { replenishmentId: id },
          data: { replenishmentId: null, status: 'PENDING' }
        });
      }

      return { success: true, req: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function releasePettyCashReplenishment(
  id: string,
  releaseMode: string,
  releaseRefNo: string,
  receiverId: string
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const req = await tx.pettyCashReplenishment.findUnique({ 
        where: { id },
        include: { account: true, expenses: true }
      });
      if (!req || req.status !== 'APPROVED') throw new Error('Request not found or not approved');

      // Update request to RELEASED and CLOSED
      const updated = await tx.pettyCashReplenishment.update({
        where: { id },
        data: {
          status: 'CLOSED',
          releaseDate: new Date(),
          releaseMode,
          releaseRefNo,
          receiverId
        }
      });

      // Mark all expenses as LIQUIDATED
      await tx.pettyCashExpense.updateMany({
        where: { replenishmentId: id },
        data: { status: 'LIQUIDATED' }
      });

      // Restore Account Balance
      await tx.pettyCashAccount.update({
        where: { id: req.accountId },
        data: { currentBalance: { increment: req.amountRequested } }
      });

      return { success: true, req: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
