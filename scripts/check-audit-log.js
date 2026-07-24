require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } });

async function run() {
  const auditLogs = await prisma.auditLog.findMany({
    where: { actionType: 'PASSWORD_RESET_COMPLETED' },
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(auditLogs, null, 2));
}

run().finally(() => prisma.$disconnect());
