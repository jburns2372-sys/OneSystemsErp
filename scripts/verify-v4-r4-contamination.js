require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } });

async function run() {
  const engineer = await prisma.user.findUnique({
    where: { id: 'cmriniqgy001lvchcegw8qcxv' },
    include: { projectAssignments: true }
  });

  const schedules = await prisma.projectSchedule.count();

  console.log(JSON.stringify({ engineer, schedules }, null, 2));
}

run().finally(() => prisma.$disconnect());
