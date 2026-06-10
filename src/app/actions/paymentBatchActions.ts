'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function generatePaymentBatch(periodId: string, paymentMethodType: string, payrollBankAccountId: string, userId: string) {
  try {
    const period = await prisma.payrollPeriod.findUnique({
      where: { id: periodId },
      include: {
        payrolls: {
          where: {
            worker: {
              allowedPaymentMethod: paymentMethodType === 'GCASH' ? 'GCash Only' : 'Bank Transfer Only'
            },
            paymentStatus: { in: ['PENDING', 'UNPAID'] } // Assuming 'PENDING' or 'UNPAID'
          },
          include: { worker: true }
        }
      }
    });

    if (!period) throw new Error('Payroll period not found');
    if (!period.isLocked) throw new Error('Payroll must be locked to generate batches');
    if (period.payrolls.length === 0) throw new Error(`No eligible unpaid payslips found for ${paymentMethodType}`);

    // Create the Batch
    const batchNumber = `BAT-${paymentMethodType}-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const totalAmount = period.payrolls.reduce((sum, p) => sum + p.netPay, 0);

    const account = await prisma.payrollBankAccount.findUnique({ where: { id: payrollBankAccountId } });
    if (!account) throw new Error('Funding account not found');

    if (account.currentAvailableBalance < totalAmount) {
      const shortage = totalAmount - account.currentAvailableBalance;
      return { success: false, error: 'Insufficient funds', shortage };
    }

    // Wrap batch creation and balance reserve in a transaction
    const [batch] = await prisma.$transaction([
      prisma.paymentBatch.create({
      data: {
        batchNumber,
        payrollPeriodId: periodId,
        paymentMethodType,
        payrollBankAccountId,
        status: 'DRAFT',
        totalAmount,
        totalWorkers: period.payrolls.length,
        preparedById: userId,
        rows: {
          create: period.payrolls.map(p => ({
            payrollId: p.id,
            workerId: p.workerId,
            amount: p.netPay,
            status: 'PENDING'
          }))
        }
      }
      }),
      prisma.payrollBankAccount.update({
        where: { id: account.id },
        data: {
          currentAvailableBalance: { decrement: totalAmount },
          reservedPayrollBalance: { increment: totalAmount }
        }
      })
    ]);

    // Update the payrolls to link to the batch (optional but good for tracking)
    // Actually the `paymentBatchId` is on `Payroll`, wait, wait. 
    // In schema I added `paymentBatchRows PaymentBatchRow[]` to Payroll, so it's linked via `PaymentBatchRow`.
    
    // BUT I also have `paymentBatchId` on `Payroll`!
    await prisma.payroll.updateMany({
      where: { id: { in: period.payrolls.map(p => p.id) } },
      data: { paymentBatchId: batch.id }
    });

    revalidatePath(`/payroll/${periodId}`);
    return { success: true, batchId: batch.id };
  } catch (error: any) {
    console.error('Error generating payment batch:', error);
    return { success: false, error: error.message };
  }
}
