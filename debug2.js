const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


// Let's just copy the logic to see where it throws:
async function test() {
    const period = await prisma.payrollPeriod.findFirst({
      orderBy:{createdAt:'desc'},
      include: {
        dtrs: { include: { worker: true } },
        payrolls: true
      }
    });

    if (!period) throw new Error('Payroll period not found');

    const govSettings = await prisma.governmentSettings.findFirst() || {
      phEmployeeRate: 2.5,
      pagibigEmployeeRate: 2.0,
      deductionSchedule: 'SPLIT'
    };

    // Filter out workers that shouldn't be in this cutoff
    const dtrsToProcess = period.dtrs.filter(dtr => dtr.worker.subjectToPayrollCutoff);
    
    console.log("DTRs to process length:", dtrsToProcess.length);

    // Group DTRs by Worker
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

    console.log("Worker map size:", workerMap.size);

    for (const [workerId, data] of workerMap.entries()) {
      const worker = data.worker;
      let basicPay = 0;
      let overtimePay = 0;
      let retentionAmount = 0;

      // 1. Basic Pay Computation
      if (worker.rateType === 'MONTHLY_SALARY') {
        basicPay = worker.basicMonthlySalary / 2; // Assuming semi-monthly
        // Convert to hourly for OT
        const hourlyRate = (worker.basicMonthlySalary / 22) / (worker.standardWorkHours || 8);
        overtimePay = data.totalOvertimeHours * hourlyRate * 1.25; 
      } else if (worker.rateType === 'DAILY_RATE') {
        basicPay = worker.dailyRate * data.daysWorked;
        const hourlyRate = worker.dailyRate / (worker.standardWorkHours || 8);
        overtimePay = data.totalOvertimeHours * hourlyRate * 1.25;
      }
      // ...
      let grossPay = basicPay + overtimePay;
      
      let sssDeduction = 0;
      let philHealthDeduction = 0;
      let pagIbigDeduction = 0;
      let withholdingTax = 0;
      let taxableIncome = grossPay;
      let cashAdvanceDeduction = 0;
      let loanDeduction = 0;
      let totalDeductions = 0;
      let netPay = grossPay;
      let paymentStatus = 'PENDING';
      let paymentHoldReason = null;
      
      const existingPayroll = period.payrolls.find((p) => p.workerId === workerId);
      
      const payrollData = {
        payrollPeriodId: period.id,
        workerId: worker.id,
        daysWorked: data.daysWorked,
        regularHours: data.totalRegularHours,
        overtimeHours: data.totalOvertimeHours,
        basicPay,
        overtimePay,
        grossPay,
        taxableCompensation: taxableIncome > 0 ? taxableIncome : 0,
        sssDeduction,
        philhealthDeduction: philHealthDeduction,
        pagibigDeduction: pagIbigDeduction,
        withholdingTax,
        finalWithholdingTax: withholdingTax,
        cashAdvance: cashAdvanceDeduction,
        loanDeduction,
        totalDeductions,
        netPay,
        paymentMethod: worker.allowedPaymentMethod,
        paymentStatus,
        paymentHoldReason: paymentHoldReason || undefined
      };

      console.log(`Trying to update worker ${worker.firstName}`);
      try {
        if (existingPayroll) {
           await prisma.payroll.update({ where: { id: existingPayroll.id }, data: payrollData });
        } else {
           await prisma.payroll.create({ data: payrollData });
        }
        console.log(`Success for ${worker.firstName}`);
      } catch (e) {
        console.error(`Failed for ${worker.firstName}`, e.message);
      }
    }
}


test().catch(console.error).finally(()=>prisma.$disconnect());
