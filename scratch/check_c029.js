
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const item = await prisma.consolidatedBOQItem.findFirst({ where: { itemCode: 'C029' } });
  console.log(JSON.stringify(item, null, 2));
}
main();

