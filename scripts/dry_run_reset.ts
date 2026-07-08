// @ts-nocheck
// DRY RUN — shows what WOULD be cleared vs preserved, without touching the database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PRESERVED_TABLES = new Set([
  '_prisma_migrations',
  'user', 'role', 'userrole', 'rolepermission', 'roleconflictrule', 'systemrole',
  'module', 'validationsettings', 'projectuserassignment',
  'worker', 'workerdocument', 'supplier', 'subcontractor',
  'project', 'awardedboqitem', 'boqmapping', 'boqlotbreakdown',
  'consolidatedboqitem', 'procurementbenchmarkitem', 'boqtemplateupload',
  'projectschedule', 'schedulewbs', 'scheduleactivity', 'scheduleboqmapping',
  'scheduledependency', 'schedulemilestone', 'schedulepowmapping',
  'programofworks',
  'knowledgereference', 'knowledgerecord', 'knowledgerulereference',
  'ainotebookreference', 'notebookreference', 'notebookreferencemodule',
  'notebookreferenceproject', 'notebookreferencerole',
  'aivalidationrule', 'aimoduleprompt', 'airagkeywordregistry', 'airagschemamap',
  'aiuiactionregistry', 'aisystemenumregistry', 'airagnoisexclusion',
  'securitysimulationscenario', 'securitysimulationcampaign', 'securityrule', 'threatip',
  'governmentsettings', 'ssstable', 'birwithholdingtaxtable',
  'payrollcutoffsetting', 'payrollbankaccount',
  'equipment', 'hikvisiondevice', 'geofence', 'projectcamera',
  'documenttemplate', 'workflowtemplate',
  'receivingbank', 'paymentprovider',
]);

async function main() {
  const allTables: { tablename: string }[] = await prisma.$queryRawUnsafe(
    `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  );

  const willClear = allTables.map(r => r.tablename).filter(n => !PRESERVED_TABLES.has(n.toLowerCase()));
  const willPreserve = allTables.map(r => r.tablename).filter(n => PRESERVED_TABLES.has(n.toLowerCase()));

  console.log(`\n🔒 PRESERVED (${willPreserve.length}):`);
  willPreserve.forEach(t => console.log(`  ✓ ${t}`));

  console.log(`\n🗑️  WILL BE CLEARED (${willClear.length}):`);
  willClear.forEach(t => console.log(`  ✗ ${t}`));

  console.log('\n--- DRY RUN COMPLETE — No data was changed ---');
}
main().finally(() => prisma.$disconnect());
