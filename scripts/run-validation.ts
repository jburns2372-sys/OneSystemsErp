import { PrismaClient } from '@prisma/client';
import { validateScheduleForReview } from '../src/lib/scheduling/scheduleWorkflow';

const prisma = new PrismaClient({ log: ['query', 'warn', 'error'] });

const PROJECT_ID = 'cmrjo4msn0000vc9c7s65o3lt';
const NEW_SCHEDULE_ID = 'clean-candidate-1784004755783';

async function main() {
  const postClean = await prisma.projectSchedule.findUnique({ where: { id: NEW_SCHEDULE_ID } });
  
  if (postClean && postClean.workflowStatus === 'AI_GENERATED_DRAFT') {
     console.log('RESUMING DETERMINISTIC VALIDATION...');
     let sysAdmin = await prisma.user.findFirst({ where: { role: { in: ['SYSTEM_ADMIN', 'CEO'] } } });
     if (!sysAdmin) sysAdmin = await prisma.user.findFirst();
     const resolvedActorId = sysAdmin!.id;
     
     const valResult = await validateScheduleForReview({ projectId: PROJECT_ID, scheduleId: NEW_SCHEDULE_ID, actorId: resolvedActorId, expectedRowVersion: postClean.rowVersion });
     
     if (valResult.isValid) {
        await prisma.projectSchedule.update({
          where: { id: NEW_SCHEDULE_ID },
          data: { workflowStatus: 'READY_FOR_REVIEW', rowVersion: { increment: 1 } }
        });
        console.log('DETERMINISTIC VALIDATION PASSED. Transitioned to READY_FOR_REVIEW.');
     } else {
        console.error('VALIDATION FAILED', valResult.errors);
        process.exit(1);
     }
  } else {
     console.log('Status is not AI_GENERATED_DRAFT, it is:', postClean?.workflowStatus);
  }
}
main().finally(() => prisma.$disconnect());
