import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const pkg = await prisma.subcontractPackage.findUnique({
    where: { id: "a9f44a36-7edd-4700-ab4a-36c964222d29" }, // ID of SP-1781438273684
    include: {
      subcontractor: {
        include: {
          subcontractorBOQItems: {
            include: {
              awardedBoqItem: true
            }
          }
        }
      }
    }
  });

  if (!pkg) {
    console.log("Package not found");
    return;
  }

  const boqItems = pkg.subcontractor?.subcontractorBOQItems || [];
  
  if (boqItems.length === 0) {
    console.log("No BOQ items");
    return;
  }

  // Calculate Grand Total of Master BOQ
  let grandMasterTotal = 0;
  for (const item of boqItems) {
    const qty = parseFloat(item.awardedBoqItem.quantity.toString()) || 0;
    const unitCost = parseFloat(item.awardedBoqItem.combinedUnitCost.toString()) || 0;
    grandMasterTotal += qty * unitCost;
  }

  console.log(`Grand Master Total: ${grandMasterTotal}`);

  if (grandMasterTotal === 0) {
    console.log("Grand Master Total is 0");
    return;
  }

  // Contract Amount
  const contractAmount = parseFloat(pkg.contractAmount?.toString() || "0");
  console.log(`Package Contract Amount: ${contractAmount}`);

  // Distribute
  for (const item of boqItems) {
    const qty = parseFloat(item.awardedBoqItem.quantity.toString()) || 0;
    const masterUnitCost = parseFloat(item.awardedBoqItem.combinedUnitCost.toString()) || 0;
    const masterCost = qty * masterUnitCost;
    
    const percentage = masterCost / grandMasterTotal;
    const allocatedTotal = contractAmount * percentage;
    
    const subQty = parseFloat(item.quantity.toString()) || 1;
    const allocatedUnitCost = allocatedTotal / subQty;

    console.log(`Updating ${item.awardedBoqItem.itemCode}: % = ${percentage * 100}, UnitCost = ${allocatedUnitCost}, Total = ${allocatedTotal}`);

    await prisma.subcontractorBOQItem.update({
      where: { id: item.id },
      data: {
        unitCost: allocatedUnitCost,
        totalCost: allocatedTotal
      }
    });
  }

  console.log("Distribution complete!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
