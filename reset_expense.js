
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.expense.deleteMany({});
  await prisma.accountsPayable.updateMany({
    data: {
      status: 'PENDING',
      paidAmount: 0,
      paymentMethod: null,
      paymentRef: null,
      paidAt: null
    }
  });
  console.log('Reset complete');
}
main();

