const { execSync } = require('child_process');
const fs = require('fs');
require('dotenv').config({ path: '.env.uat-v4-r7', override: true });

const directUrl = process.env.DIRECT_URL;
const archivePath = 'backups/scheduling-reconstruction-uat-v4-r6-post-gate8d.dump';

console.log('=== STAGE 5: RESTORE TRUSTED GATE 8 ARCHIVE ===');

const pgRestoreBase = `"C:\\Program Files\\PostgreSQL\\18\\bin\\pg_restore.exe"`;

// Generate list
console.log('Generating list...');
execSync(`${pgRestoreBase} -l "${archivePath}" > restore_list.txt`, { stdio: 'inherit' });

// Filter list
const list = fs.readFileSync('restore_list.txt', 'utf8');
const lines = list.split('\n');
const filteredLines = lines.filter(line => !line.includes('neon_auth') && !line.includes('EXTENSION - pgcrypto') && !line.includes('EXTENSION - pg_stat_statements'));
fs.writeFileSync('filtered_list.txt', filteredLines.join('\n'));

console.log('Filtered list generated.');

const pgRestoreCmd = `${pgRestoreBase} -d "${directUrl}" -L filtered_list.txt --no-owner --no-privileges --single-transaction --exit-on-error "${archivePath}"`;

const startTime = Date.now();
try {
    console.log('Starting restore with filtered list...');
    execSync(pgRestoreCmd, { stdio: 'inherit' });
    const duration = Date.now() - startTime;
    console.log(`Restore completed successfully in ${duration}ms.`);
    console.log('Exit Code: 0');
} catch (err) {
    console.error('Restore failed:', err.message);
    process.exit(1);
}
