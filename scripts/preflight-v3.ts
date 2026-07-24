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

try {
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
  client.connect()
    .then(() => client.query('SELECT 1 as test'))
    .then(res => {
      console.log('UAT_V3_CLEAN_BRANCH_CONNECTION_VERIFIED');
      process.exit(0);
    })
    .catch(err => {
      console.error('Connection failed:', err.message);
      console.log('UAT_V3_ENVIRONMENT_CONFIGURATION_INVALID');
      process.exit(1);
    });
} catch (e) {
  console.error(e);
  console.log('UAT_V3_ENVIRONMENT_CONFIGURATION_INVALID');
  process.exit(1);
}
