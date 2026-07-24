import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- PRE-DEPLOYMENT RECORD COUNTS ---');
  
  const getCount = async (table: string) => {
    try {
      const res: any = await prisma.$queryRawUnsafe(`SELECT count(*) FROM "${table}"`);
      return Number(res[0].count);
    } catch {
      return 0;
    }
  };

  const counts = {
    Project: await getCount('Project'),
    ProjectSchedule: await getCount('ProjectSchedule'),
    ScheduleWBS: await getCount('ScheduleWBS'),
    ScheduleActivity: await getCount('ScheduleActivity'),
    ScheduleDependency: await getCount('ScheduleDependency'),
    ScheduleBOQAllocation: await getCount('ScheduleBOQAllocation'),
    ScheduleBOQMapping: await getCount('ScheduleBOQMapping'),
    AwardedBOQItem: await getCount('AwardedBOQItem'),
    PhysicalAccomplishment: await getCount('PhysicalAccomplishment')
  };
  
  console.log(JSON.stringify(counts, null, 2));
  
  console.log('\n--- EXISTING PGH SCHEDULE ---');
  const pghId = 'cmrjd97x80001vciwqyzsvvnt';
  
  try {
    const schedules: any = await prisma.$queryRaw`SELECT * FROM "ProjectSchedule" WHERE id = ${pghId}`;
    if (schedules.length > 0) {
      const schedule = schedules[0];
      const wbsRes: any = await prisma.$queryRaw`SELECT count(*) as count FROM "ScheduleWBS" WHERE "scheduleId" = ${pghId}`;
      const actRes: any = await prisma.$queryRaw`SELECT count(*) as count FROM "ScheduleActivity" WHERE "scheduleId" = ${pghId}`;
      const depRes: any = await prisma.$queryRaw`SELECT count(*) as count FROM "ScheduleDependency" WHERE "predecessorId" IN (SELECT id FROM "ScheduleActivity" WHERE "scheduleId" = ${pghId})`;
      const allocRes: any = await prisma.$queryRaw`SELECT count(*) as count FROM "ScheduleBOQAllocation" WHERE "scheduleId" = ${pghId}`.catch(() => [{count: 0}]);
      const mapRes: any = await prisma.$queryRaw`SELECT count(*) as count FROM "ScheduleBOQMapping" WHERE "scheduleId" = ${pghId}`.catch(() => [{count: 0}]);
      
      console.log(JSON.stringify({
        projectId: schedule.projectId,
        legacyStatus: schedule.status || schedule.workflowStatus,
        awardedContractAmount: schedule.awardedContractAmount?.toString() || "0",
        scheduledAmount: schedule.scheduledAmount?.toString() || "0",
        differenceAmount: schedule.differenceAmount?.toString() || "0",
        wbsCount: Number(wbsRes[0].count),
        activityCount: Number(actRes[0].count),
        dependencyCount: Number(depRes[0].count),
        allocationCount: Number(allocRes[0].count) + Number(mapRes[0].count)
      }, null, 2));
    } else {
      console.log('PGH Schedule cmrjd97x80001vciwqyzsvvnt NOT FOUND.');
    }
  } catch (e) {
    console.error(e);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
