'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import * as xlsx from 'xlsx';
import { put } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenAI, Type, Schema } from '@google/genai';

async function parseBoqWithGemini(buffer: Buffer | null, mimeType: string, rawTextContent?: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "The name of the project" },
      location: { type: Type.STRING, description: "The location or address of the project" },
      contractAmount: { type: Type.NUMBER, description: "The total contract amount" },
      items: {
        type: Type.ARRAY,
        description: "List of Bill of Quantities (BOQ) line items",
        items: {
          type: Type.OBJECT,
          properties: {
            itemCode: { type: Type.STRING, description: "Item Number or Code" },
            description: { type: Type.STRING, description: "Description of work or item" },
            unit: { type: Type.STRING, description: "Unit of Measurement (e.g., cu.m, sq.m, lot, ls)" },
            quantity: { type: Type.NUMBER, description: "Quantity" },
            unitCost: { type: Type.NUMBER, description: "Unit Cost or Price" },
            totalCost: { type: Type.NUMBER, description: "Total Cost or Amount for this item" }
          }
        }
      }
    }
  };

  const parts: any[] = [
    { text: 'Extract the project details (name, location, total contract amount) and the detailed Bill of Quantities (BOQ) line items from this data. Ensure you capture all items accurately. STRICT RULES:\n1. Assign the numbering or item code exactly as it appears in the uploaded file to the "itemCode" field (column 1). Do not merge it into the description.\n2. Exclude irrelevant rows like "MATERIAL LABOR EQUIPMENT TOTAL" or standalone multipliers (e.g., 0.08, 0.05). Include header rows (e.g., "I. GENERAL REQUIREMENTS") as items with 0 cost/quantity so they appear as sections.' }
  ];

  if (rawTextContent) {
    parts.push({ text: `RAW EXCEL DATA:\n${rawTextContent}` });
  } else if (buffer && mimeType) {
    parts.push({ inlineData: { mimeType: mimeType, data: buffer.toString('base64') } });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: parts
      }
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: schema
    }
  });

  const rawJson = response.text || '{}';
  const result = JSON.parse(rawJson);

  // Normalize parsed items
  const items = (result.items || []).map((item: any) => {
    const quantity = Number(item.quantity) || 0;
    const unitCost = Number(item.unitCost) || 0;
    let totalCost = Number(item.totalCost) || 0;
    if (totalCost === 0 && quantity > 0 && unitCost > 0) {
      totalCost = quantity * unitCost;
    }
    return {
      itemCode: String(item.itemCode || ''),
      description: String(item.description || ''),
      unit: String(item.unit || ''),
      quantity,
      directCost: 0,
      indirectCost: 0,
      combinedUnitCost: unitCost,
      totalCost,
      status: 'PENDING',
      processingType: 'MATERIAL_EQUIPMENT'
    };
  });

  return {
    name: result.name || '',
    location: result.location || '',
    contractAmount: result.contractAmount || 0,
    items
  };
}


export async function createProject(formData: FormData) {
  const boqFile = formData.get('boqFile') as File | null;
  const managerId = formData.get('managerId') as string | null;
  const startDateStr = formData.get('startDate') as string | null;
  const durationDaysStr = formData.get('durationDays') as string | null;

  if (!boqFile || boqFile.size === 0) {
    throw new Error('No file uploaded');
  }

  let name = boqFile.name.replace(/\.[^/.]+$/, ""); // fallback to filename
  let location = 'Unknown Location';
  let description = `Automated Project Import from BOQ File: ${boqFile.name}`;
  let contractAmount = 0;
  
  let parsedItems: any[] = [];
  let savedFilePath = '';

  // Process file in memory for parsing
  const buffer = Buffer.from(await boqFile.arrayBuffer());
  
  description = `Automated Project Import from BOQ File: ${boqFile.name}`;

  const isPdfOrImage = boqFile.type === 'application/pdf' || boqFile.type.startsWith('image/');

  let aiResult: any;

  const mappedBoqJson = formData.get('mappedBoqJson') as string | null;

  if (mappedBoqJson) {
    try {
      const parsedClientItems = JSON.parse(mappedBoqJson);
      parsedItems = parsedClientItems;
      contractAmount = parsedItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
    } catch (e) {
      throw new Error('Failed to parse client-mapped BOQ data');
    }
  } else if (isPdfOrImage) {
    try {
      aiResult = await parseBoqWithGemini(buffer, boqFile.type);
    } catch (e: any) {
      if (e.message?.includes('RESOURCE_EXHAUSTED') || e.status === 429) {
        throw new Error('AI Processing Error: Your Gemini API credits have been depleted. Please upload an Excel file instead, which does not require AI to process.');
      }
      throw e;
    }
  } else {
    // Parse Excel file using LOCAL parser (0 API credits)
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });

    // 1. Extract Name and Location from the top ~20 rows
    for (let i = 0; i < Math.min(20, rows.length); i++) {
      const row = rows[i];
      if (!row || !Array.isArray(row)) continue;
      
      const cellStrings = row.map(cell => (cell || '').toString().trim());
      
      for (let j = 0; j < cellStrings.length; j++) {
        const cellText = (cellStrings[j] || '').toLowerCase();
        
        if (cellText.startsWith('project') && cellText !== 'project manager') {
          for (let k = j + 1; k < cellStrings.length; k++) {
            const nextCell = cellStrings[k] || '';
            if (nextCell && nextCell !== ':') {
              name = nextCell;
              break;
            }
          }
        }
        
        if (cellText.startsWith('location') || cellText.startsWith('address')) {
          for (let k = j + 1; k < cellStrings.length; k++) {
            const nextCell = cellStrings[k] || '';
            if (nextCell && nextCell !== ':') {
              location = nextCell;
              break;
            }
          }
        }
      }
    }

    // 2. Extract BOQ Items
    let headerRowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row && Array.isArray(row) && row.some(cell => typeof cell === 'string' && (cell.toLowerCase().includes('item no') || cell.toLowerCase().includes('description')))) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex !== -1) {
      const headers = rows[headerRowIndex].map(h => (h || '').toString().toLowerCase().trim());
      
      let currentSectionIndex = 0;

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !Array.isArray(row) || row.length === 0) continue;
        
        let itemCode = '';
        let itemDesc = '';
        let unit = '';
        let quantity = 0;
        let unitCost = 0;
        let totalCost = 0;
        
        for (let j = 0; j < headers.length; j++) {
          const h = headers[j];
          const val = row[j];
          if (!h || val == null) continue;
          
          if (h.includes('item')) itemCode = val;
          else if (h.includes('desc')) itemDesc = val;
          else if (h === 'unit cost' || h.includes('combined') || h.includes('price')) unitCost = parseFloat((val || '').toString()) || 0;
          else if (h === 'total cost' || h === 'amount') totalCost = parseFloat((val || '').toString()) || 0;
          else if (h.includes('unit') || h.includes('uom')) unit = val;
          else if (h === 'qty' || h.includes('quantity')) quantity = parseFloat((val || '').toString()) || 0;
        }
        
        quantity = isNaN(quantity) ? 0 : quantity;
        unitCost = isNaN(unitCost) ? 0 : unitCost;
        totalCost = isNaN(totalCost) ? 0 : totalCost;

        if (totalCost === 0) totalCost = quantity * unitCost;

        let isHeader = false;
        
        // If it's a major category header (like I. GENERAL REQUIREMENTS or II. EARTHWORKS)
        // They typically have no cost/quantity but might have it in the description.
        if (itemDesc && quantity === 0 && totalCost === 0 && !itemDesc.toUpperCase().includes('MATERIAL LABOR EQUIPMENT')) {
           // It's a header section. We should reset the item numbering.
           isHeader = true;
           currentSectionIndex = 0;
           
           // If the itemCode is completely missing, and the description looks like "I. GENERAL REQUIREMENTS",
           // let's try to extract the roman numeral or number from the description to itemCode if we want,
           // but the user just wants the items *under* it to have 1.0, 2.0. So resetting is enough.
        }

        // Apply auto-numbering for line items that have no itemCode but have quantity/cost
        if (!isHeader && (quantity > 0 || totalCost > 0) && !itemCode) {
           currentSectionIndex += 1;
           itemCode = `${currentSectionIndex}.0`;
           console.log('AUTO-NUMBERED:', itemDesc, '->', itemCode);
        }

        console.log('Evaluating row:', { itemCode, itemDesc, quantity, totalCost, isHeader });

        if (itemDesc && !itemDesc.toUpperCase().includes('MATERIAL LABOR EQUIPMENT') && (quantity > 0 || totalCost > 0 || isHeader)) {
          parsedItems.push({
            itemCode: String(itemCode || ''),
            description: String(itemDesc || ''),
            unit: String(unit || ''),
            quantity: quantity,
            directCost: 0,
            indirectCost: 0,
            combinedUnitCost: unitCost,
            totalCost: totalCost,
            status: 'PENDING',
            processingType: 'MATERIAL_EQUIPMENT'
          });
          
          // Accumulate contract amount automatically
          contractAmount += totalCost;
        }
      }
    }
  }

  if (aiResult) {
    if (aiResult.name) name = aiResult.name;
    if (aiResult.location) location = aiResult.location;
    if (aiResult.contractAmount) contractAmount = aiResult.contractAmount;
    parsedItems = aiResult.items;
    
    // Fallback if AI didn't compute total contract amount correctly
    if (contractAmount === 0 && parsedItems.length > 0) {
      contractAmount = parsedItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
    }
  }



  const contractAmountOverrideStr = formData.get('contractAmountOverride') as string | null;
  if (contractAmountOverrideStr && !isNaN(parseFloat(contractAmountOverrideStr))) {
    contractAmount = parseFloat(contractAmountOverrideStr);
  }

  let startDate: Date | null = null;
  let endDate: Date | null = null;
  let originalContractDuration: number | null = null;

  if (startDateStr) {
    startDate = new Date(startDateStr);
  }
  if (durationDaysStr) {
    originalContractDuration = parseInt(durationDaysStr);
    if (startDate && originalContractDuration) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + originalContractDuration);
    }
  }

  const project = await prisma.project.create({
    data: {
      name,
      description,
      location,
      contractAmount,
      status: 'ACTIVE',
      managerId: managerId || null,
      startDate,
      endDate,
      originalContractDuration,
      originalCompletionDate: endDate,
      awardedBoqItems: {
        create: parsedItems
      }
    }
  });

  revalidatePath('/projects');
  revalidatePath('/');
}

export async function uploadProcurementBenchmark(formData: FormData) {
  const projectId = formData.get('projectId') as string;
  const boqFile = formData.get('benchmarkFile') as File | null;
  if (!boqFile || boqFile.size === 0) {
    throw new Error('No file uploaded');
  }

  let parsedItems: any[] = [];
  const buffer = Buffer.from(await boqFile.arrayBuffer());

  // Parse Excel file
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });

  // Extract BOQ Items
  let headerRowIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row && Array.isArray(row) && row.some(cell => typeof cell === 'string' && (cell.toLowerCase().includes('item no') || cell.toLowerCase().includes('description')))) {
      headerRowIndex = i;
      break;
    }
  }

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
      let totalCost = 0;
      let category = '';
      
      for (let j = 0; j < headers.length; j++) {
        const h = headers[j];
        const val = row[j];
        if (!h || val == null) continue;
        
        if (h.includes('item')) itemCode = val;
        else if (h.includes('desc')) itemDesc = val;
        else if (h === 'unit cost' || h.includes('price')) unitCost = parseFloat((val || '').toString()) || 0;
        else if (h === 'total cost' || h === 'amount') totalCost = parseFloat((val || '').toString()) || 0;
        else if (h.includes('unit') || h.includes('uom')) unit = val;
        else if (h === 'qty' || h.includes('quantity')) quantity = parseFloat((val || '').toString()) || 0;
        else if (h.includes('cat')) category = val;
      }
      
      quantity = isNaN(quantity) ? 0 : quantity;
      unitCost = isNaN(unitCost) ? 0 : unitCost;
      totalCost = isNaN(totalCost) ? 0 : totalCost;

      if (totalCost === 0) totalCost = quantity * unitCost;

      const descUpper = String(itemDesc || '').toUpperCase();
      if (descUpper.includes('TOTAL PROJECT COST') || descUpper === 'GRAND TOTAL' || descUpper === 'TOTAL') {
        continue;
      }

      if (itemDesc && (quantity > 0 || totalCost > 0)) {
        parsedItems.push({
          projectId,
          itemCode: String(itemCode || ''),
          description: String(itemDesc || ''),
          category: String(category || ''),
          unit: String(unit || ''),
          quantity: quantity,
          unitCost: unitCost,
          totalCost: totalCost,
          status: 'PENDING'
        });
      }
    }
  }

  // Clear existing un-locked items and insert new ones
  await prisma.procurementBenchmarkItem.deleteMany({
    where: { projectId }
  });

  if (parsedItems.length > 0) {
    await prisma.procurementBenchmarkItem.createMany({
      data: parsedItems
    });
  }

  revalidatePath(`/projects/${projectId}`);
}

export async function createMaterialRequest(formData: FormData) {
  const projectId = formData.get('projectId') as string;
  const requestedById = formData.get('requestedById') as string;
  const description = formData.get('description') as string;
  
  // Create an MR, generating an automatic mrNumber
  const count = await prisma.materialRequest.count();
  const mrNumber = `MR-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

  await prisma.materialRequest.create({
    data: {
      mrNumber,
      projectId,
      requesterId: requestedById,
      status: 'DRAFT',
      remarks: description,
    }
  });

  revalidatePath('/material-requests');
  revalidatePath('/');
}

// Generate an MRF from selected Consolidated BOQ items
export async function generateMRFFromConsolidated(data: {
  projectId: string;
  requesterId: string;
  purpose: string;
  priority: string;
  locationOfUse: string;
  dateNeeded: string;
  remarks: string;
  items: { consolidatedBoqItemId: string; quantity: number; breakdownData?: any }[];
}) {
  const { projectId, requesterId, purpose, priority, locationOfUse, dateNeeded, remarks, items } = data;

  if (!items || items.length === 0) {
    throw new Error('No items selected for the material request.');
  }

  // Assign a temporary Draft ID until it passes AI Validation
  const mrNumber = `DRAFT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const mr = await prisma.materialRequest.create({
    data: {
      mrNumber,
      projectId,
      requesterId,
      status: 'DRAFT',
      purpose,
      priority,
      locationOfUse,
      remarks,
      dateNeeded: dateNeeded ? new Date(dateNeeded) : null,
      items: {
        create: items.map(item => ({
          consolidatedBoqItemId: item.consolidatedBoqItemId,
          quantity: item.quantity,
          breakdownData: item.breakdownData || null,
        })),
      },
    },
  });

  revalidatePath('/material-requests');
  revalidatePath(`/projects/${projectId}`);
  return mr.id;
}

// AI Validation for MRF (deterministic checks)
export async function runMRFAIValidation(mrId: string) {
  const mr = await prisma.materialRequest.findUnique({
    where: { id: mrId },
    include: {
      items: {
        include: {
          consolidatedBoqItem: true,
        },
      },
      project: true,
    },
  });

  if (!mr) throw new Error('Material Request not found');

  const findings: string[] = [];
  let riskLevel = 'LOW';

  for (const item of mr.items) {
    const boqItem = item.consolidatedBoqItem;
    const boqBalance = boqItem.quantity - boqItem.deliveredQty;

    // Check if requested quantity exceeds BOQ balance
    if (item.quantity > boqBalance) {
      findings.push(
        `⚠️ OVER-REQUEST: "${boqItem.description}" — Requested ${item.quantity} ${boqItem.unit}, but BOQ balance is only ${boqBalance.toFixed(2)} ${boqItem.unit}.`
      );
      riskLevel = 'HIGH';
    }

    // Check if requested quantity exceeds total BOQ quantity
    if (item.quantity > boqItem.quantity) {
      findings.push(
        `🚨 EXCEEDS BOQ: "${boqItem.description}" — Requested ${item.quantity} ${boqItem.unit} exceeds total BOQ quantity of ${boqItem.quantity} ${boqItem.unit}.`
      );
      riskLevel = 'CRITICAL';
    }

    // Check for zero or negative quantities
    if (item.quantity <= 0) {
      findings.push(
        `❌ INVALID QTY: "${boqItem.description}" — Requested quantity is ${item.quantity}.`
      );
      riskLevel = 'CRITICAL';
    }

    // Check for duplicate requests of same item in other pending MRs
    const existingMRItems = await prisma.materialRequestItem.findMany({
      where: {
        consolidatedBoqItemId: item.consolidatedBoqItemId,
        mr: {
          projectId: mr.projectId,
          status: { in: ['DRAFT', 'SUBMITTED', 'FOR_REVIEW', 'APPROVED'] },
          id: { not: mrId },
        },
      },
    });

    if (existingMRItems.length > 0) {
      const totalAlreadyRequested = existingMRItems.reduce((sum, i) => sum + i.quantity, 0);
      findings.push(
        `🔄 DUPLICATE ALERT: "${boqItem.description}" — ${totalAlreadyRequested} ${boqItem.unit} already requested in ${existingMRItems.length} other active MR(s).`
      );
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
    }
  }

  if (findings.length === 0) {
    findings.push('✅ All items passed validation. Quantities are within BOQ balance. No duplicates detected.');
    riskLevel = 'LOW';
  }

  // If it passes (not CRITICAL) and still has a DRAFT number, assign an official MRF Number
  let officialMrNumber = mr.mrNumber;
  if (riskLevel !== 'CRITICAL' && mr.mrNumber.startsWith('DRAFT-')) {
    const count = await prisma.materialRequest.count({
      where: {
        mrNumber: { startsWith: 'MR-' }
      }
    });
    officialMrNumber = `MR-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
  }

  // Update the MR with AI validation results
  await prisma.materialRequest.update({
    where: { id: mrId },
    data: {
      status: 'AI_CHECKING',
      aiValidationRisk: riskLevel,
      aiValidationNotes: findings.join('\n'),
      mrNumber: officialMrNumber,
    },
  });

  revalidatePath(`/material-requests/${mrId}`);
  revalidatePath('/material-requests');
  return { riskLevel, findings };
}

// Update MR status (workflow transitions)
export async function updateMRStatus(mrId: string, newStatus: string, userId?: string) {
  const updateData: any = { status: newStatus };
  
  if (newStatus === 'APPROVED' && userId) {
    updateData.approverId = userId;
  }
  if (newStatus === 'FOR_REVIEW' && userId) {
    updateData.checkerId = userId;
  }
  if (newStatus === 'SUBMITTED' && userId) {
    updateData.preparerId = userId;
  }

  await prisma.materialRequest.update({
    where: { id: mrId },
    data: updateData,
  });

  revalidatePath(`/material-requests/${mrId}`);
  revalidatePath('/material-requests');
}


export async function lockProjectBOQ(projectId: string) {
  await prisma.project.update({
    where: { id: projectId },
    data: { boqLocked: true }
  });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/projects');
}

export async function toggleConsolidatedBOQLock(id: string, lockState: boolean) {
  await prisma.project.update({
    where: { id },
    data: { consolidatedBOQLocked: lockState }
  });
  revalidatePath(`/projects/${id}`);
}

export async function lockProcurementBenchmark(projectId: string) {
  await prisma.project.update({
    where: { id: projectId },
    data: { procurementBenchmarkLocked: true }
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProject(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) throw new Error('Project not found');

  // 1. Delete the physical file if it exists in description
  const match = project.description?.match(/BOQ File Uploaded: (.*)/);
  if (match && match[1]) {
    const fileName = match[1].trim();
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'boq', fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // 2. Delete the entire project (Cascades to AwardedBOQItems, etc.)
  await prisma.project.delete({
    where: { id: projectId }
  });

  revalidatePath('/projects');
}

export async function getLotBreakdowns(boqItemId: string) {
  return await prisma.bOQLotBreakdown.findMany({
    where: { boqItemId },
  });
}

export async function saveLotBreakdown(data: any) {
  const breakdown = await prisma.bOQLotBreakdown.create({
    data: {
      boqItemId: data.boqItemId,
      description: data.description,
      weightPercentage: 0
    }
  });
  return { ...breakdown, ...data };
}

export async function deleteLotBreakdown(breakdownId: string) {
  await prisma.bOQLotBreakdown.delete({
    where: { id: breakdownId }
  });
  return { success: true };
}
