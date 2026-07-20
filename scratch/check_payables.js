
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const payables = await prisma.accountsPayable.findMany();
  console.log('Payables:', JSON.stringify(payables, null, 2));
}
main();

