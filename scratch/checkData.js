const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.scheduleGenerationAudit.findFirst({ orderBy: { timestamp: 'desc' } }).then(a => {
  console.log(a.validationResults);
  process.exit(0);
});
