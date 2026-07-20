const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const workers = await prisma.worker.findMany({
    where: { firstName: { in: ['Carlos', 'Sophia', 'Joey'] } },
    select: { id: true, firstName: true, lastName: true, rateType: true, dailyRate: true, subjectToPayrollCutoff: true }
  });
  console.log("WORKERS:", workers);

  const periods = await prisma.payrollPeriod.findMany({
    orderBy: { createdAt: 'desc' },
    take: 1,
    include: {
      payrolls: true,
      dtrs: true
    }
  });

  console.log("PAYROLLS:", periods[0].payrolls.map(p => ({
    workerId: p.workerId,
    daysWorked: p.daysWorked,
    regularHours: p.regularHours,
    basicPay: p.basicPay,
    grossPay: p.grossPay,
    netPay: p.netPay
  })));
}

check().catch(console.error).finally(() => prisma.$disconnect());
