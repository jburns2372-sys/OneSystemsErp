'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { computePayrollForPeriod } from './payrollEngine';
import { promises as fs } from 'fs';
import path from 'path';
import Papa from 'papaparse';

export async function saveManualDtr(data: any, payrollPeriodId: string, encodedById: string) {
  try {
    const { workerId, date, timeIn, timeOut, regularHours, overtimeHours } = data;

    const parsedDate = new Date(date);
    
    let parsedTimeIn = null;
    let parsedTimeOut = null;
    
    if (timeIn) {
      const [h, m] = timeIn.split(':').map(Number);
      parsedTimeIn = new Date(parsedDate);
      parsedTimeIn.setHours(h, m, 0, 0);
    }
    
    if (timeOut) {
      const [h, m] = timeOut.split(':').map(Number);
      parsedTimeOut = new Date(parsedDate);
      parsedTimeOut.setHours(h, m, 0, 0);
      
      if (parsedTimeIn && parsedTimeOut < parsedTimeIn) {
        parsedTimeOut.setDate(parsedTimeOut.getDate() + 1);
      }
    }
    
    // Check if DTR already exists for this worker on this date
    const existing = await prisma.dailyTimeRecord.findUnique({
      where: {
        workerId_date: {
          workerId,
          date: parsedDate
        }
      }
    });

    if (existing) {
      await prisma.dailyTimeRecord.update({
        where: { id: existing.id },
        data: {
          timeIn: parsedTimeIn,
          timeOut: parsedTimeOut,
          regularHours: Number(regularHours),
          overtimeHours: Number(overtimeHours),
          payrollPeriodId
        }
      });
    } else {
      await prisma.dailyTimeRecord.create({
        data: {
          workerId,
          date: parsedDate,
          timeIn: parsedTimeIn,
          timeOut: parsedTimeOut,
          regularHours: Number(regularHours),
          overtimeHours: Number(overtimeHours),
          payrollPeriodId
        }
      });
    }

    // Auto-compute payroll in the background so the UI is always up to date
    await computePayrollForPeriod(payrollPeriodId);

    revalidatePath(`/payroll/${payrollPeriodId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error saving manual DTR:', error);
    return { success: false, error: error.message || 'Failed to save DTR' };
  }
}

export async function processAIBiometrics(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const payrollPeriodId = formData.get('periodId') as string;
    const currentUserId = formData.get('userId') as string;

    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Recommended Save Location: 
    // In production, this should ideally go to a cloud bucket (S3, GCS, etc).
    // For local environments, we save it in a secure folder outside the public web root.
    const uploadsDir = path.join(process.cwd(), 'uploads', 'biometrics');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Save the file
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, safeFileName);
    await fs.writeFile(filePath, buffer);
    
    // Continue with CSV parsing
    const period = await prisma.payrollPeriod.findUnique({ where: { id: payrollPeriodId } });
    const workers = await prisma.worker.findMany();
    if (!period || workers.length === 0) throw new Error('No workers found');

    const csvText = buffer.toString('utf-8');
    const parseResult = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parseResult.data as any[];

    // Map workers by their string workerId (e.g. EMP-123) to their database internal ID
    const workerMap = new Map();
    for (const w of workers) {
      if (w.workerId) workerMap.set(w.workerId, w.id);
    }

    // Process actual DTRs from the uploaded CSV
    for (const row of rows) {
      const empNo = row['Emp No'];
      if (!empNo) continue;
      
      const workerDbId = workerMap.get(empNo);
      if (!workerDbId) continue;
      
      const dateStr = row['Date'];
      if (!dateStr) continue;
      const date = new Date(dateStr);
      
      // Filter out dates that are not within this payroll period
      if (date < period.startDate || date > period.endDate) continue;
      
      const regularHours = parseFloat(row['Regular Hours']) || 0;
      const overtimeHours = parseFloat(row['OT Hours']) || 0;

      await prisma.dailyTimeRecord.upsert({
        where: { workerId_date: { workerId: workerDbId, date } },
        update: { 
          regularHours, 
          overtimeHours,
          payrollPeriodId,
          sourceFile: safeFileName
        },
        create: {
          workerId: workerDbId,
          date,
          regularHours,
          overtimeHours,
          payrollPeriodId,
          sourceFile: safeFileName
        }
      });
    }

    // Auto-compute payroll in the background
    await computePayrollForPeriod(payrollPeriodId);

    revalidatePath(`/payroll/${payrollPeriodId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error processing biometrics:', error);
    return { success: false, error: error.message || 'Failed to process file' };
  }
}
