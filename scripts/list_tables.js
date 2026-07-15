const { PrismaClient } = require('@prisma/client');
async function main() {
  const prisma = new PrismaClient();
  try {
    const r = await prisma.$queryRawUnsafe(`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`);
    console.log(r.map(t => t.table_name).join(', '));
  } finally {
    await prisma.$disconnect();
  }
}
main();
