import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sId = 'cmrjd97x80001vciwqyzsvvnt';
  
  const schedule = await prisma.projectSchedule.findUnique({ where: { id: sId } });
  if (!schedule) {
    throw new Error(`Test schedule not found: ${sId}`);
  }
  if (!schedule.validationMetrics) {
    throw new Error(`Validation metrics not found on schedule: ${sId}`);
  }
  
  const metrics = JSON.parse(schedule.validationMetrics);
  metrics.OVERALL = 'READY_FOR_REVIEW';
  
  await prisma.projectSchedule.update({
    where: { id: sId },
    data: {
      status: 'DRAFT',
      validationMetrics: JSON.stringify(metrics)
    }
  });
  console.log("Updated schedule", sId, "to DRAFT / READY_FOR_REVIEW for browser test");
}

main().finally(() => prisma.$disconnect());
