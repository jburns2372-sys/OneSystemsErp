import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { Client } from 'pg';

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const dbUrl = envConfig.DATABASE_URL || '';
const directUrl = envConfig.DIRECT_URL || '';

if (!dbUrl || !directUrl) {
  console.log('UAT_V3_ENVIRONMENT_CONFIGURATION_INVALID: Missing URLs');
  process.exit(1);
}

async function run() {
  const dbUrlParsed = new URL(dbUrl);
  const directUrlParsed = new URL(directUrl);

  console.log('DATABASE_URL Hostname:', dbUrlParsed.hostname);
  console.log('DIRECT_URL Hostname:', directUrlParsed.hostname);
  console.log('Endpoint Prefix (DB):', dbUrlParsed.hostname.split('.')[0]);
  console.log('Database Name:', dbUrlParsed.pathname.replace('/', ''));
  console.log('Database Role:', dbUrlParsed.username);
  console.log('Environment Source: .env file');
  console.log('Shell Override Status:', process.env.DATABASE_URL ? 'PRESENT' : 'ABSENT');

  const isDbPooler = dbUrlParsed.hostname.includes('-pooler');
  const isDirectPooler = directUrlParsed.hostname.includes('-pooler');
  const isNeonDbDb = dbUrlParsed.pathname === '/neondb';
  const isNeonDbDirect = directUrlParsed.pathname === '/neondb';
  const isOwnerDb = dbUrlParsed.username === 'neondb_owner';
  const isOwnerDirect = directUrlParsed.username === 'neondb_owner';
  const notUatV2Db = !dbUrlParsed.hostname.includes('ep-rapid-base-apec3cyh');
  const notUatV2Direct = !directUrlParsed.hostname.includes('ep-rapid-base-apec3cyh');

  if (!isDbPooler || isDirectPooler || !isNeonDbDb || !isNeonDbDirect || !isOwnerDb || !isOwnerDirect || !notUatV2Db || !notUatV2Direct) {
    console.log('UAT_V3_ENVIRONMENT_CONFIGURATION_INVALID');
    process.exit(1);
  }

  const client = new Client({ connectionString: directUrl });
  try {
    await client.connect();
    const res = await client.query('SELECT 1 as test');
    console.log('SELECT 1 result:', res.rows[0].test);

    // Read-only counts
    const queries = {
      Project: 'SELECT count(*) FROM "Project"',
      ProjectBOQVersion: 'SELECT count(*) FROM "ProjectBOQVersion"',
      ProjectSchedule: 'SELECT count(*) FROM "ProjectSchedule"',
      ScheduleWBS: 'SELECT count(*) FROM "ScheduleWBS"',
      ScheduleActivity: 'SELECT count(*) FROM "ScheduleActivity"',
      ScheduleDependency: 'SELECT count(*) FROM "ScheduleDependency"',
      ScheduleBOQAllocation: 'SELECT count(*) FROM "ScheduleBOQAllocation"',
      ScheduleApproval: 'SELECT count(*) FROM "ScheduleApproval"',
      ScheduleReviewComment: 'SELECT count(*) FROM "ScheduleReviewComment"',
      BaselineActivation: 'SELECT count(*) FROM "BaselineActivation"',
      ChecksumVarianceApprovals: 'SELECT count(*) FROM "AuditEvent" WHERE action LIKE \'%VARIANCE_APPROV%\''
    };

    let totalCounts = 0;
    const results: any = {};
    for (const [key, q] of Object.entries(queries)) {
      try {
        const cRes = await client.query(q);
        const c = parseInt(cRes.rows[0].count, 10);
        results[key] = c;
        totalCounts += c;
      } catch (e) {
        results[key] = 0; // table might not exist if totally clean
      }
    }

    console.log('\n--- Record Counts ---');
    for (const [key, val] of Object.entries(results)) {
      console.log(`${key}: ${val}`);
    }

    console.log('\n--- Forensic Presence ---');
    console.log(`Contains Forensic Gate 7 Project: ${results.Project > 0}`);
    console.log(`Contains Injected Variance Approvals: ${results.ChecksumVarianceApprovals > 0}`);
    console.log(`Contains Forensic Gate 8 Schedule: ${results.ProjectSchedule > 0}`);
    console.log(`Contains WBS/Activities/Dependencies/Allocations: ${results.ScheduleWBS > 0 || results.ScheduleActivity > 0 || results.ScheduleDependency > 0 || results.ScheduleBOQAllocation > 0}`);

    if (totalCounts > 0) {
      console.log('\nUAT_V3_BRANCH_CONTAINS_FORENSIC_RECORDS');
    } else {
      console.log('\nUAT_V3_CLEAN_BRANCH_CONNECTION_VERIFIED');
    }

    await client.end();
  } catch (err: any) {
    console.error('Connection failed:', err.message);
    console.log('UAT_V3_ENVIRONMENT_CONFIGURATION_INVALID');
    process.exit(1);
  }
}

run().catch(console.error);
