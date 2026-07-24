require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } });

async function run() {
  const fks = await prisma.$queryRawUnsafe(`SELECT tc.table_name, tc.constraint_name FROM information_schema.table_constraints AS tc WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'`);
  const sql = fks.map(fk => `ALTER TABLE "${fk.table_name}" DROP CONSTRAINT "${fk.constraint_name}";`).join('\n');
  fs.writeFileSync('drop_fks.sql', sql);
  console.log('Wrote', fks.length, 'FK drops to drop_fks.sql');
}
run().finally(() => prisma.$disconnect());
