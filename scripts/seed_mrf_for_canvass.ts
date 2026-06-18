import { PrismaClient } from '../prisma/generated/client';

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst();
  const user = await prisma.user.findFirst();

  if (!project || !user) {
    console.log("No project or user found. Make sure DB is seeded.");
    return;
  }

  // Find a ConsolidatedBOQItem that is NOT a 'lot'
  const boqItems = await prisma.consolidatedBOQItem.findMany({
    where: { 
      projectId: project.id,
      NOT: { unit: { contains: 'lot', mode: 'insensitive' } }
    },
    take: 3
  });

  if (boqItems.length === 0) {
    console.log("No suitable non-lot BOQ items found.");
    return;
  }

  // Ensure 3 test suppliers exist
  const suppliersData = [
    { name: 'Apex Build Supplies Inc.', contactPerson: 'John Doe', email: 'sales@apexbuild.com' },
    { name: 'Metro Hardware Corp.', contactPerson: 'Jane Smith', email: 'quotes@metrohardware.ph' },
    { name: 'Prime Materials Ltd.', contactPerson: 'Bob Johnson', email: 'bidding@primematerials.com' }
  ];

  const suppliers = [];
  for (const sData of suppliersData) {
    const s = await prisma.supplier.upsert({
      where: { name: sData.name }, // Assuming name isn't inherently unique in schema but let's try finding first
      update: {},
      create: sData
    }).catch(async () => {
      // If no unique constraint on name, just find or create
      const existing = await prisma.supplier.findFirst({ where: { name: sData.name }});
      if (existing) return existing;
      return prisma.supplier.create({ data: sData });
    });
    suppliers.push(s);
  }

  // Create an APPROVED Material Request
  const mrNumber = `MRF-TEST-AI-${Math.floor(Math.random() * 10000)}`;
  const mr = await prisma.materialRequest.create({
    data: {
      mrNumber: mrNumber,
      status: 'APPROVED',
      projectId: project.id,
      requesterId: user.id,
      approverId: user.id,
      purpose: 'Testing AI Canvassing workflow with multiple suppliers',
      items: {
        create: boqItems.map(item => ({
          quantity: item.quantity > 5 ? 5 : item.quantity,
          approvedQuantity: item.quantity > 5 ? 5 : item.quantity,
          consolidatedBoqItemId: item.id
        }))
      }
    },
    include: { items: true }
  });

  console.log(`Created Approved MRF: ${mr.mrNumber}`);

  // Auto-generate the Canvass Form
  const canvassCount = await prisma.canvassForm.count();
  const canvassNumber = `CANV-${new Date().getFullYear()}-${String(canvassCount + 1).padStart(4, '0')}`;

  const canvass = await prisma.canvassForm.create({
    data: {
      canvassNumber,
      mrId: mr.id,
      projectId: project.id,
      preparedById: user.id,
      status: 'DRAFT',
      items: {
        create: mr.items.map(item => ({
          quantityRequired: item.approvedQuantity || item.quantity,
          consolidatedBoqItemId: item.consolidatedBoqItemId
        }))
      }
    },
    include: { items: true }
  });

  console.log(`Created Canvass Form: ${canvass.canvassNumber}`);

  // Create 3 Supplier Quotations
  for (let i = 0; i < suppliers.length; i++) {
    const supplier = suppliers[i];
    
    // Make supplier 1 usually the cheapest to test AI
    const priceMultiplier = i === 0 ? 0.9 : (i === 1 ? 1.1 : 1.05);
    
    let totalAmount = 0;
    const quoteItems = canvass.items.map(cItem => {
      // Base cost somewhere between 500 and 5000
      const baseCost = Math.floor(Math.random() * 4500) + 500;
      const unitCost = baseCost * priceMultiplier;
      const totalCost = unitCost * cItem.quantityRequired;
      totalAmount += totalCost;

      return {
        canvassItemId: cItem.id,
        unitCost: unitCost,
        quantityAvailable: cItem.quantityRequired,
        totalCost: totalCost,
        brand: `Brand ${String.fromCharCode(65 + i)}`,
        remarks: 'In stock'
      };
    });

    const quotation = await prisma.supplierQuotation.create({
      data: {
        canvassFormId: canvass.id,
        supplierId: supplier.id,
        status: 'RECEIVED',
        totalAmount: totalAmount,
        paymentTerms: i === 0 ? 'Cash on Delivery' : '30 Days',
        deliveryLeadTime: i === 0 ? '3 Days' : '7 Days',
        items: {
          create: quoteItems
        }
      }
    });

    console.log(`Added Quotation for ${supplier.name} - Total: ₱${totalAmount.toFixed(2)}`);
  }

  console.log(`\n✅ Simulation Data Ready!`);
  console.log(`Navigate to the Canvassing Dashboard and look for ${canvass.canvassNumber}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
