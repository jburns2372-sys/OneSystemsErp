
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const payables = await prisma.accountsPayable.findMany();
  for (let i = 0; i < payables.length; i++) {
    if (!payables[i].voucherNumber) {
      const voucherNumber = 'PV-' + new Date().getFullYear() + '-' + String(i + 1).padStart(4, '0');
      await prisma.accountsPayable.update({
        where: { id: payables[i].id },
        data: { voucherNumber: voucherNumber }
      });
      console.log('Updated', payables[i].id, 'to', voucherNumber);
    }
  }
}
main();

