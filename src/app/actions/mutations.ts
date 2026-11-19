'use server';
import { verifySession } from '@/lib/dal/auth';
import { assertProjectGraphOwnership, isGlobalTenantAdminRole, withUboqRlsContext } from '@/lib/uboq/project-ownership';
import { assertUboqStageAuthorization } from '@/lib/uboq/security/stage-rbac';
import {
  isProjectOrItemsUboqGoverned,
  validateAndNormalizeGovernedMrfLines,
  computeMrfValidationPassHash,
  transitionGovernedMrfStatusAtomically,
} from '@/lib/uboq/adapters/procurement-adapter';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import * as xlsx from 'xlsx';
import { uploadToS3 as put } from '@/lib/s3';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import ExcelJS from 'exceljs';
import { cookies } from 'next/headers';

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


export async function createProject(_formData?: FormData): Promise<never> {
  throw new Error(
    'LEGACY_CREATE_PROJECT_DISABLED: Legacy BOQ-coupled project creation is disabled. Use createProjectProfile (project-first intake) and governed BOQ intake.'
  );
}

export async function uploadProcurementBenchmark(formData: FormData) {
  const projectId = formData.get('projectId') as string;
  const boqFile = formData.get('benchmarkFile') as File | null;
  if (!boqFile || boqFile.size === 0) {
    throw new Error('No file uploaded');
  }

  let parsedItems: any[] = [];
  const buffer = Buffer.from(await boqFile.arrayBuffer());
  let contractAmount = 0;

  // Parse Excel file
  const workbookXlsx = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbookXlsx.SheetNames[0];
  const sheetXlsx = workbookXlsx.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json<any[]>(sheetXlsx, { header: 1 });

  // Check if it's the BOQ Master Template
  let isMasterTemplate = false;
  let anchorRowIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row && Array.isArray(row)) {
      if (row.some(cell => String(cell || '').replace(/\s/g, '').toUpperCase().includes('BIDDETAILEDCOSTBREAKDOWN'))) {
        isMasterTemplate = true;
        anchorRowIndex = i;
        break;
      }
    }
  }

  let line1 = "REPUBLIC OF THE PHILIPPINES";
  let line2 = "";
  let line3 = "";
  let logoData: string | null = null;

  if (isMasterTemplate) {
    // Parse using Master Template Format (via ExcelJS)
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.worksheets[0];
    
    // Helper to safely get string from cell (handles rich text)
    const getCellString = (cell: ExcelJS.Cell) => {
      if (cell.value && typeof cell.value === 'object' && 'richText' in cell.value) {
        // @ts-ignore
        return cell.value.richText.map(rt => rt.text).join("");
      }
      return cell.value?.toString() || "";
    };

    // Extract Logo
    const imgObj = sheet.getImages()[0];
    if (imgObj) {
      try {
        const img = workbook.getImage(imgObj.imageId as unknown as number);
        if (img && img.buffer) {
          const bufferAny = img.buffer as any;
          const base64Str = Buffer.isBuffer(bufferAny) 
            ? bufferAny.toString('base64') 
            : Buffer.from(bufferAny).toString('base64');
          logoData = `data:image/${img.extension};base64,${base64Str}`;
        }
      } catch (e) {
        console.warn("Failed to extract image", e);
      }
    }

    line1 = getCellString(sheet.getRow(1).getCell(3)) || getCellString(sheet.getRow(2).getCell(1)) || "REPUBLIC OF THE PHILIPPINES";
    line2 = getCellString(sheet.getRow(2).getCell(3)) || getCellString(sheet.getRow(3).getCell(1)) || "";
    line3 = getCellString(sheet.getRow(3).getCell(3)) || getCellString(sheet.getRow(4).getCell(1)) || "";

    let anchorRowNumber = -1;
    sheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        if (cell.type === ExcelJS.ValueType.String && cell.value?.toString().replace(/\s/g, '').toUpperCase().includes("BIDDETAILEDCOSTBREAKDOWN")) {
          anchorRowNumber = rowNumber;
        }
      });
    });

    if (anchorRowNumber !== -1) {
      const headerRow = sheet.getRow(anchorRowNumber + 1);
      const headers = Array.from(headerRow.values as any[] || []).map(v => String(v || '').replace(/\s/g, '').toUpperCase());

      const cItem = headers.findIndex(h => h && h.includes("ITEM"));
      const cDesc = headers.findIndex(h => h && h.includes("DESCRIPTION"));
      const cUnit = headers.findIndex(h => h && h.includes("UNIT") && !h.includes("COST"));
      const cQty = headers.findIndex(h => h && h.includes("QUANTITY"));
      const cUc = headers.findIndex(h => h && h.includes("UNITCOST"));
      const cAmt = headers.findIndex(h => h && (h.includes("AMOUNT") || h.includes("TOTALCOST")));

      const getNum = (cell: ExcelJS.Cell) => {
        if (cell.type === ExcelJS.ValueType.Number) return cell.value as number;
        if (cell.type === ExcelJS.ValueType.Formula) return cell.result as number || 0;
        return Number(String(cell.value || '').replace(/[^0-9.-]/g, '')) || 0;
      };

      let currentRowNum = anchorRowNumber + 2;
      while (currentRowNum <= sheet.rowCount) {
        const row = sheet.getRow(currentRowNum);
        const descCell = getCellString(row.getCell(cDesc)).trim();
        const amount = getNum(row.getCell(cAmt));
        const qty = getNum(row.getCell(cQty));

        if (!descCell) {
          currentRowNum++;
          continue;
        }

        const descUpper = descCell.toUpperCase();
        if (descUpper.includes("GRAND TOTAL") || descUpper.includes("TOTAL ESTIMATED COST") || descUpper === "TOTAL") {
          break;
        }

        let itemNumber = getCellString(row.getCell(cItem)).trim();
        let unit = getCellString(row.getCell(cUnit)).trim();

        if (descCell && (qty > 0 || amount > 0)) {
          parsedItems.push({
            projectId,
            itemCode: itemNumber,
            description: descCell,
            unit: unit || "LOT",
            quantity: qty,
            unitCost: getNum(row.getCell(cUc)),
            totalCost: amount,
            status: 'PENDING'
          });
          contractAmount += amount;
        }
        
        currentRowNum++;
      }
    }
  } else {
    // Original generic flat-file parser
    let headerRowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row && Array.isArray(row) && row.some(cell => typeof cell === 'string' && (cell.toLowerCase().includes('item no') || cell.toLowerCase().includes('description')))) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex !== -1) {
      const headers = Array.from(rows[headerRowIndex]).map(h => (h || '').toString().toLowerCase().trim());
      
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
          contractAmount += totalCost;
        }
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
    
    if (isMasterTemplate) {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          contractAmountVATInclusive: true,

        }
      });
    } else {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          contractAmountVATInclusive: true,
        }
      });
    }
  }

  revalidatePath(`/projects/${projectId}`);
}

export async function createMaterialRequest(formData: FormData) {
  const actor = await verifySession();
  if (!actor) throw new Error('UBOQ_UNAUTHORIZED: Active authenticated session required');

  const projectId = formData.get('projectId') as string;
  const description = formData.get('description') as string;

  await withUboqRlsContext(
    { userId: actor.id, sessionVersion: actor.sessionVersion, projectId },
    async () => {
      await assertUboqStageAuthorization(prisma, {
        userId: actor.id,
        projectId,
        capability: 'UBOQ_MRF_CREATE',
      });
      await assertProjectGraphOwnership(prisma, {
        userId: actor.id,
        userRole: actor.role,
        projectId,
      });

      const count = await prisma.materialRequest.count({ where: { projectId } });
      const mrNumber = `MR-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}-${Math.floor(Math.random() * 1000)}`;

      await prisma.materialRequest.create({
        data: {
          mrNumber,
          projectId,
          requesterId: actor.id,
          status: 'DRAFT',
          remarks: description,
        },
      });
    }
  );

  revalidatePath('/material-requests');
  revalidatePath('/');
}

// Generate an MRF from selected Consolidated BOQ items (supports both Legacy & UBOQ Resource-Governed PRRs)
export async function generateMRFFromConsolidated(data: {
  projectId: string;
  requesterId: string;
  purpose: string;
  priority: string;
  locationOfUse: string;
  dateNeeded: string;
  remarks: string;
  items: {
    consolidatedBoqItemId: string;
    quantity: number;
    canonicalResourceId?: string | null;
    uboqResourceRequirementId?: string | null;
    resourceUnit?: string | null;
    breakdownData?: any;
  }[];
}) {
  const actor = await verifySession();
  if (!actor) throw new Error('UBOQ_UNAUTHORIZED: Active authenticated session required');

  const { projectId, purpose, priority, locationOfUse, dateNeeded, remarks, items } = data;

  if (!items || items.length === 0) {
    throw new Error('No items selected for the material request.');
  }

  const consolidatedIds = items.map((i) => i.consolidatedBoqItemId);
  return withUboqRlsContext(
    { userId: actor.id, sessionVersion: actor.sessionVersion, projectId },
    async () => {
      await assertUboqStageAuthorization(prisma, {
        userId: actor.id,
        projectId,
        capability: 'UBOQ_MRF_CREATE',
      });
      await assertProjectGraphOwnership(prisma, {
        userId: actor.id,
        userRole: actor.role,
        projectId,
        consolidatedBoqItemIds: consolidatedIds,
      });

  const isGoverned = await isProjectOrItemsUboqGoverned(prisma, projectId, consolidatedIds);
  const createItemsPayload = isGoverned
    ? (await validateAndNormalizeGovernedMrfLines(prisma, projectId, items)).map((ln) => ({
        consolidatedBoqItemId: ln.consolidatedBoqItemId,
        canonicalResourceId: ln.canonicalResourceId,
        uboqResourceRequirementId: ln.uboqResourceRequirementId,
        resourceUnit: ln.resourceUnit,
        quantity: ln.quantity,
        breakdownData: (ln.breakdownData as any) || null,
      }))
    : items.map((item) => ({
        consolidatedBoqItemId: item.consolidatedBoqItemId,
        quantity: item.quantity,
        breakdownData: item.breakdownData || null,
      }));

  // Assign a temporary Draft ID until it passes AI Validation
  const mrNumber = `DRAFT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const mr = await prisma.materialRequest.create({
    data: {
      mrNumber,
      projectId,
      requesterId: actor.id,
      status: 'DRAFT',
      purpose,
      priority,
      locationOfUse,
      remarks,
      dateNeeded: dateNeeded ? new Date(dateNeeded) : null,
      items: {
        create: createItemsPayload,
      },
    },
  });

      revalidatePath('/material-requests');
      revalidatePath(`/projects/${projectId}`);
      return mr.id;
    }
  );
}

// AI Validation for MRF (deterministic checks — PRR resource ceiling for UBOQ, BOQ balance for Legacy)
export async function runMRFAIValidation(mrId: string) {
  const actor = await verifySession();
  if (!actor) throw new Error('UBOQ_UNAUTHORIZED: Active authenticated session required');

  const mr = await prisma.materialRequest.findUnique({
    where: { id: mrId },
    include: {
      items: {
        include: {
          consolidatedBoqItem: true,
          canonicalResource: true,
          uboqResourceRequirement: true,
        },
      },
      project: true,
    },
  });

  if (!mr) throw new Error('Material Request not found');
  await assertProjectGraphOwnership(prisma, {
    userId: actor.id,
    userRole: actor.role,
    projectId: mr.projectId,
    mrId: mr.id,
  });

  const findings: string[] = [];
  let riskLevel = 'LOW';

  const consolidatedBoqItemIds = mr.items
    .map(i => i.consolidatedBoqItemId)
    .filter((id): id is string => id !== null);

  const allExistingMRItems = await prisma.materialRequestItem.findMany({
    where: {
      consolidatedBoqItemId: { in: consolidatedBoqItemIds },
      mr: {
        projectId: mr.projectId,
        status: { in: ['DRAFT', 'SUBMITTED', 'FOR_REVIEW', 'APPROVED'] },
        id: { not: mrId },
      },
    },
  });

  for (const item of mr.items) {
    if (item.canonicalResourceId || mr.project.uboqGovernanceEnabled || item.consolidatedBoqItem?.isUboqResourceGoverned) {
      const acct = item.canonicalResource;
      if (!acct || !item.uboqResourceRequirementId || !item.resourceUnit) {
        findings.push(`🚨 MISSING PRR BINDING: Line ${item.id} on UBOQ-governed project lacks canonicalResourceId / PRR binding.`);
        riskLevel = 'CRITICAL';
        continue;
      }
      if (acct.activeApprovedPrId !== item.uboqResourceRequirementId) {
        findings.push(`🚨 SUPERSEDED PRR: "${acct.resourceDescription}" references non-active PRR ${item.uboqResourceRequirementId}; active PRR is ${acct.activeApprovedPrId ?? 'NONE'}.`);
        riskLevel = 'CRITICAL';
      }
      if (item.resourceUnit !== acct.resourceUomNormalized) {
        findings.push(`🚨 UOM MISMATCH: Requested in ${item.resourceUnit}, resource account requires ${acct.resourceUomNormalized}.`);
        riskLevel = 'CRITICAL';
      }
      if (item.quantity <= 0) {
        findings.push(`❌ INVALID QTY: "${acct.resourceDescription}" — Requested quantity is ${item.quantity}.`);
        riskLevel = 'CRITICAL';
      } else if (item.quantity > Number(acct.remainingProcurementQty) + 0.0001) {
        findings.push(
          `🚨 EXCEEDS RESOURCE CEILING: "${acct.resourceDescription}" — Requested ${item.quantity} ${acct.resourceUomNormalized} exceeds remaining procurement ceiling of ${Number(acct.remainingProcurementQty).toFixed(4)} ${acct.resourceUomNormalized}.`
        );
        riskLevel = 'CRITICAL';
      }
      continue;
    }

    if (!item.consolidatedBoqItem) continue;
    const boqItem = item.consolidatedBoqItem;
    const boqBalance = boqItem.revisedQuantity - boqItem.deliveredQty;

    // Check if requested quantity exceeds BOQ balance
    if (item.quantity > boqBalance) {
      findings.push(
        `⚠️ OVER-REQUEST: "${boqItem.description}" — Requested ${item.quantity} ${boqItem.unit}, but BOQ balance is only ${boqBalance.toFixed(2)} ${boqItem.unit}.`
      );
      riskLevel = 'HIGH';
    }

    // Check if requested quantity exceeds total BOQ quantity
    if (item.quantity > boqItem.revisedQuantity) {
      findings.push(
        `🚨 EXCEEDS BOQ: "${boqItem.description}" — Requested ${item.quantity} ${boqItem.unit} exceeds total revised BOQ quantity of ${boqItem.revisedQuantity} ${boqItem.unit}.`
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
    const existingMRItems = allExistingMRItems.filter(
      (i) => i.consolidatedBoqItemId === item.consolidatedBoqItemId
    );

    if (existingMRItems.length > 0) {
      const totalAlreadyRequested = existingMRItems.reduce((sum, i) => sum + i.quantity, 0);
      findings.push(
        `🔄 DUPLICATE ALERT: "${boqItem.description}" — ${totalAlreadyRequested} ${boqItem.unit} already requested in ${existingMRItems.length} other active MR(s).`
      );
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
    }
  }

  if (findings.length === 0) {
    findings.push('✅ All items passed validation. Quantities are within approved ceiling. No blocking issues detected.');
    riskLevel = 'LOW';
  }

  // If it passes (not CRITICAL) and still has a DRAFT number, assign an official MRF Number
  let officialMrNumber = mr.mrNumber;
  if (riskLevel !== 'CRITICAL' && mr.mrNumber.startsWith('DRAFT-')) {
    const currentYear = new Date().getFullYear();
    const prefix = `MR-${currentYear}-`;
    
    const lastMr = await prisma.materialRequest.findFirst({
      where: { mrNumber: { startsWith: prefix } },
      orderBy: { mrNumber: 'desc' },
      select: { mrNumber: true }
    });

    let nextNumber = 1;
    if (lastMr && lastMr.mrNumber) {
      const lastInt = parseInt(lastMr.mrNumber.substring(prefix.length), 10);
      if (!isNaN(lastInt)) {
        nextNumber = lastInt + 1;
      }
    }
    
    officialMrNumber = `${prefix}${nextNumber.toString().padStart(4, '0')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  }

  const activeSnap = await prisma.uboqOperationalSnapshot.findFirst({
    where: { projectId: mr.projectId, status: 'APPROVED' },
    orderBy: { versionNumber: 'desc' },
    select: { versionNumber: true },
  });
  const snapVer = activeSnap?.versionNumber ?? 1;
  const passHash =
    riskLevel !== 'CRITICAL'
      ? computeMrfValidationPassHash(
          mr.id,
          snapVer,
          mr.items.map((i) => ({ id: i.id, quantity: i.quantity, canonicalResourceId: i.canonicalResourceId }))
        )
      : null;

  // Update the MR with AI validation results
  await prisma.materialRequest.update({
    where: { id: mrId },
    data: {
      status: 'AI_CHECKING',
      aiValidationRisk: riskLevel,
      aiValidationNotes: findings.join('\n'),
      mrNumber: officialMrNumber,
      validatedSnapshotVersion: passHash ? snapVer : null,
      validationPassHash: passHash,
    },
  });

  revalidatePath(`/material-requests/${mrId}`);
  revalidatePath('/material-requests');
  return { riskLevel, findings, validationPassHash: passHash };
}

// Update MR status (workflow transitions)
export async function updateMRStatus(mrId: string, newStatus: string, _userId?: string) {
  const actor = await verifySession();
  if (!actor) throw new Error('UBOQ_UNAUTHORIZED: Active authenticated session required');

  const resolvedRows = await prisma.$queryRaw<Array<{ proj: string | null }>>`
    SELECT uboq_resolve_mr_project(${mrId}::text) AS proj
  `;
  const targetProjectId = resolvedRows[0]?.proj;
  if (!targetProjectId) throw new Error('Material Request not found');

  const requiredCapability = ['APPROVED', 'REJECTED', 'CANCELLED', 'VOID'].includes(newStatus)
    ? 'UBOQ_MRF_APPROVE'
    : 'UBOQ_MRF_CREATE';

  await withUboqRlsContext(
    { userId: actor.id, sessionVersion: actor.sessionVersion, projectId: targetProjectId },
    async () => {
      await assertUboqStageAuthorization(prisma, {
        userId: actor.id,
        projectId: targetProjectId,
        capability: requiredCapability,
      });

      const mrCheck = await prisma.materialRequest.findUnique({
        where: { id: mrId },
        select: { id: true, projectId: true, aiValidationRisk: true, validationPassHash: true, project: { select: { uboqGovernanceEnabled: true } } },
      });
      if (!mrCheck) throw new Error('Material Request not found');

      await assertProjectGraphOwnership(prisma, {
        userId: actor.id,
        userRole: actor.role,
        projectId: mrCheck.projectId,
        mrId: mrCheck.id,
      });

      if (mrCheck.project.uboqGovernanceEnabled && newStatus === 'APPROVED' && mrCheck.aiValidationRisk === 'CRITICAL') {
        throw new Error('UBOQ_MRF_VALIDATION_FAILED: Cannot approve MaterialRequest with CRITICAL validation findings');
      }

      const governedResult = await transitionGovernedMrfStatusAtomically(prisma, {
        mrId,
        newStatus,
        actorUserId: actor.id,
      });

      if (!governedResult) {
        const updateData: any = { status: newStatus };
        if (newStatus === 'APPROVED') updateData.approverId = actor.id;
        if (newStatus === 'FOR_REVIEW') updateData.checkerId = actor.id;
        if (newStatus === 'SUBMITTED') updateData.preparerId = actor.id;

        await prisma.materialRequest.update({
          where: { id: mrId },
          data: updateData,
        });
      }
    }
  );

  revalidatePath(`/material-requests/${mrId}`);
  revalidatePath('/material-requests');
}


export async function deleteProcurementBenchmark(projectId: string) {
  const actor = await verifySession();
  if (!actor) throw new Error('UBOQ_UNAUTHORIZED: Active authenticated session required');
  await assertProjectGraphOwnership(prisma, {
    userId: actor.id,
    userRole: actor.role,
    projectId,
  });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { procurementBenchmarkLocked: true, uboqGovernanceEnabled: true }
  });
  if (!project) throw new Error('Project not found');
  if (project.uboqGovernanceEnabled) {
    throw new Error('UBOQ_BENCHMARK_DELETE_BLOCKED: Cannot delete benchmark on a UBOQ-governed project');
  }

  await prisma.procurementBenchmarkItem.deleteMany({
    where: { projectId }
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { procurementBenchmarkLocked: false }
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/projects');
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
  const actor = await verifySession();
  if (!actor) throw new Error('UBOQ_UNAUTHORIZED: Active authenticated session required');
  if (!isGlobalTenantAdminRole(actor.role)) {
    throw new Error('UBOQ_FORBIDDEN: Only global system administrators may delete projects');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      _count: {
        select: {
          uboqCanonicalResourceAccounts: true,
          uboqResourceLedgerEntries: true,
        },
      },
    },
  });

  if (!project) throw new Error('Project not found');
  if (
    project.uboqGovernanceEnabled ||
    project._count.uboqCanonicalResourceAccounts > 0 ||
    project._count.uboqResourceLedgerEntries > 0
  ) {
    throw new Error('UBOQ_PROJECT_DELETE_BLOCKED: UBOQ-governed projects with canonical resource accounts or ledger history cannot be deleted');
  }

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

import { convertExcelToHtml } from '@/lib/excel/excelToHtml';

export async function getExactExcelHtml(projectId: string) {
  const templateDoc = await prisma.document.findFirst({
    where: { projectId, category: 'AWARDED_BOQ_TEMPLATE' },
    orderBy: { createdAt: 'desc' }
  });

  if (!templateDoc) {
    throw new Error('No Awarded BOQ template found for this project.');
  }

  let arrayBuffer: ArrayBuffer;
  if (templateDoc.fileUrl.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), 'public', templateDoc.fileUrl.replace(/^\//, ''));
    const fileBuffer = await fs.promises.readFile(filePath);
    arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
  } else {
    const response = await fetch(templateDoc.fileUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch template file from storage.');
    }
    arrayBuffer = await response.arrayBuffer();
  }
  
  return await convertExcelToHtml(arrayBuffer);
}

export async function downloadRawOriginalBOQTemplate(projectId: string) {
  const templateDoc = await prisma.document.findFirst({
    where: { projectId, category: 'AWARDED_BOQ_TEMPLATE' },
    orderBy: { createdAt: 'desc' }
  });

  if (!templateDoc) {
    throw new Error('No Awarded BOQ template found for this project.');
  }

  let arrayBuffer: ArrayBuffer;
  if (templateDoc.fileUrl.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), 'public', templateDoc.fileUrl.replace(/^\//, ''));
    const fileBuffer = await fs.promises.readFile(filePath);
    arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
  } else {
    const response = await fetch(templateDoc.fileUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch template file from storage.');
    }
    arrayBuffer = await response.arrayBuffer();
  }
  
  const base64String = Buffer.from(arrayBuffer).toString('base64');
  return base64String;
}

import * as jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.ONLYOFFICE_JWT_SECRET || 'super-secret-key-for-dev';

export async function getAwardedBOQOnlyofficeConfig(projectId: string, baseUrl: string) {
  const templateDoc = await prisma.document.findFirst({
    where: { projectId, category: 'AWARDED_BOQ_TEMPLATE' },
    orderBy: { createdAt: 'desc' }
  });

  if (!templateDoc) {
    throw new Error('No Awarded BOQ template found for this project.');
  }

  const documentKey = `awarded-boq-${projectId}-${templateDoc.id}-${Date.now()}`;
  
  // Construct the full URL. If templateDoc.fileUrl is relative, prepend baseUrl.
  let fileUrl = templateDoc.fileUrl;
  if (fileUrl.startsWith('/')) {
    fileUrl = `${baseUrl}${fileUrl}`;
  }

  const config = {
    document: {
      fileType: 'xlsx',
      key: documentKey,
      title: templateDoc.title || `Awarded_BOQ_${projectId}.xlsx`,
      url: fileUrl,
      permissions: {
        edit: false,
        download: true,
      }
    },
    documentType: 'spreadsheet',
    editorConfig: {
      mode: 'view',
      user: {
        id: 'viewer',
        name: 'Viewer'
      },
      customization: {
        forcesave: false,
        autosave: false,
      }
    }
  };

  const token = jwt.sign(config, JWT_SECRET, { expiresIn: '2h' });
  
  return {
    config: { ...config, token },
    documentServerUrl: process.env.ONLYOFFICE_DOCUMENT_SERVER_URL || 'http://localhost:8080'
  };
}

export async function downloadAwardedBOQTemplate(projectId: string) {
  const templateDoc = await prisma.document.findFirst({
    where: { projectId, category: 'AWARDED_BOQ_TEMPLATE' },
    orderBy: { createdAt: 'desc' }
  });

  if (!templateDoc) {
    throw new Error('No Awarded BOQ template found for this project.');
  }

  let arrayBuffer: ArrayBuffer;
  if (templateDoc.fileUrl.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), 'public', templateDoc.fileUrl.replace(/^\//, ''));
    const fileBuffer = await fs.promises.readFile(filePath);
    arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
  } else {
    const response = await fetch(templateDoc.fileUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch template file from storage.');
    }
    arrayBuffer = await response.arrayBuffer();
  }
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const sheet = workbook.worksheets[0];
  
  const awardedItems = await prisma.awardedBOQItem.findMany({
    where: { projectId }
  });

  const itemMap = new Map();
  awardedItems.forEach(item => {
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
              row.getCell(costColIndex).value = matchedItem.combinedUnitCost;
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
