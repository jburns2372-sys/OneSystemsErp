'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import * as xlsx from 'xlsx';
import { put } from '@vercel/blob';
import ExcelJS from 'exceljs';

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

  const itemsToInsert: any[] = [];
  for (const group of groups.values()) {
    // Exclude header rows or items with zero value from the consolidated list
    if (group.totalCost === 0 && group.quantity === 0) {
      continue;
    }

    const unitCost = group.unitCost || 0;
    
    const itemCodePrefix = group.itemCodePrefix || 'N/A';
    const consolidatedCode = `C${index.toString().padStart(3, '0')}`;
    index++;

    itemsToInsert.push({
      projectId,
      itemCode: consolidatedCode,
      category: itemCodePrefix,
      description: group.description,
      unit: group.unit,
      quantity: group.quantity,
      unitCost: unitCost,
      totalCost: group.totalCost,
      status: 'PENDING'
    });
  }

  if (itemsToInsert.length > 0) {
    await prisma.consolidatedBOQItem.createMany({
      data: itemsToInsert
    });
  }

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

  // Upload to Vercel Blob with fallback
  let blobUrl = '';
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`templates/${projectId}/master-materials-template.xlsx`, buffer, {
      access: 'public',
      addRandomSuffix: true,
    });
    blobUrl = blob.url;
  } else {
    console.warn("BLOB_READ_WRITE_TOKEN is missing. Falling back to local filesystem for upload.");
    const fs = require('fs');
    const path = require('path');
    try {
      const dir = path.join(process.cwd(), 'public', 'uploads', 'templates', projectId);
      fs.mkdirSync(dir, { recursive: true });
      const safeName = `${Date.now()}-master-materials-template.xlsx`;
      const filePath = path.join(dir, safeName);
      fs.writeFileSync(filePath, buffer);
      blobUrl = `/uploads/templates/${projectId}/${safeName}`;
    } catch (err) {
      console.warn("Could not save file to local filesystem (likely Vercel read-only environment). Continuing without saving file.", err);
    }
  }

  // Remove existing templates for this project to keep it clean
  await prisma.document.deleteMany({
    where: { projectId, category: 'BOQ_TEMPLATE' }
  });

  // Save the template Document
  await prisma.document.create({
    data: {
      projectId,
      title: 'Master Materials Template',
      category: 'BOQ_TEMPLATE',
      fileUrl: blobUrl,
      fileType: materialsFile.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileSize: buffer.length
    }
  });

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

  // Insert items in bulk (much faster than individual creates in a transaction)
  if (parsedItems.length > 0) {
    await prisma.consolidatedBOQItem.createMany({ 
      data: parsedItems 
    });
  }

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

export async function downloadMasterMaterialsTemplate(projectId: string) {
  const templateDoc = await prisma.document.findFirst({
    where: { projectId, category: 'BOQ_TEMPLATE' },
    orderBy: { createdAt: 'desc' }
  });

  if (!templateDoc) {
    throw new Error('No BOQ template found for this project.');
  }

  const response = await fetch(templateDoc.fileUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch template file from storage.');
  }

  const arrayBuffer = await response.arrayBuffer();
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const sheet = workbook.worksheets[0];
  
  const consolidatedItems = await prisma.consolidatedBOQItem.findMany({
    where: { projectId }
  });

  const itemMap = new Map();
  consolidatedItems.forEach(item => {
    const descClean = item.description.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    itemMap.set(descClean, item);
  });

  let headerRowIndex = -1;
  let descColIndex = -1;
  let qtyColIndex = -1;
  let costColIndex = -1;

  sheet.eachRow((row, rowNumber) => {
    if (headerRowIndex === -1) {
      let hasDesc = false;
      row.eachCell((cell, colNumber) => {
        const val = cell.text?.toLowerCase() || '';
        if (val.includes('desc') || val.includes('item')) {
          hasDesc = true;
          descColIndex = colNumber;
        } else if (val.includes('qty') || val.includes('quantity')) {
          qtyColIndex = colNumber;
        } else if (val.includes('unit cost') || val.includes('price')) {
          costColIndex = colNumber;
        }
      });
      if (hasDesc) {
        headerRowIndex = rowNumber;
      }
    } else {
      if (descColIndex !== -1) {
        const descCell = row.getCell(descColIndex);
        const descVal = descCell.text?.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (descVal) {
          let matchedItem = itemMap.get(descVal);
          if (!matchedItem) {
             for (const [key, item] of itemMap.entries()) {
               if (descVal.length > 10 && key.length > 10 && Math.abs(descVal.length - key.length) <= 2) {
                 if (descVal.startsWith(key.substring(0, 10)) || key.startsWith(descVal.substring(0, 10))) {
                   matchedItem = item;
                   break;
                 }
               }
             }
          }

          if (matchedItem) {
            if (qtyColIndex !== -1) {
              row.getCell(qtyColIndex).value = matchedItem.quantity;
            }
            if (costColIndex !== -1) {
              row.getCell(costColIndex).value = matchedItem.unitCost;
            }
            row.commit();
          }
        }
      }
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString('base64');
}
