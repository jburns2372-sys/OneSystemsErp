// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Deleting seeded subcontracting data...");

  const packageNumbers = [
    "SP-2026-001", "SP-2026-100", "SP-2026-101", "SP-2026-102",
    "SP-2026-MECH", "SP-2026-ELEC", "SP-2026-CIV", "SP-2026-PNT",
    "SP-2026-MAS", "SP-2026-DWL", "SP-2026-PLM", "SP-2026-FIT",
    "SP-2026-TST", "SP-2026-CON"
  ];

  // Get package IDs to delete dependencies
  const packages = await prisma.subcontractPackage.findMany({
    where: { packageNumber: { in: packageNumbers } },
    select: { id: true }
  });
  const packageIds = packages.map(p => p.id);

  // 0. Delete ProgramOfWorks tied to these packages
  const powResult = await prisma.programOfWorks.deleteMany({
    where: { packageId: { in: packageIds } }
  });
  console.log(`Deleted ${powResult.count} seeded Program Of Works.`);

  // 1. Delete Job Orders created by seed scripts (handled earlier or retry if failed halfway)
  const joResult = await prisma.jobOrder.deleteMany({
    where: {
      jobNumber: {
        in: [
          "JO-2026-001", "JO-2026-002", 
          "JO-2026-100", "JO-2026-101", 
          "JO-2026-102", "JO-2026-103", 
          "JO-2026-104", "JO-2026-105"
        ]
      }
    }
  });
  console.log(`Deleted ${joResult.count} seeded Job Orders.`);

  // 2. Delete Subcontract Packages created by seed scripts
  const spResult = await prisma.subcontractPackage.deleteMany({
    where: {
      id: { in: packageIds }
    }
  });
  console.log(`Deleted ${spResult.count} seeded Subcontract Packages.`);

  // 3. Delete Subcontractors created by seed scripts
  const subResult = await prisma.subcontractor.deleteMany({
    where: {
      name: {
        in: [
          "Acme Concrete Works", "Fast Paint Co.",
          "Mechanical Experts Inc.", "Electrical Experts Inc.", "Civil Experts Inc.",
          "Painting Experts Inc.", "Masonry Experts Inc.", "Dry Wall Experts Inc.",
          "Plumbing & Sanitary Experts Inc.", "Fit-out and finishes Experts Inc.",
          "Testing & Commissioning Experts Inc.", "Consultancy Experts Inc."
        ]
      }
    }
  });
  console.log(`Deleted ${subResult.count} seeded Subcontractors.`);

  // 4. Delete seeded Consolidated BOQ Items
  const boqResult = await prisma.consolidatedBOQItem.deleteMany({
    where: {
      itemCode: {
        in: [
          "MECH-001", "ELEC-001", "CIV-001", "PNT-001", "MAS-001",
          "DWL-001", "PLM-001", "FIT-001", "TST-001", "CON-001"
        ]
      }
    }
  });
  console.log(`Deleted ${boqResult.count} seeded BOQ Items.`);

  console.log("Seeded data successfully removed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
