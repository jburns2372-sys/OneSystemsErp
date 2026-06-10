const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  const projects = await prisma.project.findMany({
    include: { awardedBoqItems: true }
  });
  
  projects.forEach(p => {
    console.log(`Project: ${p.name}`);
    console.log(`BOQ Items Count: ${p.awardedBoqItems.length}`);
  });
}

checkData().catch(console.error).finally(() => prisma.$disconnect());
