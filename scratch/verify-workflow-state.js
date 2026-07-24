require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const scheduleId = '641f4c56e72847e6a5e3288d0';
  
  const s = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId }
  });
  
  const transitions = await prisma.scheduleWorkflowTransition.findMany({
    where: { scheduleId, action: 'SUBMIT_DRAFT_FOR_REVIEW' },
    orderBy: { occurredAt: 'desc' }
  });
  
  const commentCount = await prisma.scheduleReviewComment.count({ where: { scheduleId } });
  const approvalCount = await prisma.scheduleApproval.count({ where: { scheduleId } });
  const baselineCount = await prisma.baselineActivation.count({ where: { scheduleId } });
  
  console.log(`workflowStatus=${s?.workflowStatus}`);
  console.log(`transition_count=${transitions.length}`);
  if (transitions.length > 0) {
    console.log(`latest_action=${transitions[0].action}`);
    console.log(`latest_actor=${transitions[0].actorEmailSnapshot}`); // wait, what field has actor info? 
  }
  console.log(`comment_count=${commentCount}`);
  console.log(`approval_count=${approvalCount}`);
  console.log(`baseline_count=${baselineCount}`);
}

main().finally(() => prisma.$disconnect());
