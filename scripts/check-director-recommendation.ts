require('dotenv').config({ path: '.env.uat-v4-r7' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const projectId = 'cmrirhhw30000ic0406v47smb';
  const scheduleId = '641f4c56e72847e6a5e3288d0';

  const schedule = await prisma.projectSchedule.findUnique({
    where: { id_projectId: { id: scheduleId, projectId } },
    include: {
      approvals: true,
      workflowTransitions: true,
      reviewComments: true,
      baselineActivations: true
    }
  });

  if (!schedule) {
    console.log("Schedule not found");
    return;
  }

  console.log("workflowStatus:", schedule.workflowStatus);
  console.log("rowVersion:", schedule.rowVersion);
  console.log("ScheduleApproval count:", schedule.approvals.length);
  
  const technical = schedule.approvals.find((a: any) => a.approvalStage === 'TECHNICAL');
  const finance = schedule.approvals.find((a: any) => a.approvalStage === 'FINANCE');
  
  if (technical) {
    const user = await prisma.user.findUnique({ where: { id: technical.reviewerId }});
    console.log(`Approval stages:`);
    console.log(`TECHNICAL / ${technical.decision} - ${user?.email} (${technical.reviewerRoleSnapshot})`);
  }
  if (finance) {
    const user = await prisma.user.findUnique({ where: { id: finance.reviewerId }});
    console.log(`FINANCE / ${finance.decision} - ${user?.email} (${finance.reviewerRoleSnapshot})`);
  }

  const auditLog = await prisma.auditLog.findFirst({
    where: {
      actionType: 'SCHEDULE_FINAL_BASELINE_RECOMMENDED',
      moduleName: 'PROJECT_SCHEDULING'
    },
    orderBy: { createdAt: 'desc' }
  });

  if (auditLog) {
    const directorUser = await prisma.user.findUnique({ where: { id: auditLog.userId }});
    const roles = await prisma.projectUserAssignment.findFirst({ where: { userId: auditLog.userId, projectId } });
    const globalRole = await prisma.userRole.findFirst({ where: { userId: auditLog.userId }, include: { role: true } });
    console.log("Director recommendation actor:", directorUser?.email);
    console.log("Director actor role:", roles?.projectRole || globalRole?.role?.roleCode);
  } else {
    console.log("Director recommendation actor: NOT FOUND");
  }

  console.log("workflow-transition count:", schedule.workflowTransitions.length);
  console.log("review-comment count:", schedule.reviewComments.length);
  console.log("baseline-activation count:", schedule.baselineActivations.length);

  const scheduleTotal = await prisma.scheduleActivity.aggregate({
    where: { scheduleId },
    _sum: { allocatedAmount: true }
  });
  
  const benchmarkTotal = await prisma.boqItem.aggregate({
    where: { projectId, isBenchmark: true },
    _sum: { amount: true }
  });

  const diff = (scheduleTotal._sum.allocatedAmount || 0) - (benchmarkTotal._sum.amount || 0);
  console.log(`financial difference: PHP ${diff.toFixed(2)}`);
  
  await prisma.$disconnect();
}

check().catch(console.error);
