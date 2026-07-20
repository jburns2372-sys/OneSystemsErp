
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.accountsPayable.updateMany({
    data: {
      status: 'PENDING',
      paidAmount: 0,
      paymentMethod: null,
      paymentRef: null,
      paidAt: null
    }
  });
  console.log('All payments reset to PENDING');
}
main();

