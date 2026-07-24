require('dotenv').config({ path: '.env.uat-v4-r7', override: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  const projectId = 'cmrirhhw30000ic0406v47smb';
  try {
    const schedules = await prisma.projectSchedule.findMany({ where: { projectId } });
    const scheduleCount = schedules.length;
    const workflowStatus = schedules[0]?.workflowStatus;
    
    const scheduleWBS = await prisma.scheduleWBS.count({ where: { scheduleId: schedules[0]?.id } });
    const scheduleActivity = await prisma.scheduleActivity.count({ where: { scheduleId: schedules[0]?.id } });
    const scheduleDependency = await prisma.scheduleDependency.count({ where: { predecessor: { scheduleId: schedules[0]?.id } } });
    const scheduleBOQAllocation = await prisma.scheduleBOQAllocation.count({ where: { activity: { scheduleId: schedules[0]?.id } } });
    const awardedBOQItem = await prisma.awardedBOQItem.count({ where: { projectId } });

    const scheduleWorkflowTransition = await prisma.scheduleWorkflowTransition.count();
    const scheduleReviewComment = await prisma.scheduleReviewComment.count();
    const scheduleApproval = await prisma.scheduleApproval.count();
    const baselineActivation = await prisma.baselineActivation.count();

    const allocatedData = await prisma.scheduleBOQAllocation.findMany({ where: { activity: { scheduleId: schedules[0]?.id } } });
    const allocatedTotal = allocatedData.reduce((sum, a) => sum + (a.allocatedAmount ? Number(a.allocatedAmount) : 0), 0);

    const boqData = await prisma.awardedBOQItem.findMany({ where: { projectId } });
    const boqTotal = boqData.reduce((sum, a) => sum + (a.totalCost ? Number(a.totalCost) : 0), 0);

    const maxFinish = await prisma.scheduleActivity.aggregate({
        where: { scheduleId: schedules[0]?.id },
        _max: { plannedFinishDate: true }
    });
    const cpmFinish = maxFinish._max.plannedFinishDate ? maxFinish._max.plannedFinishDate.toISOString().split('T')[0] : null;

    const diff = Math.abs(boqTotal - allocatedTotal);
    
    if (
        scheduleCount === 1 && 
        workflowStatus === 'AI_GENERATED_DRAFT' &&
        scheduleWBS === 13 &&
        scheduleActivity === 14 &&
        scheduleDependency === 11 &&
        scheduleBOQAllocation === 326 &&
        awardedBOQItem === 326 &&
        scheduleWorkflowTransition === 0 &&
        scheduleReviewComment === 0 &&
        scheduleApproval === 0 &&
        baselineActivation === 0 &&
        allocatedTotal.toFixed(2) === '43106674.89' &&
        boqTotal.toFixed(2) === '43106674.89' &&
        diff < 0.01 &&
        cpmFinish === '2026-10-18'
    ) {
        console.log('GATE9D_STAGE_7_BASELINE_UNCHANGED');
    } else {
        console.error('GATE9D_STAGE_7_BASELINE_CHANGED_UNEXPECTEDLY', {
            scheduleCount, workflowStatus, scheduleWBS, scheduleActivity, scheduleDependency,
            scheduleBOQAllocation, awardedBOQItem, scheduleWorkflowTransition, scheduleReviewComment,
            scheduleApproval, baselineActivation, allocatedTotal, boqTotal, diff, cpmFinish
        });
    }
  } catch (e) {
      console.error(e);
      console.error('GATE9D_STAGE_7_BASELINE_CHANGED_UNEXPECTEDLY');
  } finally {
      await prisma.$disconnect();
  }
}

verify();
