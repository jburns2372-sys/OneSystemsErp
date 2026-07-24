require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const s = await prisma.projectSchedule.findFirst({ where: { projectId: 'cmrirhhw30000ic0406v47smb' }, include: { workflowTransitions: true } });
  console.log('Status:', s?.workflowStatus);
  console.log('Transitions:', s?.workflowTransitions?.length);
}
main().finally(() => prisma.$disconnect());
