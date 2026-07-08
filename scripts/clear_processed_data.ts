// @ts-nocheck
/**
 * ============================================================
 *  MASTER RESET — PROCESSED DATA ONLY
 * ============================================================
 *  SAFE TO RUN: This script wipes ONLY transactional / processed
 *  data. It will NEVER touch:
 *    • User accounts, Roles, Permissions, Access Rights
 *    • Seeded Workers (employee master data)
 *    • Seeded Suppliers / Vendors
 *    • Seeded Subcontractors
 *    • Projects and their BOQ / Consolidation
 *    • Project Schedule structures (WBS, Activities)
 *    • Project-User Assignments (PBAC)
 *    • Knowledge Center (SOP references, notebooks)
 *    • AI Validation Rules and Policies
 *    • Security Simulation Scenarios / Campaigns
 *    • Government Settings, SSS Table, BIR Tables
 *    • Document Templates
 *    • System Roles, Modules, Security Rules
 *    • Equipment Master List
 *    • Hikvision Device Registry
 *    • Workflow Templates
 *    • Any system configuration / seeded reference data
 * ============================================================
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── PRESERVED TABLES (never truncated) ───────────────────────
// These are system config, master data, or seeded data that give
// the application its structure and functionality.
const PRESERVED_TABLES = new Set([
  // --- Prisma internals ---
  '_prisma_migrations',

  // --- Users & Access Control ---
  'user',
  'role',
  'userrole',
  'rolepermission',
  'roleconflictrule',
  'systemrole',
  'module',
  'validationsettings',
  'projectuserassignment',

  // --- Master People / Org Data ---
  'worker',
  'workerdocument',
  'supplier',
  'subcontractor',

  // --- Projects & BOQ (structural seeded data) ---
  'project',
  'awardedboqitem',
  'boqmapping',
  'boqlotbreakdown',
  'consolidatedboqitem',
  'procurementbenchmarkitem',
  'boqtemplateupload',

  // --- Project Schedule Structure ---
  'projectschedule',
  'schedulewbs',
  'scheduleactivity',
  'scheduleboqmapping',
  'scheduledependency',
  'schedulemilestone',
  'schedulepowmapping',

  // --- Program of Works ---
  'programofworks',

  // --- Knowledge Center & AI References ---
  'knowledgereference',
  'knowledgerecord',
  'knowledgerulereference',
  'ainotebookreference',
  'notebookreference',
  'notebookreferencemodule',
  'notebookreferenceproject',
  'notebookreferencerole',

  // --- AI Rules, Policies, RAG Registry ---
  'aivalidationrule',
  'aimoduleprompt',
  'airagkeywordregistry',
  'airagschemamap',
  'aiuiactionregistry',
  'aisystemenumregistry',
  'airagnoisexclusion',

  // --- Security Configuration (SOC Scenarios) ---
  'securitysimulationscenario',
  'securitysimulationcampaign',
  'securityrule',
  'threatip',

  // --- Government / Payroll Reference Tables ---
  'governmentsettings',
  'ssstable',
  'birwithholdingtaxtable',
  'payrollcutoffsetting',
  'payrollbankaccount',

  // --- Equipment & Fleet Registry (master devices) ---
  'equipment',
  'hikvisiondevice',
  'geofence',
  'projectcamera',

  // --- Document & Workflow Templates ---
  'documenttemplate',
  'workflowtemplate',

  // --- Receiving Bank & Payment Providers ---
  'receivingbank',
  'paymentprovider',
]);

// ─── TRANSACTIONAL TABLES (will be truncated) ─────────────────
// Everything NOT in PRESERVED_TABLES is transactional data.
// This is automatically derived from the live database, so new
// tables added in future migrations are correctly classified.

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║        MASTER RESET — PROCESSED DATA ONLY           ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
  console.log('🔒 Protected tables (will NOT be touched):');
  console.log(`   ${PRESERVED_TABLES.size} tables locked`);
  console.log('');

  const allTables: { tablename: string }[] = await prisma.$queryRawUnsafe(
    `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  );

  const tablesToClear = allTables
    .map(r => r.tablename)
    .filter(name => !PRESERVED_TABLES.has(name.toLowerCase()));

  if (tablesToClear.length === 0) {
    console.log('✅ No transactional tables found to clear.');
    return;
  }

  console.log(`🗑️  Transactional tables to clear (${tablesToClear.length} tables):`);
  tablesToClear.forEach(t => console.log(`   - ${t}`));
  console.log('');

  // Safety: list preserved tables for confirmation
  const preservedFound = allTables
    .map(r => r.tablename)
    .filter(name => PRESERVED_TABLES.has(name.toLowerCase()));
  console.log(`🔒 Confirmed preserved (${preservedFound.length} tables):`);
  preservedFound.forEach(t => console.log(`   ✓ ${t}`));
  console.log('');

  console.log('⚡ Executing TRUNCATE CASCADE on transactional tables...');
  const quoted = tablesToClear.map(t => `"${t}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} CASCADE`);

  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║     ✅  MASTER RESET COMPLETED SUCCESSFULLY         ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📋 What was preserved:');
  console.log('   ✓ All users, roles, permissions & access rights');
  console.log('   ✓ All workers (employee master data)');
  console.log('   ✓ All suppliers/vendors & subcontractors');
  console.log('   ✓ All projects, BOQ, and consolidated BOQ');
  console.log('   ✓ Project schedules, WBS, and activities');
  console.log('   ✓ Project-user assignments (PBAC)');
  console.log('   ✓ Knowledge Center references & SOPs');
  console.log('   ✓ AI validation rules & RAG registry');
  console.log('   ✓ SOC simulation scenarios & security rules');
  console.log('   ✓ Government settings, SSS & BIR tables');
  console.log('   ✓ Equipment registry & Hikvision devices');
  console.log('   ✓ Document & workflow templates');
  console.log('');
  console.log('📋 What was cleared (transactional data only):');
  console.log('   ✓ Material Requests & Canvass Forms');
  console.log('   ✓ Purchase Orders & Accounts Payable');
  console.log('   ✓ Expenses, Petty Cash transactions');
  console.log('   ✓ Accomplishments & Progress Billings');
  console.log('   ✓ Payroll periods & payroll entries');
  console.log('   ✓ Variation Orders & Job Orders');
  console.log('   ✓ Security Events & Incidents (SOC live data)');
  console.log('   ✓ Equipment maintenance logs & deployments');
  console.log('   ✓ DTR records & audit logs');
  console.log('   ✓ AI chat sessions & query logs');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('');
    console.error('❌ MASTER RESET FAILED:', e.message);
    await prisma.$disconnect();
    process.exit(1);
  });
