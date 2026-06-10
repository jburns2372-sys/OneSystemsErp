const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.project.findFirst();
  if (p) console.log('Project Description:', p.description);
  else console.log('No project found');
}
main().finally(() => prisma.$disconnect());