const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.awardedBOQItem.findMany({
      where: { projectId: 'cmrirhhw30000ic0406v47smb', INVALID_FIELD: { gt: 0 } }
    });
    console.log('SUCCESS');
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
