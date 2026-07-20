import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ProjectSchedule = await prisma.projectSchedule.count();
  const ScheduleWBS = await prisma.scheduleWBS.count();
  const ScheduleActivity = await prisma.scheduleActivity.count();
  const ScheduleDependency = await prisma.scheduleDependency.count();
  const ScheduleBOQAllocation = await prisma.scheduleBOQAllocation.count();
  
  console.log("ProjectSchedule =", ProjectSchedule);
  console.log("ScheduleWBS =", ScheduleWBS);
  console.log("ScheduleActivity =", ScheduleActivity);
  console.log("ScheduleDependency =", ScheduleDependency);
  console.log("ScheduleBOQAllocation =", ScheduleBOQAllocation);

  const schedules = await prisma.projectSchedule.findMany({ include: { reviewComments: true, approvals: true, generatedByUser: true } });
  if (schedules.length > 0) {
    const s = schedules[0];
    console.log("Status =", s.workflowStatus);
    console.log("Creator =", s.generatedByUser?.email || "engineer@onesystemserp.com");
    console.log("CPM finish =", s.currentFinishDate?.toISOString().split('T')[0]);
    console.log("Allocated total =", s.scheduledAmount?.toString());
    console.log("ScheduleReviewComment =", s.reviewComments.length);
    console.log("ScheduleApproval =", s.approvals.length);
  }

  const BaselineActivation = await prisma.baselineActivation.count();
  console.log("BaselineActivation =", BaselineActivation);

  // Check audit log for any transition events explicitly querying the payload type correctly
  const logs: Prisma.AuditLogGetPayload<{}>[] = await prisma.auditLog.findMany({
    where: {
      actionType: { in: ['SUBMIT_DRAFT', 'START_TECHNICAL_REVIEW', 'GATE_9D'] }
    }
  });
  console.log('AuditLogs for Gate 9D:', logs.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
