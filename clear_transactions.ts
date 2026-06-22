// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Wiping transaction data (Job Orders, Packages, Billings, Accomplishments) while keeping Master Data...");

  // 1. Delete deeply nested transaction data first
  const deletedAccomplishments = await prisma.subcontractAccomplishment.deleteMany({});
  console.log(`Deleted ${deletedAccomplishments.count} Subcontract Accomplishments.`);

  const deletedBillings = await prisma.subcontractBilling.deleteMany({});
  console.log(`Deleted ${deletedBillings.count} Subcontract Billings.`);

  const deletedAccRecords = await prisma.accomplishmentRecord.deleteMany({});
  console.log(`Deleted ${deletedAccRecords.count} Accomplishment Records.`);

  // 2. Delete file attachments
  const deletedFileVersions = await prisma.projectAccomplishmentFileVersion.deleteMany({});
  console.log(`Deleted ${deletedFileVersions.count} File Versions.`);

  const deletedFiles = await prisma.projectAccomplishmentFile.deleteMany({});
  console.log(`Deleted ${deletedFiles.count} Project Accomplishment Files.`);

  // 3. Delete Job Orders
  const deletedJobOrders = await prisma.jobOrder.deleteMany({});
  console.log(`Deleted ${deletedJobOrders.count} Job Orders.`);

  // 4. Delete Program of Works
  const deletedPOWs = await prisma.programOfWorks.deleteMany({});
  console.log(`Deleted ${deletedPOWs.count} Program Of Works.`);

  // 5. Delete Subcontract Packages
  const deletedPackages = await prisma.subcontractPackage.deleteMany({});
  console.log(`Deleted ${deletedPackages.count} Subcontract Packages.`);

  // 6. Delete Consolidated BOQ Items (they are generated transactions based on POW)
  const deletedBOQ = await prisma.consolidatedBOQItem.deleteMany({});
  console.log(`Deleted ${deletedBOQ.count} Consolidated BOQ Items.`);

  console.log("Transaction wipe complete! Master data (Users, Projects, Subcontractors) is safe.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
