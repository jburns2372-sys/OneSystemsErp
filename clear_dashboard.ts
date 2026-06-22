// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing all Subcontracting and Job Order data to reset the dashboard...");

  await prisma.programOfWorks.deleteMany({});
  console.log("Cleared Program Of Works.");

  await prisma.jobOrder.deleteMany({});
  console.log("Cleared Job Orders.");

  await prisma.subcontractPackage.deleteMany({});
  console.log("Cleared Subcontract Packages.");

  await prisma.subcontractor.deleteMany({});
  console.log("Cleared Subcontractors.");

  await prisma.consolidatedBOQItem.deleteMany({});
  console.log("Cleared BOQ Items.");

  console.log("Dashboard is now completely clear.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
