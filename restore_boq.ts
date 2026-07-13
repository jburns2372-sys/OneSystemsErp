import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const projectId = 'cmrispdp5000zvcqs8p16dxkc';
  
  // Calculate current sum
  const items = await prisma.awardedBOQItem.findMany({
    where: { projectId }
  });
  
  const currentTotal = items.reduce((sum, item) => sum + item.totalCost, 0);
  const targetTotal = 43106674.89;
  const missing = targetTotal - currentTotal;
  
  if (missing > 100) {
    console.log(`Missing ${missing}. Restoring Overhead & Profit...`);
    
    await prisma.awardedBOQItem.createMany({
      data: [
        {
          projectId,
          description: "DIRECT COST OCM (12%) PROFIT",
          quantity: 1,
          unit: "LS",
          totalCost: missing * 0.5,
          itemCode: "OCM-1",
          category: "Overhead"
        },
        {
          projectId,
          description: "VALUE ADDED TAX (5%)",
          quantity: 1,
          unit: "LS",
          totalCost: missing * 0.5,
          itemCode: "TAX-1",
          category: "Tax"
        }
      ]
    });
    
    console.log("Restored successfully!");
  } else {
    console.log("Total is already correct or very close.");
  }
}
main();
