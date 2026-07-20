import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEEP_TABLES = [
  'User',
  'Role',
  'UserRole',
  'SystemRole',
  'RolePermission',
  'Module',
  'RoleConflictRule',
  'Supplier',
  'Subcontractor',
  'Worker',
  'Equipment',
  'DocumentTemplate',
  'ValidationSettings',
  'GovernmentSettings',
  'SSSTable',
  'BIRWithholdingTaxTable',
  'PayrollCutoffSetting',
  'WorkflowTemplate',
  'WorkflowStep',
  'Document',
  '_prisma_migrations',
  'sqlite_sequence',
  // AI Reference Data
  'KnowledgeRecord',
  'KnowledgeReference',
  'KnowledgeRuleReference',
  'KnowledgeRuleAuditLog',
  'KnowledgeAuditTrail',
  'NotebookReference',
  'NotebookReferenceVersion',
  'NotebookReferenceModule',
  'NotebookReferenceRole',
  'NotebookReferenceProject',
  'AIModulePrompt',
  'AIValidationRule',
  'AINotebookReference'
].map(t => t.toLowerCase());

async function main() {
  console.log('Starting master reset (transactional data only)...');

  // Get all tables
  const tables: { name: string }[] = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table';`;
  
  const tablesToWipe = tables
    .map(t => t.name)
    .filter(name => !KEEP_TABLES.includes(name.toLowerCase()));

  console.log(`Found ${tablesToWipe.length} tables to wipe.`);

  let pendingTables = [...tablesToWipe];
  let iterations = 0;
  const maxIterations = 20;

  while (pendingTables.length > 0 && iterations < maxIterations) {
    iterations++;
    const nextPending = [];
    let deletedThisRound = 0;

    for (const table of pendingTables) {
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
        deletedThisRound++;
      } catch (err: any) {
        // FK constraint failure, try again next round
        if (err.message.includes('FOREIGN KEY constraint failed')) {
          nextPending.push(table);
        } else {
          console.error(`Error deleting from ${table}:`, err.message);
          nextPending.push(table);
        }
      }
    }

    pendingTables = nextPending;
    console.log(`Iteration ${iterations}: Deleted ${deletedThisRound} tables. ${pendingTables.length} remaining...`);
    
    if (deletedThisRound === 0 && pendingTables.length > 0) {
      console.error('Stuck! Could not delete the following tables due to constraints:', pendingTables);
      break;
    }
  }

  if (pendingTables.length === 0) {
    console.log('Successfully wiped all transactional data!');
  }

  // Verification
  console.log('\n--- VERIFICATION ---');
  for (const table of ['Project', 'PurchaseOrder', 'Expense', 'Supplier', 'Worker']) {
    try {
      const result: any[] = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}"`);
      const count = Number(result[0].count);
      console.log(`Table ${table}: ${count} records`);
    } catch (e) {
      console.log(`Table ${table}: error reading`);
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
