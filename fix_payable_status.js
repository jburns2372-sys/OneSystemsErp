
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const payables = await prisma.accountsPayable.findMany({ where: { status: 'PAID' } });
  for (const p of payables) {
    if (new Date(p.dueDate) > new Date()) {
      await prisma.accountsPayable.update({ where: { id: p.id }, data: { status: 'ACCRUED' } });
      console.log('Fixed', p.id, 'to ACCRUED');
    }
  }
}
main();

