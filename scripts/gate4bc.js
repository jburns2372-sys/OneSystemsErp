const fs = require('fs');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
require('dotenv').config();
const { Client } = require('pg');

const dumpPath = 'backups/scheduling-reconstruction-uat-prechange.dump';

async function run() {
  console.log('--- GATE 4B: VERIFY BACKUP ---');
  const fileBuffer = fs.readFileSync(dumpPath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  const hex = hashSum.digest('hex');
  console.log('SHA-256:', hex);
  
  const restoreRes = spawnSync('C:\\Program Files\\PostgreSQL\\18\\bin\\pg_restore.exe', ['--list', dumpPath]);
  if (restoreRes.status !== 0) {
    console.error('pg_restore list failed');
    process.exit(1);
  }
  const listCount = restoreRes.stdout.toString().split('\n').filter(l => l.trim().length > 0 && !l.startsWith(';')).length;
  console.log('Archive object count:', listCount);
  
  if (hex !== '918469aa531705b5509c690f1cbac7ede400f84eebfa7dcfa7f243f7a811b51c' || listCount !== 1069) {
    console.error('UAT_VERIFIED_BACKUP_CHANGED_OR_INVALID');
    process.exit(1);
  }

  console.log('--- GATE 4C: PRECONDITION ---');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  const tables = await client.query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';");
  console.log('Total tables:', tables.rows[0].count);
  
  const hasPS = await client.query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ProjectSchedule';");
  console.log('ProjectSchedule table existence:', hasPS.rows[0].count > 0);
  
  if (hasPS.rows[0].count > 0) {
    const psCount = await client.query('SELECT count(*) FROM "ProjectSchedule";');
    console.log('ProjectSchedule row count:', psCount.rows[0].count);
    if (Number(psCount.rows[0].count) !== 0) {
      console.error('UAT_MIGRATION_PRECONDITION_FAILED');
      process.exit(1);
    }
  } else {
    console.log('ProjectSchedule row count: 0 (table missing before migration)');
  }

  const mig = await client.query("SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at ASC;");
  console.log('Migrations count:', mig.rowCount);
  const applied = mig.rows.filter(r => r.finished_at !== null);
  console.log('Applied migration:', applied.map(r => r.migration_name).join(', '));
  const failed = mig.rows.filter(r => r.finished_at === null);
  console.log('Failed migrations:', failed.length);

  await client.end();
}
run();
