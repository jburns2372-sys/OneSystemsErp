import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.aiRagKeywordRegistry.deleteMany({});
  console.log("Cleared AiRagKeywordRegistry");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
