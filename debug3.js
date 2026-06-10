const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const period = await prisma.payrollPeriod.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { payrolls: true }
  });
  
  console.log("Total payrolls for period:", period.payrolls.length);
  
  const joeyPayrolls = period.payrolls.filter(p => p.workerId === 'cmq43vnrn000evcekob8qaxip');
  console.log("Joey payrolls:", joeyPayrolls);
}

check().catch(console.error).finally(()=>prisma.$disconnect());
