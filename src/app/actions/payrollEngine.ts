'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * AI-Assisted Payroll Computation Engine
 */
export async function computePayrollForPeriod(payrollPeriodId: string) {
  try {
    const period = await prisma.payrollPeriod.findUnique({
      where: { id: payrollPeriodId },
      include: {
        dtrs: { include: { worker: true } },
        payrolls: true
      }
    });

    if (!period) throw new Error('Payroll period not found');

    const govSettings = await prisma.governmentSettings.findFirst() || {
      phEmployeeRate: 2.5,
      pagibigEmployeeRate: 2.0,
      deductionSchedule: 'SPLIT'
    } as any;

    // Map calendarRule to expected payrollCategory
    const categoryMap: Record<string, string> = {
      'WEEKLY': 'Weekly Salaried',
      'SEMI_MONTHLY': 'Semi-Monthly',
      'MONTHLY': 'Monthly'
    };
    const allowedCategory = categoryMap[period.calendarRule];

    // Filter out workers that shouldn't be in this cutoff
    const dtrsToProcess = period.dtrs.filter(dtr => {
      if (!dtr.worker.subjectToPayrollCutoff) return false;
      return true;
    });

    // Group DTRs by Worker
    const workerMap = new Map();
    for (const dtr of dtrsToProcess) {
      if (!workerMap.has(dtr.workerId)) {
        workerMap.set(dtr.workerId, {
          worker: dtr.worker,
          totalRegularHours: 0,
          totalOvertimeHours: 0,
          daysWorked: 0
        });
      }
      const data = workerMap.get(dtr.workerId);
      data.totalRegularHours += dtr.regularHours;
      data.totalOvertimeHours += dtr.overtimeHours;
      if (dtr.regularHours > 0) data.daysWorked += 1;
    }

    const payrollResults = [];

    for (const [workerId, data] of workerMap.entries()) {
      const worker = data.worker;
      let basicPay = 0;
      let overtimePay = 0;
      let retentionAmount = 0;

      // 1. Basic Pay Computation
      if (worker.rateType === 'MONTHLY_SALARY') {
        basicPay = worker.basicMonthlySalary / 2; // Assuming semi-monthly
        // Convert to hourly for OT
        const hourlyRate = (worker.basicMonthlySalary / 22) / (worker.standardWorkHours || 8);
        overtimePay = data.totalOvertimeHours * hourlyRate * 1.25; 
      } else if (worker.rateType === 'DAILY_RATE') {
        basicPay = worker.dailyRate * data.daysWorked;
        const hourlyRate = worker.dailyRate / (worker.standardWorkHours || 8);
        overtimePay = data.totalOvertimeHours * hourlyRate * 1.25;
      } else if (worker.rateType === 'HOURLY_RATE') {
        basicPay = worker.hourlyRate * data.totalRegularHours;
        overtimePay = data.totalOvertimeHours * worker.hourlyRate * 1.25;
      } else if (worker.rateType === 'PIECE_RATE') {
        // Fallback for simple calculation if DTR has no quantities
        basicPay = worker.pieceRate;
      } else if (worker.rateType === 'ONE_LOT') {
        // Typically paid based on milestone, fallback to full amount for now
        basicPay = worker.contractAmount;
        if (worker.retentionPercentage > 0) {
          retentionAmount = basicPay * (worker.retentionPercentage / 100);
          basicPay -= retentionAmount;
        }
      } else if (worker.rateType === 'PROFESSIONAL_FEE') {
        basicPay = worker.professionalFee;
      }

      // Fallback: If basicPay is still 0 but we have a daily rate and attendance, assume daily worker
      if (basicPay === 0 && worker.dailyRate > 0 && data.daysWorked > 0) {
        basicPay = worker.dailyRate * data.daysWorked;
        const hourlyRate = worker.dailyRate / (worker.standardWorkHours || 8);
        overtimePay = data.totalOvertimeHours * hourlyRate * 1.25;
      }

      let grossPay = basicPay + overtimePay;

      // 2. Government Deductions
      let sssDeduction = 0;
      let philHealthDeduction = 0;
      let pagIbigDeduction = 0;

      if (worker.sssDeductionEnabled) {
        // Simplified SSS Table look up (using a flat average deduction for the demo)
        sssDeduction = grossPay * 0.045; // 4.5% approx
      }
      
      if (worker.philHealthDeductionEnabled) {
        philHealthDeduction = grossPay * (govSettings.phEmployeeRate / 100);
      }

      if (worker.pagibigDeductionEnabled) {
        pagIbigDeduction = Math.min(grossPay * (govSettings.pagibigEmployeeRate / 100), 200); // Max 200/mo usually
      }

      // Schedule adjustments
      if (govSettings.deductionSchedule === 'SPLIT') {
        sssDeduction /= 2;
        philHealthDeduction /= 2;
        pagIbigDeduction /= 2;
      }

      // 3. Tax Computation
      let withholdingTax = 0;
      const taxableIncome = grossPay - (sssDeduction + philHealthDeduction + pagIbigDeduction);
      
      if (worker.withholdingTaxEnabled) {
        if (worker.withholdingTaxType === 'EXPANDED_WITHHOLDING_TAX' || worker.withholdingTaxRate > 0) {
          // Flat rate for consultants / one-lot
          withholdingTax = taxableIncome * ((worker.withholdingTaxRate || 0) / 100);
        } else if (taxableIncome > 10417) {
          // Standard TRAIN/CREATE compensation brackets
          if (taxableIncome >= 333333) {
            withholdingTax = 91770.70 + ((taxableIncome - 333333) * 0.35);
          } else if (taxableIncome >= 83333) {
            withholdingTax = 16770.70 + ((taxableIncome - 83333) * 0.30);
          } else if (taxableIncome >= 33333) {
            withholdingTax = 4270.70 + ((taxableIncome - 33333) * 0.25);
          } else if (taxableIncome >= 16667) {
            withholdingTax = 937.50 + ((taxableIncome - 16667) * 0.20);
          } else if (taxableIncome >= 10417) {
            withholdingTax = (taxableIncome - 10417) * 0.15;
          }
        }
      }

      // 4. Ledger Deductions (Loans & Cash Advances)
      const activeLedgers = await prisma.deductionLedger.findMany({
        where: { workerId: worker.id, status: 'ACTIVE' }
      });

      let cashAdvanceDeduction = 0;
      let loanDeduction = 0;

      for (const ledger of activeLedgers) {
        const deductAmount = Math.min(ledger.deductionPerPayroll, ledger.balance);
        if (ledger.type === 'CASH_ADVANCE') cashAdvanceDeduction += deductAmount;
        if (ledger.type === 'LOAN') loanDeduction += deductAmount;
      }

      const totalDeductions = sssDeduction + philHealthDeduction + pagIbigDeduction + withholdingTax + cashAdvanceDeduction + loanDeduction;
      const netPay = grossPay - totalDeductions;

      // 5. Payment Rule Validations
      let paymentStatus = 'PENDING';
      let paymentHoldReason = null;

      if (worker.payrollCategory === 'Weekly Salaried') {
        if (worker.allowedPaymentMethod !== 'GCash Only') {
          paymentStatus = 'EXCEPTION';
          paymentHoldReason = 'Weekly salaried workers must be paid through GCash only.';
        } else if (!worker.gcashNumber) {
          paymentStatus = 'ON_HOLD';
          paymentHoldReason = 'Missing GCash mobile number.';
        } else if (worker.gcashVerificationStatus !== 'Verified') {
          paymentStatus = 'ON_HOLD';
          paymentHoldReason = 'GCash profile is not verified.';
        }
      } else if (['Semi-Monthly', 'Monthly', '1-Lot Consultant', 'Freelance Consultant'].includes(worker.payrollCategory || '')) {
        if (worker.allowedPaymentMethod !== 'Bank Transfer Only') {
          paymentStatus = 'EXCEPTION';
          paymentHoldReason = `${worker.payrollCategory} workers must be paid through nominated bank account only.`;
        } else if (!worker.bankAccountNumber) {
          paymentStatus = 'ON_HOLD';
          paymentHoldReason = 'Missing bank account number.';
        } else if (worker.bankVerificationStatus !== 'Verified') {
          paymentStatus = 'ON_HOLD';
          paymentHoldReason = 'Bank account is not verified.';
        }
      }

      // Create or update the Payroll Record
      const existingPayroll = period.payrolls.find((p: any) => p.workerId === workerId);
      
      const payrollData = {
        payrollPeriodId: period.id,
        workerId: worker.id,
        daysWorked: data.daysWorked,
        regularHours: data.totalRegularHours,
        overtimeHours: data.totalOvertimeHours,
        basicPay,
        overtimePay,
        grossPay,
        taxableCompensation: taxableIncome > 0 ? taxableIncome : 0,
        sssDeduction,
        philhealthDeduction: philHealthDeduction,
        pagibigDeduction: pagIbigDeduction,
        withholdingTax,
        finalWithholdingTax: withholdingTax,
        cashAdvance: cashAdvanceDeduction,
        loanDeduction,
        totalDeductions,
        netPay,
        paymentMethod: worker.allowedPaymentMethod,
        paymentStatus,
        paymentHoldReason: paymentHoldReason || undefined
      };

      if (existingPayroll) {
        await prisma.payroll.update({ where: { id: existingPayroll.id }, data: payrollData });
      } else {
        await prisma.payroll.create({ data: payrollData });
      }

      payrollResults.push(payrollData);
    }

    // Clean up payroll records for workers with no attendance
    const computedWorkerIds = Array.from(workerMap.keys());
    await prisma.payroll.deleteMany({
      where: {
        payrollPeriodId: period.id,
        workerId: {
          notIn: computedWorkerIds
        }
      }
    });

    revalidatePath(`/payroll/${payrollPeriodId}`);
    return { success: true, count: payrollResults.length };
  } catch (error: any) {
    console.error('Computation error:', error);
    return { success: false, error: error.message || 'Failed to compute payroll' };
  }
}

export async function deletePayrollPeriod(periodId: string) {
  try {
    const period = await prisma.payrollPeriod.findUnique({
      where: { id: periodId }
    });
    
    if (!period) throw new Error('Period not found');
    if (period.status !== 'DRAFT') throw new Error('Only DRAFT periods can be deleted');

    await prisma.dailyTimeRecord.deleteMany({
      where: { payrollPeriodId: periodId }
    });

    await prisma.payroll.deleteMany({
      where: { payrollPeriodId: periodId }
    });

    await prisma.payrollPeriod.delete({
      where: { id: periodId }
    });

    revalidatePath('/payroll');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete period' };
  }
}


export async function saveCutoffSetting(data: any) {
  try {
    if (data.id) {
      await prisma.payrollCutoffSetting.update({
        where: { id: data.id },
        data
      });
    } else {
      await prisma.payrollCutoffSetting.create({ data });
    }
    revalidatePath('/payroll/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCutoffSetting(id: string) {
  try {
    await prisma.payrollCutoffSetting.delete({ where: { id } });
    revalidatePath('/payroll/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
