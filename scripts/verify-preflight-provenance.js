require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } });

async function run() {
  const engineer = await prisma.user.findUnique({
    where: { email: 'engineer@onesystemserp.com' }
  });

  const assignment = await prisma.projectUserAssignment.findFirst({
    where: { userId: engineer.id, projectId: 'cmrirhhw30000ic0406v47smb' }
  });

  const auditLogs = await prisma.auditLog.findMany({
    where: { 
      OR: [
        { transactionId: engineer.id },
        { transactionId: assignment?.id }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(JSON.stringify({
    engineer_passwordChangedAt: engineer.passwordChangedAt,
    engineer_sessionVersion: engineer.sessionVersion,
    engineer_mustChangePassword: engineer.mustChangePassword,
    engineer_status: engineer.status,
    engineer_lockedUntil: engineer.lockedUntil,
    assignment,
    auditLogs
  }, null, 2));
}

run().finally(() => prisma.$disconnect());
