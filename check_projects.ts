import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const projects = await prisma.project.findMany({ select: { id: true, name: true } });
  console.log('--- PROJECTS IN DATABASE ---');
  console.log(projects);
  console.log('----------------------------');
}
main();
