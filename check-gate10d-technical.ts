import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.uat-v4-r7' });

import { prismaBase } from './src/lib/prisma-base';

async function main() {
  const projectId = 'cmrirhhw30000ic0406v47smb';
  const scheduleId = '641f4c56e72847e6a5e3288d0';

  const sched = await prismaBase.projectSchedule.findUnique({
    where: { id: scheduleId }
  });

  if (!sched) {
    console.log('Schedule not found');
    return;
  }

  const approvals = await prismaBase.scheduleApproval.findMany({
    where: { scheduleId },
    include: { reviewer: true }
  });

  const transitions = await prismaBase.scheduleWorkflowTransition.count({
    where: { scheduleId }
  });

  const comments = await prismaBase.scheduleReviewComment.count({
    where: { scheduleId }
  });

  const baselines = await prismaBase.baselineActivation.count({
    where: { scheduleId }
  });

  const technicalApproval = approvals.find(a => a.approvalStage === 'TECHNICAL');
  const financeApprovals = approvals.filter(a => a.approvalStage === 'FINANCE').length;

  console.log(`workflowStatus: ${sched.workflowStatus}`);
  console.log(`rowVersion: ${sched.rowVersion}`);
  console.log(`ScheduleApproval count: ${approvals.length}`);
  
  if (technicalApproval) {
    console.log('TECHNICAL approval:');
    console.log(`approvalStage: ${technicalApproval.approvalStage}`);
    console.log(`decision: ${technicalApproval.decision}`);
    console.log(`actor email: ${technicalApproval.reviewer?.email}`);
    console.log(`actor role: ${technicalApproval.reviewerRoleSnapshot}`);
    console.log(`review round: ${technicalApproval.reviewRound}`);
  } else {
    console.log('TECHNICAL approval: NONE');
  }

  console.log(`FINANCE approval count: ${financeApprovals}`);
  console.log(`workflow-transition count: ${transitions}`);
  console.log(`review-comment count: ${comments}`);
  console.log(`baseline-activation count: ${baselines}`);
  console.log(`financial difference: PHP ${sched.differenceAmount}`);
}

main().then(() => prismaBase.$disconnect()).catch(console.error);
