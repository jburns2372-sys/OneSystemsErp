require('dotenv').config({ path: '.env.uat-v4-r7' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const scheduleId = '641f4c56e72847e6a5e3288d0';
  const projectId = 'cmrirhhw30000ic0406v47smb';

  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      workflowTransitions: true,
      approvals: true,
      reviewComments: true,
      baselineActivations: true
    }
  });

  if (!schedule) {
    console.log(JSON.stringify({ error: 'Schedule not found' }));
    return;
  }

  const users = await prisma.user.findMany({
    where: {
      id: { in: schedule.approvals.map(a => a.reviewerId) }
    }
  });
  
  const userMap = {};
  for (const u of users) userMap[u.id] = u.email || '';

  const technical = schedule.approvals.find(a => a.approvalStage === 'TECHNICAL');
  const finance = schedule.approvals.find(a => a.approvalStage === 'FINANCE');

  const result = {
    workflowStatus: schedule.workflowStatus,
    rowVersion: schedule.rowVersion,
    approvalCount: schedule.approvals.length,
    technical: technical ? {
      approvalStage: technical.approvalStage,
      decision: technical.decision,
      actorEmail: userMap[technical.reviewerId] || technical.reviewerId,
      actorRole: technical.reviewerRoleSnapshot,
      reviewRound: technical.reviewRound
    } : null,
    finance: finance ? {
      approvalStage: finance.approvalStage,
      decision: finance.decision,
      actorEmail: userMap[finance.reviewerId] || finance.reviewerId,
      actorRole: finance.reviewerRoleSnapshot,
      reviewRound: finance.reviewRound
    } : null,
    transitionCount: schedule.workflowTransitions.length,
    commentCount: schedule.reviewComments.length,
    baselineActivationCount: schedule.baselineActivations.length
  };

  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
