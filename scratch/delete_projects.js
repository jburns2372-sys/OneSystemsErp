const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.evidenceFile.deleteMany({});
  await prisma.projectCamera.deleteMany({});
  await prisma.liveCameraSnapshot.deleteMany({});
  await prisma.bOQMapping.deleteMany({});
  await prisma.awardedBOQItem.deleteMany({});
  await prisma.consolidatedBOQItem.deleteMany({});
  await prisma.project.deleteMany({});
  console.log('All projects and related records removed!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
