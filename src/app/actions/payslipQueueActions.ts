'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function holdPayslip(payslipId: string, reason: string) {
  try {
    await prisma.payroll.update({
      where: { id: payslipId },
      data: {
        paymentStatus: 'ON_HOLD',
        paymentRemarks: reason
      }
    });

    revalidatePath('/finance/approved-payslips');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resolvePayslipException(payslipId: string) {
  try {
    await prisma.payroll.update({
      where: { id: payslipId },
      data: {
        paymentStatus: 'PENDING',
        paymentRemarks: 'Resolved'
      }
    });

    revalidatePath('/finance/approved-payslips');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
