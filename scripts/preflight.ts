import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function runPreflight() {
  const projectId = 'cmrirhhw30000ic0406v47smb';
  const scheduleId = '641f4c56e72847e6a5e3288d0';
  const directorEmail = 'director@onesystemserp.com';

  try {
    // Check Director User
    const directorUser = await prisma.user.findUnique({ where: { email: directorEmail } });
    if (!directorUser) throw new Error('Director user not found');
    
    // Check Assignment
    const assignment = await prisma.projectUserAssignment.findUnique({
      where: { userId_projectId: { userId: directorUser.id, projectId } }
    });
    
    // Schedule Preflight
    const schedule = await prisma.projectSchedule.findUnique({
      where: { id_projectId: { id: scheduleId, projectId } },
      include: {
        activities: { include: { boqAllocations: true } },
        wbsNodes: true,
        dependencies: true
      }
    });
    if (!schedule) throw new Error('Schedule not found');

    const approvals = await prisma.scheduleApproval.findMany({
      where: { scheduleId }
    });
    const comments = await prisma.scheduleReviewComment.count({ where: { scheduleId } });
    const transitions = await prisma.scheduleWorkflowTransition.count({ where: { scheduleId } });
    const activations = await prisma.baselineActivation.count({ where: { scheduleId } });
    const validations = await prisma.scheduleGenerationAudit.count({ where: { projectId } }); // Or whichever is Stage A

    const technicalApprovals = approvals.filter(a => a.approvalStage === 'TECHNICAL' && a.decision === 'APPROVE' && a.reviewRound === schedule.reviewRound);
    const financeApprovals = approvals.filter(a => a.approvalStage === 'FINANCE' && a.decision === 'APPROVE' && a.reviewRound === schedule.reviewRound);
    const rejections = approvals.filter(a => (a.decision === 'REJECT' || a.decision === 'RETURN_FOR_REVISION') && a.reviewRound === schedule.reviewRound);
    
    const allocationsCount = schedule.activities.reduce((sum, act) => sum + act.boqAllocations.length, 0);
    const phaseNames = schedule.wbsNodes.map(w => w.name.toLowerCase());
    const hasTesting = phaseNames.some(n => n.includes('testing') || n.includes('commissioning'));
    const hasDemob = phaseNames.some(n => n.includes('acceptance') || n.includes('demobilization'));

    const { checkSchedulingAccess } = await import('../src/lib/scheduling/authUtils');
    const access = await checkSchedulingAccess(directorUser.id, assignment?.projectRole || 'PROJECT_DIRECTOR', projectId, 'canLock');

    console.log(JSON.stringify({
      actor: { email: directorEmail, role: assignment?.projectRole, active: assignment?.assignmentStatus },
      pbac: { capability: 'canLock', result: access },
      schedule: {
        workflowStatus: schedule.workflowStatus,
        rowVersion: schedule.rowVersion,
        reviewRound: schedule.reviewRound,
        lockedBOQChecksum: schedule.lockedBOQChecksum,
        awardedContractAmount: schedule.awardedContractAmount,
        scheduledAmount: schedule.scheduledAmount,
        financialDifference: Math.abs(Number(schedule.awardedContractAmount) - Number(schedule.scheduledAmount))
      },
      counts: {
        scheduleApproval: approvals.length,
        technicalApprovals: technicalApprovals.length,
        financeApprovals: financeApprovals.length,
        rejections: rejections.length,
        reviewComments: comments,
        workflowTransitions: transitions,
        baselineActivations: activations,
        wbsNodes: schedule.wbsNodes.length,
        activities: schedule.activities.length,
        dependencies: schedule.dependencies.length,
        allocations: allocationsCount
      },
      phases: { hasTesting, hasDemob }
    }, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}
runPreflight();
