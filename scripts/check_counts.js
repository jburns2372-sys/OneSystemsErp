const { PrismaClient } = require('@prisma/client');
async function main() {
  const prisma = new PrismaClient();
  try {
    const tables = [
      'ProjectSchedule',
      'BaselineActivation',
      'ScheduleReviewComment',
      'ScheduleApproval',
      'ScheduleWBS',
      'ScheduleActivity',
      'ScheduleDependency',
      'ScheduleBOQAllocation'
    ];
    let results = {};
    for (const table of tables) {
      try {
        const r = await prisma.$queryRawUnsafe(`SELECT count(*) as count FROM "${table}"`);
        results[table] = Number(r[0].count);
      } catch (e) {
        results[table] = 'Error: ' + e.message;
      }
    }
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}
main();
