'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { 
  VariationOrder, 
  VariationOrderItem, 
  VariationOrderDocument, 
  VariationOrderApproval 
} from '@prisma/client';

export async function getAllVariationOrders() {
  try {
    const vos = await prisma.variationOrder.findMany({
      include: {
        items: true,
        project: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return vos;
  } catch (error: any) {
    throw new Error('Failed to fetch Variation Orders: ' + error.message);
  }
}

export async function getVariationOrders(projectId: string) {
  try {
    const vos = await prisma.variationOrder.findMany({
      where: { projectId },
      include: {
        items: true,
        documents: true,
        approvals: true,
        aiValidations: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return vos;
  } catch (error: any) {
    throw new Error('Failed to fetch Variation Orders: ' + error.message);
  }
}

export async function getVariationOrderById(id: string) {
  try {
    const vo = await prisma.variationOrder.findUnique({
      where: { id },
      include: {
        items: true,
        documents: true,
        approvals: true,
        aiValidations: true,
        project: true
      }
    });
    return vo;
  } catch (error: any) {
    throw new Error('Failed to fetch Variation Order details: ' + error.message);
  }
}

export async function createVariationOrder(data: any) {
  try {
    // Generate Sequence Number
    const count = await prisma.variationOrder.count({
      where: { projectId: data.projectId, createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) } }
    });
    
    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw new Error('Project not found');
    
    const year = new Date().getFullYear();
    const sequence = String(count + 1).padStart(4, '0');
    let prefix = 'VO';
    
    switch(data.variationType) {
      case 'Change Order': prefix = 'CO'; break;
      case 'Extra Work Order': prefix = 'EWO'; break;
      case 'Deductive Variation': prefix = 'DVO'; break;
      case 'Emergency Variation': prefix = 'EVO'; break;
      case 'Internal Cost Variation': prefix = 'ICV'; break;
    }
    
    const voNumber = `${prefix}-${project.contractNumber || 'PROJ'}-${year}-${sequence}`;

    const newVo = await prisma.variationOrder.create({
      data: {
        ...data,
        voNumber,
        originalContractAmount: project.contractAmount,
      }
    });
    
    revalidatePath(`/projects/${data.projectId}`);
    return newVo;
  } catch (error: any) {
    throw new Error('Failed to create Variation Order: ' + error.message);
  }
}

export async function addVariationOrderItem(voId: string, data: any) {
  try {
    const item = await prisma.variationOrderItem.create({
      data: {
        ...data,
        variationOrderId: voId
      }
    });

    // Update VO Headers
    await recalculateVariationOrderTotals(voId);
    return item;
  } catch (error: any) {
    throw new Error('Failed to add BOQ item: ' + error.message);
  }
}

export async function recalculateVariationOrderTotals(voId: string) {
  try {
    const vo = await prisma.variationOrder.findUnique({
      where: { id: voId },
      include: { items: true, project: true }
    });
    if (!vo) return;

    let totalAdditional = 0;
    let totalDeductive = 0;

    vo.items.forEach((item: VariationOrderItem) => {
      totalAdditional += item.additionalAmount;
      totalDeductive += item.deductiveAmount;
    });

    const netAmount = totalAdditional - totalDeductive;
    
    // Fetch previous approved VOs to compute Revised Contract
    const approvedVos = await prisma.variationOrder.findMany({
      where: { 
        projectId: vo.projectId, 
        approvalStatus: 'APPROVED' 
      }
    });

    let prevAdditive = 0;
    let prevDeductive = 0;
    approvedVos.forEach((v) => {
      prevAdditive += v.additionalAmount;
      prevDeductive += v.deductiveAmount;
    });

    const revisedContractAmount = vo.originalContractAmount + prevAdditive - prevDeductive + netAmount;
    const percentageImpact = vo.originalContractAmount > 0 ? (netAmount / vo.originalContractAmount) * 100 : 0;

    await prisma.variationOrder.update({
      where: { id: voId },
      data: {
        additionalAmount: totalAdditional,
        deductiveAmount: totalDeductive,
        netVariationAmount: netAmount,
        totalPreviouslyApprovedAdditive: prevAdditive,
        totalPreviouslyApprovedDeductive: prevDeductive,
        currentRevisedContractAmount: revisedContractAmount,
        percentageImpact
      }
    });

    revalidatePath(`/variation-orders/${voId}`);
  } catch (error: any) {
    throw new Error('Failed to recalculate VO totals: ' + error.message);
  }
}

export async function submitVariationOrder(id: string) {
  try {
    const updated = await prisma.variationOrder.update({
      where: { id },
      data: { currentStatus: 'SUBMITTED' }
    });
    revalidatePath(`/variation-orders/${id}`);
    return updated;
  } catch (error: any) {
    throw new Error('Failed to submit: ' + error.message);
  }
}

export async function approveVariationOrderStage(voId: string, stage: string, action: string, userId: string, remarks: string) {
  try {
    await prisma.variationOrderApproval.create({
      data: {
        variationOrderId: voId,
        stage,
        action,
        actionById: userId,
        remarks
      }
    });

    let nextStatus = 'PENDING';
    if (stage === 'TECHNICAL_REVIEW' && action === 'APPROVED') nextStatus = 'FOR_COSTING';
    if (stage === 'COST_REVIEW' && action === 'APPROVED') nextStatus = 'FOR_PM_REVIEW';
    if (stage === 'PM_REVIEW' && action === 'APPROVED') nextStatus = 'FOR_FINANCE_REVIEW';
    if (stage === 'FINANCE_REVIEW' && action === 'APPROVED') nextStatus = 'FOR_PD_APPROVAL';
    if (stage === 'PD_APPROVAL' && action === 'APPROVED') nextStatus = 'APPROVED';
    if (action === 'REJECTED') nextStatus = 'REJECTED';
    if (action === 'RETURNED') nextStatus = 'FOR_REVISION';

    const updateData: any = { currentStatus: nextStatus };
    if (nextStatus === 'APPROVED') {
      updateData.approvedForImplementation = true;
      updateData.approvedForProcurement = true;
      updateData.approvedForSubcontracting = true;
      updateData.approvedForJobOrder = true;
      updateData.approvedForBilling = true;
    }

    const updated = await prisma.variationOrder.update({
      where: { id: voId },
      data: updateData
    });
    
    // Recalculate if it becomes approved (to update revised contract globally)
    if (nextStatus === 'APPROVED') {
       await recalculateVariationOrderTotals(voId);
    }
    
    revalidatePath(`/variation-orders/${voId}`);
    return updated;
  } catch (error: any) {
    throw new Error('Failed to process approval: ' + error.message);
  }
}

export async function createMRFFromVO(voId: string, itemIds: string[], userId: string) {
  try {
    const vo = await prisma.variationOrder.findUnique({
      where: { id: voId },
      include: { items: true, project: true }
    });
    if (!vo) throw new Error('VO not found');
    if (!vo.approvedForProcurement) throw new Error('VO is not approved for procurement');

    const count = await prisma.materialRequest.count();
    const mrNumber = `MRF-${vo.project.contractNumber || 'PROJ'}-${String(count + 1).padStart(4, '0')}`;

    const mr = await prisma.materialRequest.create({
      data: {
        mrNumber,
        projectId: vo.projectId,
        requesterId: userId,
        purpose: `Materials for Variation Order: ${vo.voNumber}`,
        remarks: 'Auto-generated from Approved Variation Order',
        items: {
          create: vo.items.filter(i => itemIds.includes(i.id)).map(item => ({
            quantity: item.revisedQuantity, // Should be requested quantity
            consolidatedBoqItemId: item.originalBoqItemId || '' // Failsafe if it's a new item, we might need to handle this differently in a full implementation
          }))
        }
      }
    });
    return mr;
  } catch (error: any) {
    throw new Error('Failed to create MRF from VO: ' + error.message);
  }
}

export async function createSubcontractFromVO(voId: string, itemIds: string[]) {
  try {
    const vo = await prisma.variationOrder.findUnique({
      where: { id: voId },
      include: { items: true, project: true }
    });
    if (!vo) throw new Error('VO not found');
    if (!vo.approvedForSubcontracting) throw new Error('VO is not approved for subcontracting');

    // Minimal implementation for demonstration. Full implementation would map items.
    const pkg = await prisma.subcontractPackage.create({
      data: {
        packageName: `Subcontract for VO: ${vo.voNumber}`,
        projectId: vo.projectId,
        totalAmount: vo.items.filter(i => itemIds.includes(i.id)).reduce((acc, i) => acc + i.subcontractCost, 0),
        status: 'DRAFT',
        description: 'Auto-generated from Variation Order'
      }
    });
    return pkg;
  } catch (error: any) {
    throw new Error('Failed to create Subcontract from VO: ' + error.message);
  }
}
