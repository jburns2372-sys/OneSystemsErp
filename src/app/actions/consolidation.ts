'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import * as xlsx from 'xlsx';

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

export async function uploadMasterMaterialsList(formData: FormData) {
  const projectId = formData.get('projectId') as string;
  const materialsFile = formData.get('materialsFile') as File | null;
  if (!materialsFile || materialsFile.size === 0) {
    throw new Error('No file uploaded');
  }

  // Clear existing items before uploading
  await prisma.consolidatedBOQItem.deleteMany({
    where: { projectId }
  });

  const buffer = Buffer.from(await materialsFile.arrayBuffer());
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });

  let headerRowIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row && Array.isArray(row) && row.some(cell => typeof cell === 'string' && (cell.toLowerCase().includes('description') || cell.toLowerCase().includes('item')))) {
      headerRowIndex = i;
      break;
    }
  }

  const groups = new Map<string, any>();

  if (headerRowIndex !== -1) {
    const headers = rows[headerRowIndex].map(h => (h || '').toString().toLowerCase().trim());
    
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !Array.isArray(row) || row.length === 0) continue;
      
      let itemCode = '';
      let itemDesc = '';
      let unit = '';
      let quantity = 0;
      let unitCost = 0;
      let category = '';

      headers.forEach((header, colIndex) => {
        const cellValue = row[colIndex];
        if (cellValue === undefined || cellValue === null) return;
        
        if (header.includes('item no') || header.includes('item code')) itemCode = cellValue.toString().trim();
        else if (header.includes('desc')) itemDesc = cellValue.toString().trim();
        else if (header === 'unit') unit = cellValue.toString().trim();
        else if (header.includes('qty') || header.includes('quantity')) {
          quantity = parseFloat(cellValue.toString().replace(/,/g, ''));
        }
        else if (header.includes('unit cost') || header.includes('price')) {
          unitCost = parseFloat(cellValue.toString().replace(/,/g, ''));
        }
        else if (header.includes('category')) category = cellValue.toString().trim();
      });

      if (itemDesc) {
        if (isNaN(quantity)) quantity = 0;
        if (isNaN(unitCost)) unitCost = 0;
        
        let oldItemCode = itemCode || 'N/A';
        if (oldItemCode === 'N/A' || oldItemCode.trim() === '') {
          oldItemCode = itemDesc;
        }

        if (oldItemCode.includes('5.0m pump Lift') || oldItemCode.includes('BDU513A450VE')) {
          oldItemCode = 'ACU PUMPS';
        }

        const currentDescClean = itemDesc.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        let finalDesc = itemDesc.trim();
        let finalUnit = unit.trim() || 'lot';

        let matchedKey: string | null = null;
        for (const [existingKey, group] of groups.entries()) {
          const existDescClean = group.description.toLowerCase().replace(/[^a-z0-9]/g, '');
          
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
            break;
          }
        }

        let key = matchedKey;
        if (!key) {
          key = `${oldItemCode.trim().toLowerCase()}|${finalDesc.toLowerCase()}`;
          groups.set(key, {
            itemCodePrefix: oldItemCode,
            category: category,
            description: finalDesc,
            unit: finalUnit,
            quantity: 0,
            totalCost: 0,
            unitCost: unitCost || 0,
          });
        }

        const group = groups.get(key)!;

        if (finalUnit.toLowerCase().includes('pc') && !group.unit.toLowerCase().includes('pc')) {
          group.unit = finalUnit;
        }
        
        const itemTotal = quantity * unitCost;
        group.totalCost += itemTotal;
        
        if (group.unit.toLowerCase().includes('lot')) {
          group.quantity = 1;
        } else {
          group.quantity += quantity;
        }
      }
    }
  }

  if (groups.size === 0) {
    throw new Error('No valid material items found in the uploaded file.');
  }

  const parsedItems: any[] = [];
  let index = 1;

  for (const group of groups.values()) {
    const consolidatedCode = `C${index.toString().padStart(3, '0')}`;
    parsedItems.push({
      projectId,
      itemCode: consolidatedCode,
      category: group.category || group.itemCodePrefix,
      description: group.description,
      unit: group.unit,
      quantity: group.quantity,
      unitCost: group.unitCost,
      totalCost: group.totalCost,
      status: 'PENDING'
    });
    index++;
  }

  // Insert items
  await prisma.$transaction(
    parsedItems.map(item => prisma.consolidatedBOQItem.create({ data: item }))
  );

  revalidatePath(`/projects/${projectId}`);
}

export async function addManualConsolidatedItem(data: {
  projectId: string;
  itemCode: string;
  category: string;
  description: string;
  unit: string;
  quantity: number;
  unitCost: number;
}) {
  const { projectId, itemCode, category, description, unit, quantity, unitCost } = data;

  await prisma.consolidatedBOQItem.create({
    data: {
      projectId,
      itemCode,
      category,
      description,
      unit,
      quantity,
      unitCost,
      totalCost: quantity * unitCost,
      status: 'PENDING'
    }
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function deleteMasterMaterialsList(projectId: string) {
  // Clear existing items
  await prisma.consolidatedBOQItem.deleteMany({
    where: { projectId }
  });

  // Optionally unlock the consolidated BOQ if it was locked
  await prisma.project.update({
    where: { id: projectId },
    data: { consolidatedBOQLocked: false }
  });

  revalidatePath(`/projects/${projectId}`);
}
