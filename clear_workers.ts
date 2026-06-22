// @ts-nocheck
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const deleted = await prisma.worker.deleteMany();
  console.log('Deleted ' + deleted.count + ' workers.');
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
