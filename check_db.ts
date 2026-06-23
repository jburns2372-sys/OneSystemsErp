import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const consolidated = await prisma.consolidatedBOQItem.count({
    where: { projectId: 'cmqplg5if02n2vcn0c74sscvu' }
  });
  console.log('consolidated count:', consolidated);
}

main().catch(console.error).finally(async () => { await prisma.$disconnect(); });
