'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { computePayrollForPeriod } from './payrollEngine';
import { promises as fs } from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { put } from '@vercel/blob';

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

export async function saveBulkManualDtr(workerId: string, payrollPeriodId: string, entries: { date: string, timeIn?: string, timeOut?: string, regularHours: number, overtimeHours: number }[]) {
  try {
    for (const entry of entries) {
      const parsedDate = new Date(entry.date);
      
      // Skip empty entries (0 hours and 0 OT and no time)
      if (entry.regularHours === 0 && entry.overtimeHours === 0 && !entry.timeIn && !entry.timeOut) {
        continue;
      }

      let parsedTimeIn = null;
      let parsedTimeOut = null;
      
      if (entry.timeIn) {
        const [h, m] = entry.timeIn.split(':').map(Number);
        parsedTimeIn = new Date(parsedDate);
        parsedTimeIn.setHours(h, m, 0, 0);
      }
      
      if (entry.timeOut) {
        const [h, m] = entry.timeOut.split(':').map(Number);
        parsedTimeOut = new Date(parsedDate);
        parsedTimeOut.setHours(h, m, 0, 0);
        
        if (parsedTimeIn && parsedTimeOut < parsedTimeIn) {
          parsedTimeOut.setDate(parsedTimeOut.getDate() + 1);
        }
      }
      
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
            regularHours: Number(entry.regularHours),
            overtimeHours: Number(entry.overtimeHours),
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
            regularHours: Number(entry.regularHours),
            overtimeHours: Number(entry.overtimeHours),
            payrollPeriodId
          }
        });
      }
    }

    // Auto-compute payroll in the background
    await computePayrollForPeriod(payrollPeriodId);

    revalidatePath(`/payroll/${payrollPeriodId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error saving bulk manual DTR:', error);
    return { success: false, error: error.message || 'Failed to save bulk DTR' };
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

    // Save the file to Vercel Blob or local fallback
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    let fileUrl = '';
    
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(`biometrics/${safeFileName}`, buffer, {
          access: 'public',
          addRandomSuffix: false
        });
        fileUrl = blob.url;
      } catch (e) {
        console.warn("Vercel Blob upload failed, falling back to local storage:", e);
        // Fallback if token is expired/invalid
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'biometrics');
        await fs.mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, safeFileName);
        await fs.writeFile(filePath, buffer);
        fileUrl = `/uploads/biometrics/${safeFileName}`;
      }
    } else {
      // Local fallback for development without Vercel Blob
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'biometrics');
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, safeFileName);
      await fs.writeFile(filePath, buffer);
      fileUrl = `/uploads/biometrics/${safeFileName}`;
    }
    
    // Continue with CSV parsing
    const period = await prisma.payrollPeriod.findUnique({ where: { id: payrollPeriodId } });
    const workers = await prisma.worker.findMany();
    if (!period || workers.length === 0) throw new Error('No workers found');

    let rows: any[] = [];
    
    if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
      const xlsx = require('xlsx');
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      // Use the sheet that contains 'Logs' if it exists, otherwise use the first one
      const sheetName = workbook.SheetNames.find((name: string) => name.toLowerCase().includes('log')) || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const rawData: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });
      
      // Find the actual header row (some exports have document titles in row 1)
      let headerRowIdx = -1;
      for (let i = 0; i < Math.min(rawData.length, 20); i++) {
        if (!rawData[i]) continue;
        const rowStr = rawData[i].map((c: any) => String(c).toLowerCase());
        if (rowStr.includes('emp no') || rowStr.includes('employee no') || rowStr.includes('worker name')) {
          headerRowIdx = i;
          break;
        }
      }
      
      if (headerRowIdx !== -1 && headerRowIdx < rawData.length - 1) {
        const headers = rawData[headerRowIdx];
        for (let i = headerRowIdx + 1; i < rawData.length; i++) {
          const rowData = rawData[i];
          const obj: any = {};
          headers.forEach((header: string, index: number) => {
            if (header) {
              obj[header] = rowData[index];
            }
          });
          rows.push(obj);
        }
      } else {
        rows = xlsx.utils.sheet_to_json(worksheet, { raw: false, defval: '' });
      }
    } else {
      const csvText = buffer.toString('utf-8');
      const parseResult = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
      });
      rows = parseResult.data as any[];
    }
    
    console.log("DEBUG: Extracted first row from biometrics upload:", rows[0]);

    // Map workers by their string workerId (e.g. EMP-123) to their database internal ID
    const workerMap = new Map();
    for (const w of workers) {
      if (w.workerId) workerMap.set(w.workerId, w.id);
    }

    let insertedCount = 0;
    let outOfBoundsCount = 0;

    // Process actual DTRs from the uploaded CSV/Excel
    for (const row of rows) {
      const empNo = row['Emp No'] || row['Employee No'] || row['Worker ID'];
      if (!empNo) continue;
      
      const workerDbId = workerMap.get(empNo);
      if (!workerDbId) continue;
      
      let dateStr = row['Date'];
      if (!dateStr) continue;
      
      let date: Date;
      // Handle Excel serial date format (e.g. 46189 for Jun 16 2026)
      if (typeof dateStr === 'number' || (typeof dateStr === 'string' && !isNaN(Number(dateStr)) && Number(dateStr) > 25000)) {
        date = new Date(Math.round((Number(dateStr) - 25569) * 864e5));
      } else {
        date = new Date(dateStr);
      }
      
      // Filter out dates that are not within this payroll period
      if (date < period.startDate || date > period.endDate) {
        outOfBoundsCount++;
        continue;
      }
      
      let regularHours = parseFloat(row['Regular Hours']);
      let overtimeHours = parseFloat(row['OT Hours']);
      
      // If Regular/OT hours are missing but Total Hours is provided, auto-calculate
      if (isNaN(regularHours)) {
        const totalHours = parseFloat(row['Total Hours']) || parseFloat(row['TotalHours']) || 0;
        if (totalHours > 8) {
          regularHours = 8;
          overtimeHours = totalHours - 8;
        } else {
          regularHours = totalHours;
          overtimeHours = 0;
        }
      } else {
        if (isNaN(overtimeHours)) overtimeHours = 0;
      }

      await prisma.dailyTimeRecord.upsert({
        where: { workerId_date: { workerId: workerDbId, date } },
        update: { 
          regularHours, 
          overtimeHours,
          payrollPeriodId,
          sourceFile: fileUrl
        },
        create: {
          workerId: workerDbId,
          date,
          regularHours,
          overtimeHours,
          payrollPeriodId,
          sourceFile: fileUrl
        }
      });
      insertedCount++;
    }

    if (insertedCount === 0) {
      if (outOfBoundsCount > 0) {
        throw new Error(`Found ${outOfBoundsCount} records, but none of them matched the cutoff period (${period.startDate.toISOString().split('T')[0]} to ${period.endDate.toISOString().split('T')[0]}). Please ensure your biometrics file corresponds to the correct payroll period.`);
      } else {
        throw new Error('No valid DTR records found for the workers in this file.');
      }
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
