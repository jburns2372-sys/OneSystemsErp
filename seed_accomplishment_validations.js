const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst({
    where: { name: { contains: 'Air-Conditioning' } }
  });

  if (!project) {
    console.log("Could not find the target project.");
    return;
  }

  const user = await prisma.user.findFirst({ where: { role: 'DIRECTORS' } }) || await prisma.user.findFirst();
  const projectId = project.id;
  const userId = user.id;

  // Clear existing AI Validation Records for this project to start fresh with the matrix
  await prisma.aIValidationRecord.deleteMany({ where: { projectId } });

  console.log(`Seeding accomplishment-based validation records for project: ${project.name}`);

  // Create real Billing records
  const billing1 = await prisma.billing.create({
    data: {
      projectId: projectId,
      billingNumber: 'BILL-001',
      billingPeriodFrom: new Date('2026-05-01'),
      billingPeriodTo: new Date('2026-05-15'),
      billingDate: new Date('2026-05-16'),
      billingType: 'PROGRESS',
      contractAmount: project.contractAmount || 10000000,
      revisedContractAmount: project.contractAmount || 10000000,
      currentBillingAmount: 1500000,
      status: 'SUBMITTED',
      preparedById: userId
    }
  });

  const billing2 = await prisma.billing.create({
    data: {
      projectId: projectId,
      billingNumber: 'BILL-002',
      billingPeriodFrom: new Date('2026-05-16'),
      billingPeriodTo: new Date('2026-05-31'),
      billingDate: new Date('2026-06-01'),
      billingType: 'PROGRESS',
      contractAmount: project.contractAmount || 10000000,
      revisedContractAmount: project.contractAmount || 10000000,
      currentBillingAmount: 3000000,
      status: 'SUBMITTED',
      preparedById: userId
    }
  });

  const billing1Id = billing1.id;
  const billing2Id = billing2.id;

  // --- SEED BILLING 1 (15% Progress - Mobilization) ---
  await prisma.aIValidationRecord.createMany({
    data: [
      {
        projectId, relatedBillingId: billing1Id, moduleSource: 'BOQ', evidenceType: 'DOCUMENT',
        aiFindings: 'Mobilization BOQ items match perfectly.', aiConfidenceScore: 95, riskLevel: 'GREEN',
        recommendation: 'Approve', status: 'REVIEWED', createdById: userId, findingsData: JSON.stringify({ variance: 0 })
      },
      {
        projectId, relatedBillingId: billing1Id, moduleSource: 'PHOTO', evidenceType: 'IMAGE',
        evidenceFileUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356f12?auto=format&fit=crop&w=800',
        aiFindings: 'Site preparation photos validated. Geotagging verified.', aiConfidenceScore: 92, riskLevel: 'GREEN',
        recommendation: 'Approve', status: 'REVIEWED', createdById: userId
      },
      {
        projectId, relatedBillingId: billing1Id, moduleSource: 'PLAN', evidenceType: 'DOCUMENT',
        aiFindings: 'Initial layout plans approved.', aiConfidenceScore: 98, riskLevel: 'GREEN',
        recommendation: 'Approve', status: 'REVIEWED', createdById: userId
      }
    ]
  });

  // --- SEED BILLING 2 (30% Progress - Ducting Installation) ---
  await prisma.aIValidationRecord.createMany({
    data: [
      {
        projectId, relatedBillingId: billing2Id, moduleSource: 'BOQ', evidenceType: 'DOCUMENT',
        aiFindings: 'Ducting materials claimed (1,200kg) exceeds the delivered inventory (900kg).', aiConfidenceScore: 88, riskLevel: 'YELLOW',
        recommendation: 'Require Revalidation - Check delivery logs.', status: 'PENDING', createdById: userId, findingsData: JSON.stringify({ variance: 300 })
      },
      {
        projectId, relatedBillingId: billing2Id, moduleSource: 'BILLING', evidenceType: 'INVOICE',
        aiFindings: 'Invoice matches BOQ claim but missing sub-contractor lien release.', aiConfidenceScore: 75, riskLevel: 'ORANGE',
        recommendation: 'Hold for Additional Evidence', status: 'PENDING', createdById: userId
      },
      {
        projectId, relatedBillingId: billing2Id, moduleSource: 'CCTV', evidenceType: 'VIDEO',
        aiFindings: 'Live feed confirms ducting installation on 3rd floor. Safety violations detected.', aiConfidenceScore: 82, riskLevel: 'YELLOW',
        recommendation: 'Conditionally Approve - Issue Safety Memo', status: 'PENDING', createdById: userId
      },
      {
        projectId, relatedBillingId: billing2Id, moduleSource: 'PHOTO', evidenceType: 'IMAGE',
        evidenceFileUrl: 'https://images.unsplash.com/photo-1541888086425-d81bb19240f5?auto=format&fit=crop&w=800',
        aiFindings: 'Ducting photos show progress, but EXIF metadata indicates photos are 2 weeks old.', aiConfidenceScore: 60, riskLevel: 'RED',
        recommendation: 'Hold / Reject - Require fresh photos', status: 'PENDING', createdById: userId
      }
    ]
  });

  console.log("Seeding complete with Real Billing Records!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
