import { prismaBase as prisma } from '../src/lib/prisma-base';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function runTests() {
  console.log('--- GATE 12D UI TESTS ---');
  let successCount = 0;
  let failCount = 0;

  const runTest = async (name: string, fn: () => Promise<any>) => {
    try {
      await fn();
      console.log(`✅ PASSED: ${name}`);
      successCount++;
    } catch (e: any) {
      console.log(`❌ FAILED: ${name}`);
      console.error(e.message || e);
      failCount++;
    }
  };

  const projectId = 'cmrirhhw30000ic0406v47smb';
  const targetScheduleId = '641f4c56e72847e6a5e3288d0';

  await runTest('ACTIVE_BASELINE is obtained from ProjectSchedule.workflowStatus', async () => {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        projectSchedule: true
      }
    });

    const schedules = project?.projectSchedule || [];
    
    // Exact selection logic from page.tsx
    let selectedSchedule = null;
    selectedSchedule = selectedSchedule || schedules.find(s => s.workflowStatus === 'ACTIVE_BASELINE');
    selectedSchedule = selectedSchedule || schedules.find(s => s.workflowStatus === 'SUPERSEDED_BASELINE');
    
    if (!selectedSchedule) {
      throw new Error('No schedule selected by workflowStatus === ACTIVE_BASELINE');
    }
    
    if (selectedSchedule.id !== targetScheduleId) {
      throw new Error(`Selected wrong schedule. Expected ${targetScheduleId}, got ${selectedSchedule.id}`);
    }
    
    if (selectedSchedule.workflowStatus !== 'ACTIVE_BASELINE') {
      throw new Error(`Selected schedule workflowStatus is not ACTIVE_BASELINE. It is ${selectedSchedule.workflowStatus}`);
    }
    
    if (selectedSchedule.rowVersion !== 7) {
      throw new Error(`Row version is not 7. It is ${selectedSchedule.rowVersion}`);
    }
  });

  console.log(`\nResults: ${successCount} PASSED, ${failCount} FAILED`);
  
  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
