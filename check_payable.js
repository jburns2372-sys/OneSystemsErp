
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.accountsPayable.findFirst();
  console.log(p);
}
main();

