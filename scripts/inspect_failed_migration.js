const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('--- 2. INSPECT FAILED MIGRATION ---');
  const migRes = await client.query("SELECT * FROM _prisma_migrations WHERE migration_name = '20260714_reconcile_pre_phase3_schema_drift';");
  console.log('Entry count:', migRes.rowCount);
  if (migRes.rowCount > 0) {
    const m = migRes.rows[0];
    console.log('started_at:', m.started_at);
    console.log('finished_at:', m.finished_at);
    console.log('rolled_back_at:', m.rolled_back_at);
    console.log('applied_steps_count:', m.applied_steps_count);
    console.log('checksum:', m.checksum);
    console.log('logs:', m.logs);
  }

  console.log('--- 3. VERIFY PARTIAL DATABASE EFFECTS ---');
  const tablesRes = await client.query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';");
  console.log('Current table count:', tablesRes.rows[0].count);

  console.log('--- 4. AUDIT THE EXISTING COLUMN ---');
  const colRes = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'BOQMapping' AND column_name = 'procurementBenchmarkItemId';
  `);
  if (colRes.rowCount > 0) {
    const c = colRes.rows[0];
    console.log('Type:', c.data_type);
    console.log('Nullable:', c.is_nullable);
    console.log('Default:', c.column_default);
  } else {
    console.log('Column not found in DB!');
  }

  const fkRes = await client.query(`
    SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.update_rule,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'BOQMapping' AND kcu.column_name = 'procurementBenchmarkItemId';
  `);
  
  if (fkRes.rowCount > 0) {
    const fk = fkRes.rows[0];
    console.log('FK Target Table:', fk.foreign_table_name);
    console.log('FK Target Column:', fk.foreign_column_name);
    console.log('ON DELETE:', fk.delete_rule);
    console.log('ON UPDATE:', fk.update_rule);
  } else {
    console.log('No FK found for this column!');
  }

  const idxRes = await client.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'BOQMapping' AND indexdef LIKE '%procurementBenchmarkItemId%';
  `);
  if (idxRes.rowCount > 0) {
    console.log('Indexes:', idxRes.rows.map(r => r.indexname).join(', '));
  } else {
    console.log('No indexes found.');
  }

  await client.end();
}

run();
