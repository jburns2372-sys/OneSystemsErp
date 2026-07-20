const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const period = await prisma.payrollPeriod.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { dtrs: { include: { worker: true } }, payrolls: true }
  });

  console.log("Period:", period.id);
  console.log("DTRs Count:", period.dtrs.length);
  console.log("Payrolls Count:", period.payrolls.length);
  
  if (period.dtrs.length > 0) {
    const dtrsForDingdong = period.dtrs.filter(d => d.worker.firstName === 'Dingdong');
    console.log("Dingdong DTRs:", dtrsForDingdong.length);
    if(dtrsForDingdong.length > 0) {
       console.log("Sample DTR Reg Hrs:", dtrsForDingdong[0].regularHours);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
