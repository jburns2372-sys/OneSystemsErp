const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.uat-v4-r7' });

const prisma = new PrismaClient();

async function trace() {
  const scheduleId = '641f4c56e72847e6a5e3288d0';
  const projectId = 'cmrirhhw30000ic0406v47smb';
  const email = 'director@onesystemserp.com';

  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log(JSON.stringify({ error: 'User not found' }));
    return;
  }

  const assignment = await prisma.projectUserAssignment.findFirst({
    where: { projectId, userId: user.id }
  });

  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId, projectId },
    include: { approvals: true, baselineActivations: true }
  });

  const result = {
    user: {
      email: user.email,
      id: user.id,
      globalRole: user.role
    },
    assignment: assignment ? {
      exists: true,
      projectRole: assignment.projectRole,
      status: assignment.status
    } : { exists: false },
    schedule: schedule ? {
      workflowStatus: schedule.workflowStatus,
      rowVersion: schedule.rowVersion,
      approvalCount: schedule.approvals.length,
      baselineCount: schedule.baselineActivations.length
    } : null
  };

  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

trace().catch(console.error);
