import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const targetIds = ['cmriveop10378vcqsma96byxi', 'cmrirhhw30000ic0406v47smb'];
  
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { id: { in: targetIds } },
        { name: { contains: 'PGH', mode: 'insensitive' } },
        { description: { contains: 'PGH', mode: 'insensitive' } }
      ]
    },
    include: {
      awardedBoqItems: true,
      projectSchedule: {
        include: {
          wbsNodes: true,
          activities: true,
          dependencies: true,
          boqAllocations: true
        }
      }
    }
  });

  console.log(`Found ${projects.length} matching projects.\n`);

  for(const p of projects) {
    const projectBOQVersions = await prisma.projectBOQVersion.findMany({ where: { projectId: p.id } });
    
    console.log(`Project ID: ${p.id}`);
    console.log(`Project Name: ${p.name}`);
    console.log(`Contract Amount: ${p.contractAmount}`);
    console.log(`Start Date: ${p.startDate}`);
    console.log(`Completion Date: ${p.originalCompletionDate}`);
    console.log(`BOQ row count: ${p.awardedBoqItems.length}`);
    const pricedDetails = p.awardedBoqItems.filter(i => (i.quantity > 0 || i.totalCost > 0) && i.processingType === 'MATERIAL_EQUIPMENT');
    console.log(`Priced-detail count (approx): ${pricedDetails.length}`);
    const boqTotal = p.awardedBoqItems.reduce((acc, i) => acc + i.totalCost, 0);
    console.log(`BOQ total: ${boqTotal}`);
    console.log(`Locked BOQ version ID: ${p.lockedBoqVersionId}`);
    
    if (p.lockedBoqVersionId) {
      const lockedVer = projectBOQVersions.find(v => v.id === p.lockedBoqVersionId);
      console.log(`Locked BOQ checksum: ${lockedVer?.checksum}`);
    } else {
      console.log(`Locked BOQ checksum: null`);
    }

    if (p.projectSchedule) {
      console.log(`Schedule count: 1 (ID: ${p.projectSchedule.id})`);
      console.log(`WBS nodes: ${p.projectSchedule.wbsNodes.length}`);
      console.log(`Activities: ${p.projectSchedule.activities.length}`);
      console.log(`Dependencies: ${p.projectSchedule.dependencies.length}`);
      console.log(`Allocation count: ${p.projectSchedule.boqAllocations.length}`);
    } else {
      console.log(`Schedule count: 0`);
      console.log(`Allocation count: 0`);
    }

    console.log(`Creation date: ${p.createdAt}`);
    console.log(`Last modified date: ${p.updatedAt}`);
    // Check if there's any source filename or import batch ID
    console.log(`Source filename / import batch ID: N/A (requires ProjectBOQVersion check if any)`);
    console.log(`-----------------------------------------\n`);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
