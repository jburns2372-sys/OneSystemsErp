import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding ONLY Subcontractors data...");

  const specialties = [
    { name: "Mechanical Works Experts Inc.", category: "Mechanical" },
    { name: "Electrical Power Contractors", category: "Electrical" },
    { name: "Prime Civil & Structural", category: "Civil" },
    { name: "Master Painters Co.", category: "Painting" },
    { name: "Solid Masonry Builders", category: "Masonry" },
    { name: "Dry Wall & Partitions Specialists", category: "Dry Wall" },
    { name: "Aqua Plumbing Services", category: "Plumbing & Sanitary" },
    { name: "Elegant Fit-out Solutions", category: "Fit-out and finishes" }
  ];

  for (const [index, spec] of specialties.entries()) {
    // Check if it already exists to avoid duplicates
    const existing = await prisma.subcontractor.findFirst({
      where: { name: spec.name }
    });

    if (!existing) {
      const sub = await prisma.subcontractor.create({
        data: {
          name: spec.name,
          businessType: "CORPORATION",
          tradeCategory: spec.category,
          contactPerson: `Contact Person ${index + 1}`,
          contactNumber: `0917000000${index}`,
          accreditation: "APPROVED"
        }
      });
      console.log(`Created subcontractor for ${spec.category}:`, sub.name);
    } else {
      console.log(`Subcontractor already exists:`, existing.name);
    }
  }

  console.log("Subcontractors seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
