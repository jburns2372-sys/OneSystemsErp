require('dotenv').config();
const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const tables = [
    'BOQExtractedItem', 'BOQExtractedSection', 'OnlyOfficeSession', 
    'ProjectBOQVersion', 'SecuritySimulationArchive', 'SecuritySimulationCampaign',
    'SecuritySimulationRun', 'SecuritySimulationScenario', 'UploadedWorkbookFile',
    'WorkbookExtractionAudit', 'WorkbookFormulaValidation', 'WorkbookTemplateValidation',
    'WorkbookVersion'
  ];
  for (const t of tables) {
    const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name=$1;`, [t]);
    if (res.rowCount > 0) {
      console.log(`Table ${t} exists.`);
    } else {
      console.log(`Table ${t} DOES NOT exist.`);
    }
  }

  // Also check CountermeasureLog, SecurityEvent, SecurityIncident columns added in migration
  const cols = [
    { table: 'CountermeasureLog', col: 'actualResult' },
    { table: 'SecurityEvent', col: 'actualResponse' },
    { table: 'SecurityIncident', col: 'evidenceJson' }
  ];

  for (const c of cols) {
    const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name=$1 AND column_name=$2;`, [c.table, c.col]);
    if (res.rowCount > 0) {
      console.log(`Column ${c.table}.${c.col} exists.`);
    } else {
      console.log(`Column ${c.table}.${c.col} DOES NOT exist.`);
    }
  }

  await client.end();
}
run();
