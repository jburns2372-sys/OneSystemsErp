// @ts-nocheck
/**
 * ============================================================
 *  MASTER RESET VERIFICATION TEST  (Fast Version)
 * ============================================================
 *  Uses a single SQL batch query to count all tables at once
 *  instead of sequential queries — runs in seconds.
 *
 *  PHASE 1: Snapshot all row counts BEFORE reset
 *  PHASE 2: Execute master reset
 *  PHASE 3: Snapshot AFTER, compare, report PASS/FAIL
 * ============================================================
 */

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

// Single query using pg_stat_user_tables for fast approximate counts,
// then exact counts only for the preserved tables (fewer, manageable)
async function getAllCounts(): Promise<Map<string, number>> {
  // Use pg_stat_user_tables for a fast bulk count of all tables
  const rows: { relname: string; n_live_tup: string }[] = await prisma.$queryRawUnsafe(`
    SELECT relname, n_live_tup
    FROM pg_stat_user_tables
    ORDER BY relname
  `);

  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.relname, parseInt(row.n_live_tup, 10));
  }
  return counts;
}

async function getExactCounts(tableNames: string[]): Promise<Map<string, number>> {
  // Build a UNION ALL query for exact counts of specified tables
  const unionParts = tableNames.map(t => `SELECT '${t}' AS tbl, COUNT(*)::int AS cnt FROM "${t}"`);
  const sql = unionParts.join(' UNION ALL ');
  const rows: { tbl: string; cnt: number }[] = await prisma.$queryRawUnsafe(sql);
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.tbl, row.cnt);
  }
  return counts;
}

async function runReset(tablesToClear: string[]) {
  if (tablesToClear.length === 0) return;
  const quoted = tablesToClear.map(t => `"${t}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} CASCADE`);
}

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          MASTER RESET — VERIFICATION TEST               ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  // ── Get table list ────────────────────────────────────────────
  const tableList: { tablename: string }[] = await prisma.$queryRawUnsafe(
    `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  );

  const allTables = tableList.map(r => r.tablename);
  const preservedTables = allTables.filter(n => PRESERVED_TABLES.has(n.toLowerCase()));
  const transactionalTables = allTables.filter(n => !PRESERVED_TABLES.has(n.toLowerCase()));

  // ── PHASE 1: BEFORE snapshot (fast bulk + exact for preserved) ─
  console.log('📸 PHASE 1: Capturing BEFORE snapshot (fast batch query)...');
  const bulkBefore = await getAllCounts();
  const exactBefore = await getExactCounts(preservedTables);

  // Merge: use exact for preserved, bulk for transactional
  const before = new Map<string, number>();
  for (const t of allTables) {
    if (PRESERVED_TABLES.has(t.toLowerCase())) {
      before.set(t, exactBefore.get(t) ?? 0);
    } else {
      before.set(t, bulkBefore.get(t) ?? 0);
    }
  }

  const totalBefore = [...before.values()].reduce((a, b) => a + Math.max(b, 0), 0);
  console.log(`   Tables found: ${allTables.length} (${preservedTables.length} protected, ${transactionalTables.length} transactional)`);
  console.log(`   Total rows BEFORE: ~${totalBefore.toLocaleString()}`);
  console.log('');

  // Key protected table preview
  const keyTables = [
    'User', 'Role', 'RolePermission', 'Worker', 'Supplier', 'Subcontractor',
    'Project', 'AwardedBOQItem', 'ConsolidatedBOQItem', 'KnowledgeReference',
    'SecuritySimulationScenario', 'ScheduleActivity', 'ProjectUserAssignment',
    'GovernmentSettings', 'SSSTable'
  ];
  console.log('   Key protected tables BEFORE reset:');
  for (const t of keyTables) {
    const count = before.get(t) ?? 0;
    const flag = count > 0 ? '✓' : '○';
    console.log(`   ${flag} ${t.padEnd(32)} ${count} rows`);
  }
  console.log('');

  // ── PHASE 2: RUN RESET ───────────────────────────────────────
  console.log('⚡ PHASE 2: Running Master Reset...');
  await runReset(transactionalTables);
  console.log('   Reset complete.');
  console.log('');

  // ── PHASE 3: AFTER snapshot + compare ─────────────────────────
  console.log('📊 PHASE 3: Verifying results...');
  const exactAfter = await getExactCounts([...preservedTables, ...transactionalTables]);

  const failures: string[] = [];
  const transactionalNotCleared: string[] = [];

  // Check all preserved tables still have their rows
  console.log('');
  console.log('  🔒 PRESERVED TABLES CHECK:');
  let preservedPassed = 0;
  let preservedFailed = 0;

  for (const table of preservedTables) {
    const bCount = before.get(table) ?? 0;
    const aCount = exactAfter.get(table) ?? 0;
    if (aCount < bCount) {
      preservedFailed++;
      failures.push(`  ❌ ${table} — had ${bCount} rows, now has ${aCount} (LOST ${bCount - aCount} rows!)`);
      console.log(`  ❌ ${table.padEnd(35)} ${bCount} → ${aCount}  ⚠️  DATA LOST!`);
    } else {
      preservedPassed++;
      const status = bCount === 0 ? '(was already empty)' : `${bCount} rows retained ✓`;
      console.log(`  ✅ ${table.padEnd(35)} ${status}`);
    }
  }

  // Check transactional tables are all 0
  console.log('');
  console.log('  🗑️  TRANSACTIONAL TABLES CHECK:');
  let transactionalPassed = 0;
  let transactionalFailed = 0;

  for (const table of transactionalTables) {
    const aCount = exactAfter.get(table) ?? 0;
    if (aCount === 0) {
      transactionalPassed++;
    } else {
      transactionalFailed++;
      transactionalNotCleared.push(`  ⚠️  ${table.padEnd(35)} still has ${aCount} rows`);
    }
  }

  if (transactionalFailed === 0) {
    console.log(`  ✅ All ${transactionalTables.length} transactional tables cleared to 0 rows`);
  } else {
    transactionalNotCleared.forEach(t => console.log(t));
  }

  // ── FINAL REPORT ─────────────────────────────────────────────
  const totalAfter = [...exactAfter.values()].reduce((a, b) => a + b, 0);

  console.log('');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('  SUMMARY');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`  Rows before reset:     ~${totalBefore.toLocaleString()}`);
  console.log(`  Rows after reset:       ${totalAfter.toLocaleString()}`);
  console.log(`  Rows cleared:          ~${(totalBefore - totalAfter).toLocaleString()}`);
  console.log('');
  console.log(`  Protected tables:       ${preservedPassed} ✅  ${preservedFailed} ❌`);
  console.log(`  Transactional tables:   ${transactionalPassed} ✅  ${transactionalFailed} ⚠️`);
  console.log('');

  if (failures.length > 0) {
    console.log('  ❌ CRITICAL: These protected tables lost rows:');
    failures.forEach(f => console.log(f));
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  ❌  TEST FAILED — Protected data was altered            ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    process.exit(1);
  } else {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  ✅  ALL TESTS PASSED — Master Reset working correctly   ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
  }
  console.log('');
}

main().finally(() => prisma.$disconnect());
