'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { requirePermission } from '@/lib/permissions';
import { submitTransaction, approveTransaction } from '@/lib/workflow';
import { validateTransactionWithAI } from './aiValidationActions';

export async function createPOFromMRF(mrId: string, items: { consolidatedBoqItemId: string, quantity: number, unitCost: number, supplierId: string }[]) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  
  if (!sessionId) {
    throw new Error('Not authenticated');
  }

  const currentUser = await prisma.user.findUnique({ where: { id: sessionId }});
  if (!currentUser) throw new Error('User not found');

  await requirePermission(currentUser.id, 'PURCHASE_ORDER', 'canCreate');

  // Group items by supplierId
  const supplierGroups = items.reduce((groups: Record<string, any[]>, item) => {
    if (!groups[item.supplierId]) {
      groups[item.supplierId] = [];
    }
    groups[item.supplierId].push(item);
    return groups;
  }, {});

  // === AI VALIDATION INTERCEPTOR ===
  const validation = await validateTransactionWithAI(
    'Purchase Order Generation',
    {
      action: 'Generate Purchase Orders from MRF',
      mrId,
      itemsToProcure: items
    },
    currentUser.id,
    currentUser.role || 'PURCHASING_OFFICER'
  );

  if (validation.validationStatus === 'BLOCKING ISSUE') {
    return { 
      success: false, 
      error: `AI Blocked Transaction: ${validation.findings}`,
      validationLogId: validation.validationLogId 
    };
  }
  // =================================

  const createdPOIds = [];
  
  // Get current PO count for numbering
  let count = await prisma.purchaseOrder.count();

  // Create a PO for each supplier
  for (const supplierId of Object.keys(supplierGroups)) {
    const supplierItems = supplierGroups[supplierId];
    
    // Fetch supplier to check VAT status
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    const isVatable = supplier?.isVatable ?? false;

    const totalAmount = supplierItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);
    
    let netAmount = totalAmount;
    let vatAmount = 0;

    if (isVatable) {
      // Government accepted formula: Gross Amount / 1.12 = Vatable Amount (Net Amount)
      netAmount = totalAmount / 1.12;
      vatAmount = totalAmount - netAmount; // Equivalent to netAmount * 0.12
    }
    
    count++;
    const poNumber = `PO-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        status: 'FOR_REVIEW', // Sends it to Project Director
        supplierId,
        mrId,
        preparerId: sessionId,
        totalAmount,
        netAmount,
        vatAmount,
        items: {
          create: supplierItems.map(item => ({
            quantity: item.quantity,
            unitCost: item.unitCost,
            consolidatedBoqItemId: item.consolidatedBoqItemId
          }))
        }
      }
    });

    // Enforce Workflow Submission
    await submitTransaction(currentUser.id, currentUser.role || 'PURCHASING_OFFICER', 'PURCHASE_ORDER', po.id);
    
    createdPOIds.push(po.id);
  }

  // Mark MRF as procured
  await prisma.materialRequest.update({
    where: { id: mrId },
    data: { status: 'FULLY_PROCURED' }
  });

  revalidatePath('/procurement/purchase-orders');
  revalidatePath('/material-requests');
  
  return { success: true, createdPOIds };
}

export async function approvePurchaseOrder(poId: string) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  
  if (!sessionId) throw new Error('Not authenticated');

  const currentUser = await prisma.user.findUnique({ where: { id: sessionId }});
  if (!currentUser) throw new Error('User not found');

  await requirePermission(currentUser.id, 'PURCHASE_ORDER', 'canApprove');

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: {
      items: true,
      mr: true,
      supplier: true
    }
  });
  if (!po) throw new Error('PO not found');

  // Maker-Checker specific to PO logic
  if (po.preparerId === currentUser.id && currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
    throw new Error('Self-approval blocked by Workflow Engine.');
  }

  await prisma.purchaseOrder.update({
    where: { id: poId },
    data: {
      status: 'APPROVED',
      approverId: currentUser.id
    }
  });

  // [HOOK] Create CommitmentLedger entries for each item
  if (po.mr && po.mr.projectId) {
    for (const item of po.items) {
      if (item.consolidatedBoqItemId) {
        // Also update the committedCost on the Procurement Benchmark
        const lineTotal = item.quantity * item.unitCost;
        
        await prisma.commitmentLedger.create({
          data: {
            projectId: po.mr.projectId,
            consolidatedBoqItemId: item.consolidatedBoqItemId,
            commitmentType: 'PURCHASE_ORDER',
            supplierName: po.supplier?.name || '',
            approvedAmount: lineTotal,
            remainingCommitment: lineTotal,
            status: 'ACTIVE'
          }
        });

        await prisma.consolidatedBOQItem.update({
          where: { id: item.consolidatedBoqItemId },
          data: {
            committedCost: { increment: lineTotal }
          }
        });
      }
    }
  }

  await approveTransaction(currentUser.id, currentUser.role || 'PROJECT_DIRECTOR', 'PURCHASE_ORDER', po.id, 'Approved PO digitally');

  revalidatePath('/procurement/purchase-orders');
  return { success: true };
}

export async function submitPOForApproval(poId: string) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  
  if (!sessionId) throw new Error('Not authenticated');

  const currentUser = await prisma.user.findUnique({ where: { id: sessionId }});
  if (!currentUser) throw new Error('User not found');

  const po = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
  if (!po) throw new Error('PO not found');

  await prisma.purchaseOrder.update({
    where: { id: poId },
    data: { status: 'FOR_REVIEW' }
  });

  await submitTransaction(currentUser.id, currentUser.role || 'PURCHASING_OFFICER', 'PURCHASE_ORDER', po.id);

  revalidatePath(`/procurement/purchase-orders/${poId}`);
  revalidatePath('/procurement/purchase-orders');
  return { success: true };
}

