'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/permissions';
import { submitTransaction, approveTransaction } from '@/lib/workflow';
import { validateTransactionWithAI } from './aiValidationActions';

export async function encodeDelivery(data: {
  poId: string;
  receiptNumber: string;
  items: { consolidatedBoqItemId: string; quantity: number; drQuantity: number; remarks: string }[];
  drDocumentText?: string;
  proofFileUrl?: string;
}) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  if (!sessionId) throw new Error('Unauthorized');

  const user = await prisma.user.findUnique({ where: { id: sessionId } });
  if (!user) throw new Error('User not found');

  await requirePermission(user.id, 'DELIVERY_RECEIVING', 'canCreate');

  // Check for mismatches and generate notes
  const mismatchedItems = data.items.filter(item => item.quantity !== item.drQuantity);
  const isMismatch = mismatchedItems.length > 0;
  
  let mismatchNotes = null;
  if (isMismatch) {
    // Fetch item descriptions to build a readable footnote
    const itemIds = mismatchedItems.map(i => i.consolidatedBoqItemId);
    const boqItems = await prisma.consolidatedBOQItem.findMany({
      where: { id: { in: itemIds } }
    });
    
    mismatchNotes = mismatchedItems.map(item => {
      const boq = boqItems.find(b => b.id === item.consolidatedBoqItemId);
      const diff = item.drQuantity - item.quantity;
      return `${diff > 0 ? 'Missing' : 'Over-delivered'} ${Math.abs(diff)} of ${boq?.description || 'Unknown Item'} (Reason: ${item.remarks})`;
    }).join(' | ');
  }

  // === AI VALIDATION INTERCEPTOR ===
  const validation = await validateTransactionWithAI(
    'Delivery Receiving',
    {
      action: 'Encode Delivery Receipt',
      poId: data.poId,
      receiptNumber: data.receiptNumber,
      isMismatch,
      mismatchNotes,
      items: data.items,
      attachedDocumentOCR: data.drDocumentText || 'No document attached.'
    },
    user.id,
    user.role || 'STOCKMAN'
  );

  if (validation.validationStatus === 'BLOCKING ISSUE') {
    return { 
      success: false, 
      error: `AI Blocked Transaction: ${validation.findings}`,
      validationLogId: validation.validationLogId 
    };
  }
  // =================================

  const delivery = await prisma.delivery.create({
    data: {
      poId: data.poId,
      receiptNumber: data.receiptNumber,
      status: 'FOR_ACCOUNTANT_APPROVAL',
      receivedById: user.id,
      proofFileUrl: data.proofFileUrl,
      isMismatch,
      mismatchNotes,
      items: {
        create: data.items.map(item => ({
          quantity: item.quantity,
          drQuantity: item.drQuantity,
          remarks: item.remarks,
          consolidatedBoqItemId: item.consolidatedBoqItemId,
        }))
      }
    }
  });

  await submitTransaction(user.id, user.role || 'STOCKMAN', 'DELIVERY_RECEIVING', delivery.id);

  revalidatePath('/deliveries');
  revalidatePath('/inventory');
  return { success: true, deliveryId: delivery.id };
}

export async function approveDelivery(deliveryId: string) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  if (!sessionId) throw new Error('Unauthorized');

  const user = await prisma.user.findUnique({ where: { id: sessionId } });
  if (!user) throw new Error('User not found');

  await requirePermission(user.id, 'DELIVERY_RECEIVING', 'canApprove');

  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: { 
      items: {
        include: { consolidatedBoqItem: true }
      },
      po: {
        include: { supplier: true, items: true }
      }
    }
  });

  if (!delivery || delivery.status !== 'FOR_ACCOUNTANT_APPROVAL') {
    throw new Error('Invalid delivery status');
  }

  // Transaction to update Delivery status and ConsolidatedBOQItem actualDeliveredQuantity
  await prisma.$transaction(async (tx) => {
    await tx.delivery.update({
      where: { id: deliveryId },
      data: {
        status: 'APPROVED',
        approverId: user.id
      }
    });

    for (const item of delivery.items) {
      await tx.consolidatedBOQItem.update({
        where: { id: item.consolidatedBoqItemId },
        data: {
          deliveredQty: {
            increment: item.quantity
          }
        }
      });
    }

    // Calculate total payable amount based on actual quantities delivered and PO unit costs
    const totalAmount = delivery.items.reduce((sum, item) => {
      const poItem = delivery.po.items.find(i => i.consolidatedBoqItemId === item.consolidatedBoqItemId);
      const unitCost = poItem ? poItem.unitCost : item.consolidatedBoqItem.unitCost;
      return sum + (item.quantity * unitCost);
    }, 0);

    // Calculate due date based on supplier payment terms
    let termDays = 0;
    if (delivery.po.supplier.paymentTerms) {
      // Extract numbers from terms like "30 Days", "15 days", etc.
      const match = delivery.po.supplier.paymentTerms.match(/(\d+)/);
      if (match) {
        termDays = parseInt(match[1], 10);
      }
    }
    
    // Add terms to the delivery date
    const dueDate = new Date(delivery.createdAt);
    dueDate.setDate(dueDate.getDate() + termDays);

    // Compute VAT based on Supplier
    let calculatedNetAmount = totalAmount;
    let calculatedVatAmount = 0;
    if (delivery.po.supplier.isVatable) {
      calculatedNetAmount = totalAmount / 1.12;
      calculatedVatAmount = totalAmount - calculatedNetAmount;
    }

    const count = await tx.accountsPayable.count();
    const voucherNumber = `PV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Create AccountsPayable record
    await tx.accountsPayable.create({
      data: {
        voucherNumber: voucherNumber,
        amount: totalAmount,
        netAmount: calculatedNetAmount,
        vatAmount: calculatedVatAmount,
        dueDate: dueDate,
        status: 'PENDING',
        deliveryId: delivery.id,
        poId: delivery.poId,
        supplierId: delivery.po.supplierId,
      }
    });

  });

  // Call the Maker-Checker workflow engine
  await approveTransaction(user.id, user.role || 'PROJECT_ACCOUNTANT', 'DELIVERY_RECEIVING', deliveryId, 'Approved Delivery');

  revalidatePath(`/deliveries/${deliveryId}`);
  revalidatePath('/deliveries');
  revalidatePath('/inventory');
  return { success: true };
}

import fs from 'fs';
import path from 'path';
import { verifyDeliveryDocumentWithAI } from './aiValidationActions';

export async function encodeDeliveryWithFile(formData: FormData) {
  try {
    const poId = formData.get('poId') as string;
    const receiptNumber = formData.get('receiptNumber') as string;
    const itemsStr = formData.get('items') as string;
    const items = JSON.parse(itemsStr);
    const file = formData.get('file') as File | null;
    const noFileReason = formData.get('noFileReason') as string | null;

    let drDocumentText = noFileReason ? `No document uploaded. Reason provided by user: ${noFileReason}` : 'No document uploaded.';
    let proofFileUrl: string | undefined;

    if (file && file.size > 0) {
      // 1. Save file locally
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${Date.now()}-${file.name}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'deliveries');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);
      
      proofFileUrl = `/uploads/deliveries/${fileName}`;

      // 2. Prepare data for AI Vision matching
      const po = await prisma.purchaseOrder.findUnique({
        where: { id: poId },
        include: { supplier: true }
      });

      if (!po) throw new Error("PO not found for AI Verification");

      const itemIds = items.map((i: any) => i.consolidatedBoqItemId);
      const boqItems = await prisma.consolidatedBOQItem.findMany({
        where: { id: { in: itemIds } }
      });

      const poDetails = {
        poNumber: po.poNumber,
        supplierName: po.supplier.name,
        items: items.map((i: any) => {
          const b = boqItems.find(b => b.id === i.consolidatedBoqItemId);
          return {
            description: b?.description || 'Unknown',
            quantity: i.quantity,
            drQuantity: i.drQuantity
          }
        })
      };

      // 3. Call Gemini Vision
      const visionResult = await verifyDeliveryDocumentWithAI(buffer, file.type, poDetails);

      if (!visionResult.matches) {
        // Intercept and return error immediately
        return { 
          success: false, 
          error: `AI Document Mismatch: ${visionResult.findings}`,
          // Also generate a validation log ID for the override request feature if you want, or just fail it hard
          validationLogId: null 
        };
      }

      drDocumentText = `[AI EXTRACTED OCR & VISION MATCH PASSED]: ${visionResult.findings}`;
    }

    return await encodeDelivery({
      poId,
      receiptNumber,
      items,
      drDocumentText,
      proofFileUrl
    });
  } catch (error: any) {
    console.error('Error encoding delivery with file:', error);
    return { success: false, error: error.message || 'Failed to process file and encode delivery.' };
  }
}

export async function uploadDelayedDeliveryProof(formData: FormData) {
  try {
    const deliveryId = formData.get('deliveryId') as string;
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) throw new Error('No file provided');

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        po: { include: { supplier: true } },
        items: { include: { consolidatedBoqItem: true } }
      }
    });

    if (!delivery) throw new Error('Delivery not found');

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-delayed-${file.name}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'deliveries');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    const proofFileUrl = `/uploads/deliveries/${fileName}`;

    // Prepare data for AI Vision matching
    const poDetails = {
      poNumber: delivery.po.poNumber,
      supplierName: delivery.po.supplier.name,
      items: delivery.items.map((i: any) => ({
        description: i.consolidatedBoqItem.description,
        quantity: i.quantity,
        drQuantity: i.drQuantity
      }))
    };

    // Call Gemini Vision
    const visionResult = await verifyDeliveryDocumentWithAI(buffer, file.type, poDetails);

    if (!visionResult.matches) {
      return { 
        success: false, 
        error: `AI Document Mismatch: ${visionResult.findings}`
      };
    }

    // Update the delivery with the new proof
    await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        proofFileUrl: proofFileUrl,
        hasProof: true
      }
    });

    revalidatePath(`/deliveries/${deliveryId}`);
    return { success: true, proofFileUrl };
  } catch (error: any) {
    console.error('Error uploading delayed delivery proof:', error);
    return { success: false, error: error.message || 'Failed to process delayed file upload.' };
  }
}
