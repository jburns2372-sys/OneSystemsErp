import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const accounts = {
    tech: await prisma.user.findFirst({ where: { email: 'tech_reviewer@test.com' } }),
    app: await prisma.user.findFirst({ where: { email: 'baseline_approver@test.com' } }),
    unauth: await prisma.user.findFirst({ where: { email: 'unauth_user@test.com' } })
  };

  console.log("=== Accounts ===");
  console.log("Technical Reviewer:", !!accounts.tech);
  console.log("Baseline Approver:", !!accounts.app);
  console.log("Unauthorized User:", !!accounts.unauth);

  const sched = await prisma.projectSchedule.findUnique({
    where: { id: 'cmrjou0ne0001vcf01eju4dh8' },
    include: {
      _count: {
        select: { boqAllocations: true }
      },
      boqAllocations: {
        select: { awardedBoqItemId: true }
      }
    }
  });

  console.log("=== Canonical Schedule ===");
  console.log("Status:", sched?.workflowStatus);
  console.log("baselineCode:", sched?.baselineCode);
  console.log("baselineStartDate:", sched?.baselineStartDate);
  console.log("baselineFinishDate:", sched?.baselineFinishDate);
  console.log("activationSnapshotHash:", sched?.activationSnapshotHash);
  console.log("rowVersion:", sched?.rowVersion);
  console.log("BOQ Allocations Count:", sched?._count.boqAllocations);
  
  const uniqueBoqs = new Set(sched?.boqAllocations.map(a => a.awardedBoqItemId)).size;
  console.log("Unique BOQ Lines:", uniqueBoqs);
  console.log("Financial Difference:", sched?.differenceAmount?.toString());

}

check().catch(console.error).finally(() => prisma.$disconnect());
