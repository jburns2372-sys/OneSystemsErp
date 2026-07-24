const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe('UPDATE "ConsolidatedBOQItem" SET "revisedQuantity" = "quantity" WHERE "revisedQuantity" = 0 AND "quantity" > 0');
  console.log('Fixed existing ConsolidatedBOQItems revisedQuantity.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
