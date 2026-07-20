import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.uat-v4-r7' });

const prisma = new PrismaClient();

async function check() {
  const projectId = "cmrirhhw30000ic0406v47smb";
  const schedule = await prisma.projectSchedule.findFirst({
    where: { projectId: projectId }
  });
  
  if (!schedule) {
    console.log("No schedule found");
    return;
  }
  
  console.log("WORKFLOW_STATUS:", schedule.workflowStatus);
  
  const transitions = await prisma.scheduleWorkflowTransition.count({
    where: { 
      scheduleId: schedule.id,
      action: "SUBMIT_DRAFT_FOR_REVIEW"
    }
  });
  console.log("SUBMIT_DRAFT_FOR_REVIEW_COUNT:", transitions);
  
  const comments = await prisma.scheduleReviewComment.count({
    where: { scheduleId: schedule.id }
  });
  console.log("COMMENTS_COUNT:", comments);
  
  const approvals = await prisma.scheduleApproval.count({
    where: { scheduleId: schedule.id }
  });
  console.log("APPROVALS_COUNT:", approvals);
  
  const baselines = await prisma.baselineActivation.count({
    where: { scheduleId: schedule.id }
  });
  console.log("BASELINES_COUNT:", baselines);
}

check().catch(console.error).finally(() => prisma.$disconnect());
