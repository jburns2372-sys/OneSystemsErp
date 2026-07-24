require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } });

async function run() {
  const fks = await prisma.$queryRawUnsafe(`SELECT tc.table_name, tc.constraint_name FROM information_schema.table_constraints AS tc WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'`);
  for (const fk of fks) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "${fk.table_name}" DROP CONSTRAINT "${fk.constraint_name}"`);
  }
  console.log('Dropped', fks.length, 'FKs');
}
run().finally(() => prisma.$disconnect());
