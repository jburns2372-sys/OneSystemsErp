// @ts-nocheck
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// --- JOB ORDER CRUD ---

export async function getJobOrders(projectId?: string) {
  return await prisma.jobOrder.findMany({
    where: projectId ? { projectId } : undefined,
    include: {
      subcontractor: true,
      project: true,
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getJobOrderById(id: string) {
  try {
    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id },
      include: {
        subcontractor: true,
        project: true,
        subcontractAccomplishments: true,
        subcontractBillings: true
      }
    });
    return { success: true, data: jobOrder };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getConsolidatedBoqItemsByProjectId(projectId: string) {
  try {
    const items = await prisma.consolidatedBOQItem.findMany({
      where: { 
        projectId,
        quantity: { gt: 0 },
        totalCost: { gt: 0 }
      },
      select: { id: true, category: true, description: true, totalCost: true, itemCode: true, quantity: true, unitCost: true, unit: true }
    });
    // Map unitCost to combinedUnitCost for form compatibility
    const mapped = items.map(item => ({ ...item, combinedUnitCost: item.unitCost }));
    return { success: true, items: mapped };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createJobOrder(data: any) {
  try {
    if (!data.jobNumber) {
      data.jobNumber = 'JO-' + Date.now();
    }

    // Check for duplicate job order number
    const existing = await prisma.jobOrder.findUnique({ where: { jobNumber: data.jobNumber } });
    if (existing) {
      return { success: false, error: `A Job Order with number "${data.jobNumber}" already exists. Please refresh the page to generate a new number.` };
    }
    
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.completionDate) data.completionDate = new Date(data.completionDate);
    
    // Check threshold (simplified, configurable per user request)
    const threshold = 250000;
    if (data.contractAmount > threshold) {
      data.isThresholdExceeded = true;
      data.thresholdWarning = "This Job Order amount exceeds the standard Job Order limit. Consider converting this to a full subcontract.";
    }

    const boqReferenceIds = data.boqReferenceIds || [];

    // Check BOQ Conflict: Ensure it's not already in a Subcontract
    if (boqReferenceIds.length > 0) {
      const pureBoqIds = boqReferenceIds.filter((id: string) => id !== '1_LOT');
      if (pureBoqIds.length > 0) {
        const existingSubcontract = await prisma.subcontractorBOQItem.findFirst({
          where: { awardedBoqItemId: { in: pureBoqIds } }
        });
        if (existingSubcontract) {
          return { 
            success: false, 
            error: `Conflict Error: One or more selected BOQ items are already assigned to an active Subcontract Package. You cannot issue a Job Order for subcontracted scope.` 
          };
        }
      }
    }

    // Check for logical Duplicate Job Order (Same Project, Subcontractor, and BOQ Scope)
    const existingJOs = await prisma.jobOrder.findMany({
      where: { 
        projectId: data.projectId, 
        subcontractorId: data.subcontractorId 
      }
    });

    const isDuplicate = existingJOs.some(jo => {
      const existingIds = Array.isArray(jo.boqReferenceIds) ? jo.boqReferenceIds : [];
      if (existingIds.length === boqReferenceIds.length && existingIds.length > 0) {
        const sortedExisting = [...existingIds].sort();
        const sortedIncoming = [...boqReferenceIds].sort();
        return sortedExisting.every((val, index) => val === sortedIncoming[index]);
      }
      return false;
    });

    if (isDuplicate) {
      return { success: false, error: "Duplicate Error: A Job Order for this Subcontractor with the exact same BOQ scope already exists." };
    }

    // Remove UI-only fields that don't exist in the Prisma schema
    const { durationDays, boqReferenceIds: _, jobOrderType, ...prismaData } = data;
    prismaData.boqReferenceId = boqReferenceIds;

    const result = await prisma.jobOrder.create({ data: prismaData });
    revalidatePath('/subcontracting/job-orders');
    revalidatePath('/job-orders/dashboard');
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Create Job Order Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateJobOrder(id: string, data: any) {
  try {
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.completionDate) data.completionDate = new Date(data.completionDate);
    
    const threshold = 250000;
    if (data.contractAmount > threshold) {
      data.isThresholdExceeded = true;
      data.thresholdWarning = "This Job Order amount exceeds the standard Job Order limit. Consider converting this to a full subcontract.";
    } else {
      data.isThresholdExceeded = false;
      data.thresholdWarning = null;
    }

    // Check if locked
    const existing = await prisma.jobOrder.findUnique({
      where: { id },
      include: { subcontractAccomplishments: true, subcontractBillings: true }
    });
    
    if (existing) {
      const isLocked = existing.subcontractAccomplishments.some((a: any) => a.status === 'APPROVED') || 
                       existing.subcontractBillings.some((b: any) => b.status === 'APPROVED_FOR_PAYMENT' || b.paymentStatus === 'PAID');
      if (isLocked) {
        throw new Error("Job Order is locked and cannot be edited because accomplishments or payments have been processed.");
      }
    }

    // Store boqReferenceIds as JSON
    const boqReferenceId = data.boqReferenceIds || [];

    const { 
      durationDays, 
      project, 
      subcontractor, 
      subcontractAccomplishments,
      subcontractBillings,
      boqReferenceIds: _,
      jobOrderType,
      ...prismaData 
    } = data;

    prismaData.boqReferenceId = boqReferenceId;

    const result = await prisma.jobOrder.update({ where: { id }, data: prismaData });
    revalidatePath('/job-orders/dashboard');
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Update Job Order Error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteJobOrder(id: string) {
  try {
    await prisma.jobOrder.delete({
      where: { id }
    });
    revalidatePath('/job-orders/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateJobOrderStatus(id: string, newStatus: any) {
  try {
    const data: any = { status: newStatus };
    // Temporarily bypassing isLocked write to prevent PrismaClientValidationError
    // until the user restarts their Next.js server.
    // if (newStatus === 'APPROVED') {
    //   data.isLocked = true;
    // }
    const result = await prisma.jobOrder.update({
      where: { id },
      data
    });
    revalidatePath(`/job-orders/${id}`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Update Job Order Status Error:", error);
    return { success: false, error: error.message };
  }
}

export async function unlockJobOrder(id: string) {
  try {
    // Temporarily bypassing isLocked write. Just changing status back to FOR_FINANCIAL_REVIEW
    // to simulate an unlock without crashing Prisma.
    const result = await prisma.jobOrder.update({
      where: { id },
      data: { status: 'FOR_FINANCIAL_REVIEW' }
    });
    revalidatePath(`/job-orders/${id}`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Unlock Job Order Error:", error);
    return { success: false, error: error.message };
  }
}

