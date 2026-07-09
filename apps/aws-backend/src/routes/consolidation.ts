// @ts-nocheck
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient(); // Assuming prisma client is available at this path
import ExcelJS from 'exceljs'; // ExcelJS is used for modifying and creating Excel files

const router = Router();

// Assuming express.json() middleware is already configured in your main Express app
// If not, you'd need `router.use(express.json());` here or in your main app file.

router.post('/:projectId/auto-consolidate', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { force } = req.body;

    // Placeholder for actual auto-consolidation logic using Prisma
    // Example: update a project status or trigger a more complex consolidation process.
    // The original function only called a backend, so this is where the database interaction happens.
    console.log(`AWS Backend: Auto-consolidating BOQ for project ${projectId} with force=${force}`);
    // e.g., await prisma.project.update({ where: { id: projectId }, data: { lastConsolidatedAt: new Date(), needsRecalculation: force } });

    res.json({ success: true, message: 'Auto-consolidation process initiated in backend.' });
  } catch (error: any) {
    console.error('AWS Backend Error in autoConsolidateBOQ:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:projectId/upload', async (req, res) => {
  try {
    const { projectId } = req.params;
    // The Next.js Server Action preprocesses the file and sends documentData and parsedItems.
    const { documentData, parsedItems } = req.body;

    // 1. Create or Update document record
    const existingDocument = await prisma.document.findFirst({
      where: { projectId, title: documentData.title },
    });

    let documentRecord;
    if (existingDocument) {
      documentRecord = await prisma.document.update({
        where: { id: existingDocument.id },
        data: {
          fileUrl: documentData.fileUrl,
          fileType: documentData.fileType,
          fileSize: documentData.fileSize,
          updatedAt: new Date(),
        },
      });
    } else {
      documentRecord = await prisma.document.create({
        data: {
          projectId,
          title: documentData.title,
          category: 'MASTER_MATERIALS_LIST', // Assign a specific category for this document type
          fileUrl: documentData.fileUrl,
          fileType: documentData.fileType,
          fileSize: documentData.fileSize,
        },
      });
    }

    // 2. Clear existing consolidated items for this project before adding new ones
    await prisma.consolidatedBOQItem.deleteMany({
      where: { projectId },
    });

    // 3. Create new consolidated items
    await prisma.consolidatedBOQItem.createMany({
      data: parsedItems.map((item: any) => ({
        projectId,
        itemCode: item.itemCode,
        category: item.category,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: item.totalCost,
        status: item.status,
        documentId: documentRecord.id, // Link items to the newly created/updated document
      })),
    });

    res.json({ success: true, message: 'Master materials list uploaded and consolidated successfully.' });
  } catch (error: any) {
    console.error('AWS Backend Error in uploadMasterMaterialsList:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/items', async (req, res) => {
  try {
    const { projectId, itemCode, category, description, unit, quantity, unitCost } = req.body;

    const newConsolidatedItem = await prisma.consolidatedBOQItem.create({
      data: {
        projectId,
        itemCode,
        category,
        description,
        unit,
        quantity,
        unitCost,
        totalCost: quantity * unitCost,
        status: 'MANUAL_ADDITION', // Or another appropriate status
      },
    });

    res.json({ success: true, item: newConsolidatedItem, message: 'Manual consolidated item added successfully.' });
  } catch (error: any) {
    console.error('AWS Backend Error in addManualConsolidatedItem:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Delete all consolidated items associated with the project first
    await prisma.consolidatedBOQItem.deleteMany({
      where: { projectId },
    });

    // Then delete the document record for the master materials list
    await prisma.document.deleteMany({
      where: { projectId, category: 'MASTER_MATERIALS_LIST' }, // Assuming this category for deletion
    });

    res.json({ success: true, message: 'Master materials list and associated items deleted.' });
  } catch (error: any) {
    console.error('AWS Backend Error in deleteMasterMaterialsList:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:projectId/download-template', async (req, res) => {
  try {
    const { projectId } = req.params;

    const templateDoc = await prisma.document.findFirst({
      where: { projectId, category: 'BOQ_TEMPLATE' }, // Find the BOQ template document
      orderBy: { createdAt: 'desc' }
    });

    if (!templateDoc) {
      return res.status(404).json({ success: false, error: 'No BOQ template found for this project.' });
    }

    const response = await fetch(templateDoc.fileUrl); // Fetch the template file from its URL (e.g., S3)
    if (!response.ok) {
      throw new Error(`Failed to fetch template file from storage. Status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer); // Load the Excel template

    const sheet = workbook.worksheets[0];
    
    // Fetch consolidated items from the database to populate the template
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

    // Iterate through the rows of the Excel sheet to find headers and populate data
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
          headerRowIndex = rowNumber; // Found the header row
        }
      } else {
        // Process data rows after the header
        if (descColIndex !== -1) {
          const descCell = row.getCell(descColIndex);
          const descVal = descCell.text?.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          
          if (descVal) {
            let matchedItem = itemMap.get(descVal);
            // Implement fuzzy matching if exact match not found (as in original code)
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
              // Populate quantity and unit cost columns
              if (qtyColIndex !== -1) {
                row.getCell(qtyColIndex).value = matchedItem.quantity;
              }
              if (costColIndex !== -1) {
                row.getCell(costColIndex).value = matchedItem.unitCost;
              }
              row.commit(); // Save changes to the row
            }
          }
        }
      }
    });

    const buffer = await workbook.xlsx.writeBuffer(); // Write the modified workbook to a buffer
    // Return the buffer as a base64 encoded string
    res.json({ success: true, file: Buffer.from(buffer).toString('base64') });
  } catch (error: any) {
    console.error('AWS Backend Error in downloadMasterMaterialsTemplate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
