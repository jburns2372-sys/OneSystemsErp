const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const period = await prisma.payrollPeriod.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { dtrs: { include: { worker: true } }, payrolls: true }
  });

  const dtrsToProcess = period.dtrs.filter(dtr => dtr.worker.subjectToPayrollCutoff);
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
    if (worker.firstName !== 'Dingdong') continue; // only debug Dingdong

    console.log("Worker:", worker.firstName);
    console.log("rateType:", worker.rateType);
    console.log("dailyRate:", worker.dailyRate);
    console.log("basicMonthlySalary:", worker.basicMonthlySalary);
    console.log("daysWorked:", data.daysWorked);
    console.log("totalRegularHours:", data.totalRegularHours);

    let basicPay = 0;
    let overtimePay = 0;
    let retentionAmount = 0;

    if (worker.rateType === 'MONTHLY_SALARY') {
      basicPay = worker.basicMonthlySalary / 2;
      const hourlyRate = (worker.basicMonthlySalary / 22) / (worker.standardWorkHours || 8);
      overtimePay = data.totalOvertimeHours * hourlyRate * 1.25; 
    } else if (worker.rateType === 'DAILY_RATE') {
      basicPay = worker.dailyRate * data.daysWorked;
      const hourlyRate = worker.dailyRate / (worker.standardWorkHours || 8);
      overtimePay = data.totalOvertimeHours * hourlyRate * 1.25;
    } else if (worker.rateType === 'HOURLY_RATE') {
      basicPay = worker.hourlyRate * data.totalRegularHours;
      overtimePay = data.totalOvertimeHours * worker.hourlyRate * 1.25;
    } else if (worker.rateType === 'PIECE_RATE') {
      basicPay = worker.pieceRate;
    } else if (worker.rateType === 'ONE_LOT') {
      basicPay = worker.contractAmount;
      if (worker.retentionPercentage > 0) {
        retentionAmount = basicPay * (worker.retentionPercentage / 100);
        basicPay -= retentionAmount;
      }
    } else if (worker.rateType === 'PROFESSIONAL_FEE') {
      basicPay = worker.professionalFee;
    }

    if (basicPay === 0 && worker.dailyRate > 0 && data.daysWorked > 0) {
      console.log("Fallback used!");
      basicPay = worker.dailyRate * data.daysWorked;
      const hourlyRate = worker.dailyRate / (worker.standardWorkHours || 8);
      overtimePay = data.totalOvertimeHours * hourlyRate * 1.25;
    }

    console.log("Calculated Basic Pay:", basicPay);
    console.log("Calculated Overtime Pay:", overtimePay);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
