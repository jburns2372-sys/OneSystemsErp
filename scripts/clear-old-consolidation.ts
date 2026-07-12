import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
  const pId = 'cmrhu7e9f0004vcwoq0uhvaao';
  
  // Unlock the master materials list
  await prisma.project.update({
    where: { id: pId },
    data: { consolidatedBOQLocked: false }
  });

  // Delete all old mappings and consolidated items
  await prisma.bOQMapping.deleteMany({
    where: { consolidatedBoqItem: { projectId: pId } }
  });
  
  await prisma.consolidatedBOQItem.deleteMany({
    where: { projectId: pId }
  });

  console.log("Unlocked and wiped old Master Materials list.");
}

fix().then(() => prisma.$disconnect());
