const { spawnSync } = require('child_process');
require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');

const dumpPath = 'backups/scheduling-reconstruction-uat-prechange.dump';

if (fs.existsSync(dumpPath)) {
  fs.renameSync(dumpPath, dumpPath + '.' + Date.now() + '.failed');
}

const directUrl = process.env.DIRECT_URL;
if (!directUrl || !directUrl.includes('ep-billowing-dawn-ap2swfv9')) {
  console.error('UAT_BACKUP_ENVIRONMENT_MISMATCH');
  process.exit(1);
}

const pgDumpPath = 'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe';
const pgRestorePath = 'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_restore.exe';

const startTimestamp = new Date().toISOString();
console.log('Starting pg_dump...');

const dumpArgs = [
  '--format=custom',
  '--no-owner',
  '--no-acl',
  '--verbose',
  `--file=${dumpPath}`,
  directUrl
];

const dumpRes = spawnSync(pgDumpPath, dumpArgs, { stdio: 'pipe' });

const dumpExitCode = dumpRes.status;
console.log('pg_dump exit code:', dumpExitCode);

if (dumpExitCode !== 0) {
  console.error('pg_dump failed:', dumpRes.stderr.toString());
  process.exit(1);
}

const completionTimestamp = new Date().toISOString();
const stats = fs.statSync(dumpPath);
console.log('Backup size:', stats.size);

console.log('Starting pg_restore --list...');
const restoreRes = spawnSync(pgRestorePath, ['--list', dumpPath], { stdio: 'pipe' });
const restoreExitCode = restoreRes.status;
console.log('pg_restore list exit code:', restoreExitCode);

if (restoreExitCode !== 0) {
  console.error('pg_restore list failed:', restoreRes.stderr.toString());
  process.exit(1);
}

const listOutput = restoreRes.stdout.toString();
const archiveObjectCount = listOutput.split('\n').filter(l => l.trim().length > 0 && !l.startsWith(';')).length;
console.log('Archive object count:', archiveObjectCount);

const hashSum = crypto.createHash('sha256');
hashSum.update(fs.readFileSync(dumpPath));
console.log('SHA-256:', hashSum.digest('hex'));

console.log(`Start: ${startTimestamp}`);
console.log(`Completion: ${completionTimestamp}`);
