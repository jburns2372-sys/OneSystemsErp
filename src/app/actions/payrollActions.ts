'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { validateTransactionWithAI } from './aiValidationActions';
import { logAudit } from '@/lib/workflow';

export async function createPayrollPeriod(data: any, userId: string) {
  try {
    const { month, year, calendarRule, periodType, startDate, endDate, payrollDate, projectId, notes } = data;

    // Check if period already exists
    const existing = await prisma.payrollPeriod.findFirst({
      where: { 
        month: Number(month), 
        year: Number(year), 
        calendarRule,
        periodType,
        projectId: projectId || null
      }
    });

    if (existing) {
      throw new Error(`A payroll period for ${periodType} of ${month}/${year} already exists.`);
    }

    // === AI VALIDATION INTERCEPTOR ===
    const validation = await validateTransactionWithAI(
      'Payroll Generation',
      {
        action: 'Create New Payroll Period',
        month,
        year,
        calendarRule,
        periodType,
        startDate,
        endDate
      },
      userId,
      'USER' // Need actual user session role ideally, defaulting for now
    );

    if (validation.validationStatus === 'BLOCKING ISSUE') {
      return { 
        success: false, 
        error: `AI Blocked Transaction: ${validation.findings}`,
        validationLogId: validation.validationLogId 
      };
    }
    // =================================

    // Generate Batch Number
    const typeCode = periodType.replace('_', '').substring(0, 4);
    const projCode = projectId ? '-PROJ' : '';
    const batchNumber = `PAY-${year}-${String(month).padStart(2, '0')}-${typeCode}${projCode}-${Math.floor(Math.random() * 1000)}`;

    const period = await prisma.payrollPeriod.create({
      data: {
        payrollBatchNumber: batchNumber,
        month: Number(month),
        year: Number(year),
        calendarRule,
        periodType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        payrollDate: new Date(payrollDate),
        projectId: projectId || null,
        notes: notes || null,
        status: 'DRAFT',
        createdById: userId
      }
    });

    // Map calendarRule to expected payrollCategory
    const categoryMap: Record<string, string> = {
      'WEEKLY': 'Weekly Salaried',
      'SEMI_MONTHLY': 'Semi-Monthly',
      'MONTHLY': 'Monthly'
    };

    const workerFilter: any = {};
    if (projectId) workerFilter.assignedProjectId = projectId;
    
    // Explicitly apply category filtering if mapped, ensuring only matching workers are processed
    if (categoryMap[calendarRule]) {
      workerFilter.payrollCategory = categoryMap[calendarRule];
    }

    // Load workers here automatically
    const workers = await prisma.worker.findMany({
      where: workerFilter
    });

    if (workers.length > 0) {
      const payrollEntries = workers.map(w => ({
        workerId: w.id,
        payrollPeriodId: period.id,
        projectId: projectId || null,
        compensationType: w.employmentType === 'REGULAR' ? 'MONTHLY' : w.employmentType === 'PROJECT_BASED' ? 'PROJECT_BASED' : 'DAILY',
        rate: w.dailyRate || 0,
        basicPay: 0,
        netPay: 0
      }));

      await prisma.payroll.createMany({
        data: payrollEntries
      });
    }

    await logAudit(
      userId,
      'HR_OFFICER', // Default role if not available
      'PAYROLL',
      period.id,
      'CREATE_PAYROLL_PERIOD',
      undefined,
      'DRAFT',
      `Created ${periodType} payroll period for ${month}/${year}`
    );

    revalidatePath('/payroll');
    return { success: true, data: period };
  } catch (error: any) {
    console.error('Error creating payroll period:', error);
    return { success: false, error: error.message || 'Failed to create payroll period' };
  }
}
