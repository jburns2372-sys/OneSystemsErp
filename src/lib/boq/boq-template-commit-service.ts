// @ts-nocheck
import { prisma } from '@/lib/prisma';

export async function commitTemplateToBOQ(
  uploadedWorkbookFileId: string,
  projectId: string,
  userId: string
) {
  // 1. Validate Upload Status
  const upload = await prisma.uploadedWorkbookFile.findUnique({
    where: { id: uploadedWorkbookFileId }
  });

  if (!upload) throw new Error('Upload record not found.');
  if (upload.validationStatus === 'FAILED') throw new Error('Cannot commit a failed upload without override.');
  if (upload.status === 'COMMITTED') throw new Error('This upload has already been committed.');

  // 2. Fetch Extracted Data
  const extractedItems = await prisma.bOQExtractedItem.findMany({
    where: { uploadedWorkbookFileId },
    include: { section: true },
    orderBy: { sourceRowNumber: 'asc' }
  });

  if (extractedItems.length === 0) throw new Error('No items to commit.');

  const awardedBoqItems = [];

  // 3. Map to AwardedBOQItem
  for (const item of extractedItems) {
    awardedBoqItems.push({
      projectId,
      uploadedWorkbookFileId,
      itemCode: item.itemNumber || item.section?.sectionCode || 'UNCODED',
      category: item.section?.sectionName || 'GENERAL',
      description: item.description,
      unit: item.unit || 'L.S.',
      quantity: item.quantity,
      directCost: item.totalDirectCost,
      indirectCost: item.totalIndirectCost,
      combinedUnitCost: item.unitCost,
      totalCost: item.amount,
      status: 'APPROVED', // Assuming committing sets it as official
    });
  }

  // 4. Execute Transaction
  await prisma.$transaction(async (tx) => {
    // Insert new AwardedBOQItems
    // Note: If you want to replace existing, you would delete them first. 
    // Usually, you append or handle versions. We append for now.
    await tx.awardedBOQItem.createMany({
      data: awardedBoqItems
    });

    // Mark upload as COMMITTED
    await tx.uploadedWorkbookFile.update({
      where: { id: uploadedWorkbookFileId },
      data: { status: 'COMMITTED' }
    });

    // Create Audit Log
    await tx.workbookExtractionAudit.create({
      data: {
        uploadedWorkbookFileId,
        projectId,
        action: 'COMMIT_TO_AWARDED_BOQ',
        status: 'SUCCESS',
        message: `Committed ${awardedBoqItems.length} items to official project BOQ.`,
        performedBy: userId
      }
    });
  });

  return { success: true, count: awardedBoqItems.length };
}
