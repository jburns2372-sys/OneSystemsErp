const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const count = await prisma.awardedBOQItem.count();
  console.log('AwardedBOQItem Count:', count);
}
run().finally(() => prisma.$disconnect());
