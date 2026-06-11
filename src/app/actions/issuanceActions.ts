'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { validateTransactionWithAI } from './aiValidationActions';

export async function getConsolidatedItemsForIssuance(projectId: string) {
  try {
    const items = await prisma.consolidatedBOQItem.findMany({
      where: { projectId },
      orderBy: { description: 'asc' }
    });
    
    // Only return items that have physical stock available (delivered > consumed)
    const availableItems = items.filter(item => item.deliveredQty > item.consumedQty);
    
    return { success: true, data: availableItems };
  } catch (error) {
    console.error('Error fetching consolidated items:', error);
    return { success: false, error: 'Failed to fetch items' };
  }
}

export async function createIssuanceSlip(data: any) {
  try {
    // === AI VALIDATION INTERCEPTOR ===
    const validation = await validateTransactionWithAI(
      'Material Issuance',
      {
        action: 'Create Material Issuance Slip',
        projectId: data.projectId,
        activity: data.activity,
        itemsRequested: data.items
      },
      data.foremanId || 'unknown',
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

    // Generate a simple MIS Number
    const count = await prisma.materialIssuance.count();
    const misNumber = `MIS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const issuance = await prisma.materialIssuance.create({
      data: {
        misNumber,
        projectId: data.projectId,
        foremanId: data.foremanId,
        activity: data.activity,
        items: {
          create: data.items.map((item: any) => ({
            consolidatedBoqItemId: item.consolidatedBoqItemId,
            requestedQty: item.requestedQty,
          }))
        }
      }
    });

    revalidatePath('/material-issuance');
    return { success: true, issuance };
  } catch (error) {
    console.error('Error creating issuance slip:', error);
    return { success: false, error: 'Failed to create issuance slip' };
  }
}

export async function processIssuanceSlip(issuanceId: string, warehousemanId: string, itemsData: any[]) {
  try {
    // Wrap in transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // 1. Update the quantities for the issuance items
      for (const item of itemsData) {
        await tx.issuanceItem.update({
          where: { id: item.id },
          data: { releasedQty: item.releasedQty }
        });
      }

      // 2. Update the Material Issuance slip status
      await tx.materialIssuance.update({
        where: { id: issuanceId },
        data: {
          status: 'PROCESSED',
          warehousemanId: warehousemanId
        }
      });
    });

    revalidatePath('/material-issuance');
    return { success: true };
  } catch (error) {
    console.error('Error processing issuance:', error);
    return { success: false, error: 'Failed to process issuance' };
  }
}

export async function approveIssuanceSlip(issuanceId: string, accountantId: string) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Get the slip and its items
      const slip = await tx.materialIssuance.findUnique({
        where: { id: issuanceId },
        include: { items: true }
      });

      if (!slip) throw new Error('Slip not found');
      if (slip.status !== 'PROCESSED') throw new Error('Slip must be processed first');

      // 2. Deduct from inventory (increase consumedQty on ConsolidatedBOQItem)
      for (const item of slip.items) {
        const boqItem = await tx.consolidatedBOQItem.findUnique({
          where: { id: item.consolidatedBoqItemId }
        });

        if (!boqItem) throw new Error('BOQ Item not found');

        // Verify available inventory again
        const available = boqItem.deliveredQty - boqItem.consumedQty;
        if (item.releasedQty > available) {
          throw new Error(`Not enough inventory for ${boqItem.description}. Available: ${available}, Requested: ${item.releasedQty}`);
        }

        // Increment consumedQty
        await tx.consolidatedBOQItem.update({
          where: { id: boqItem.id },
          data: {
            consumedQty: { increment: Number(item.releasedQty) }
          }
        });
      }

      // 3. Mark slip as APPROVED/RELEASED
      await tx.materialIssuance.update({
        where: { id: issuanceId },
        data: {
          status: 'RELEASED',
          accountantId: accountantId,
          releaseDate: new Date(),
          releasedById: accountantId // Accountant essentially releases it in this flow
        }
      });
    });

    revalidatePath('/material-issuance');
    return { success: true };
  } catch (error: any) {
    console.error('Error approving issuance:', error);
    return { success: false, error: error.message || 'Failed to approve issuance' };
  }
}

export async function rejectIssuanceSlip(issuanceId: string, userId: string) {
  try {
    await prisma.materialIssuance.update({
      where: { id: issuanceId },
      data: { status: 'REJECTED' }
    });
    revalidatePath('/material-issuance');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to reject' };
  }
}
