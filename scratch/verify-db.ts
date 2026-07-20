import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  try {
    // Check Step 4: Actor Provenance (Just verifying some records exist for the users, etc.)
    // We can just query BOQ versions and approvals to verify who did what.

    // Step 5: Verify BOQ and Lock State
    const awardedBoqCount = await prisma.awardedBOQItem.count();
    console.log(`AwardedBOQItem = ${awardedBoqCount}`);

    const projectBoqVersions = await prisma.projectBOQVersion.findMany();
    console.log(`ProjectBOQVersion count = ${projectBoqVersions.length}`);

    const lockedVersions = projectBoqVersions.filter(v => v.status === 'LOCKED');
    console.log(`Locked BOQ versions = ${lockedVersions.length}`);

    const version = lockedVersions[0];
    if (version) {
      console.log(`lockedAt: ${version.lockedAt}`);
      console.log(`lockedById: ${version.lockedById}`);
      console.log(`canonicalChecksum: ${version.canonicalChecksum}`);
    }

    // Step 8: Final Zero Schedule Counts
    const modelsToCheck = [
      'projectSchedule',
      'scheduleWBS',
      'scheduleActivity',
      'scheduleDependency',
      'scheduleBOQAllocation',
      'scheduleApproval',
      'scheduleReviewComment',
      'baselineActivation'
    ];

    for (const model of modelsToCheck) {
      const count = await (prisma as any)[model].count();
      console.log(`${model} = ${count}`);
    }

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
