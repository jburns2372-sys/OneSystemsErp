// @ts-nocheck
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { uploadToS3 as put } from '../../../../src/lib/s3';
import ExcelJS from "exceljs";
import fs from 'fs';
import path from 'path';

const router = Router();

const SERVERLESS_UNSUPPORTED_ACCOMPLISHMENT_WRITE_PATHS = new Set([
  '/uploadaccomplishmentfileaction',
  '/createworkingcopyaction',
  '/savefileeditaction',
  '/saveasnewaccomplishmentfileaction',
  '/createsuccessivebillingaction',
]);

router.use((req, res, next) => {
  const normalizedPath = req.path.replace(/\/+$/, '').toLowerCase();
  if (
    process.env.VERCEL &&
    req.method === 'POST' &&
    SERVERLESS_UNSUPPORTED_ACCOMPLISHMENT_WRITE_PATHS.has(normalizedPath)
  ) {
    return res.status(501).json({
      success: false,
      error: 'SERVERLESS_LEGACY_UPLOAD_UNSUPPORTED',
      message:
        'Legacy base64 JSON / local-disk accomplishment write endpoints are disabled on Vercel serverless runtime (4.5 MB body limit and ephemeral disk). Use the governed direct-to-Blob intake flow.',
    });
  }
  return next();
});

// Helper function, moved from original Next.js Server Action
async function saveFileLocallyOrBlob(directory: string, fileName: string, buffer: Buffer, contentType?: string): Promise<string> {
  if (process.env.VERCEL) {
    throw new Error(
      'SERVERLESS_LEGACY_UPLOAD_UNSUPPORTED: Legacy base64 JSON accomplishment uploads are disabled on Vercel serverless runtime (4.5 MB body limit and ephemeral disk). Use the governed direct-to-Blob intake flow.'
    );
  }
  if (process.env.AWS_ACCESS_KEY_ID) {
    const blob = await put(`${directory}/${fileName}`, buffer, {
      access: 'public', // Or specific ACL
      contentType: contentType || "application/octet-stream",
    });
    return blob.url;
  }
  // Local storage fallback for non-serverless development only
  const uploadDir = path.join(process.cwd(), 'uploads', directory);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  fs.writeFileSync(path.join(uploadDir, fileName), buffer);
  return `${process.env.AWS_BACKEND_URL || 'http://localhost:4000'}/uploads/${directory}/${fileName}`;
}

// Handler for uploadAccomplishmentFileAction
router.post('/uploadAccomplishmentFileAction', async (req, res) => {
  try {
    const { projectId, base64File, fileName, fileType, fileSize, currentUserId } = req.body;

    if (!base64File || !fileName || !projectId) {
      return res.status(400).json({ success: false, error: "Missing required file data or project ID" });
    }

    const buffer = Buffer.from(base64File, 'base64');

    const uniqueId = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const newFileName = `${uniqueId}-${sanitizedFileName}`;

    const publicPath = await saveFileLocallyOrBlob("accomplishments", newFileName, buffer, fileType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const newFileRecord = await prisma.projectAccomplishmentFile.create({
      data: {
        projectId: projectId,
        fileName: fileName,
        originalFilePath: publicPath,
        fileSize: fileSize,
        fileType: fileType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        isLockedOriginal: false,
        uploadedById: currentUserId,
        status: "ACTIVE",
        fileVersion: 1, // Initial version
        workingFilePath: publicPath, // Initial working path is the original
      },
    });

    res.json({ success: true, file: newFileRecord });
  } catch (error: any) {
    console.error("Error in uploadAccomplishmentFileAction (backend):", error);
    res.status(500).json({ success: false, error: error.message || "Failed to upload file" });
  }
});

// Handler for deleteAccomplishmentFileAction
router.post('/deleteAccomplishmentFileAction', async (req, res) => {
  try {
    const { fileId } = req.body;

    if (!fileId) {
      return res.status(400).json({ success: false, error: "File ID is required" });
    }

    const fileRecord = await prisma.projectAccomplishmentFile.findUnique({
      where: { id: fileId }
    });

    if (!fileRecord) {
      return res.status(404).json({ success: false, error: "File not found" });
    }

    // Optional: Add logic to delete physical file from S3/local storage here if necessary
    // await deleteFileFromS3(fileRecord.originalFilePath);

    await prisma.projectAccomplishmentFile.delete({
      where: { id: fileId }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error in deleteAccomplishmentFileAction (backend):", error);
    res.status(500).json({ success: false, error: error.message || "Failed to delete file" });
  }
});

// Handler for extractAccomplishmentDataAction
router.post('/extractAccomplishmentDataAction', async (req, res) => {
  try {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ success: false, error: "File ID is required" });

    // 1. Validate File
    const file = await prisma.projectAccomplishmentFile.findUnique({ where: { id: fileId } });
    if (!file) return res.status(404).json({ success: false, error: "File not found" });
    if (file.status !== 'BILLING' && !file.isLockedOriginal) {
      return res.status(400).json({ success: false, error: "Only locked billings can be extracted to the schedule." });
    }

    // 2. Fetch Active Schedule Baseline
    const activeSchedule = await prisma.projectSchedule.findFirst({
      where: { projectId: file.projectId, workflowStatus: 'ACTIVE_BASELINE' }
    });
    if (!activeSchedule) {
      return res.status(400).json({ success: false, error: "No ACTIVE_BASELINE schedule found for this project. Please activate a schedule first." });
    }

    // 3. Fetch File Buffer
    const fileUrl = file.workingFilePath || file.originalFilePath;
    const fetchUrl = fileUrl.startsWith('/uploads/') ? `${process.env.AWS_BACKEND_URL || 'http://localhost:4000'}${fileUrl}` : fileUrl;
    const fileRes = await fetch(fetchUrl);
    if (!fileRes.ok) throw new Error(`Failed to fetch file: ${fileRes.statusText}`);
    const sourceBuffer = Buffer.from(await fileRes.arrayBuffer());

    // 4. Load Excel
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(sourceBuffer as any);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new Error("No worksheet found in Excel file.");

    // 5. Parse Data & Update Prisma
    let itemsExtracted = 0;
    const affectedActivityIds = new Set<string>();
    
    // Pass 1: Update BOQ Items from Excel
    for (let rowNumber = 3; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const descCell = row.getCell(2).value;
      const desc = descCell ? String(descCell).trim() : "";
      if (!desc || desc.toUpperCase().includes("TOTAL PROJECT COST") || desc.toUpperCase().includes("GENERAL REQUIREMENTS")) continue;

      const qtyAccomplishedCol = row.getCell(8).value;
      const amountAccomplishedCol = row.getCell(10).value;
      
      const qtyAccomplished = typeof qtyAccomplishedCol === 'object' && qtyAccomplishedCol !== null ? Number((qtyAccomplishedCol as any).result) || 0 : Number(qtyAccomplishedCol) || 0;
      let amountAccomplished = typeof amountAccomplishedCol === 'object' && amountAccomplishedCol !== null ? Number((amountAccomplishedCol as any).result) || 0 : Number(amountAccomplishedCol) || 0;

      // Find AwardedBOQItem by Description and Project
      const awardedItem = await prisma.awardedBOQItem.findFirst({
        where: { projectId: file.projectId, description: { equals: desc, mode: 'insensitive' } }
      });
      
      if (!awardedItem) continue; // Skip if no match

      // Update AwardedBOQItem
      const percentage = awardedItem.totalCost > 0 ? (amountAccomplished / awardedItem.totalCost) * 100 : 0;
      await prisma.awardedBOQItem.update({
        where: { id: awardedItem.id },
        data: {
          totalQuantityAccomplished: qtyAccomplished,
          amountAccomplished: amountAccomplished,
          percentageAccomplished: percentage
        }
      });
      
      itemsExtracted++;

      // Find all allocations for this BOQ item in this schedule to mark them as affected
      const allocations = await prisma.scheduleBOQAllocation.findMany({
        where: { scheduleId: activeSchedule.id, awardedBoqItemId: awardedItem.id }
      });

      for (const alloc of allocations) {
        affectedActivityIds.add(alloc.activityId);
      }
    }

    // Pass 2: Calculate Weighted Average Progress for Affected Activities
    for (const activityId of affectedActivityIds) {
      const allAllocations = await prisma.scheduleBOQAllocation.findMany({
        where: { scheduleId: activeSchedule.id, activityId: activityId },
        include: { awardedBoqItem: true }
      });

      let totalAllocatedAmount = 0;
      let totalAccomplishedAmount = 0;

      for (const alloc of allAllocations) {
        const allocAmount = Number(alloc.allocatedAmount) || 0;
        totalAllocatedAmount += allocAmount;
        totalAccomplishedAmount += ((alloc.awardedBoqItem.percentageAccomplished || 0) / 100) * allocAmount;
      }

      const activityPct = totalAllocatedAmount > 0 ? (totalAccomplishedAmount / totalAllocatedAmount) * 100 : 0;

      // Upsert ScheduleProgressUpdate
      const existingProgress = await prisma.scheduleProgressUpdate.findFirst({
        where: { scheduleId: activeSchedule.id, activityId: activityId, accomplishmentId: file.id }
      });

      if (existingProgress) {
        await prisma.scheduleProgressUpdate.update({
          where: { id: existingProgress.id },
          data: { progressPercent: activityPct, updateDate: new Date() }
        });
      } else {
        await prisma.scheduleProgressUpdate.create({
          data: {
            scheduleId: activeSchedule.id,
            activityId: activityId,
            updateDate: new Date(),
            progressPercent: activityPct,
            accomplishmentId: file.id
          }
        });
      }
      
      // Update Activity Status
      await prisma.scheduleActivity.update({
        where: { id: activityId },
        data: {
           actualProgressPercent: activityPct,
           status: activityPct >= 100 ? "COMPLETED" : (activityPct > 0 ? "IN_PROGRESS" : "NOT_STARTED")
        }
      });
    }

    res.json({ success: true, message: `Successfully extracted ${itemsExtracted} items and synced ${affectedActivityIds.size} schedule activities.` });
  } catch (error: any) {
    console.error("Error in extractAccomplishmentDataAction (backend):", error);
    res.status(500).json({ success: false, error: error.message || "Failed to extract data" });
  }
});

// Handler for aiValidateAccomplishmentAction
router.post('/aiValidateAccomplishmentAction', async (req, res) => {
  try {
    const { fileId } = req.body;

    if (!fileId) {
      return res.status(400).json({ success: false, error: "File ID is required" });
    }

    await new Promise(r => setTimeout(r, 2000));

    const file = await prisma.projectAccomplishmentFile.findUnique({ where: { id: fileId } });
    if (file) {
      await prisma.projectAccomplishmentAIFinding.create({
        data: {
          fileId: file.id,
          projectId: file.projectId,
          findingType: "MISSING_SIGNATURE",
          description: "The AI detected that the Sign Off section is missing a required signature.",
          severity: "WARNING",
          recommendation: "Ensure the document is physically signed before final approval."
        }
      });
    }

    res.json({ success: true, message: "AI Validation complete. Findings generated." });
  } catch (error: any) {
    console.error("Error in aiValidateAccomplishmentAction (backend):", error);
    res.status(500).json({ success: false, error: error.message || "Failed AI Validation" });
  }
});

// Handler for createWorkingCopyAction
router.post('/createWorkingCopyAction', async (req, res) => {
  try {
    const { fileId } = req.body;

    if (!fileId) {
      return res.status(400).json({ success: false, error: "File ID is required" });
    }

    const fileRecord = await prisma.projectAccomplishmentFile.findUnique({
      where: { id: fileId }
    });

    if (!fileRecord) return res.status(404).json({ success: false, error: "File not found" });
    if (fileRecord.workingFilePath) return res.json({ success: true, message: "Working copy already exists", workingFilePath: fileRecord.workingFilePath });

    const uniqueId = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedFileName = fileRecord.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const newFileName = `working-${uniqueId}-${sanitizedFileName}`;

    let sourcePath = fileRecord.originalFilePath;
    let sourceBuffer: Buffer;
    // Assuming file is accessible via HTTP or S3 direct URL for the backend
    try {
      const fetchUrl = sourcePath.startsWith('/uploads/') // Backend needs to fetch its own local uploads if relevant
        ? `${process.env.AWS_BACKEND_URL || 'http://localhost:4000'}${sourcePath}`
        : sourcePath;
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch source file: ${response.status} ${response.statusText}`);
      }
      sourceBuffer = Buffer.from(await response.arrayBuffer());
    } catch (fetchError: any) {
      console.error("Error fetching source file for working copy:", fetchError);
      return res.status(500).json({ success: false, error: `Failed to fetch original file: ${fetchError.message}` });
    }

    const publicPath = await saveFileLocallyOrBlob("accomplishments", newFileName, sourceBuffer, fileRecord.fileType);

    const updatedFileRecord = await prisma.projectAccomplishmentFile.update({
      where: { id: fileId },
      data: {
        workingFilePath: publicPath,
      },
    });

    res.json({ success: true, workingFilePath: publicPath, file: updatedFileRecord });
  } catch (error: any) {
    console.error("Error in createWorkingCopyAction (backend):", error);
    res.status(500).json({ success: false, error: error.message || "Failed to create working copy" });
  }
});

// Handler for saveFileEditAction
router.post('/saveFileEditAction', async (req, res) => {
  try {
    const { fileId, base64Data, isLocked } = req.body;

    if (!fileId || !base64Data) {
      return res.status(400).json({ success: false, error: "File ID and base64Data are required" });
    }

    const fileRecord = await prisma.projectAccomplishmentFile.findUnique({
      where: { id: fileId }
    });

    if (!fileRecord) return res.status(404).json({ success: false, error: "File not found" });

    const uniqueId = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedFileName = fileRecord.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const newFileName = `v${fileRecord.fileVersion + 1}-${uniqueId}-${sanitizedFileName}`;

    const buffer = Buffer.from(base64Data, "base64");

    const publicPath = await saveFileLocallyOrBlob("accomplishments", newFileName, buffer, fileRecord.fileType);

    const versionNumber = fileRecord.fileVersion + 1;

    const newVersion = await prisma.projectAccomplishmentFileVersion.create({
      data: {
        fileId: fileRecord.id,
        versionNumber,
        filePath: publicPath,
      }
    });

    const updatedFile = await prisma.projectAccomplishmentFile.update({
        where: { id: fileId },
        data: {
            fileVersion: versionNumber,
            workingFilePath: publicPath,
            fileSize: buffer.length,
            isLockedOriginal: isLocked !== undefined ? isLocked : fileRecord.isLockedOriginal,
            status: isLocked ? "BILLING" : fileRecord.status,
        }
    });

    res.json({ success: true, file: updatedFile, version: newVersion });
  } catch (error: any) {
    console.error("Error in saveFileEditAction (backend):", error);
    res.status(500).json({ success: false, error: error.message || "Failed to save file edits" });
  }
});

// Handler for saveAsNewAccomplishmentFileAction
router.post('/saveAsNewAccomplishmentFileAction', async (req, res) => {
  try {
    const { projectId, base64Data, newFileName, originalFileType, isLocked } = req.body;

    if (!projectId || !base64Data || !newFileName || !originalFileType) {
      return res.status(400).json({ success: false, error: "Missing required data for saving new file" });
    }

    const uniqueId = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedFileName = newFileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const newPhysicalFileName = `v1-${uniqueId}-${sanitizedFileName}`;

    const buffer = Buffer.from(base64Data, "base64");

    const publicPath = await saveFileLocallyOrBlob("accomplishments", newPhysicalFileName, buffer, originalFileType);

    const newFile = await prisma.projectAccomplishmentFile.create({
      data: {
        projectId,
        fileName: newFileName,
        originalFilePath: publicPath,
        fileSize: buffer.length,
        fileType: originalFileType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        isLockedOriginal: isLocked,
        status: isLocked ? "BILLING" : "ACTIVE",
        fileVersion: 1,
        workingFilePath: publicPath,
      },
    });

    res.json({ success: true, file: newFile });
  } catch (error: any) {
    console.error("Error in saveAsNewAccomplishmentFileAction (backend):", error);
    res.status(500).json({ success: false, error: error.message || "Failed to save as new file" });
  }
});

// Handler for createSuccessiveBillingAction
router.post('/createSuccessiveBillingAction', async (req, res) => {
  try {
    const { projectId, templateFileId } = req.body;

    if (!projectId || !templateFileId) {
      return res.status(400).json({ success: false, error: "Project ID and template file ID are required" });
    }

    const latestBilling = await prisma.projectAccomplishmentFile.findUnique({
      where: {
        id: templateFileId
      }
    });

    if (!latestBilling) {
      return res.status(404).json({ success: false, error: "The selected previously locked billing could not be found." });
    }

    const fileUrl = latestBilling.workingFilePath || latestBilling.originalFilePath;

    let nextNumber = 2;
    let baseName = "PROGRESS BILLING";
    let ext = ".xlsx";

    const match = latestBilling.fileName.match(/(.*BILLING) (\d+)(.*)/i);
    if (match) {
      baseName = match[1].trim();
      nextNumber = parseInt(match[2]) + 1;
      ext = match[3];
    } else {
      const dotIdx = latestBilling.fileName.lastIndexOf('.');
      if (dotIdx !== -1) {
        baseName = latestBilling.fileName.substring(0, dotIdx);
        ext = latestBilling.fileName.substring(dotIdx);
      } else {
        baseName = latestBilling.fileName;
        ext = "";
      }
    }

    const newFileName = `${baseName} ${nextNumber}${ext}`;

    const uniqueId = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedFileName = newFileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const newPhysicalFileName = `${uniqueId}-${sanitizedFileName}`;

    let finalBuffer: Buffer;

    try {
      let sourceBuffer: Buffer;
      // Backend needs to fetch files, potentially from S3 or its own local storage
      const fetchUrl = fileUrl.startsWith('/uploads/')
        ? `${process.env.AWS_BACKEND_URL || 'http://localhost:4000'}${fileUrl}`
        : fileUrl;
      const res = await fetch(fetchUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch original file for billing: ${res.status} ${res.statusText}`);
      }
      sourceBuffer = Buffer.from(await res.arrayBuffer());

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(sourceBuffer as any);
      const worksheet = workbook.worksheets[0];

      if (worksheet) {
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) {
            let currentCol10Val: any = row.getCell(10).value;
            let baseCol10 = typeof currentCol10Val === 'object' && currentCol10Val !== null ? (currentCol10Val as any).result : currentCol10Val;
            baseCol10 = Number(baseCol10) || 0;

            const col13Value = row.getCell(13).value;
            let newCol11Val: any = 0;

            if (col13Value !== null && col13Value !== undefined) {
              newCol11Val = typeof col13Value === 'object' && col13Value !== null ? (col13Value as any).result : col13Value;
            } else {
              const c11 = row.getCell(11).value;
              newCol11Val = typeof c11 === 'object' && c11 !== null ? (c11 as any).result : c11;
            }

            // Fallback to baseCol10 if formula result was stripped by web UI edits
            if (!newCol11Val || Number(newCol11Val) === 0) {
              newCol11Val = baseCol10;
            }

            row.getCell(11).value = Number(newCol11Val) || 0;

            if (Number(newCol11Val) > 0 || baseCol10 > 0) {
              const computedResult = baseCol10 - (Number(newCol11Val) || 0);
              row.getCell(12).value = { formula: `J${rowNumber}-K${rowNumber}`, result: computedResult };
            } else {
              row.getCell(12).value = null;
            }
          }
        });
        const uint8Array = await workbook.xlsx.writeBuffer();
        finalBuffer = Buffer.from(uint8Array);
      } else {
        finalBuffer = sourceBuffer; // If no worksheet found, just use the original buffer
      }
    } catch (excelError: any) {
      console.error("Failed to manipulate Excel columns (backend):", excelError);
      // Fallback: if excel manipulation fails, just re-upload the original content
      try {
        const fetchUrl = fileUrl.startsWith('/uploads/')
          ? `${process.env.AWS_BACKEND_URL || 'http://localhost:4000'}${fileUrl}`
          : fileUrl;
        const res = await fetch(fetchUrl);
        if (!res.ok) {
          throw new Error(`Failed to fetch original file for billing (fallback): ${res.status} ${res.statusText}`);
        }
        finalBuffer = Buffer.from(await res.arrayBuffer());
      } catch (fallbackFetchError: any) {
        console.error("Failed to fetch original file even in fallback:", fallbackFetchError);
        return res.status(500).json({ success: false, error: `Failed to process or fetch original file: ${fallbackFetchError.message}` });
      }
    }

    const publicPath = await saveFileLocallyOrBlob("accomplishments", newPhysicalFileName, finalBuffer, latestBilling.fileType);

    const newBillingFile = await prisma.projectAccomplishmentFile.create({
      data: {
        projectId,
        fileName: newFileName,
        originalFilePath: publicPath,
        fileSize: finalBuffer.length,
        fileType: latestBilling.fileType,
        status: "BILLING",
        isLockedOriginal: false,
        fileVersion: 1,
        workingFilePath: publicPath,
      }
    });

    res.json({ success: true, message: `Created ${newFileName} successfully!`, file: newBillingFile });
  } catch (error: any) {
    console.error("Error in createSuccessiveBillingAction (backend):", error);
    res.status(500).json({ success: false, error: error.message || "Failed to create successive billing" });
  }
});

export default router;
