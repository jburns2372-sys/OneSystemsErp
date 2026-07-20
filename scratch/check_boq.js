
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const items = await prisma.consolidatedBOQItem.findMany();
  console.log(JSON.stringify(items.slice(0, 3), null, 2));
}
main();

