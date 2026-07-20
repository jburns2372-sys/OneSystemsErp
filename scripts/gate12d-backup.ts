import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL not found');
}

const backupPath = 'backups/scheduling-reconstruction-uat-v4-r7-final-gate12d.dump';

console.log('Starting pg_dump...');
try {
  if (!fs.existsSync('backups')) {
    fs.mkdirSync('backups');
  }
  
  const pgDump = '"C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe"';
  const pgRestore = '"C:\\Program Files\\PostgreSQL\\18\\bin\\pg_restore.exe"';
  
  execSync(`${pgDump} "${dbUrl}" -F c -f "${backupPath}"`, { stdio: 'inherit' });
  console.log('pg_dump completed.');
  
  const stats = fs.statSync(backupPath);
  console.log(`Backup size: ${stats.size} bytes`);
  
  console.log('Running pg_restore --list...');
  const toc = execSync(`${pgRestore} --list "${backupPath}"`).toString();
  
  const expectedTables = [
    'ProjectSchedule',
    'ScheduleWBS',
    'ScheduleActivity',
    'ScheduleDependency',
    'ScheduleBOQAllocation',
    'ScheduleApproval',
    'ScheduleReviewComment',
    'ScheduleWorkflowTransition',
    'BaselineActivation'
  ];
  
  let allPresent = true;
  for (const table of expectedTables) {
    if (toc.includes(table)) {
      console.log(`✅ Table present: ${table}`);
    } else {
      console.log(`❌ Table missing: ${table}`);
      allPresent = false;
    }
  }
  
  if (!allPresent) {
    throw new Error('Missing tables in backup');
  }
  
  console.log('Backup verification completed successfully.');
} catch (e: any) {
  console.error('Backup failed:', e.message);
  process.exit(1);
}
