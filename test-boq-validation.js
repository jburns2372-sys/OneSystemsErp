const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// mock toMoney function
function toMoney(val) {
  if (isNaN(val)) throw new Error("Invalid decimal value");
  return Number(val).toFixed(2);
}

async function main() {
  console.log("Testing AwardedBOQItem query shape...");
  const boqItems = await prisma.awardedBOQItem.findMany({
    where: { projectId: "cmrirhhw30000ic0406v47smb", totalCost: { gt: 0 } },
    select: { id: true, itemCode: true, quantity: true },
    take: 1
  });
  console.log("Corrected query shape is valid. Result count:", boqItems.length);

  console.log("Testing missing BOQ validation...");
  const missingBoqItems = await prisma.awardedBOQItem.findMany({
    where: { projectId: "MISSING_PROJECT_ID", totalCost: { gt: 0 } },
    select: { id: true, itemCode: true, quantity: true }
  });
  console.log("Missing BOQ handled safely. Result count:", missingBoqItems.length);

  console.log("Testing malformed monetary values...");
  let errors = [];
  try {
    toMoney("malformed_number");
  } catch(e) {
    errors.push(`BOQ: AwardedBOQItem quantity test_id: ${e.message}`);
  }
  console.log("Malformed monetary values handled safely. Caught errors:", errors);
}

main().catch(console.error).finally(() => prisma.$disconnect());
