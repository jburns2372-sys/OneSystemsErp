import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- MINIMUM DATABASE ACCEPTANCE TEST ---');
  try {
    // 1. Create a temporary project (or find an existing one to use)
    const project = await prisma.project.findFirst();
    if (!project) {
      throw new Error('No project found in the database. Cannot run test.');
    }

    // 2. Create a temporary unapproved test schedule.
    console.log('Creating test Schedule...');
    const schedule = await prisma.projectSchedule.create({
      data: {
        projectId: project.id,
        name: 'TEST_SCHEDULE_ANTIGRAVITY',
        status: 'DRAFT',
      },
    });

    // 3. Create one root ScheduleWBS record.
    console.log('Creating root WBS...');
    const rootWbsId = 'TEST_ROOT_WBS_' + Date.now();
    await prisma.scheduleWBS.create({
      data: {
        id: rootWbsId,
        scheduleId: schedule.id,
        parentId: null,
        code: 'TEST_CONST',
        name: 'Test Construction Phase',
        level: 1,
        orderIndex: 1,
      }
    });

    // 4. Create one child phase ScheduleWBS record.
    console.log('Creating child WBS...');
    const childWbsId = 'TEST_CHILD_WBS_' + Date.now();
    await prisma.scheduleWBS.create({
      data: {
        id: childWbsId,
        scheduleId: schedule.id,
        parentId: rootWbsId,
        code: 'TEST_PH-1',
        name: 'Test Phase 1',
        level: 2,
        orderIndex: 1,
      }
    });

    // 5. Read both records back.
    console.log('Reading WBS records back...');
    const records = await prisma.scheduleWBS.findMany({
      where: { scheduleId: schedule.id },
      orderBy: { level: 'asc' }
    });
    
    // 6. Verify that both belong to the same schedule.
    if (records.length !== 2) {
      throw new Error(`Expected 2 records, got ${records.length}`);
    }
    console.log(`Found ${records.length} records belonging to schedule ${schedule.id}.`);
    
    records.forEach(r => {
      console.log(`- ${r.code} (Level ${r.level}, Parent: ${r.parentId || 'None'}) -> Schedule: ${r.scheduleId}`);
    });

    // 7. Roll back or safely delete the temporary test records.
    console.log('Cleaning up temporary records...');
    await prisma.projectSchedule.delete({ where: { id: schedule.id } });
    console.log('Test completed successfully.');

  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
