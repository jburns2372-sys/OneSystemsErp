'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function autoConsolidateBOQ(projectId: string, force: boolean = false) {
  // Check if project benchmark is locked
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { procurementBenchmarkLocked: true }
  });

  if (!project?.procurementBenchmarkLocked) {
    throw new Error('Procurement Benchmark is not locked. Lock it first before generating Master Materials List.');
  }

  // Check if already consolidated
  const existing = await prisma.consolidatedBOQItem.count({
    where: { projectId }
  });

  if (existing > 0) {
    if (!force) {
      throw new Error('BOQ is already consolidated for this project.');
    } else {
      // Delete existing to allow regeneration
      await prisma.consolidatedBOQItem.deleteMany({
        where: { projectId }
      });
    }
  }

  const benchmarkItems = await prisma.procurementBenchmarkItem.findMany({
    where: { projectId }
  });

  if (benchmarkItems.length === 0) {
    throw new Error('No Procurement Benchmark items found to consolidate.');
  }

  // AI Grouping Logic: We group by category (old item code), description, and unit (ignoring case).
  // In a real full-scale AI engine, this would call an LLM or vector DB, 
  // but this heuristic accurately simulates grouping identical materials.
  const groups = new Map<string, any>();

  for (const item of benchmarkItems) {
    let oldItemCode = item.itemCode || 'N/A';
    if (oldItemCode === 'N/A' || oldItemCode.trim() === '') {
      oldItemCode = item.description.trim(); // Fallback category to description if missing
    }

    // Hardcoded rule: User specifically wants this lengthy string renamed to 'ACU PUMPS'
    if (oldItemCode.includes('5.0m pump Lift') || oldItemCode.includes('BDU513A450VE')) {
      oldItemCode = 'ACU PUMPS';
    }

    const currentDescClean = item.description.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    let finalDesc = item.description.trim();
    let finalUnit = item.unit.trim();
    
    // Attempt to find an existing fuzzy-matched group
    let matchedKey: string | null = null;
    let globalIsMatch = false;

    for (const [existingKey, group] of groups.entries()) {
      const existDescClean = group.description.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Fuzzy match logic
      let localIsMatch = false;
      if (currentDescClean === existDescClean && currentDescClean.length > 0) {
        localIsMatch = true;
      } else if (currentDescClean.length > 10 && existDescClean.length > 10 && Math.abs(currentDescClean.length - existDescClean.length) <= 2) {
        if (currentDescClean.startsWith(existDescClean.substring(0, 10)) || existDescClean.startsWith(currentDescClean.substring(0, 10))) {
          localIsMatch = true;
        }
      }

      if (localIsMatch) {
        matchedKey = existingKey;
        globalIsMatch = true;
        break;
      }
    }

    let key = matchedKey;

    if (!key) {
      // Create new group key
      key = `${oldItemCode.trim().toLowerCase()}|${finalDesc.toLowerCase()}`;
      groups.set(key, {
        itemCodePrefix: oldItemCode,
        description: finalDesc,
        unit: finalUnit,
        quantity: 0,
        totalCost: 0,
        unitCost: item.unitCost || 0,
        items: []
      });
    }

    const group = groups.get(key)!;

    // Prioritize "pcs" or "pc" over other units if a conflict exists in the group
    if (finalUnit.toLowerCase().includes('pc') && !group.unit.toLowerCase().includes('pc')) {
      group.unit = finalUnit;
    }
    
    // Combine total costs
    group.totalCost += item.totalCost;
    
    // If it's a lot, force quantity to 1. Otherwise, sum the quantities.
    if (group.unit.toLowerCase().includes('lot')) {
      group.quantity = 1;
    } else {
      group.quantity += item.quantity;
    }
    
    group.items.push(item);
  }

  let index = 1;

  // Use a transaction for safety with an increased timeout for large BOQs
  await prisma.$transaction(async (tx) => {
    for (const group of groups.values()) {
      const unitCost = group.unitCost || 0;
      
      const itemCodePrefix = group.itemCodePrefix || 'N/A';
      const consolidatedCode = `C${index.toString().padStart(3, '0')}`;
      index++;

      // Create the parent consolidated item
      const consolidated = await tx.consolidatedBOQItem.create({
        data: {
          projectId,
          itemCode: consolidatedCode,
          category: itemCodePrefix,
          description: group.description,
          unit: group.unit,
          quantity: group.quantity,
          unitCost: unitCost,
          totalCost: group.totalCost,
          status: 'PENDING' // Awaiting final approval from procurement
        }
      });

      // We no longer create BOQMapping here, as we are generating from ProcurementBenchmark
    }
  }, {
    maxWait: 20000, // 20 seconds to wait for a connection
    timeout: 120000  // 120 seconds timeout for the transaction itself
  });

  revalidatePath(`/projects/${projectId}`);
}
