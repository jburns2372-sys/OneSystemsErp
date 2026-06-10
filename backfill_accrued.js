
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const expenses = await prisma.expense.findMany();
  for (const exp of expenses) {
    if (exp.receiptRef) {
      const payable = await prisma.accountsPayable.findFirst({ where: { voucherNumber: exp.receiptRef } });
      if (payable && payable.dueDate > new Date(exp.date)) {
        await prisma.expense.update({ where: { id: exp.id }, data: { isAccrued: true } });
        console.log('Marked', exp.id, 'as accrued');
      }
    }
  }
}
main();

