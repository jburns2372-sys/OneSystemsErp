'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createMaterialReturn(data: any) {
  try {
    const { issuanceId, projectId, foremanId, items } = data;

    // Generate MRS number (Material Return Slip)
    const count = await prisma.materialReturn.count();
    const mrsNumber = `MRS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const newReturn = await prisma.materialReturn.create({
      data: {
        mrsNumber,
        issuanceId,
        projectId,
        foremanId,
        items: {
          create: items.map((item: any) => ({
            returnedQty: item.returnedQty,
            condition: item.condition,
            issuanceItemId: item.issuanceItemId,
            consolidatedBoqItemId: item.consolidatedBoqItemId,
          }))
        }
      }
    });

    revalidatePath('/material-issuance');
    return { success: true, data: newReturn };
  } catch (error: any) {
    console.error('Error creating material return:', error);
    return { success: false, error: error.message || 'Failed to create return slip' };
  }
}

export async function processMaterialReturn(returnId: string, warehousemanId: string) {
  try {
    const materialReturn = await prisma.materialReturn.findUnique({
      where: { id: returnId },
      include: { items: true }
    });

    if (!materialReturn) throw new Error('Return slip not found');
    if (materialReturn.status === 'COMPLETED') throw new Error('Return slip already completed');

    // For each item with GOOD condition, decrease the consumedQty
    for (const item of materialReturn.items) {
      if (item.condition === 'GOOD') {
        await prisma.consolidatedBOQItem.update({
          where: { id: item.consolidatedBoqItemId },
          data: {
            consumedQty: { decrement: Number(item.returnedQty) }
          }
        });
      }
    }

    const updatedReturn = await prisma.materialReturn.update({
      where: { id: returnId },
      data: {
        status: 'COMPLETED',
        warehousemanId,
        receiveDate: new Date()
      }
    });

    await prisma.materialIssuance.update({
      where: { id: materialReturn.issuanceId },
      data: { status: 'COMPLETED' }
    });

    revalidatePath('/material-issuance');
    revalidatePath('/inventory');
    return { success: true, data: updatedReturn };
  } catch (error: any) {
    console.error('Error processing material return:', error);
    return { success: false, error: error.message || 'Failed to process return slip' };
  }
}
