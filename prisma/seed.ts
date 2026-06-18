import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Comprehensive Subcontracting Data...");

  // 1. Ensure a Project exists
  let project = await prisma.project.findFirst();
  if (!project) {
    project = await prisma.project.create({
      data: {
        name: "PGH Expansion Building",
        projectCode: "PRJ-2026-001",
        location: "Manila",
        client: "Department of Health",
        contractAmount: 500000000,
        status: "ONGOING"
      }
    });
    console.log("Created dummy project:", project.name);
  }

  // Define the required specialties
  const specialties = [
    { code: "MECH", name: "Mechanical Works", category: "Mechanical", cost: 15000000 },
    { code: "ELEC", name: "Electrical Works", category: "Electrical", cost: 12000000 },
    { code: "CIV", name: "Civil & Structural", category: "Civil", cost: 45000000 },
    { code: "PNT", name: "Painting Works", category: "Painting", cost: 3500000 },
    { code: "MAS", name: "Masonry Works", category: "Masonry", cost: 8000000 },
    { code: "DWL", name: "Dry Wall & Partitions", category: "Dry Wall", cost: 4500000 },
    { code: "PLM", name: "Plumbing & Sanitary", category: "Plumbing & Sanitary", cost: 9500000 },
    { code: "FIT", name: "Fit-out and Finishes", category: "Fit-out and finishes", cost: 22000000 },
    { code: "TST", name: "Testing & Commissioning", category: "Testing & Commissioning", cost: 1500000 },
    { code: "CON", name: "Consultancy Services", category: "Consultancy", cost: 5000000 }
  ];

  for (const [index, spec] of specialties.entries()) {
    // 2. Create Subcontractor for this specialty
    const sub = await prisma.subcontractor.create({
      data: {
        name: `${spec.category} Experts Inc.`,
        businessType: "CORPORATION",
        tradeCategory: spec.category,
        contactPerson: "Seeded Contact",
        contactNumber: "0917000000" + index,
        accreditation: "APPROVED"
      }
    });
    console.log(`Created subcontractor for ${spec.category}:`, sub.name);

    // 3. Create Consolidated BOQ Item
    const boq = await prisma.consolidatedBOQItem.create({
      data: {
        projectId: project.id,
        itemCode: `${spec.code}-001`,
        category: spec.category,
        description: `Complete ${spec.name} for the building`,
        unit: "lot",
        quantity: 1,
        unitCost: spec.cost,
        totalCost: spec.cost,
        status: "APPROVED"
      }
    });

    // 4. Create Subcontract Package linked to BOQ and Subcontractor
    const sp = await prisma.subcontractPackage.create({
      data: {
        projectId: project.id,
        packageNumber: `SP-2026-${spec.code}`,
        subcontractorId: sub.id,
        workCategory: spec.category,
        contractType: "LUMP_SUM",
        masterBoqItemId: boq.id,
        scopeOfWork: boq.description,
        location: "Whole Building",
        quantity: 1,
        unit: "lot",
        unitCost: spec.cost,
        contractAmount: spec.cost,
        costType: "DIRECT",
        paymentTerms: "PROGRESS",
        retentionPct: 10,
        status: "APPROVED"
      }
    });

    // 5. Create Program of Works for the Subcontract Package with start and end dates
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (index * 10)); // Stagger start dates
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 2); // 2 months duration

    await prisma.programOfWorks.create({
      data: {
        packageId: sp.id,
        title: `${spec.name} POW`,
        description: `Detailed schedule for ${spec.category}`,
        startDate: startDate,
        endDate: endDate,
        activities: [
          { name: "Mobilization", durationDays: 5, startOffset: 0 },
          { name: "Execution Phase 1", durationDays: 20, startOffset: 5 },
          { name: "Execution Phase 2", durationDays: 20, startOffset: 25 },
          { name: "Demobilization & Handover", durationDays: 5, startOffset: 45 }
        ]
      }
    });
    console.log(`Created BOQ, Subcontract Package, and POW for ${spec.category}.`);
  }

  console.log("Subcontracting Seeding completed.");

  // Seed AI Policies
  try {
    const { seedAiPolicies } = require('../scripts/seed_ai_policies');
    await seedAiPolicies();
  } catch (err) {
    console.error("Failed to seed AI policies:", err);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
