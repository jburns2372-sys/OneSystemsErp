const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.project.findFirst();
  await prisma.project.update({
    where: { id: p.id },
    data: { description: '\n\nBOQ File Uploaded: 1780678747123_PGH_AWARDED_BILL_OF_QUANTITY.xlsx' }
  });
  console.log('Fixed description to match disk file!');
}
main().finally(() => prisma.$disconnect());
