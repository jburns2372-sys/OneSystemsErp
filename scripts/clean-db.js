const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  await prisma.awardedBOQItem.deleteMany();
  await prisma.projectBOQVersion.deleteMany();
  await prisma.auditLog.deleteMany();
  console.log('Cleaned');
}
run().finally(() => prisma.$disconnect());
