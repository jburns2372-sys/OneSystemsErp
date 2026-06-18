'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// --- SUBCONTRACTOR MASTER CRUD ---

export async function getSubcontractors() {
  return await prisma.subcontractor.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function getSubcontractorById(id: string) {
  return await prisma.subcontractor.findUnique({
    where: { id },
    include: {
      packages: true,
      jobOrders: true,
      subcontractBillings: true,
      backCharges: true
    }
  });
}

export async function createSubcontractor(data: any) {
  try {
    const result = await prisma.subcontractor.create({ data });
    revalidatePath('/subcontracting/subcontractors');
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Create Subcontractor Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateSubcontractor(id: string, data: any) {
  try {
    const result = await prisma.subcontractor.update({ where: { id }, data });
    revalidatePath('/subcontracting/subcontractors');
    revalidatePath(`/subcontracting/subcontractors/${id}`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Update Subcontractor Error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteSubcontractor(id: string) {
  try {
    await prisma.subcontractor.delete({ where: { id } });
    revalidatePath('/subcontracting/subcontractors');
    return { success: true };
  } catch (error: any) {
    console.error("Delete Subcontractor Error:", error);
    return { success: false, error: error.message };
  }
}

// --- SUBCONTRACT PACKAGE CRUD ---

export async function getSubcontractPackages(projectId?: string) {
  return await prisma.subcontractPackage.findMany({
    where: projectId ? { projectId } : undefined,
    include: {
      subcontractor: true,
      project: true,
      accomplishments: true,
      billings: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createSubcontractPackage(data: any) {
  try {
    // Generate a unique package number if not provided
    if (!data.packageNumber) {
      data.packageNumber = 'SP-' + Date.now();
    }
    
    const result = await prisma.subcontractPackage.create({ data });
    revalidatePath('/subcontracting/packages');
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Create Package Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateSubcontractPackage(id: string, data: any) {
  try {
    const result = await prisma.subcontractPackage.update({ where: { id }, data });
    revalidatePath('/subcontracting/packages');
    revalidatePath(`/subcontracting/packages/${id}`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Update Package Error:", error);
    return { success: false, error: error.message };
  }
}

// --- SUBCONTRACT ACCOMPLISHMENTS ---

export async function getAccomplishments(packageId?: string) {
  return await prisma.subcontractAccomplishment.findMany({
    where: packageId ? { packageId } : undefined,
    include: {
      package: {
        include: { subcontractor: true, project: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createAccomplishment(data: any) {
  try {
    // Perform threshold/quantity checks here if needed before saving
    // Example: Check if cumulativePercent > 100
    if (data.cumulativePercent > 100) {
       return { success: false, error: "Cumulative accomplishment cannot exceed 100%" };
    }

    const result = await prisma.subcontractAccomplishment.create({ data });
    revalidatePath('/subcontracting/accomplishments');
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Create Accomplishment Error:", error);
    return { success: false, error: error.message };
  }
}

// --- SUBCONTRACT BILLING ---

export async function getBillings(packageId?: string) {
  return await prisma.subcontractBilling.findMany({
    where: packageId ? { packageId } : undefined,
    include: {
      subcontractor: true,
      package: true,
      jobOrder: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createBilling(data: any) {
  try {
    if (!data.billingNumber) {
      data.billingNumber = 'BILL-' + Date.now();
    }

    const result = await prisma.subcontractBilling.create({ data });
    revalidatePath('/subcontracting/billings');
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Create Billing Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getAwardedBoqItemsByProjectId(projectId: string) {
  try {
    const items = await prisma.awardedBOQItem.findMany({
      where: { projectId },
      select: { id: true, itemCode: true, category: true, description: true, unit: true, quantity: true, totalCost: true, combinedUnitCost: true }
    });
    return { success: true, items };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createFullSubcontractPackage(packageData: any, boqItems: any[], powData: any) {
  try {
    // 0. Check BOQ Conflict: Ensure none are already in a Job Order
    if (boqItems && boqItems.length > 0) {
      const awardedBoqIds = boqItems.map(item => item.id);
      const conflictingJO = await prisma.jobOrder.findFirst({
        where: { boqReferenceId: { in: awardedBoqIds } }
      });
      if (conflictingJO) {
        return { 
          success: false, 
          error: `Conflict Error: BOQ item is already assigned to active Job Order (${conflictingJO.jobNumber}). You cannot subcontract a BOQ item that has an active Job Order.` 
        };
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Prepare Dates
      if (packageData.startDate) packageData.startDate = new Date(packageData.startDate);
      if (packageData.targetCompletion) packageData.targetCompletion = new Date(packageData.targetCompletion);

      if (!packageData.packageNumber) {
        packageData.packageNumber = 'SP-' + Date.now();
      }

      // 2. Create the base package
      const newPackage = await tx.subcontractPackage.create({
        data: packageData
      });

      // 3. Create SubcontractorBOQItems (if any)
      if (boqItems && boqItems.length > 0) {
        const boqData = boqItems.map((item: any) => ({
          subcontractorId: newPackage.subcontractorId,
          awardedBoqItemId: item.id,
          quantity: parseFloat(item.subcontractorQuantity) || 0,
          unitCost: parseFloat(item.subcontractorUnitCost) || 0,
          totalCost: (parseFloat(item.subcontractorQuantity) || 0) * (parseFloat(item.subcontractorUnitCost) || 0),
        }));
        
        await tx.subcontractorBOQItem.createMany({
          data: boqData
        });
      }

      // 4. Create Program of Works
      if (powData) {
        if (powData.startDate) powData.startDate = new Date(powData.startDate);
        if (powData.endDate) powData.endDate = new Date(powData.endDate);

        await tx.programOfWorks.create({
          data: {
            ...powData,
            packageId: newPackage.id
          }
        });
      }

      return newPackage;
    });

    revalidatePath('/subcontracting/dashboard');
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Full Subcontract Package Creation Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getSubcontractPackageById(id: string) {
  return await prisma.subcontractPackage.findUnique({
    where: { id },
    include: {
      project: true,
      subcontractor: {
        include: { subcontractorBOQItems: { include: { awardedBoqItem: true } } }
      },
      programOfWorks: true,
      accomplishments: true,
      billings: true,
      jobOrders: true,
    }
  });
}

export async function deleteSubcontractPackage(id: string) {
  try {
    // Delete associated Program of Works first
    await prisma.programOfWorks.deleteMany({ where: { packageId: id } });
    
    // We do not delete SubcontractorBOQItems here unless we explicitly link them to packageId,
    // but the current schema links them to Subcontractor.
    
    await prisma.subcontractPackage.delete({ where: { id } });
    revalidatePath('/subcontracting/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error("Delete Package Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateFullSubcontractPackage(id: string, packageData: any, boqItems: any[], powData: any) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      if (packageData.startDate) packageData.startDate = new Date(packageData.startDate);
      if (packageData.targetCompletion) packageData.targetCompletion = new Date(packageData.targetCompletion);

      // We remove relation fields from the packageData before updating to avoid Prisma errors
      const { project, subcontractor, programOfWorks, accomplishments, billings, jobOrders, ...cleanData } = packageData;

      const updatedPackage = await tx.subcontractPackage.update({
        where: { id },
        data: cleanData
      });

      // Update BOQ items (simplified: delete all for this sub, recreate)
      // Note: This is destructive to other packages if the sub shares items. 
      // A better approach is to map them by ID if they exist, but SubcontractorBOQItem lacks packageId.
      // We will leave BOQ items alone here unless explicitly requested to update, or just use upsert.
      
      // Update Program of Works
      if (powData) {
        if (powData.startDate) powData.startDate = new Date(powData.startDate);
        if (powData.endDate) powData.endDate = new Date(powData.endDate);

        const existingPow = await tx.programOfWorks.findFirst({ where: { packageId: id } });
        if (existingPow) {
          await tx.programOfWorks.update({
            where: { id: existingPow.id },
            data: powData
          });
        } else {
          await tx.programOfWorks.create({
            data: {
              ...powData,
              packageId: id
            }
          });
        }
      }

      return updatedPackage;
    });

    revalidatePath('/subcontracting/dashboard');
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Update Full Package Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateSubcontractPackageStatus(id: string, status: string) {
  try {
    const isApproved = status === 'APPROVED';
    const result = await prisma.subcontractPackage.update({
      where: { id },
      data: { 
        status: status as any,
        isLocked: isApproved ? true : undefined
      }
    });
    revalidatePath(`/subcontracting/packages/${id}`);
    revalidatePath('/subcontracting/packages');
    revalidatePath('/subcontracting/dashboard');
    revalidatePath('/subcontracting/progress-hub');
    revalidatePath(`/subcontracting/progress-hub/${id}`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Update Package Status Error:", error);
    return { success: false, error: error.message };
  }
}

export async function unlockSubcontractPackage(id: string) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;
    if (!sessionId) throw new Error('Not authenticated');

    const user = await prisma.user.findUnique({
      where: { id: sessionId },
      include: { userRoles: { include: { role: true } } }
    });

    const packageBillings = await prisma.subcontractBilling.findMany({
      where: {
        packageId: id,
        status: { in: ['APPROVED_FOR_PAYMENT', 'PAID'] }
      }
    });

    const hasCompletedPayments = packageBillings.length > 0;

    let isAuthorized = false;
    if (hasCompletedPayments) {
      isAuthorized = user?.email === 'pd@gmail.com' ||
        user?.role === 'PROJECT_DIRECTOR' ||
        user?.role === 'SYSTEM_ADMIN' ||
        user?.userRoles?.some(ur => ['SYSTEM_ADMIN', 'PROJECT_DIRECTOR'].includes(ur.role.roleCode));
    } else {
      isAuthorized = user?.email === 'pd@gmail.com' ||
        user?.role === 'PROJECT_DIRECTOR' ||
        user?.role === 'PROJECT_MANAGER' ||
        user?.role === 'SYSTEM_ADMIN' ||
        user?.userRoles?.some(ur => ['SYSTEM_ADMIN', 'PROJECT_DIRECTOR', 'PROJECT_MANAGER'].includes(ur.role.roleCode));
    }

    if (!isAuthorized) {
      return { 
        success: false, 
        error: hasCompletedPayments 
          ? 'Unauthorized: Since payment has been approved/completed, only the Project Director can unlock this package.'
          : 'Unauthorized: Only Project Managers or Project Directors can unlock packages.' 
      };
    }

    const result = await prisma.subcontractPackage.update({
      where: { id },
      data: { isLocked: false }
    });

    revalidatePath(`/subcontracting/packages/${id}`);
    revalidatePath('/subcontracting/packages');
    revalidatePath(`/subcontracting/packages/${id}/edit`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Unlock Package Error:", error);
    return { success: false, error: error.message };
  }
}


