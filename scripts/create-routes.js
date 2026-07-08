const fs = require('fs');
const path = require('path');

const routes = {
  'src/app/api/projects/[id]/pow-boq/upload/route.ts': `import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const projectId = id;
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const hash = crypto.createHash('sha256').update(buffer).digest('hex');

        const existingFile = await prisma.uploadedWorkbookFile.findFirst({
            where: { fileHash: hash, projectId }
        });

        if (existingFile) {
            return NextResponse.json({
                error: "Duplicate upload detected.",
                uploadId: existingFile.id
            }, { status: 409 });
        }

        const blob = await put(\`pow-boq-uploads/\${projectId}/\${Date.now()}-\${file.name}\`, buffer, {
            access: "public",
        });

        const uploadedFile = await prisma.uploadedWorkbookFile.create({
            data: {
                projectId,
                originalFilename: file.name,
                fileHash: hash,
                mimeType: file.type,
                fileSize: file.size,
                storagePath: blob.url,
                status: "DRAFT"
            }
        });

        const version = await prisma.workbookVersion.create({
            data: {
                uploadedWorkbookFileId: uploadedFile.id,
                projectId,
                versionNumber: 1,
                versionLabel: "Original Upload",
                sourceType: "ORIGINAL_UPLOAD",
                filePath: blob.url,
                fileHash: hash,
                createdBy: "System"
            }
        });

        await prisma.uploadedWorkbookFile.update({
            where: { id: uploadedFile.id },
            data: { latestPreservedVersionId: version.id }
        });

        await prisma.workbookExtractionAudit.create({
            data: {
                uploadedWorkbookFileId: uploadedFile.id,
                projectId,
                action: "FILE_UPLOADED",
                status: "SUCCESS",
                message: "Original .xlsx file uploaded and preserved.",
            }
        });

        return NextResponse.json({ success: true, uploadId: uploadedFile.id, message: "File uploaded successfully" });

    } catch (error: any) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: "An error occurred during upload." }, { status: 500 });
    }
}`,

  'src/app/api/projects/[id]/pow-boq/uploads/[uploadId]/onlyoffice-config/route.ts': `import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; uploadId: string }> }
) {
    try {
        const { id, uploadId } = await params;
        const projectId = id;
        const userId = "placeholder-user-id";
        const userName = "Authorized User";

        const uploadedFile = await prisma.uploadedWorkbookFile.findUnique({
            where: { id: uploadId, projectId },
            include: {
                workbookVersions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1
                }
            }
        });

        if (!uploadedFile) {
            return new NextResponse("File not found", { status: 404 });
        }

        const latestVersion = uploadedFile.workbookVersions[0];
        const fileUrl = latestVersion ? latestVersion.filePath : uploadedFile.storagePath;
        const documentServerUrl = process.env.ONLYOFFICE_DOCUMENT_SERVER_URL || "http://localhost:8080";
        const jwtSecret = process.env.ONLYOFFICE_JWT_SECRET || "your-secret";
        const callbackUrl = \`\${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/projects/\${projectId}/pow-boq/uploads/\${uploadId}/onlyoffice-callback\`;
        const documentKey = uploadedFile.onlyOfficeDocumentKey || \`\${uploadedFile.id}-\${Date.now()}\`;

        if (!uploadedFile.onlyOfficeDocumentKey) {
            await prisma.uploadedWorkbookFile.update({
                where: { id: uploadedFile.id },
                data: { onlyOfficeDocumentKey: documentKey }
            });
        }

        const config = {
            document: {
                fileType: "xlsx",
                key: documentKey,
                title: uploadedFile.originalFilename,
                url: fileUrl,
                permissions: { edit: true, download: true, print: true }
            },
            documentType: "spreadsheet",
            editorConfig: {
                callbackUrl: callbackUrl,
                user: { id: userId, name: userName },
                mode: "edit",
                lang: "en"
            }
        };

        let token = "";
        if (process.env.ONLYOFFICE_ENABLED === "true" || jwtSecret) {
            token = jwt.sign(config, jwtSecret, { expiresIn: "1h" });
        }

        await prisma.workbookExtractionAudit.create({
            data: {
                uploadedWorkbookFileId: uploadId,
                projectId,
                action: "FILE_OPENED_ONLYOFFICE",
                status: "SUCCESS",
                message: "ONLYOFFICE configuration generated.",
            }
        });

        return NextResponse.json({ config, token, documentServerUrl });

    } catch (error: any) {
        console.error("ONLYOFFICE Config Error:", error);
        return new NextResponse("An error occurred generating config.", { status: 500 });
    }
}`,

  'src/app/api/projects/[id]/pow-boq/uploads/[uploadId]/onlyoffice-callback/route.ts': `import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; uploadId: string }> }
) {
    try {
        const { id, uploadId } = await params;
        const projectId = id;
        const body = await request.json();
        const status = body.status;

        if (body.users && body.users.length > 0) {
             await prisma.onlyOfficeSession.updateMany({
                where: { 
                    uploadedWorkbookFileId: uploadId,
                    userId: { in: body.users },
                    status: 'ACTIVE'
                 },
                data: { lastCallbackAt: new Date() }
             });
        }

        if (status === 2 || status === 6) {
            const downloadUri = body.url;
            if (!downloadUri) return new NextResponse("Download URI missing", { status: 400 });

            const response = await fetch(downloadUri);
            if (!response.ok) throw new Error("Failed to download modified file");

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const hash = crypto.createHash('sha256').update(buffer).digest('hex');

            const uploadedFile = await prisma.uploadedWorkbookFile.findUnique({
                where: { id: uploadId, projectId }
            });
            if (!uploadedFile) return new NextResponse("Uploaded file not found", { status: 404 });

            const previousVersions = await prisma.workbookVersion.findMany({
                where: { uploadedWorkbookFileId: uploadId },
                orderBy: { versionNumber: 'desc' },
                take: 1
            });
            const nextVersion = (previousVersions[0]?.versionNumber || 0) + 1;

            const blob = await put(\`pow-boq-uploads/\${projectId}/\${Date.now()}-\${uploadedFile.originalFilename}\`, buffer, {
                access: "public",
            });

            const newVersionRecord = await prisma.workbookVersion.create({
                data: {
                    uploadedWorkbookFileId: uploadId,
                    projectId,
                    versionNumber: nextVersion,
                    versionLabel: \`Edited in ONLYOFFICE\`,
                    sourceType: "ONLYOFFICE_EDIT",
                    filePath: blob.url,
                    fileHash: hash,
                    createdBy: body.users ? body.users[0] : "System"
                }
            });

             await prisma.uploadedWorkbookFile.update({
                where: { id: uploadedFile.id },
                data: { latestPreservedVersionId: newVersionRecord.id }
            });

            await prisma.workbookExtractionAudit.create({
                data: {
                    uploadedWorkbookFileId: uploadId,
                    projectId,
                    action: "FILE_MODIFIED_ONLYOFFICE",
                    status: "SUCCESS",
                    message: \`Document saved in ONLYOFFICE, creating version \${nextVersion}.\`,
                }
            });
        }
        return NextResponse.json({ error: 0 });
    } catch (error: any) {
        console.error("ONLYOFFICE Callback Error:", error);
        return NextResponse.json({ error: 1, message: "Callback failed" }, { status: 500 });
    }
}`,

  'src/app/api/projects/[id]/pow-boq/uploads/[uploadId]/file-access/route.ts': `import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; uploadId: string }> }
) {
    try {
        const { id, uploadId } = await params;
        const projectId = id;
        const uploadedFile = await prisma.uploadedWorkbookFile.findUnique({
            where: { id: uploadId, projectId },
            include: {
                workbookVersions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1
                }
            }
        });

        if (!uploadedFile) {
            return new NextResponse("File not found", { status: 404 });
        }

        const latestVersion = uploadedFile.workbookVersions[0];
        const fileUrl = latestVersion ? latestVersion.filePath : uploadedFile.storagePath;

        const response = await fetch(fileUrl);
        if (!response.ok) {
             throw new Error("Failed to fetch file from storage");
        }

        const fileBuffer = await response.arrayBuffer();

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": \`attachment; filename="\${uploadedFile.originalFilename}"\`,
            },
        });

    } catch (error: any) {
        console.error("File Access Error:", error);
        return new NextResponse("An error occurred serving the file.", { status: 500 });
    }
}`,

  'src/app/api/projects/[id]/pow-boq/uploads/[uploadId]/extract/route.ts': `import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";

const prisma = new PrismaClient();

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; uploadId: string }> }
) {
    try {
        const { id, uploadId } = await params;
        const projectId = id;

        const uploadedFile = await prisma.uploadedWorkbookFile.findUnique({
            where: { id: uploadId, projectId },
            include: {
                workbookVersions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1
                }
            }
        });

        if (!uploadedFile) return new NextResponse("File not found", { status: 404 });

        const latestVersion = uploadedFile.workbookVersions[0];
        const fileUrl = latestVersion ? latestVersion.filePath : uploadedFile.storagePath;

        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("Failed to fetch file from storage");

        const fileBuffer = await response.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(Buffer.from(fileBuffer));

        let worksheet = workbook.getWorksheet('BOQ') || workbook.getWorksheet('Bill of Quantities') || workbook.worksheets[0];
        if (!worksheet) return new NextResponse("No worksheet found in document.", { status: 400 });

        await prisma.bOQExtractedSection.deleteMany({ where: { uploadedWorkbookFileId: uploadId } });
        await prisma.workbookFormulaValidation.deleteMany({ where: { uploadedWorkbookFileId: uploadId } });

        let currentSection: any = null;
        let displayOrder = 0;

        for (let r = 1; r <= worksheet.rowCount; r++) {
            const row = worksheet.getRow(r);
            const itemNumber = row.getCell(1).text;
            const description = row.getCell(2).text;
            const unit = row.getCell(3).text;
            const qtyStr = row.getCell(4).value;
            const unitCostStr = row.getCell(5).value;
            const amountCell = row.getCell(6);

            if (!itemNumber && !description) continue;

            if (description && !unit && (!qtyStr || qtyStr === '') && (!unitCostStr || unitCostStr === '')) {
                 currentSection = await prisma.bOQExtractedSection.create({
                    data: { uploadedWorkbookFileId: uploadId, projectId, sheetName: worksheet.name, sourceRowNumber: r, sectionName: description.substring(0, 255), displayOrder: displayOrder++ }
                 });
                 continue;
            }

            if (description && unit) {
                const qty = typeof qtyStr === 'number' ? qtyStr : parseFloat(qtyStr as string) || 0;
                const unitCost = typeof unitCostStr === 'number' ? unitCostStr : parseFloat(unitCostStr as string) || 0;
                let actualAmount = 0;
                if (amountCell.type === ExcelJS.ValueType.Formula) actualAmount = (amountCell.result as number) || 0;
                else actualAmount = typeof amountCell.value === 'number' ? amountCell.value : parseFloat(amountCell.value as string) || 0;

                const expectedAmount = qty * unitCost;
                let validationStatus = "PASSED";
                let formulaError = null;

                if (Math.abs(actualAmount - expectedAmount) > 0.1) {
                    validationStatus = "FAILED";
                    formulaError = \`Formula error in cell F\${r}: Expected \${expectedAmount}, found \${actualAmount}\`;
                    await prisma.workbookFormulaValidation.create({
                        data: { uploadedWorkbookFileId: uploadId, projectId, sheetName: worksheet.name, cellAddress: \`F\${r}\`, sourceRowNumber: r, expectedValue: expectedAmount.toString(), actualValue: actualAmount.toString(), severity: "HIGH", validationStatus: "FAILED", message: formulaError }
                    });
                }

                await prisma.bOQExtractedItem.create({
                    data: { uploadedWorkbookFileId: uploadId, projectId, sectionId: currentSection ? currentSection.id : null, sheetName: worksheet.name, sourceRowNumber: r, itemNumber: itemNumber?.substring(0, 100) || null, description: description.substring(0, 500), unit: unit.substring(0, 50), quantity: qty, totalDirectCost: unitCost, unitCost: unitCost, amount: actualAmount, validationStatus: validationStatus, validationErrorsJson: formulaError ? JSON.stringify([formulaError]) : null }
                });
            }
        }

        await prisma.uploadedWorkbookFile.update({ where: { id: uploadId }, data: { extractionStatus: "COMPLETED" } });
        await prisma.workbookExtractionAudit.create({ data: { uploadedWorkbookFileId: uploadId, projectId, action: "DATA_EXTRACTED", status: "SUCCESS", message: "BOQ data and formulas extracted and validated." } });

        return NextResponse.json({ success: true, message: "Extraction completed successfully" });

    } catch (error: any) {
        console.error("Extraction Error:", error);
        return NextResponse.json({ error: "An error occurred during extraction.", details: error.message }, { status: 500 });
    }
}`,

  'src/app/api/projects/[id]/pow-boq/uploads/[uploadId]/commit/route.ts': `import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; uploadId: string }> }
) {
    try {
        const { id, uploadId } = await params;
        const projectId = id;

        const extractedItems = await prisma.bOQExtractedItem.findMany({
            where: { uploadedWorkbookFileId: uploadId, projectId },
            include: { section: true }
        });

        if (extractedItems.length === 0) return new NextResponse("No extracted items found to commit.", { status: 400 });

        const hasErrors = extractedItems.some(item => item.validationStatus === 'FAILED');
        if (hasErrors) return new NextResponse("Cannot commit: Extracted data contains validation errors.", { status: 400 });

        const previousVersions = await prisma.projectBOQVersion.findMany({
            where: { projectId },
            orderBy: { versionNumber: 'desc' },
            take: 1
        });
        const nextVersionNumber = (previousVersions[0]?.versionNumber || 0) + 1;

        const totalAmount = extractedItems.reduce((acc, item) => acc + (item.amount || 0), 0);
        const totalDirectCost = extractedItems.reduce((acc, item) => acc + (item.totalDirectCost || 0), 0);
        const totalIndirectCost = extractedItems.reduce((acc, item) => acc + (item.totalIndirectCost || 0), 0);

        const boqVersion = await prisma.projectBOQVersion.create({
            data: {
                projectId,
                sourceUploadedWorkbookFileId: uploadId,
                versionNumber: nextVersionNumber,
                versionLabel: \`Committed from Upload Center\`,
                status: "ACTIVE",
                totalDirectCost,
                totalIndirectCost,
                totalAmount,
                committedBy: "System",
                committedAt: new Date(),
                approvedBy: "System",
                approvedAt: new Date()
            }
        });

        await prisma.awardedBOQItem.deleteMany({ where: { projectId } });

        const awardedItemsToInsert = extractedItems.map(item => ({
            projectId,
            itemCode: item.itemNumber || \`ITEM-\${item.sourceRowNumber}\`,
            category: item.section?.sectionName || "General",
            description: item.description,
            unit: item.unit || "LOT",
            quantity: item.quantity,
            totalCost: item.amount,
            directCost: item.totalDirectCost,
            indirectCost: item.totalIndirectCost,
            combinedUnitCost: item.unitCost,
            materialUnitCost: item.materialUnitCost,
            laborUnitCost: item.laborUnitCost,
            equipmentUnitCost: item.equipmentUnitCost,
            percentageOfTotal: item.percentage,
            uploadedWorkbookFileId: uploadId,
            sourceRowNumber: item.sourceRowNumber,
            approvalStatus: "APPROVED"
        }));

        await prisma.awardedBOQItem.createMany({ data: awardedItemsToInsert });

        await prisma.uploadedWorkbookFile.update({
            where: { id: uploadId },
            data: { commitStatus: "COMMITTED", status: "APPROVED" }
        });

        await prisma.workbookExtractionAudit.create({
            data: {
                uploadedWorkbookFileId: uploadId,
                projectId,
                action: "DATA_COMMITTED",
                status: "SUCCESS",
                message: \`BOQ Version \${nextVersionNumber} committed to live project database.\`,
            }
        });

        return NextResponse.json({ success: true, version: boqVersion.versionNumber });

    } catch (error: any) {
        console.error("Commit Error:", error);
        return new NextResponse("An error occurred during commit.", { status: 500 });
    }
}`
};

for (const [filePath, content] of Object.entries(routes)) {
  const absolutePath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, 'utf8');
  console.log('Created ' + filePath);
}
