import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const modelSchema = PrismaClient.name; // just to make sure
  // query 1 NotebookReference
  const ref = await prisma.notebookReference.findFirst();
  console.log(ref);
}

main().catch(console.error).finally(() => prisma.$disconnect());
