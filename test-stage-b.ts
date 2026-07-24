import { prisma, transactionContext } from './src/lib/prisma';
import { submitDraftForReview } from './src/lib/services/schedule-workflow.service';

async function main() {
  const projectId = 'cmrirhhw30000ic0406v47smb';
  const scheduleId = '641f4c56e72847e6a5e3288d0';

  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId, projectId }
  });

  if (!schedule) throw new Error('Schedule not found');

  const engineer = await prisma.user.findUnique({ where: { email: 'engineer@onesystemserp.com' } });
  if (!engineer) throw new Error('Engineer not found');

  try {
    await transactionContext.run({ sourceProvenance: 'GATE9_WORKFLOW_ENGINE' }, async () => {
      await submitDraftForReview(
        projectId,
        scheduleId,
        schedule.rowVersion,
        'test_hash_' + Date.now(),
        {
          userId: engineer.id,
          sessionVersion: 1,
          accountActive: true,
          accountLocked: false,
          mustChangePassword: false
        } as any
      );
    });
    console.log('SUCCESS');
  } catch (error: any) {
    console.error('ERROR OCCURRED:');
    console.error(error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
