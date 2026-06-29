// @ts-nocheck
'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function createCanvassForm(mrId: string) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  
  if (!sessionId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const mr = await prisma.materialRequest.findUnique({
      where: { id: mrId },
      include: { items: true, project: true }
    });

    if (!mr) {
      return { success: false, error: 'Material request not found' };
    }

    // Check if canvass already exists
    const existingCanvass = await prisma.canvassForm.findFirst({
      where: { mrId: mrId }
    });

    if (existingCanvass) {
      return { success: true, canvassId: existingCanvass.id };
    }

    const currentYear = new Date().getFullYear();
    const prefix = `CANV-${currentYear}-`;
    const lastCanvass = await prisma.canvassForm.findFirst({
      where: { canvassNumber: { startsWith: prefix } },
      orderBy: { canvassNumber: 'desc' },
      select: { canvassNumber: true }
    });

    let nextNumber = 1;
    if (lastCanvass && lastCanvass.canvassNumber) {
      const lastInt = parseInt(lastCanvass.canvassNumber.substring(prefix.length), 10);
      if (!isNaN(lastInt)) nextNumber = lastInt + 1;
    }
    const canvassNumber = `${prefix}${String(nextNumber).padStart(4, '0')}`;

    const canvass = await prisma.canvassForm.create({
      data: {
        canvassNumber,
        mrId: mr.id,
        projectId: mr.projectId,
        preparedById: sessionId,
        status: 'DRAFT',
        items: {
          create: mr.items.map(item => ({
            quantityRequired: item.approvedQuantity || item.quantity,
            consolidatedBoqItemId: item.consolidatedBoqItemId
          }))
        }
      }
    });

    return { success: true, canvassId: canvass.id };
  } catch (error: any) {
    console.error('Error creating canvass:', error);
    return { success: false, error: error.message || 'Failed to create canvass form' };
  }
}

export async function addSupplierQuotation(canvassId: string, supplierId: string, items: any[]) {
  try {
    const quotation = await prisma.supplierQuotation.create({
      data: {
        canvassFormId: canvassId,
        supplierId: supplierId,
        status: 'RECEIVED',
        totalAmount: items.reduce((acc, item) => acc + (item.unitCost * item.quantityAvailable), 0),
        items: {
          create: items.map(item => ({
            canvassItemId: item.canvassItemId,
            unitCost: item.unitCost,
            quantityAvailable: item.quantityAvailable,
            totalCost: item.unitCost * item.quantityAvailable,
            brand: item.brand,
            remarks: item.remarks
          }))
        }
      }
    });

    return { success: true, quotationId: quotation.id };
  } catch (error: any) {
    console.error('Error adding quotation:', error);
    return { success: false, error: error.message || 'Failed to add quotation' };
  }
}

export async function autoGeneratePOFromCanvass(canvassId: string, supplierId: string) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  
  if (!sessionId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const canvass = await prisma.canvassForm.findUnique({
      where: { id: canvassId },
      include: { mr: true }
    });

    if (!canvass) return { success: false, error: 'Canvass not found' };

    const quotation = await prisma.supplierQuotation.findFirst({
      where: { canvassFormId: canvassId, supplierId: supplierId },
      include: { items: { include: { canvassItem: true } } }
    });

    if (!quotation) return { success: false, error: 'Quotation not found' };

    const currentYear = new Date().getFullYear();
    const prefix = `PO-${currentYear}-`;
    const lastPO = await prisma.purchaseOrder.findFirst({
      where: { poNumber: { startsWith: prefix } },
      orderBy: { poNumber: 'desc' },
      select: { poNumber: true }
    });

    let nextNumber = 1;
    if (lastPO && lastPO.poNumber) {
      const lastInt = parseInt(lastPO.poNumber.substring(prefix.length), 10);
      if (!isNaN(lastInt)) nextNumber = lastInt + 1;
    }
    const poNumber = `${prefix}${String(nextNumber).padStart(4, '0')}`;

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        mrId: canvass.mrId,
        canvassFormId: canvass.id,
        preparerId: sessionId,
        status: 'DRAFT',
        totalAmount: quotation.totalAmount,
        netAmount: quotation.totalAmount, // Assuming no VAT deduction initially
        items: {
          create: quotation.items.map(qi => ({
            quantity: qi.quantityAvailable || qi.canvassItem.quantityRequired,
            unitCost: qi.unitCost,
            consolidatedBoqItemId: qi.canvassItem.consolidatedBoqItemId
          }))
        }
      }
    });

    // Update Canvass Form to indicate completion
    await prisma.canvassForm.update({
      where: { id: canvassId },
      data: { status: 'COMPLETED' }
    });

    return { success: true, poId: po.id };
  } catch (error: any) {
    console.error('Error generating PO:', error);
    return { success: false, error: error.message || 'Failed to generate PO' };
  }
}

export async function sendCanvassEmail(canvassId: string, supplierIds: string[]) {
  try {
    const session = await cookies();
    const sessionId = session.get('userId')?.value;

    const canvass = await prisma.canvassForm.findUnique({
      where: { id: canvassId },
      include: { mr: true }
    });

    if (!canvass) return { success: false, error: 'Canvass not found' };

    const suppliers = await prisma.supplier.findMany({
      where: { id: { in: supplierIds } }
    });

    // Simulate sending email (Network delay simulation)
    await new Promise(resolve => setTimeout(resolve, 1500));

    return { 
      success: true, 
      message: `Canvass form successfully emailed to ${suppliers.length} supplier(s).` 
    };
  } catch (error: any) {
    console.error('Error sending canvass email:', error);
    return { success: false, error: error.message || 'Failed to send emails' };
  }
}

export async function approveCanvassRecommendation(canvassId: string) {
  try {
    const session = await cookies();
    const sessionId = session.get('session')?.value;
    
    if (!sessionId) {
      return { success: false, error: 'Unauthorized' };
    }

    const canvass = await prisma.canvassForm.findUnique({
      where: { id: canvassId }
    });

    if (!canvass) return { success: false, error: 'Canvass not found' };
    if (!canvass.recommendedSupplierId) return { success: false, error: 'No recommended supplier to approve.' };

    await prisma.canvassForm.update({
      where: { id: canvassId },
      data: { status: 'APPROVED' }
    });

    return { success: true, message: 'AI Recommendation Approved successfully.' };
  } catch (error: any) {
    console.error('Error approving canvass recommendation:', error);
    return { success: false, error: error.message || 'Failed to approve recommendation' };
  }
}

export async function endorseCanvassRecommendation(canvassId: string) {
  try {
    const session = await cookies();
    const sessionId = session.get('session')?.value;
    
    if (!sessionId) {
      return { success: false, error: 'Unauthorized' };
    }

    const canvass = await prisma.canvassForm.findUnique({
      where: { id: canvassId }
    });

    if (!canvass) return { success: false, error: 'Canvass not found' };
    if (!canvass.recommendedSupplierId) return { success: false, error: 'No recommended supplier to endorse.' };

    await prisma.canvassForm.update({
      where: { id: canvassId },
      data: { status: 'ENDORSED' }
    });

    return { success: true, message: 'AI Recommendation Endorsed successfully.' };
  } catch (error: any) {
    console.error('Error endorsing canvass recommendation:', error);
    return { success: false, error: error.message || 'Failed to endorse recommendation' };
  }
}



export async function deleteCanvass(canvassId: string) {
  try {
    const session = await cookies();
    const sessionId = session.get('session')?.value || session.get('userId')?.value;
    const simulatedRole = session.get('simulatedRole')?.value;
    if (!sessionId) throw new Error('Unauthorized');
    const user = await prisma.user.findUnique({ where: { id: sessionId } });
    if (!user) throw new Error('User not found');
    const role = simulatedRole || user.role;
    if (role !== 'SUPER_ADMIN') throw new Error('Unauthorized: Only SUPER_ADMIN can delete canvass forms');
    await prisma.canvassForm.delete({ where: { id: canvassId } });
    const { revalidatePath } = require('next/cache');
    revalidatePath('/procurement/canvassing');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting canvass:', error);
    throw new Error(error.message || 'Failed to delete canvass');
  }
}

export async function updateSupplierQuotation(quotationId: string, supplierId: string, items: any[]) {
  try {
    await prisma.quotationItem.deleteMany({ where: { quotationId } });
    const totalAmount = items.reduce((acc, item) => acc + (item.unitCost * item.quantityAvailable), 0);
    await prisma.supplierQuotation.update({
      where: { id: quotationId },
      data: {
        supplierId,
        totalAmount,
        items: {
          create: items.map(item => ({
            canvassItemId: item.canvassItemId,
            unitCost: item.unitCost,
            quantityAvailable: item.quantityAvailable,
            totalCost: item.unitCost * item.quantityAvailable,
            brand: item.brand,
            remarks: item.remarks
          }))
        }
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating quotation:', error);
    return { success: false, error: error.message || 'Failed to update quotation' };
  }
}
