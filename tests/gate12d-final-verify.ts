import { prismaBase as prisma } from '../src/lib/prisma-base';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function verify() {
  const scheduleId = '641f4c56e72847e6a5e3288d0';
  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      wbsNodes: true,
      activities: true,
      dependencies: true,
      boqAllocations: true,
      approvals: true,
      reviewComments: true,
      workflowTransitions: true,
      baselineActivations: true
    }
  });

  if (!schedule) {
    throw new Error('Schedule not found');
  }

  console.log('workflowStatus:', schedule.workflowStatus);
  console.log('rowVersion:', schedule.rowVersion);
  console.log('BaselineActivation count:', schedule.baselineActivations.length);
  
  const authoritativeActivation = schedule.baselineActivations.find((a: any) => a.isAuthoritative);
  console.log('isAuthoritative:', !!authoritativeActivation);
  if (authoritativeActivation) {
    console.log('activation actor:', authoritativeActivation.activatedByNameSnapshot);
    console.log('activation role:', authoritativeActivation.activatedByRoleSnapshot);
    console.log('review round:', authoritativeActivation.reviewRound);
    console.log('baselineCode populated:', !!authoritativeActivation.revisionCode);
    console.log('activatedAt populated:', !!authoritativeActivation.createdAt);
    console.log('activatedById populated:', !!authoritativeActivation.activatedById);
    console.log('activationSnapshotHash populated:', !!authoritativeActivation.scheduleSnapshotHash);
    console.log('lockedBOQChecksum:', authoritativeActivation.lockedBOQChecksum);
  }

  console.log('ScheduleApproval count:', schedule.approvals.length);
  console.log('Current-round rejection count:', schedule.approvals.filter((a: any) => a.approvalStage === 'REJECT').length);
  
  schedule.approvals.forEach((a: any) => {
    console.log(`Approval: ${a.approvalStage} ${a.approverRoleSnapshot} round ${a.reviewRound}`);
  });

  console.log('ScheduleReviewComment count:', schedule.reviewComments.length);
  const types = new Set(schedule.reviewComments.map((c: any) => c.commentType));
  console.log('Comment types:', Array.from(types).join(', '));
  
  console.log('ScheduleWorkflowTransition count:', schedule.workflowTransitions.length);
  const transitions = schedule.workflowTransitions.map((t: any) => t.action);
  console.log('Transitions:', transitions.join(', '));

  console.log('WBS count:', schedule.wbsNodes.length);
  console.log('Activity count:', schedule.activities.length);
  console.log('Dependency count:', schedule.dependencies.length);
  console.log('BOQ allocation count:', schedule.boqAllocations.length);

  console.log('Approved contract amount:', schedule.awardedContractAmount.toString());
  console.log('Scheduled amount:', schedule.scheduledAmount.toString());
  console.log('Financial difference:', schedule.differenceAmount.toString());
  
  console.log('ProjectSchedule lockedBOQChecksum:', schedule.lockedBOQChecksum);
  console.log('WBS count:', schedule.wbsNodes.length);
  schedule.wbsNodes.forEach(w => console.log('WBS:', w.name));
  
  // Phase 11 & 12
  const phases = schedule.wbsNodes.filter(w => w.parentId === null);
  console.log('Phase count:', phases.length);
  const p11 = phases.find(p => p.name.includes('Testing and Commissioning'));
  console.log('Phase 11 present:', !!p11);
  const p12 = phases.find(p => p.name.includes('Acceptance and Demobilization'));
  console.log('Phase 12 present:', !!p12);

}

verify().catch(console.error).finally(() => prisma.$disconnect());
