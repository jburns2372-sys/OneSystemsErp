import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const projId = 'cmriveop10378vcqsma96byxi';
  const schedule = await prisma.projectSchedule.findFirst({
    where: { projectId: projId },
    include: {
      wbsNodes: true,
      activities: { select: { name: true, activityCode: true } }
    }
  });
  if (schedule) {
    console.log("WBS:");
    console.log(schedule.wbsNodes.map(w => w.name));
    console.log("ACTIVITIES:", schedule.activities.length);
    console.log(schedule.activities.slice(0, 5));
  } else {
    console.log("NO SCHEDULE FOUND");
  }
}
main();
