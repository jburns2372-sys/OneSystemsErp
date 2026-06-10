'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Mock reconciliation that simulates updating batch rows based on a file upload
export async function reconcileBatch(batchId: string, results: { payslipId: string, status: string, reference?: string }[], userId: string) {
  try {
    const batch = await prisma.paymentBatch.findUnique({
      where: { id: batchId },
      include: { rows: true }
    });

    if (!batch) throw new Error('Batch not found');

    // Simulate applying results
    for (const result of results) {
      const row = batch.rows.find(r => r.payrollId === result.payslipId);
      if (row) {
        await prisma.paymentBatchRow.update({
          where: { id: row.id },
          data: {
            status: result.status,
            transactionReference: result.reference || null,
            reconciledAt: new Date()
          }
        });

        // Update Payroll status
        await prisma.payroll.update({
          where: { id: row.payrollId },
          data: { 
            paymentStatus: result.status === 'SUCCESSFUL' ? 'PAID' : 'FAILED',
            transactionReference: result.reference || null
          }
        });
      }
    }

    // Check if entire batch is complete
    const updatedRows = await prisma.paymentBatchRow.findMany({ where: { paymentBatchId: batchId } });
    const allProcessed = updatedRows.every(r => r.status === 'SUCCESSFUL' || r.status === 'FAILED');
    
    if (allProcessed) {
      await prisma.paymentBatch.update({
        where: { id: batchId },
        data: { status: 'RELEASED', dateReleased: new Date(), releasedById: userId }
      });
    }

    revalidatePath(`/payroll`);
    return { success: true };
  } catch (error: any) {
    console.error('Error reconciling batch:', error);
    return { success: false, error: error.message };
  }
}
