'use server';

import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function uploadAndAnalyzeQuotationsBulk(canvassId: string, formData: FormData) {
  try {
    const files = formData.getAll('files') as File[];
    if (!files || files.length === 0) throw new Error('No files provided');

    // 1. Fetch Canvass details
    const canvass = await prisma.canvassForm.findUnique({
      where: { id: canvassId },
      include: {
        items: { include: { consolidatedBoqItem: true } },
        invitedSuppliers: { include: { supplier: true } }
      }
    });

    if (!canvass) throw new Error('Canvass not found');

    const expectedSuppliersText = canvass.invitedSuppliers.map(s => `- ID: ${s.supplierId}, Name: ${s.supplier.name}`).join('\n');
    const expectedItemsText = canvass.items.map(i => `- Item ID: ${i.id}, Description: ${i.consolidatedBoqItem.description}, Qty Required: ${i.quantityRequired}`).join('\n');

    const results = [];

    // 2. Process each file in parallel
    const processPromises = files.map(async (file) => {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${Date.now()}-${file.name}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'quotations');
        
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);

        // Define Prompt
        const prompt = `Act as an AI Procurement Data Extractor.
You are analyzing a scanned supplier's quotation document for a Canvass.

--- System Information ---
Valid Invited Suppliers:
${expectedSuppliersText}

Expected Canvassed Items:
${expectedItemsText}

--- Task Instructions ---
1. Supplier Identification: Extract the Supplier Name from the document (usually the letterhead). Match it strictly to one of the "Valid Invited Suppliers". If the supplier is NOT in the invited list, set "matches": false and explain in "findings".
2. Item Extraction & Verification: Extract the quoted items and their unit costs. Cross-reference them against the "Expected Canvassed Items".
   - CRITICAL RULE: If the quotation contains items that are NOT in the expected list, or if it is missing items that were requested, you MUST set "matches": false and detail the mismatched items in "findings".
3. Extract Delivery Period and Payment Terms if present.

Return EXACTLY the following JSON format. Do not use markdown blocks. Just the raw JSON.
{
  "supplierId": "the ID of the matched supplier, or null if no match",
  "matches": true,
  "findings": "Explanation. E.g., 'Rejected: Quoted item XYZ not requested' or 'Successfully extracted.'",
  "totalAmount": 1000.00,
  "deliveryPeriod": "30 Days",
  "paymentTerms": "COD",
  "items": [
    {
       "canvassItemId": "id of the expected canvass item",
       "unitCost": 500.00
    }
  ]
}`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: buffer.toString("base64"),
              mimeType: file.type
            }
          }
        ]);

        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
          return {
            fileName: file.name,
            success: false,
            error: "Failed to parse AI response. The document might not be a valid quotation."
          };
        }

        const aiData = JSON.parse(jsonMatch[0]);

        if (!aiData.matches || !aiData.supplierId) {
          return {
            fileName: file.name,
            success: false,
            error: aiData.findings || "Supplier could not be identified or items mismatched."
          };
        }

        // Validate items length
        if (!aiData.items || aiData.items.length === 0) {
           return {
             fileName: file.name,
             success: false,
             error: "No valid items were extracted from the quotation."
           };
        }

        // Map data to DB format
        const itemsData = aiData.items.map((i: any) => {
          const canvassItem = canvass.items.find(ci => ci.id === i.canvassItemId);
          const qty = canvassItem?.quantityRequired || 0;
          return {
            canvassItemId: i.canvassItemId,
            unitCost: i.unitCost,
            quantityAvailable: qty,
            totalCost: i.unitCost * qty,
            brand: 'Extracted by AI',
            remarks: 'AI Auto-Encoded'
          };
        });

        const totalAmount = itemsData.reduce((sum: number, i: any) => sum + i.totalCost, 0);

        // Check if a quotation from this supplier already exists for this canvass
        const existingQuote = await prisma.supplierQuotation.findFirst({
            where: {
                canvassFormId: canvassId,
                supplierId: aiData.supplierId
            }
        });

        if (existingQuote) {
            return {
                fileName: file.name,
                success: false,
                error: `A quotation from this supplier has already been encoded in the system.`
            };
        }

        // Save to DB
        await prisma.supplierQuotation.create({
          data: {
            canvassFormId: canvassId,
            supplierId: aiData.supplierId,
            status: 'RECEIVED_AI_EXTRACTED',
            totalAmount: totalAmount,
            deliveryPeriod: aiData.deliveryPeriod || 'N/A',
            paymentTerms: aiData.paymentTerms || 'N/A',
            fileUrl: `/uploads/quotations/${fileName}`,
            items: {
              create: itemsData
            }
          }
        });

        // Get supplier name for success message
        const supplierObj = canvass.invitedSuppliers.find(s => s.supplierId === aiData.supplierId);

        return {
          fileName: file.name,
          success: true,
          supplierName: supplierObj?.supplier.name || 'Unknown Supplier',
          message: aiData.findings || 'Successfully extracted and encoded.'
        };

      } catch (fileErr: any) {
        console.error('Error processing file', file.name, fileErr);
        return {
          fileName: file.name,
          success: false,
          error: fileErr.message || 'An unexpected error occurred during processing.'
        };
      }
    });

    const finalResults = await Promise.all(processPromises);

    return { 
      success: true, 
      results: finalResults
    };
  } catch (error: any) {
    console.error('Bulk AI Analysis Error:', error);
    return { success: false, error: error.message || 'Failed to analyze quotations.' };
  }
}
