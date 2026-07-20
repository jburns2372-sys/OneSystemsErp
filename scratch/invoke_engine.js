const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const period = await prisma.payrollPeriod.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { dtrs: { include: { worker: true } }, payrolls: true }
  });

  console.log("Found Period:", period.id);

  const workerMap = new Map();
  for (const dtr of period.dtrs) {
    if (!dtr.worker.subjectToPayrollCutoff) continue;
    if (!workerMap.has(dtr.workerId)) {
      workerMap.set(dtr.workerId, {
        worker: dtr.worker,
        totalRegularHours: 0,
        totalOvertimeHours: 0,
        daysWorked: 0
      });
    }
    const data = workerMap.get(dtr.workerId);
    data.totalRegularHours += dtr.regularHours;
    data.totalOvertimeHours += dtr.overtimeHours;
    if (dtr.regularHours > 0) data.daysWorked += 1;
  }

  const workerIdToDebug = period.payrolls[0].workerId;
  const data = workerMap.get(workerIdToDebug);
  
  if (!data) {
     console.log("Worker not in workerMap! DTRs must be empty or subjectToPayrollCutoff is false.");
     return;
  }

  const worker = data.worker;
  let basicPay = 0;
  let overtimePay = 0;

  if (worker.rateType === 'DAILY_RATE') {
    basicPay = worker.dailyRate * data.daysWorked;
  }

  if (basicPay === 0 && worker.dailyRate > 0 && data.daysWorked > 0) {
    basicPay = worker.dailyRate * data.daysWorked;
  }

  console.log("Days Worked:", data.daysWorked);
  console.log("Calculated Basic Pay:", basicPay);

  const payrollData = {
    daysWorked: data.daysWorked,
    basicPay: basicPay,
    grossPay: basicPay + overtimePay
  };

  const existingPayroll = period.payrolls.find(p => p.workerId === workerIdToDebug);
  if (existingPayroll) {
    console.log("Updating Payroll ID:", existingPayroll.id);
    const updated = await prisma.payroll.update({
      where: { id: existingPayroll.id },
      data: payrollData
    });
    console.log("Updated record basicPay:", updated.basicPay);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
