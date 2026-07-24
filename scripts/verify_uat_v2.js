const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

async function main() {
  const prisma = new PrismaClient();
  try {
    const res = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('SELECT 1:', res);
    
    const tableCount = await prisma.$queryRaw`SELECT count(*) as count FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('Table count:', tableCount[0].count.toString());
    
    // Check ProjectSchedule row count safely
    let psCount = "table missing";
    try {
        const c = await prisma.$queryRaw`SELECT count(*) as count FROM "ProjectSchedule"`;
        psCount = c[0].count.toString();
    } catch(e) {}
    console.log('ProjectSchedule count:', psCount);

    const mCount = await prisma.$queryRaw`SELECT count(*) as count FROM _prisma_migrations`;
    console.log('Migration count:', mCount[0].count.toString());

    const migrations = await prisma.$queryRaw`SELECT migration_name FROM _prisma_migrations ORDER BY finished_at ASC`;
    console.log('Migrations applied:', migrations);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
