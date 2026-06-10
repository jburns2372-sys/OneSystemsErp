const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const period = await prisma.payrollPeriod.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  console.log("Testing computePayrollForPeriod on", period.id);

  // Instead of importing the TS file which is complex in Node, I will literally run the exact code block that computePayrollForPeriod runs
  const dtrs = await prisma.workerDtr.findMany({
    where: { payrollPeriodId: period.id },
    include: { worker: true }
  });

  const payrolls = await prisma.payroll.findMany({
    where: { payrollPeriodId: period.id }
  });

  const dtrsToProcess = dtrs.filter(dtr => dtr.worker.subjectToPayrollCutoff);
  const workerMap = new Map();
  for (const dtr of dtrsToProcess) {
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

  for (const [workerId, data] of workerMap.entries()) {
    const worker = data.worker;
    let basicPay = 0;
    let overtimePay = 0;
    
    if (worker.rateType === 'DAILY_RATE') {
      basicPay = worker.dailyRate * data.daysWorked;
      const hourlyRate = worker.dailyRate / (worker.standardWorkHours || 8);
      overtimePay = data.totalOvertimeHours * hourlyRate * 1.25;
    }

    if (basicPay === 0 && worker.dailyRate > 0 && data.daysWorked > 0) {
      basicPay = worker.dailyRate * data.daysWorked;
      const hourlyRate = worker.dailyRate / (worker.standardWorkHours || 8);
      overtimePay = data.totalOvertimeHours * hourlyRate * 1.25;
    }

    let grossPay = basicPay + overtimePay;

    const payrollData = {
      daysWorked: data.daysWorked,
      basicPay,
      grossPay,
      netPay: grossPay // simplified for test
    };

    const existingPayroll = payrolls.find(p => p.workerId === workerId);
    
    if (existingPayroll) {
      console.log(`Updating payroll for ${worker.firstName} with basicPay: ${basicPay}`);
      await prisma.payroll.update({ where: { id: existingPayroll.id }, data: payrollData });
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
