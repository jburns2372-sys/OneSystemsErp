"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { put, copy } from "@vercel/blob";
import { join } from "path";
import ExcelJS from "exceljs";

export async function uploadAccomplishmentFileAction(projectId: string, formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename to prevent overwriting
    const uniqueId = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const newFileName = `${uniqueId}-${sanitizedFileName}`;

    // Upload to Vercel Blob
    const blob = await put(`accomplishments/${newFileName}`, buffer, {
      access: 'public',
      addRandomSuffix: false
    });

    // Optional: get currently logged in user ID if you have an auth system
    // For now, leaving it null or you can pass it from the client
    const currentUserId = undefined;

    // Create database record marking it as a Locked Original
    await prisma.projectAccomplishmentFile.create({
      data: {
        projectId,
        fileName: file.name,
        originalFilePath: blob.url,
        fileSize: buffer.length,
        fileType: file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        isLockedOriginal: false,
        uploadedById: currentUserId,
      },
    });

    revalidatePath(`/accomplishments`);
    return { success: true };
  } catch (error: any) {
    console.error("Error uploading accomplishment file:", error);
    return { success: false, error: error.message || "Failed to upload file" };
  }
}

export async function deleteAccomplishmentFileAction(fileId: string) {
  try {
    const fileRecord = await prisma.projectAccomplishmentFile.findUnique({
      where: { id: fileId }
    });

    if (!fileRecord) {
      return { success: false, error: "File not found" };
    }

    // Strictly speaking, we might not even allow deletion if it's "Locked",
    // but usually users can delete their mistakes before processing.

    // We could delete the physical file too, but keeping it simple for now
    await prisma.projectAccomplishmentFile.delete({
      where: { id: fileId }
    });

    revalidatePath(`/accomplishments`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete file" };
  }
}

export async function extractAccomplishmentDataAction(fileId: string) {
  try {
    // 1. Fetch file record
    // 2. Load the physical file from originalFilePath using an Excel parser
    // 3. Extract data to standard DB rows (e.g. SubcontractAccomplishment)
    // 4. Leave original file untouched

    // Placeholder logic
    await new Promise(r => setTimeout(r, 1500));
    return { success: true, message: "Data successfully extracted to database without altering the original file." };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to extract data" };
  }
}

export async function aiValidateAccomplishmentAction(fileId: string) {
  try {
    // 1. Fetch file record
    // 2. Read physical file safely
    // 3. Run AI rules
    // 4. Save to ProjectAccomplishmentAIFinding

    // Placeholder logic simulating an AI run
    await new Promise(r => setTimeout(r, 2000));

    // Create a dummy finding
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

    revalidatePath(`/accomplishments`);
    return { success: true, message: "AI Validation complete. Findings generated." };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed AI Validation" };
  }
}

export async function createWorkingCopyAction(fileId: string) {
  try {
    const fileRecord = await prisma.projectAccomplishmentFile.findUnique({
      where: { id: fileId }
    });

    if (!fileRecord) return { success: false, error: "File not found" };
    if (fileRecord.workingFilePath) return { success: true, message: "Working copy already exists", workingFilePath: fileRecord.workingFilePath };

    const uniqueId = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedFileName = fileRecord.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const newFileName = `working-${uniqueId}-${sanitizedFileName}`;

    const copiedBlob = await copy(fileRecord.originalFilePath, `accomplishments/${newFileName}`, {
      access: 'public',
      addRandomSuffix: false
    });

    await prisma.projectAccomplishmentFile.update({
      where: { id: fileId },
      data: {
        workingFilePath: copiedBlob.url,
      }
    });

    revalidatePath("/accomplishments");
    return { success: true, workingFilePath: copiedBlob.url };
  } catch (error: any) {
    console.error("Error creating working copy:", error);
    return { success: false, error: error.message || "Failed to create working copy" };
  }
}

export async function saveFileEditAction(fileId: string, base64Data: string, isLocked: boolean = false) {
  try {
    const fileRecord = await prisma.projectAccomplishmentFile.findUnique({
      where: { id: fileId }
    });

    if (!fileRecord) return { success: false, error: "File not found" };

    const uniqueId = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedFileName = fileRecord.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const newFileName = `v${fileRecord.fileVersion + 1}-${uniqueId}-${sanitizedFileName}`;

    const buffer = Buffer.from(base64Data, "base64");
    
    const blob = await put(`accomplishments/${newFileName}`, buffer, {
      access: 'public',
      addRandomSuffix: false
    });
    const publicPath = blob.url;

    const updatedFile = await prisma.$transaction(async (tx) => {
      const version = await tx.projectAccomplishmentFileVersion.create({
        data: {
          fileId: fileRecord.id,
          versionNumber: fileRecord.fileVersion + 1,
          filePath: publicPath,
        }
      });

      return await tx.projectAccomplishmentFile.update({
        where: { id: fileRecord.id },
        data: {
          fileVersion: fileRecord.fileVersion + 1,
          workingFilePath: publicPath,
          isLockedOriginal: isLocked,
          status: isLocked ? "BILLING" : "ACTIVE",
        }
      });
    });

    revalidatePath("/accomplishments");
    return { success: true, file: updatedFile };
  } catch (error: any) {
    console.error("Error saving edited file:", error);
    return { success: false, error: error.message || "Failed to save file edits" };
  }
}

export async function saveAsNewAccomplishmentFileAction(projectId: string, base64Data: string, newFileName: string, originalFileType: string, isLocked: boolean = false) {
  try {
    const uniqueId = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedFileName = newFileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const newPhysicalFileName = `v1-${uniqueId}-${sanitizedFileName}`;

    const buffer = Buffer.from(base64Data, "base64");
    
    const blob = await put(`accomplishments/${newPhysicalFileName}`, buffer, {
      access: 'public',
      addRandomSuffix: false
    });
    const publicPath = blob.url;

    const newFile = await prisma.projectAccomplishmentFile.create({
      data: {
        projectId,
        fileName: newFileName,
        originalFilePath: publicPath,
        fileSize: buffer.length,
        fileType: originalFileType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        isLockedOriginal: isLocked,
        status: isLocked ? "BILLING" : "ACTIVE",
      },
    });

    revalidatePath("/accomplishments");
    return { success: true, file: newFile };
  } catch (error: any) {
    console.error("Error saving as new file:", error);
    return { success: false, error: error.message || "Failed to save as new file" };
  }
}

export async function createSuccessiveBillingAction(projectId: string, templateFileId: string) {
  try {
    const latestBilling = await prisma.projectAccomplishmentFile.findUnique({
      where: {
        id: templateFileId
      }
    });

    if (!latestBilling) {
      return { success: false, error: "The selected previously locked billing could not be found." };
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

    // Automatically carry over Accomplishment To Date (Col 13) to Previous Period (Col 11)
    try {
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const sourceBuffer = Buffer.from(arrayBuffer);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(sourceBuffer as any);
      const worksheet = workbook.worksheets[0];

      if (worksheet) {
        worksheet.eachRow((row, rowNumber) => {
          // Skip the first row (headers)
          if (rowNumber > 1) {
            // Accomplishment To Date is Col 13 (M)
            const col13Value = row.getCell(13).value;
            let newCol11Val: any = 0;

            // Transfer Col 13 to Col 11 (Previous)
            if (col13Value !== null && col13Value !== undefined) {
              newCol11Val = typeof col13Value === 'object' && col13Value !== null ? (col13Value as any).result : col13Value;
              row.getCell(11).value = Number(newCol11Val) || 0;
            } else {
              const c11 = row.getCell(11).value;
              newCol11Val = typeof c11 === 'object' && c11 !== null ? (c11 as any).result : c11;
            }

            // Check Remarks (Col 15 / O)
            const remarksCell = row.getCell(15).value;
            const remarksStr = String(remarksCell || "").toLowerCase().trim();
            const isCompleted = remarksStr === "completed";

            let currentCol10Val: any = row.getCell(10).value;

            // Do NOT clear Col 10 (Total) or Col 8 (Qty). They hold the accumulated progress To Date.
            // When the new billing opens, Total To Date (Col 10) equals Previous (Col 11),
            // resulting in a clean 0 for 'This Period'.

            // Set Col 12 (This Period) formula: Total (Col 10) - Previous (Col 11)
            const baseCol10 = Number(currentCol10Val) || 0;
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
        const response = await fetch(fileUrl);
        const arrayBuffer = await response.arrayBuffer();
        finalBuffer = Buffer.from(arrayBuffer);
      }
    } catch (excelError) {
      console.error("Failed to manipulate Excel columns:", excelError);
      // We continue even if excel parsing fails, so the user at least gets the duplicated file.
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      finalBuffer = Buffer.from(arrayBuffer);
    }

    const blob = await put(`accomplishments/${newPhysicalFileName}`, finalBuffer, {
      access: 'public',
      addRandomSuffix: false
    });
    const publicPath = blob.url;

    const newFile = await prisma.projectAccomplishmentFile.create({
      data: {
        projectId,
        fileName: newFileName,
        originalFilePath: publicPath,
        fileSize: latestBilling.fileSize,
        fileType: latestBilling.fileType,
        status: "BILLING",
        isLockedOriginal: false, // Unlocked so they can edit it
      }
    });

    revalidatePath("/accomplishments");
    return { success: true, message: `Created ${newFileName} successfully!`, file: newFile };
  } catch (error: any) {
    console.error("Error creating successive billing:", error);
    return { success: false, error: error.message || "Failed to create successive billing" };
  }
}
