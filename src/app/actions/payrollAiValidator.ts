'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function validatePayrollPreSubmission(periodId: string) {
  try {
    const period = await prisma.payrollPeriod.findUnique({
      where: { id: periodId },
      include: {
        payrolls: { include: { worker: true } }
      }
    });

    if (!period) throw new Error('Payroll period not found');
    if (period.payrolls.length === 0) throw new Error('No payrolls generated yet.');

    const criticalErrors: string[] = [];
    const warnings: string[] = [];

    for (const payroll of period.payrolls) {
      const name = `${payroll.worker.firstName} ${payroll.worker.lastName}`;
      
      // 1. Negative or Zero Net Pay
      if (payroll.netPay <= 0) {
        criticalErrors.push(`[${name}] Net Pay is zero or negative (₱${payroll.netPay}). Adjust deductions or allowances.`);
      }

      // 2. High Deductions (Philippine Labor Law generally limits deductions to prevent starvation wages, though not strictly 50%, it's a good flag)
      if (payroll.grossPay > 0 && (payroll.totalDeductions / payroll.grossPay) >= 0.6) {
        criticalErrors.push(`[${name}] Total deductions (₱${payroll.totalDeductions}) exceed 60% of Gross Pay (₱${payroll.grossPay}). This requires manual adjustment.`);
      }

      // 3. Extreme Overtime (OT Pay > Basic Pay)
      if (payroll.overtimePay > payroll.basicPay) {
        warnings.push(`[${name}] Unusual Overtime ratio. OT Pay (₱${payroll.overtimePay}) is higher than Basic Pay (₱${payroll.basicPay}). Verify DTR.`);
      }

      // 4. Missing Government Numbers but deducting
      if (payroll.sssDeduction > 0 && !payroll.worker.sssNumber) {
        warnings.push(`[${name}] SSS is being deducted but the worker has no SSS Number encoded in their profile.`);
      }
      if (payroll.philhealthDeduction > 0 && !payroll.worker.philHealthNumber) {
        warnings.push(`[${name}] PhilHealth is being deducted but the worker has no PhilHealth Number encoded.`);
      }
      if (payroll.pagibigDeduction > 0 && !payroll.worker.pagIbigNumber) {
        warnings.push(`[${name}] Pag-IBIG is being deducted but the worker has no Pag-IBIG Number encoded.`);
      }
    }

    return {
      success: true,
      canSubmit: criticalErrors.length === 0,
      criticalErrors,
      warnings
    };

  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to validate payroll.' };
  }
}

export async function submitPayrollForReview(periodId: string) {
  try {
    await prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { status: 'FOR_REVIEW' }
    });
    
    // Log Audit
    await prisma.payrollAuditLog.create({
      data: {
        actionType: 'PAYROLL_SUBMIT_REVIEW',
        module: 'PAYROLL',
        recordId: periodId,
        remarks: 'Payroll period submitted to Approver'
      }
    });

    revalidatePath(`/payroll/${periodId}`);
    revalidatePath(`/payroll`);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to submit payroll.' };
  }
}

export async function approveAndLockPayroll(periodId: string) {
  try {
    // Current user context (mocked for now)
    const currentUserId = 'clxw8xxvj0000vwu4xxw8xxvj';

    await prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { 
        status: 'APPROVED',
        isLocked: true,
        lockedAt: new Date(),
        lockedById: currentUserId
      }
    });
    
    // Log Audit
    await prisma.payrollAuditLog.create({
      data: {
        actionType: 'PAYROLL_APPROVED_LOCKED',
        module: 'PAYROLL',
        recordId: periodId,
        remarks: 'Payroll period approved and locked.'
      }
    });

    revalidatePath(`/payroll/${periodId}`);
    revalidatePath(`/payroll`);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to approve payroll.' };
  }
}
