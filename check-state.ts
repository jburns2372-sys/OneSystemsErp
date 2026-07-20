import { prisma } from './src/lib/prisma';

async function main() {
  const projectId = 'cmrirhhw30000ic0406v47smb';
  const scheduleId = '641f4c56e72847e6a5e3288d0';

  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId, projectId }
  });

  const transitions = await prisma.scheduleWorkflowTransition.count({
    where: { scheduleId }
  });

  console.log(`workflowStatus: ${schedule?.workflowStatus}`);
  console.log(`transition count: ${transitions}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
