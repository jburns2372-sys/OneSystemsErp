import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const modules = await prisma.module.findMany();
  console.log("Modules in DB:");
  modules.forEach(m => console.log(`- ${m.moduleName} (ID: ${m.id})`));
}

main().finally(() => prisma.$disconnect());
