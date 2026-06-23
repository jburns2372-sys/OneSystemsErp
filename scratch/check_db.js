const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const activities = await prisma.scheduleActivity.findMany({
    include: {
      wbs: true,
      schedule: {
        include: {
          wbsNodes: true
        }
      }
    }
  });

  console.log("Total activities:", activities.length);
  for (const act of activities) {
    console.log(`Activity: ${act.activityCode} - ${act.name} | wbsId: ${act.wbsId} | wbsName: ${act.wbs?.name}`);
  }

  const wbsNodes = await prisma.scheduleWBS.findMany();
  console.log("\nTotal WBS Nodes:", wbsNodes.length);
  for (const wbs of wbsNodes) {
    console.log(`WBS: ${wbs.code} - ${wbs.name} (level: ${wbs.level})`);
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
