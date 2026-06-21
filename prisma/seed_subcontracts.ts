import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Subcontracting data...");

  // 1. Ensure a Project exists
  let project = await prisma.project.findFirst();
  if (!project) {
    project = await prisma.project.create({
      data: {
        name: "PGH Expansion Building",
        location: "Manila",
        client: "Department of Health",
        contractAmount: 500000000,
        status: "ONGOING"
      }
    });
    console.log("Created dummy project:", project.name);
  }

  // 2. Create Subcontractors
  const sub1 = await prisma.subcontractor.create({
    data: {
      name: "Acme Concrete Works",
      businessType: "CORPORATION",
      contactPerson: "John Doe",
      contactNumber: "09171234567",
      accreditation: "APPROVED"
    }
  });
  console.log("Created subcontractor:", sub1.name);

  const sub2 = await prisma.subcontractor.create({
    data: {
      name: "Fast Paint Co.",
      businessType: "SOLE_PROPRIATOR",
      contactPerson: "Jane Smith",
      contactNumber: "09181234567",
      accreditation: "APPROVED"
    }
  });
  console.log("Created subcontractor:", sub2.name);

  // 3. Create a Subcontract Package
  const sp1 = await prisma.subcontractPackage.create({
    data: {
      projectId: project.id,
      packageNumber: "SP-2026-102",
      subcontractorId: sub1.id,
      workCategory: "Concreting",
      contractType: "LUMP_SUM",
      scopeOfWork: "All concreting works from ground to 3rd floor.",
      location: "Building A",
      quantity: 1,
      unit: "lot",
      unitCost: 1500000,
      contractAmount: 1500000,
      costType: "DIRECT",
      paymentTerms: "PROGRESS",
      retentionPct: 10,
      status: "APPROVED"
    }
  });
  console.log("Created subcontract package:", sp1.packageNumber);

  // 4. Create a Job Order (Standard - within threshold)
  const jo1 = await prisma.jobOrder.create({
    data: {
      projectId: project.id,
      jobNumber: "JO-2026-104",
      subcontractorId: sub2.id,
      description: "Painting of Ground Floor Lobby walls.",
      location: "Ground Floor Lobby",
      contractAmount: 150000,
      paymentBasis: "MILESTONE",
      materialResponsibility: "COMPANY_SUPPLIED",
      status: "APPROVED"
    }
  });
  console.log("Created Job Order:", jo1.jobNumber);

  // 5. Create a Job Order (Major - exceeding threshold)
  const jo2 = await prisma.jobOrder.create({
    data: {
      projectId: project.id,
      jobNumber: "JO-2026-105",
      subcontractorId: sub2.id,
      description: "Painting of whole 2nd Floor.",
      location: "2nd Floor",
      contractAmount: 350000, // Exceeds 250k threshold
      paymentBasis: "MILESTONE",
      materialResponsibility: "CONTRACTOR_SUPPLIED",
      status: "FOR_REVIEW"
    }
  });
  console.log("Created Job Order (Threshold Exceeded):", jo2.jobNumber);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
