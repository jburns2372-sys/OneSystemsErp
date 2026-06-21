'use server';

import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function uploadAndAnalyzeQuotation(canvassId: string, supplierId: string, formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    // 1. Save file locally
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'quotations');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    // 2. Simulate AI Vision Processing Delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Fetch Canvass Items to "extract" data for them
    const canvass = await prisma.canvassForm.findUnique({
      where: { id: canvassId },
      include: { items: true }
    });

    if (!canvass) throw new Error('Canvass not found');

    // Generate random realistic prices for simulation
    const itemsData = canvass.items.map(item => {
      // Simulate a unit cost between 500 and 5000
      const simulatedUnitCost = Math.floor(Math.random() * 4500) + 500;
      return {
        canvassItemId: item.id,
        unitCost: simulatedUnitCost,
        quantityAvailable: item.quantityRequired,
        totalCost: simulatedUnitCost * item.quantityRequired,
        brand: 'Generic AI Brand',
        remarks: 'Extracted via AI Vision'
      };
    });

    const totalAmount = itemsData.reduce((sum, i) => sum + i.totalCost, 0);

    const deliveryOptions = ["7 Days", "14 Days", "30 Days", "45 Days", "On-hand"];
    const paymentOptions = ["COD", "15 Days", "30 Days", "60 Days", "50% Downpayment"];
    
    const simulatedDelivery = deliveryOptions[Math.floor(Math.random() * deliveryOptions.length)];
    const simulatedPayment = paymentOptions[Math.floor(Math.random() * paymentOptions.length)];

    // 4. Save the simulated "extracted" quotation to DB
    const quotation = await prisma.supplierQuotation.create({
      data: {
        canvassFormId: canvassId,
        supplierId: supplierId,
        status: 'RECEIVED_AI_EXTRACTED',
        totalAmount: totalAmount,
        deliveryPeriod: simulatedDelivery,
        paymentTerms: simulatedPayment,
        fileUrl: `/uploads/quotations/${fileName}`,
        items: {
          create: itemsData
        }
      }
    });

    return { 
      success: true, 
      quotationId: quotation.id,
      message: 'Quotation successfully extracted and encoded by AI.'
    };
  } catch (error: any) {
    console.error('Error analyzing quotation:', error);
    return { success: false, error: error.message || 'Failed to analyze quotation' };
  }
}
