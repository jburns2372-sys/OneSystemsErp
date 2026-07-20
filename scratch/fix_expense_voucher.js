
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const expenses = await prisma.expense.findMany();
  for (const exp of expenses) {
    if (exp.category === 'MATERIALS' && exp.description.includes('Payment to')) {
      const poMatch = exp.description.match(/PO:\s*(.*?)\s*\|/);
      const drMatch = exp.description.match(/DR:\s*(.*)$/);
      if (poMatch && drMatch) {
        const poNumber = poMatch[1].trim();
        const drNumber = drMatch[1].trim();
        const payable = await prisma.accountsPayable.findFirst({
          where: { po: { poNumber }, delivery: { receiptNumber: drNumber } }
        });
        if (payable && payable.voucherNumber) {
          await prisma.expense.update({
            where: { id: exp.id },
            data: { receiptRef: payable.voucherNumber }
          });
          console.log('Fixed expense', exp.id, 'to', payable.voucherNumber);
        }
      }
    }
  }
}
main();

