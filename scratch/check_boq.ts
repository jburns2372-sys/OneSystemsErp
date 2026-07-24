import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const items = await prisma.awardedBOQItem.findMany({ take: 3 });
  console.log(items.map(i => ({ code: i.itemCode, desc: i.description })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
