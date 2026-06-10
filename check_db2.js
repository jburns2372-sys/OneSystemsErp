const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const period = await prisma.payrollPeriod.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { payrolls: { include: { worker: true } } }
  });

  console.log("Period:", period.id, "Status:", period.status);
  const dingdongPayroll = period.payrolls.find(p => p.worker.firstName === 'Dingdong');
  if (dingdongPayroll) {
    console.log("Dingdong Payroll in DB:", {
      id: dingdongPayroll.id,
      basicPay: dingdongPayroll.basicPay,
      daysWorked: dingdongPayroll.daysWorked,
      updatedAt: dingdongPayroll.updatedAt
    });
  } else {
    console.log("No payroll record for Dingdong in latest period.");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
