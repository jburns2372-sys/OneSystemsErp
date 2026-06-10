'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { requirePermission } from '@/lib/permissions';

export async function validateWorkerProfileWithAI(workerData: any) {
  try {
    const prompt = `
You are an expert HR and Payroll AI Assistant for a Philippine construction firm.
Your job is to strictly validate a new worker profile submission against standard business logic.
You must output a JSON array of issues found, if any. If the profile is perfect, return an empty array.

Here is the worker profile data to validate:
${JSON.stringify(workerData, null, 2)}

Validation Rules:
1. "FREELANCE_CONSULTANT" or "RETAINER_CONSULTANT" MUST have a TIN or a Valid ID. If not, return a CRITICAL severity issue.
2. "FREELANCE_CONSULTANT" does not require SSS, PhilHealth, Pag-IBIG. But if they have withholding tax enabled, they MUST have a TIN.
3. Daily Workers MUST have a dailyRate > 0. If not, return a HIGH severity issue.
4. Monthly Employees MUST have a basicMonthlySalary > 0.
5. Hourly Workers MUST have an hourlyRate > 0.
6. One-Lot / Lump Sum workers MUST have a contractAmount > 0 and a paymentBasis selected.
7. If SSS Deduction is enabled, SSS Number is highly recommended (warning if missing).
8. If PhilHealth Deduction is enabled, PhilHealth Number is highly recommended.
9. If Pag-IBIG Deduction is enabled, Pag-IBIG Number is highly recommended.
10. If Payroll Mode is BANK_TRANSFER, Bank Name and Bank Account Number MUST be provided.
11. If Payroll Mode is GCASH, GCash Number MUST be provided.

Output exactly a JSON array of objects with the following schema, and NO markdown wrapping or other text:
[
  {
    "category": "Profile" | "GovernmentIDs" | "Payment" | "Documents" | "Rules",
    "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    "message": "Detailed explanation of the issue",
    "recommendedCorrection": "How the user can fix it",
    "fieldRef": "The name of the field that is problematic (e.g. 'sssNumber', 'dailyRate')"
  }
]
`;

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: prompt,
      temperature: 0.1,
    });

    let cleanedText = text.trim();
    if (cleanedText.startsWith('\`\`\`json')) {
      cleanedText = cleanedText.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
    }

    let validationResults = [];
    try {
      validationResults = JSON.parse(cleanedText);
    } catch (e) {
      console.error('Failed to parse AI validation response', cleanedText);
    }

    return { success: true, results: validationResults };

  } catch (error: any) {
    console.error('AI Worker Validation Error:', error);
    return { success: false, error: error.message };
  }
}

export async function saveWorkerProfile(data: any, aiValidationLogs: any[]) {
  try {
    const currentUser = await prisma.user.findFirst();
    if (currentUser) {
      if (data.id) {
        await requirePermission(currentUser.id, 'WORKER_DATABASE', 'canEditDraft');
      } else {
        await requirePermission(currentUser.id, 'WORKER_DATABASE', 'canCreate');
      }
    }

    // Basic standardizing of rates if empty
    const rateData = {
      dailyRate: Number(data.dailyRate || 0),
      basicMonthlySalary: Number(data.basicMonthlySalary || 0),
      hourlyRate: Number(data.hourlyRate || 0),
      pieceRate: Number(data.pieceRate || 0),
      contractAmount: Number(data.contractAmount || 0),
      professionalFee: Number(data.professionalFee || 0),
      retentionPercentage: Number(data.retentionPercentage || 0),
      withholdingTaxRate: Number(data.withholdingTaxRate || 0),
      allowance: Number(data.allowance || 0),
      standardWorkHours: Number(data.standardWorkHours || 8),
    };

    // Dates
    const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    const dateHired = data.dateHired ? new Date(data.dateHired) : null;
    const engagementStartDate = data.engagementStartDate ? new Date(data.engagementStartDate) : null;
    const contractEndDate = data.contractEndDate ? new Date(data.contractEndDate) : null;
    const validIdExpiryDate = data.validIdExpiryDate ? new Date(data.validIdExpiryDate) : null;
    
    // Clean up fields that shouldn't be updated or passed as empty strings
    delete data.createdAt;
    delete data.updatedAt;
    if (data.gcashLastUpdatedDate === '') delete data.gcashLastUpdatedDate;
    if (data.bankLastUpdatedDate === '') delete data.bankLastUpdatedDate;
    if (data.projectId === '') data.projectId = null;

    let worker;

    const payload = {
      ...data,
      ...rateData,
      dateOfBirth,
      dateHired,
      engagementStartDate,
      contractEndDate,
      validIdExpiryDate,
      id: undefined // Don't pass id in data body
    };

    if (data.id) {
      const existingWorker = await prisma.worker.findUnique({ where: { id: data.id }});
      
      // Detect payment profile changes
      if (existingWorker) {
        let paymentChanged = false;
        
        if (payload.gcashNumber !== existingWorker.gcashNumber || payload.gcashAccountName !== existingWorker.gcashAccountName) {
          payload.gcashVerificationStatus = 'Pending';
          paymentChanged = true;
        }
        
        if (payload.bankAccountNumber !== existingWorker.bankAccountNumber || payload.bankName !== existingWorker.bankName) {
          payload.bankVerificationStatus = 'Pending';
          paymentChanged = true;
        }
        
        if (paymentChanged) {
          payload.paymentProfileStatus = 'Pending';
        }
      }

      worker = await prisma.worker.update({
        where: { id: data.id },
        data: payload
      });
    } else {
      payload.paymentProfileStatus = 'Pending';
      payload.gcashVerificationStatus = payload.gcashNumber ? 'Pending' : undefined;
      payload.bankVerificationStatus = payload.bankAccountNumber ? 'Pending' : undefined;
      
      worker = await prisma.worker.create({
        data: payload
      });
    }

    // Save AI Validation Overrides / Logs if any
    if (aiValidationLogs && aiValidationLogs.length > 0) {
      await Promise.all(aiValidationLogs.map(log => 
        prisma.aIWorkerValidationResult.create({
          data: {
            workerId: worker.id,
            category: log.category,
            severity: log.severity,
            message: log.message,
            fieldRef: log.fieldRef,
            status: log.status || 'IGNORED',
            ignoreReason: log.ignoreReason || 'User proceeded despite warning'
          }
        })
      ));
    }

    revalidatePath('/workers');
    revalidatePath('/payroll');
    return { success: true, workerId: worker.id };
  } catch (error: any) {
    console.error('Save Worker Error:', error);
    return { success: false, error: error.message };
  }
}

export async function approvePaymentProfile(workerId: string) {
  try {
    const currentUser = await prisma.user.findFirst();
    if (currentUser) {
      await requirePermission(currentUser.id, 'WORKER_DATABASE', 'canReleasePayment');
    }

    const worker = await prisma.worker.findUnique({ where: { id: workerId } });
    if (!worker) throw new Error('Worker not found');

    const updateData: any = {
      paymentProfileStatus: 'Verified',
      paymentHoldReason: null
    };

    if (worker.allowedPaymentMethod === 'GCash Only' && worker.gcashNumber) {
      updateData.gcashVerificationStatus = 'Verified';
      updateData.gcashApprovedBy = currentUser?.name || 'Finance Admin';
      updateData.gcashLastUpdatedDate = new Date();
    } else if (worker.allowedPaymentMethod === 'Bank Transfer Only' && worker.bankAccountNumber) {
      updateData.bankVerificationStatus = 'Verified';
      updateData.bankApprovedBy = currentUser?.name || 'Finance Admin';
      updateData.bankLastUpdatedDate = new Date();
    }

    await prisma.worker.update({
      where: { id: workerId },
      data: updateData
    });

    revalidatePath(`/workers/${workerId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function holdPaymentProfile(workerId: string, reason: string) {
  try {
    const currentUser = await prisma.user.findFirst();
    if (currentUser) {
      await requirePermission(currentUser.id, 'WORKER_DATABASE', 'canEditDraft');
    }

    await prisma.worker.update({
      where: { id: workerId },
      data: {
        paymentProfileStatus: 'On Hold',
        paymentHoldReason: reason
      }
    });

    revalidatePath(`/workers/${workerId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteWorker(id: string) {
  try {
    const currentUser = await prisma.user.findFirst();
    if (currentUser) {
      await requirePermission(currentUser.id, 'WORKER_DATABASE', 'canDeleteDraft');
    }

    await prisma.worker.delete({
      where: { id }
    });
    revalidatePath('/workers');
    revalidatePath('/payroll');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting worker:', error);
    return { success: false, error: error.message || 'Failed to delete worker' };
  }
}
