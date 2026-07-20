import { prisma } from './src/lib/prisma';

async function main() {
  const projectId = 'cmrirhhw30000ic0406v47smb';
  const scheduleId = '641f4c56e72847e6a5e3288d0';

  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId, projectId }
  });

  const transitionCount = await prisma.scheduleWorkflowTransition.count({
    where: { scheduleId, action: 'SUBMIT_DRAFT_FOR_REVIEW' }
  });

  const latestTransition = await prisma.scheduleWorkflowTransition.findFirst({
    where: { scheduleId },
    orderBy: { occurredAt: 'desc' },
    include: { actor: true }
  });

  const actorRoleSnapshot = latestTransition ? await prisma.projectUserAssignment.findFirst({
    where: { userId: latestTransition.actorUserId, projectId }
  }) : null;

  const commentCount = await prisma.scheduleReviewComment.count({
    where: { scheduleId }
  });

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
    console.log(`action: ${latestTransition.action}`);
    console.log(`previous status: ${latestTransition.fromStatus}`);
    console.log(`resulting status: ${latestTransition.toStatus}`);
    console.log(`actor email: ${latestTransition.actor?.email}`);
    console.log(`actor role: ${actorRoleSnapshot?.projectRole}`);
  } else {
    console.log('action: null');
    console.log('previous status: null');
    console.log('resulting status: null');
    console.log('actor email: null');
    console.log('actor role: null');
  }
  console.log(`comments: ${commentCount}`);
  console.log(`approvals: ${approvalCount}`);
  console.log(`baseline activations: ${baselineActivationCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
