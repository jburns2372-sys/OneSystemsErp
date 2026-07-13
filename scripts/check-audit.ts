import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const audits = await prisma.scheduleGenerationAudit.findMany({
    orderBy: { responseTimestamp: 'desc' },
    take: 1
  });

  if (audits.length > 0) {
    const a = audits[0];
    console.log(`Status: ${a.resultStatus}`);
    console.log(`Time: ${a.responseTimestamp}`);
    const res = JSON.parse(a.validationResults);
    
    if (res.error) {
      console.log(`Error: ${res.error}`);
    } else {
      console.log(`Valid: ${res.validationStatus?.OVERALL_STATUS}`);
      if (res.aiProposal) {
        console.log(`Phases generated: ${res.aiProposal.phases.length}`);
      }
    }
  } else {
    console.log("No audits found.");
  }
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
