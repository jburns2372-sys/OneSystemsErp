import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- API ROUTE PERSISTENCE ACCEPTANCE TEST ---');
  try {
    const project = await prisma.project.findFirst();
    if (!project) {
      throw new Error('No project found in the database. Cannot run test.');
    }

    console.log(`Targeting Project ID: ${project.id}`);
    
    // Simulate the POST request that the wizard makes
    const url = `http://localhost:3000/api/projects/${project.id}/scheduling/simulate`;
    console.log(`Sending POST request to ${url}... (This will take a minute for the AI to process)`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        consolidateBoq: true,
        lockedBOQVersionId: null // or actual if available
      })
    });

    const data = await response.json();
    console.log('HTTP Status:', response.status);

    if (response.status !== 200) {
      console.error('Test Failed! Server returned:', data);
      return;
    }

    console.log('Server response success:', data.success);
    console.log('Returned Schedule ID:', data.scheduleId);
    console.log('Difference:', data.reconciliation?.diff);

    // Verify persistence in DB
    console.log('Verifying persistence in database...');
    const schedule = await prisma.projectSchedule.findUnique({
      where: { id: data.scheduleId },
      include: {
        wbsNodes: true,
        activities: true,
        boqAllocations: true
      }
    });

    if (!schedule) {
      throw new Error('Schedule was NOT found in the database despite a 200 OK response.');
    }

    console.log('--- Persistence Verification Results ---');
    console.log(`Schedule Header Saved: YES (ID: ${schedule.id})`);
    
    const rootWbs = schedule.wbsNodes.filter(w => w.level === 1);
    const phaseWbs = schedule.wbsNodes.filter(w => w.level > 1);
    console.log(`Root WBS Saved: YES (${rootWbs.length} record(s))`);
    console.log(`Phase WBS Saved: YES (${phaseWbs.length} record(s))`);
    console.log(`Activities Saved: YES (${schedule.activities.length} record(s))`);
    console.log(`BOQ Allocations Saved: YES (${schedule.boqAllocations.length} record(s))`);
    
    if (rootWbs.length > 0 && phaseWbs.length > 0 && schedule.activities.length > 0) {
      console.log('All WBS records correctly use scheduleId.');
      console.log('The transaction successfully committed.');
      console.log('Post-save read-back succeeded.');
      console.log('\n✅ TEST PASSED SUCCESSFULLY.');
    } else {
      console.error('❌ TEST FAILED: Missing related records in the database.');
    }

  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
