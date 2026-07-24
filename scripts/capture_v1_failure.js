const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const migRes = await client.query("SELECT * FROM _prisma_migrations ORDER BY started_at;");
  
  const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';");
  const tables = tablesRes.rows.map(r => r.table_name);
  
  const psRes = tables.includes('ProjectSchedule') 
    ? await client.query('SELECT count(*) FROM "ProjectSchedule";')
    : { rows: [{ count: 0 }] };
    
  const baRes = tables.includes('BaselineActivation')
    ? await client.query('SELECT count(*) FROM "BaselineActivation";')
    : { rows: [{ count: 0 }] };

  const evidence = {
    auditTimestamp: new Date().toISOString(),
    migrations: migRes.rows,
    schemaObjectInventoryCount: tables.length,
    projectScheduleExists: tables.includes('ProjectSchedule'),
    projectScheduleCount: Number(psRes.rows[0].count),
    baselineActivationExists: tables.includes('BaselineActivation'),
    baselineActivationCount: Number(baRes.rows[0].count),
    schedulingAcceptanceDataExists: false
  };

  fs.writeFileSync('artifacts/scheduling/uat-v1-migration-order-failure.json', JSON.stringify(evidence, null, 2));

  let md = `# UAT v1 Migration Order Failure Evidence\n\n`;
  md += `- **Audit Timestamp**: ${evidence.auditTimestamp}\n`;
  md += `- **Schema Object Count**: ${evidence.schemaObjectInventoryCount}\n`;
  md += `- **ProjectSchedule Exists**: ${evidence.projectScheduleExists} (Rows: ${evidence.projectScheduleCount})\n`;
  md += `- **BaselineActivation Exists**: ${evidence.baselineActivationExists} (Rows: ${evidence.baselineActivationCount})\n`;
  md += `\n## Migration History\n`;
  evidence.migrations.forEach(m => {
    md += `### ${m.migration_name}\n`;
    md += `- **Started At**: ${m.started_at}\n`;
    md += `- **Finished At**: ${m.finished_at}\n`;
    md += `- **Rolled Back At**: ${m.rolled_back_at}\n`;
    md += `- **Applied Steps**: ${m.applied_steps_count}\n`;
    md += `- **Logs**: ${m.logs ? m.logs.substring(0, 200) + '...' : 'null'}\n\n`;
  });

  fs.writeFileSync('docs/scheduling/uat-v1-migration-order-failure.md', md);
  
  await client.end();
}
run();
