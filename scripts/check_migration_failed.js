const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const r = await prisma.$queryRaw`SELECT id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count FROM _prisma_migrations WHERE migration_name='20260714_reconcile_pre_phase3_schema_drift'`;
  console.log(r);
  await prisma.$disconnect();
}
main();
