require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const audits = await prisma.auditLog.findMany({
    where: { 
      actionType: { in: ['PASSWORD_RESET_COMPLETED', 'USER_SESSIONS_REVOKED'] }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log('Recent Audit Logs:', audits);
}
run().finally(() => prisma.$disconnect());
