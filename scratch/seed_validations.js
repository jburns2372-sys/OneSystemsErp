const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find a project to seed
  const project = await prisma.project.findFirst({
    where: { name: { contains: 'Air-Conditioning' } }
  });

  if (!project) {
    console.log("Could not find the target project.");
    return;
  }

  // Ensure user exists for createdById
  const user = await prisma.user.findFirst({ where: { role: 'DIRECTORS' } }) || await prisma.user.findFirst();
  
  if (!user) {
    console.log("No user found to associate with records.");
    return;
  }

  const projectId = project.id;
  const userId = user.id;

  // Clear existing to avoid duplicates if run multiple times
  await prisma.aIValidationRecord.deleteMany({ where: { projectId } });
  await prisma.projectValidationScore.deleteMany({ where: { projectId } });

  console.log(`Seeding validation records for project: ${project.name}`);

  // Create Validation Records
  await prisma.aIValidationRecord.createMany({
    data: [
      {
        projectId,
        moduleSource: 'BOQ',
        evidenceType: 'DOCUMENT',
        aiFindings: 'The submitted BOQ closely aligns with the standard pricing indices for VRF Air-Conditioning units. Minor discrepancies found in labor costs (approx 5% variance).',
        aiConfidenceScore: 88,
        riskLevel: 'YELLOW',
        recommendation: 'Conditionally Approve - Request clarification on labor cost breakdown.',
        status: 'REVIEWED',
        createdById: userId,
        findingsData: JSON.stringify({ variance: 5, flaggedItems: ['Labor'] })
      },
      {
        projectId,
        moduleSource: 'BILLING',
        evidenceType: 'INVOICE',
        aiFindings: 'Billing #1 for mobilization (15%) matches the contract terms. However, supporting delivery receipts for the initial copper pipes are missing.',
        aiConfidenceScore: 72,
        riskLevel: 'ORANGE',
        recommendation: 'Hold for Additional Evidence - Require delivery receipts.',
        status: 'REVIEWED',
        createdById: userId,
        findingsData: JSON.stringify({ missingDocuments: ['Delivery Receipts'] })
      },
      {
        projectId,
        moduleSource: 'PHOTO',
        evidenceType: 'IMAGE',
        evidenceFileUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356f12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        aiFindings: 'Site preparation photos validated. Geotagging matches the PGH coordinates. Time metadata is consistent with the reported timeline.',
        aiConfidenceScore: 95,
        riskLevel: 'GREEN',
        recommendation: 'Approve',
        status: 'REVIEWED',
        createdById: userId,
        findingsData: JSON.stringify({ geotagMatch: true, timestampValid: true })
      },
      {
        projectId,
        moduleSource: 'CCTV',
        evidenceType: 'VIDEO',
        aiFindings: 'Live feed analysis shows active staging area. However, PPE compliance is low among the ducting installers.',
        aiConfidenceScore: 82,
        riskLevel: 'YELLOW',
        recommendation: 'Issue Safety Warning',
        status: 'REVIEWED',
        createdById: userId,
        findingsData: JSON.stringify({ safetyViolations: ['Hardhats', 'Gloves'] })
      },
      {
        projectId,
        moduleSource: 'PLAN',
        evidenceType: 'DOCUMENT',
        aiFindings: 'The ducting layout plan submitted matches the spatial dimensions of the 3rd Floor OR. No clashes detected with existing plumbing lines.',
        aiConfidenceScore: 98,
        riskLevel: 'GREEN',
        recommendation: 'Approve',
        status: 'REVIEWED',
        createdById: userId,
        findingsData: JSON.stringify({ clashDetection: 'Passed' })
      }
    ]
  });

  // Create aggregated Validation Score
  await prisma.projectValidationScore.create({
    data: {
      projectId,
      validationConfidenceScore: 87.5,
      reportedProgress: 15.0,
      aiValidatedProgress: 12.5,
      evidenceCompletenessScore: 71.4, // 5 out of 7 categories
      riskLevel: 'YELLOW',
      latestValidationDate: new Date()
    }
  });

  console.log("Seeding complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
