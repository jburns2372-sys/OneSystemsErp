import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING PROCESSED DATA CLEAR ---');
  
  try {
    // List of tables to EXCLUDE from truncation (seeded data / system tables)
    const tablesToKeep = [
      '_prisma_migrations',
      'User',
      'Role',
      'UserRole',
      'RolePermission',
      'Worker',
      'Supplier',
      'Subcontractor',
      'SystemRole',
      'GovernmentSettings',
      'SSSTable',
      'BIRWithholdingTaxTable',
      'KnowledgeReference',
      'DocumentTemplate',
      'Account',
      'Session',
      'VerificationToken'
    ].map(t => t.toLowerCase());

    // Get all tables in the public schema
    const result: any[] = await prisma.$queryRawUnsafe(`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public';
    `);

    const tablesToTruncate = result
      .map((r: any) => r.tablename)
      .filter((tableName: string) => !tablesToKeep.includes(tableName.toLowerCase()));

    if (tablesToTruncate.length === 0) {
      console.log('No processed data tables found to clear.');
      return;
    }

    console.log(`Found ${tablesToTruncate.length} tables to truncate.`);
    console.log(tablesToTruncate.join(', '));

    // Construct the TRUNCATE statement with CASCADE
    const truncateQuery = `TRUNCATE TABLE ${tablesToTruncate.map(t => `"${t}"`).join(', ')} CASCADE;`;
    
    console.log('Executing TRUNCATE CASCADE...');
    await prisma.$executeRawUnsafe(truncateQuery);

    console.log('--- CLEAR COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('--- CLEAR FAILED ---', error);
    process.exit(1);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
