import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const s = await prisma.projectSchedule.findMany();
  console.log("ALL SCHEDULES:", s.map(x => x.projectId));
}
main();
