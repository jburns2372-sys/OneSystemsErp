const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.consolidatedBOQItem.deleteMany({});
  console.log('Cleared consolidated items!');
}

main().finally(() => prisma.$disconnect());
