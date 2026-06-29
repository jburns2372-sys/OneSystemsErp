'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
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

export async function getAllClientVariationOrders() {
  try {
    const cookieStore = await cookies();
    const activeProjectId = cookieStore.get('activeProjectId')?.value;

    const vos = await prisma.variationOrder.findMany({
      where: {
        ...(activeProjectId ? { projectId: activeProjectId } : {}),
        OR: [
          { variationCategory: null },
          { variationCategory: '' },
          { variationCategory: 'MAIN_CONTRACT' },
          { variationCategory: 'CLIENT' }
        ]
      },
      include: {
        items: true,
        project: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return vos;
  } catch (error: any) {
    throw new Error('Failed to fetch Client Variation Orders: ' + error.message);
  }
}

export async function getAllSubcontractorVariationOrders(projectId?: string) {
  try {
    const cookieStore = await cookies();
    const activeProjectId = cookieStore.get('activeProjectId')?.value;

    const vos = await prisma.variationOrder.findMany({
      where: {
        variationCategory: 'SUBCONTRACTOR',
        ...((projectId || activeProjectId) ? { projectId: projectId || activeProjectId } : {})
      },
      include: {
        items: true,
        project: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return vos;
  } catch (error: any) {
    throw new Error('Failed to fetch Subcontractor Variation Orders: ' + error.message);
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

export async function getProjectAwardedBOQItems(projectId: string) {
  try {
    return await prisma.awardedBOQItem.findMany({
      where: { projectId },
      orderBy: { itemCode: 'asc' }
    });
  } catch (error: any) {
    throw new Error('Failed to fetch BOQ items: ' + error.message);
  }
}

export async function createVariationOrder(data: any) {
  try {
    if (data.variationCategory === 'SUBCONTRACTOR' && data.subcontractPackageId) {
       const existingActiveVO = await prisma.variationOrder.findFirst({
         where: {
           subcontractPackageId: data.subcontractPackageId,
           currentStatus: { notIn: ['APPROVED', 'REJECTED'] }
         }
       });
       if (existingActiveVO) {
         throw new Error(`Package already has an active variation order (${existingActiveVO.voNumber}) that is currently ${existingActiveVO.currentStatus}. Please finalize it before creating a new one.`);
       }
    }

    // Generate Sequence Number
    const count = await prisma.variationOrder.count({
      where: { projectId: data.projectId, createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) } }
    });
    
    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw new Error('Project not found');
    
    let originalContractAmount = project.contractAmount || 0;
    if (data.variationCategory === 'SUBCONTRACTOR' && data.subcontractPackageId) {
      const pkg = await prisma.subcontractPackage.findUnique({ where: { id: data.subcontractPackageId } });
      if (pkg) originalContractAmount = pkg.contractAmount;
    }

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
        subcontractPackageId: data.subcontractPackageId || null,
        voNumber,
        originalContractAmount,
      }
    });
    
    revalidatePath(`/projects/${data.projectId}`);
    revalidatePath(`/variation-orders`);
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

export async function deleteVariationOrderItem(itemId: string, voId: string) {
  try {
    await prisma.variationOrderItem.delete({
      where: { id: itemId }
    });
    await recalculateVariationOrderTotals(voId);
    return true;
  } catch (error: any) {
    throw new Error('Failed to delete BOQ item: ' + error.message);
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
    const approvedVosWhere: any = {
      projectId: vo.projectId,
      currentStatus: 'APPROVED'
    };
    if (vo.variationCategory === 'SUBCONTRACTOR' && vo.subcontractPackageId) {
      approvedVosWhere.subcontractPackageId = vo.subcontractPackageId;
    } else {
      approvedVosWhere.variationCategory = { not: 'SUBCONTRACTOR' };
    }

    const approvedVos = await prisma.variationOrder.findMany({
      where: approvedVosWhere
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
       const vo = await prisma.variationOrder.findUnique({ where: { id: voId } });
       if (vo?.variationCategory === 'SUBCONTRACTOR') {
         await applyVariationOrderToSubcontractPackage(voId);
         await applyVariationOrderToConsolidatedBOQ(voId);
       } else {
         await applyVariationOrderToConsolidatedBOQ(voId);
         await applyVariationOrderToAwardedBOQ(voId);
         await applyVariationOrderToSchedule(voId);
       }
    }
    
    revalidatePath(`/variation-orders/${voId}`);
    return updated;
  } catch (error: any) {
    throw new Error('Failed to process approval: ' + error.message);
  }
}

/**
 * When a Subcontractor VO is approved, apply its impacts to the SubcontractPackage
 */
async function applyVariationOrderToSubcontractPackage(voId: string) {
  const vo = await prisma.variationOrder.findUnique({
    where: { id: voId }
  });
  if (!vo || !vo.subcontractPackageId) return;

  const pkg = await prisma.subcontractPackage.findUnique({
    where: { id: vo.subcontractPackageId }
  });
  if (!pkg) return;

  const newContractAmount = pkg.contractAmount + (vo.netVariationAmount || 0);

  await prisma.subcontractPackage.update({
    where: { id: vo.subcontractPackageId },
    data: {
      contractAmount: newContractAmount
    }
  });

  // [HOOK] Create CommitmentLedger for Subcontractor VO
  if (pkg.consolidatedBoqItemId && (vo.netVariationAmount || 0) !== 0) {
    await prisma.commitmentLedger.create({
      data: {
        projectId: vo.projectId,
        consolidatedBoqItemId: pkg.consolidatedBoqItemId,
        commitmentType: 'SUBCONTRACT',
        approvedAmount: vo.netVariationAmount || 0,
        remainingCommitment: vo.netVariationAmount || 0,
        status: 'ACTIVE'
      }
    });

    await prisma.consolidatedBOQItem.update({
      where: { id: pkg.consolidatedBoqItemId },
      data: {
        committedCost: { increment: vo.netVariationAmount || 0 }
      }
    });
  }
}

/**
 * When a VO is fully approved, apply its impacts to the Consolidated BOQ:
 * - BOQ_ADJUSTMENT items: find matching consolidated item and update voAdditiveQty / voDeductiveQty
 * - ADDITIONAL_WORK items: create a new ConsolidatedBOQItem flagged isVariationItem=true
 */
async function applyVariationOrderToConsolidatedBOQ(voId: string) {
  const vo = await prisma.variationOrder.findUnique({
    where: { id: voId },
    include: { items: true, project: true }
  });
  if (!vo) return;

  for (const item of vo.items) {
    if (item.itemClassification === 'ADDITIONAL_WORK' || item.itemClassification === 'NEW_ITEM') {
      // Create a brand-new consolidated BOQ entry for this additional work
      const itemCount = await prisma.consolidatedBOQItem.count({ where: { projectId: vo.projectId } });
      const newItemCode = `VO-${String(itemCount + 1).padStart(3, '0')}`;

      await prisma.consolidatedBOQItem.create({
        data: {
          itemCode: newItemCode,
          category: item.workCategory || 'Variation Order',
          description: item.description,
          unit: item.unit,
          quantity: 0, // original quantity is zero (new item)
          unitCost: item.approvedUnitCost,
          totalCost: 0, // original total is zero
          voAdditiveQty: item.revisedQuantity,
          voDeductiveQty: 0,
          revisedQuantity: item.revisedQuantity,
          voAdditiveCost: item.additionalAmount,
          voDeductiveCost: 0,
          revisedTotalCost: item.additionalAmount,
          isVariationItem: true,
          sourceVoNumber: vo.voNumber,
          status: 'PENDING',
          projectId: vo.projectId
        }
      });
    } else {
      // BOQ_ADJUSTMENT: try to match to an existing consolidated item by description
      const matchingItem = await prisma.consolidatedBOQItem.findFirst({
        where: {
          projectId: vo.projectId,
          description: { contains: item.description.trim().substring(0, 30) }
        }
      });

      if (matchingItem) {
        const addQty = item.additionalAmount > 0 ? (item.revisedQuantity - item.originalQuantity) : 0;
        const dedQty = item.deductiveAmount > 0 ? (item.originalQuantity - item.revisedQuantity) : 0;

        const newAdditiveQty = matchingItem.voAdditiveQty + Math.max(0, addQty);
        const newDeductiveQty = matchingItem.voDeductiveQty + Math.max(0, dedQty);
        const revisedQty = matchingItem.quantity + newAdditiveQty - newDeductiveQty;
        const revisedCost = revisedQty * matchingItem.unitCost;

        await prisma.consolidatedBOQItem.update({
          where: { id: matchingItem.id },
          data: {
            voAdditiveQty: newAdditiveQty,
            voDeductiveQty: newDeductiveQty,
            revisedQuantity: revisedQty,
            voAdditiveCost: matchingItem.voAdditiveCost + Math.max(0, item.additionalAmount),
            voDeductiveCost: matchingItem.voDeductiveCost + Math.max(0, item.deductiveAmount),
            revisedTotalCost: revisedCost,
            sourceVoNumber: matchingItem.sourceVoNumber
              ? `${matchingItem.sourceVoNumber}, ${vo.voNumber}`
              : vo.voNumber
          }
        });
      } else {
        // No match found — create as a variation item so it doesn't get lost
        const itemCount = await prisma.consolidatedBOQItem.count({ where: { projectId: vo.projectId } });
        const newItemCode = `VO-${String(itemCount + 1).padStart(3, '0')}`;

        const addQty = Math.max(0, item.revisedQuantity - item.originalQuantity);
        const dedQty = Math.max(0, item.originalQuantity - item.revisedQuantity);

        await prisma.consolidatedBOQItem.create({
          data: {
            itemCode: newItemCode,
            category: item.workCategory || 'Variation Order',
            description: item.description,
            unit: item.unit,
            quantity: item.originalQuantity,
            unitCost: item.approvedUnitCost,
            totalCost: item.originalAmount,
            voAdditiveQty: addQty,
            voDeductiveQty: dedQty,
            revisedQuantity: item.revisedQuantity,
            voAdditiveCost: item.additionalAmount,
            voDeductiveCost: item.deductiveAmount,
            revisedTotalCost: item.netAmount,
            isVariationItem: true,
            sourceVoNumber: vo.voNumber,
            status: 'PENDING',
            projectId: vo.projectId
          }
        });
      }
    }
  }

  // Revalidate the project page so the Consolidated BOQ tab refreshes
  revalidatePath(`/projects/${vo.projectId}`);
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
        packageNumber: `VO-${vo.voNumber}`,
        projectId: vo.projectId,
        contractAmount: vo.items.filter(i => itemIds.includes(i.id)).reduce((acc, i) => acc + i.subcontractCost, 0),
        status: 'DRAFT',
        scopeOfWork: 'Auto-generated from Variation Order'
      } as any
    });
    return pkg;
  } catch (error: any) {
    throw new Error('Failed to create Subcontract from VO: ' + error.message);
  }
}

export async function deleteVariationOrder(id: string) {
  try {
    const vo = await prisma.variationOrder.findUnique({
      where: { id },
      include: { items: true }
    });
    if (!vo) throw new Error('Variation Order not found');

    if (vo.currentStatus === 'APPROVED') {
      // Revert Subcontract Package
      if (vo.variationCategory === 'SUBCONTRACTOR' && vo.subcontractPackageId) {
        const pkg = await prisma.subcontractPackage.findUnique({ where: { id: vo.subcontractPackageId } });
        if (pkg) {
          await prisma.subcontractPackage.update({
            where: { id: pkg.id },
            data: { contractAmount: pkg.contractAmount - (vo.netVariationAmount || 0) }
          });
        }
      } else {
        // Revert Consolidated BOQ
        const relatedBoqItems = await prisma.consolidatedBOQItem.findMany({
          where: {
            projectId: vo.projectId,
            sourceVoNumber: { contains: vo.voNumber }
          }
        });

        for (const boqItem of relatedBoqItems) {
          if (boqItem.isVariationItem && boqItem.sourceVoNumber === vo.voNumber) {
            // Entirely generated by this VO -> delete
            await prisma.consolidatedBOQItem.delete({ where: { id: boqItem.id } });
          } else {
            // Existing item that was updated -> revert math
            const matchingVoItem = vo.items.find((i: any) => 
               boqItem.description.includes(i.description.trim().substring(0, 30))
            );

            if (matchingVoItem) {
              const addQty = matchingVoItem.additionalAmount > 0 ? (matchingVoItem.revisedQuantity - matchingVoItem.originalQuantity) : 0;
              const dedQty = matchingVoItem.deductiveAmount > 0 ? (matchingVoItem.originalQuantity - matchingVoItem.revisedQuantity) : 0;

              const revertedAdditiveQty = Math.max(0, boqItem.voAdditiveQty - addQty);
              const revertedDeductiveQty = Math.max(0, boqItem.voDeductiveQty - dedQty);
              const revertedRevisedQty = boqItem.quantity + revertedAdditiveQty - revertedDeductiveQty;
              const revertedRevisedCost = revertedRevisedQty * boqItem.unitCost;

              const cleanSource = boqItem.sourceVoNumber?.split(', ').filter((s: string) => s !== vo.voNumber).join(', ') || null;

              await prisma.consolidatedBOQItem.update({
                where: { id: boqItem.id },
                data: {
                  voAdditiveQty: revertedAdditiveQty,
                  voDeductiveQty: revertedDeductiveQty,
                  revisedQuantity: revertedRevisedQty,
                  voAdditiveCost: Math.max(0, boqItem.voAdditiveCost - matchingVoItem.additionalAmount),
                  voDeductiveCost: Math.max(0, boqItem.voDeductiveCost - matchingVoItem.deductiveAmount),
                  revisedTotalCost: revertedRevisedCost,
                  sourceVoNumber: cleanSource
                }
              });
            }
          }
        }
      }
    }

    // Cascading deletes
    await prisma.variationOrderItem.deleteMany({ where: { variationOrderId: id } });
    
    // Safely delete other relations if they exist
    try { await prisma.variationOrderApproval.deleteMany({ where: { variationOrderId: id } }); } catch (e) {}
    try { await prisma.variationOrderDocument.deleteMany({ where: { variationOrderId: id } }); } catch (e) {}
    try { await (prisma as any).aIValidationResult?.deleteMany({ where: { variationOrderId: id } }); } catch (e) {}

    await prisma.variationOrder.delete({
      where: { id }
    });

    revalidatePath(`/projects/${vo.projectId}`);
    revalidatePath(`/variation-orders`);
    return true;
  } catch (error: any) {
    throw new Error('Failed to force delete Variation Order: ' + error.message);
  }
}

export async function updateVariationOrderDetails(id: string, data: any) {
  try {
    const updated = await prisma.variationOrder.update({
      where: { id },
      data
    });
    return updated;
  } catch (error: any) {
    throw new Error('Failed to update Variation Order: ' + error.message);
  }
}

/**
 * When a non-subcontractor VO is fully approved, apply its impacts to the Project Schedule:
 * - Creates a "Client Variation Orders" WBS node if missing.
 * - ADDITIONAL_WORK items: create a new ScheduleActivity under this WBS.
 * - BOQ_ADJUSTMENT items: find matching ScheduleActivity and update plannedQuantity.
 */
async function applyVariationOrderToSchedule(voId: string) {
  const vo = await prisma.variationOrder.findUnique({
    where: { id: voId },
    include: { items: true }
  });
  if (!vo) return;

  const schedule = await prisma.projectSchedule.findUnique({
    where: { projectId: vo.projectId }
  });
  if (!schedule) return;

  // Find or create "Variation Orders" WBS Phase
  let voWbs = await prisma.scheduleWBS.findFirst({
    where: { scheduleId: schedule.id, name: 'Client Variation Orders' }
  });

  if (!voWbs) {
    // Try to find Construction Phase to nest under
    const constPhase = await prisma.scheduleWBS.findFirst({
      where: { scheduleId: schedule.id, code: 'CONST' }
    });

    const wbsCount = await prisma.scheduleWBS.count({ where: { scheduleId: schedule.id, parentId: constPhase?.id || null } });
    voWbs = await prisma.scheduleWBS.create({
      data: {
        scheduleId: schedule.id,
        parentId: constPhase?.id || null,
        code: `VO-PHASE`,
        name: 'Client Variation Orders',
        level: constPhase ? constPhase.level + 1 : 1,
        orderIndex: wbsCount + 1
      }
    });
  }

  for (const item of vo.items) {
    if (item.itemClassification === 'ADDITIONAL_WORK' || item.itemClassification === 'NEW_ITEM') {
        const newActivity = await prisma.scheduleActivity.create({
          data: {
            scheduleId: schedule.id,
            wbsId: voWbs.id,
            activityCode: `VO-${item.voItemNumber}`,
            name: item.description.substring(0, 100),
            description: item.description,
            plannedQuantity: item.revisedQuantity,
            unit: item.unit,
            status: 'NOT_STARTED'
          }
        });

        // Try to link it to the newly created AwardedBOQItem
        const newAwardedBoqItem = await prisma.awardedBOQItem.findFirst({
          where: {
            itemCode: `VO-${item.voItemNumber}`,
            // We don't have projectId directly on schedule, but vo.projectId is available
          }
        });
        
        if (newAwardedBoqItem) {
          await prisma.scheduleBOQMapping.create({
            data: {
              activityId: newActivity.id,
              awardedBoqItemId: newAwardedBoqItem.id,
              mappedQuantity: item.revisedQuantity,
              mappedWeight: 0
            }
          });
        }
      } else {
        // For Additive / Deductive, find an existing matching activity by name/description
        const matchingActivity = await prisma.scheduleActivity.findFirst({
          where: {
            scheduleId: schedule.id,
            name: { contains: item.description.trim().substring(0, 30) }
          }
        });

        if (matchingActivity) {
          const addQty = item.additionalAmount > 0 ? (item.revisedQuantity - item.originalQuantity) : 0;
          const dedQty = item.deductiveAmount > 0 ? (item.originalQuantity - item.revisedQuantity) : 0;
          const newPlannedQty = Math.max(0, matchingActivity.plannedQuantity + addQty - dedQty);

          await prisma.scheduleActivity.update({
            where: { id: matchingActivity.id },
            data: {
              plannedQuantity: newPlannedQty
            }
          });
        }
      }
    }
  }

/**
 * When a non-subcontractor VO is fully approved, apply its impacts to the Awarded BOQ (Client Contract):
 * - ADDITIONAL_WORK items: create a new AwardedBOQItem appended to the contract.
 * - BOQ_ADJUSTMENT items: find matching AwardedBOQItem and update revisedContractQuantity / revisedContractAmount.
 */
async function applyVariationOrderToAwardedBOQ(voId: string) {
  const vo = await prisma.variationOrder.findUnique({
    where: { id: voId },
    include: { items: true, project: true }
  });
  if (!vo) return;

  for (const item of vo.items) {
    if (item.itemClassification === 'ADDITIONAL_WORK' || item.itemClassification === 'NEW_ITEM') {
      // Create new Awarded BOQ Item
      await prisma.awardedBOQItem.create({
        data: {
          itemCode: `VO-${item.voItemNumber}`,
          category: item.workCategory || 'Variation Order',
          description: `${item.description} (VO)`,
          unit: item.unit || 'lot',
          quantity: 0, // Original contract quantity is 0
          directCost: 0,
          indirectCost: 0,
          combinedUnitCost: item.approvedUnitCost,
          totalCost: 0, // Original total cost is 0
          revisedContractQuantity: item.revisedQuantity,
          revisedContractUnitPrice: item.approvedUnitCost,
          revisedContractAmount: item.additionalAmount,
          approvedClientVoQuantity: item.revisedQuantity,
          projectId: vo.projectId
        }
      });
    } else {
      // BOQ_ADJUSTMENT (Additive/Deductive)
      const matchingItem = await prisma.awardedBOQItem.findFirst({
        where: {
          projectId: vo.projectId,
          description: { contains: item.description.trim().substring(0, 30) }
        }
      });

      if (matchingItem) {
        const addQty = item.additionalAmount > 0 ? (item.revisedQuantity - item.originalQuantity) : 0;
        const dedQty = item.deductiveAmount > 0 ? (item.originalQuantity - item.revisedQuantity) : 0;
        
        // Calculate the net VO quantity change
        const netVoQty = addQty - dedQty;
        const newApprovedVoQty = matchingItem.approvedClientVoQuantity + netVoQty;
        
        // Revised quantity is original + all approved VO quantities
        const revisedQty = matchingItem.quantity + newApprovedVoQty;
        const revisedAmount = revisedQty * (matchingItem.combinedUnitCost > 0 ? matchingItem.combinedUnitCost : item.approvedUnitCost);

        await prisma.awardedBOQItem.update({
          where: { id: matchingItem.id },
          data: {
            approvedClientVoQuantity: newApprovedVoQty,
            revisedContractQuantity: revisedQty,
            revisedContractAmount: revisedAmount,
            // Only update unit price if it was originally 0
            revisedContractUnitPrice: matchingItem.combinedUnitCost > 0 ? matchingItem.combinedUnitCost : item.approvedUnitCost
          }
        });
      }
    }
  }
}

