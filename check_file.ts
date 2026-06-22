// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const files = await prisma.projectAccomplishmentFile.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log("Recent Accomplishment Files:");
  files.forEach(f => {
    console.log(`ID: ${f.id}`);
    console.log(`Name: ${f.fileName}`);
    console.log(`Original: ${f.originalFilePath}`);
    console.log(`Working: ${f.workingFilePath}`);
    console.log("---");
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
