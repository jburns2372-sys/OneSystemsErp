const { PrismaClient } = require('@prisma/client');
const { neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const ws = require('ws');
require('dotenv').config();

neonConfig.webSocketConstructor = ws;
const connectionString = process.env.NEON_BRANCH_URL || process.env.DATABASE_URL;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function approve() {
  try {
    const uploads = await prisma.bOQTemplateUpload.findMany({
      where: { status: "DRAFT_UPLOADED" }
    });
    
    if (uploads.length === 0) return console.log("No unapproved uploads found");
    
    for (const upload of uploads) {
      console.log(`Approving upload ${upload.id}...`);
      const report = JSON.parse(upload.validationReport || "{}");
      const items = report.items || [];
      console.log(`Found ${items.length} items to insert for project ${upload.projectId}`);
      
      await prisma.$transaction(async (tx) => {
        const boqData = items.map(item => ({
          projectId: upload.projectId,
          itemCode: item.itemCode,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          directCost: item.directCost,
          indirectCost: item.indirectCost,
          combinedUnitCost: item.combinedUnitCost,
          totalCost: item.totalCost,
          ocmRate: upload.ocmRate,
          cpRate: upload.cpRate,
          vatRate: upload.vatRate,
          templateVersion: upload.templateVersion,
          sourceFileName: upload.fileName,
          sourceSheetName: "BOQ_DATA_ENTRY",
          sourceRowNumber: item.sourceRowNumber,
          status: "APPROVED",
          approvalStatus: "APPROVED",
          boqTemplateUploadId: upload.id
        }));

        await tx.awardedBOQItem.createMany({ data: boqData });
        
        await tx.bOQTemplateUpload.update({
          where: { id: upload.id },
          data: { status: "APPROVED" }
        });
        
        await tx.project.update({
          where: { id: upload.projectId },
          data: { contractAmount: upload.grandTotal }
        });
        
        console.log(`Transaction complete for ${upload.id}!`);
      });
    }
    
  } catch (e) {
    console.error("CRASH:", e);
  }
  process.exit(0);
}
approve();
