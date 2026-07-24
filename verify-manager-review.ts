import { prisma } from './src/lib/prisma';

async function main() {
  const projectId = 'cmrirhhw30000ic0406v47smb';
  const scheduleId = '641f4c56e72847e6a5e3288d0';

  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId, projectId }
  });

  const transitionCount = await prisma.scheduleWorkflowTransition.count({
    where: { scheduleId }
  });

  const latestTransition = await prisma.scheduleWorkflowTransition.findFirst({
    where: { scheduleId },
    orderBy: { occurredAt: 'desc' },
    include: { actor: true }
  });

  const comments = await prisma.scheduleReviewComment.findMany({
    where: { scheduleId }
  });

  const commentTypes = comments.map(c => c.commentType).join(', ');
  const commentCount = comments.length;

  const approvalCount = await prisma.scheduleApproval.count({
    where: { scheduleId }
  });

  const baselineActivationCount = await prisma.baselineActivation.count({
    where: { scheduleId }
  });

  console.log(`workflowStatus: ${schedule?.workflowStatus}`);
  console.log(`rowVersion: ${schedule?.rowVersion}`);
  console.log(`transition count: ${transitionCount}`);
  if (latestTransition) {
    console.log(`latest action: ${latestTransition.action}`);
    console.log(`latest actor email: ${latestTransition.actor?.email}`);
  } else {
    console.log('latest action: null');
    console.log('latest actor email: null');
  }
  console.log(`comments: ${commentCount}`);
  console.log(`comment types: ${commentTypes || 'none'}`);
  console.log(`approvals: ${approvalCount}`);
  console.log(`baseline activations: ${baselineActivationCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
