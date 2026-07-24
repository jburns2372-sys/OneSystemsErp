const { Client } = require('pg');
require('dotenv').config();

async function runInventory() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    
    const dbNameRes = await client.query('SELECT current_database() as db;');
    const pgVersion = await client.query('SELECT version();');
    
    const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';");
    const viewsRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'VIEW';");
    const indexesRes = await client.query("SELECT indexname FROM pg_indexes WHERE schemaname = 'public';");
    const fksRes = await client.query("SELECT constraint_name FROM information_schema.table_constraints WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY';");
    
    let migrationsCount = 0;
    let latestMigration = 'None';
    let failedMigrationsCount = 0;
    try {
      const migRes = await client.query("SELECT * FROM _prisma_migrations ORDER BY started_at DESC;");
      migrationsCount = migRes.rowCount;
      if (migrationsCount > 0) {
        latestMigration = migRes.rows[0].migration_name;
        failedMigrationsCount = migRes.rows.filter(r => r.finished_at === null).length;
      }
    } catch(e) {}
    
    let projectCount = 0;
    try { const pRes = await client.query('SELECT count(*) FROM "Project";'); projectCount = pRes.rows[0].count; } catch(e) {}
    
    let projectScheduleCount = 0;
    try { const psRes = await client.query('SELECT count(*) FROM "ProjectSchedule";'); projectScheduleCount = psRes.rows[0].count; } catch(e) {}
    
    let userCount = 0;
    try { const uRes = await client.query('SELECT count(*) FROM "User";'); userCount = uRes.rows[0].count; } catch(e) {}
    
    let boqCount = 0;
    try { const bRes = await client.query('SELECT count(*) FROM "ProjectBOQVersion";'); boqCount = bRes.rows[0].count; } catch(e) {}
    
    const schedulingTables = tablesRes.rows
      .map(r => r.table_name)
      .filter(t => /ProjectSchedule|Schedule|Baseline|WBS|Activity|Dependency|BOQAllocation|ReviewComment|Approval|Activation/i.test(t));
      
    const schedulingSchema = {};
    for (const table of schedulingTables) {
      const cols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public';`, [table]);
      schedulingSchema[table] = cols.rows.map(c => c.column_name);
    }
    
    const output = {
      auditTimestamp: new Date().toISOString(),
      sanitizedDatabaseHostname: process.env.DATABASE_URL.split('@')[1].split('/')[0],
      databaseName: dbNameRes.rows[0].db,
      schemaName: 'public',
      postgreSQLVersion: pgVersion.rows[0].version,
      totalTableCount: tablesRes.rowCount,
      totalViewCount: viewsRes.rowCount,
      totalIndexCount: indexesRes.rowCount,
      totalForeignKeyCount: fksRes.rowCount,
      prismaMigrationHistoryCount: migrationsCount,
      latestAppliedMigration: latestMigration,
      failedOrUnfinishedMigrationCount: failedMigrationsCount,
      totalProjectCount: Number(projectCount),
      totalProjectScheduleCount: Number(projectScheduleCount),
      totalUserCount: Number(userCount),
      totalAwardedBoqVersionCount: Number(boqCount),
      totalSchedulingRelatedTableCount: schedulingTables.length,
      currentApplicationSchemaCompatibilityResult: "Pending Migration",
      schedulingTables: schedulingSchema
    };
    
    console.log(JSON.stringify(output, null, 2));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

runInventory();
