const { execSync } = require('child_process');
const fs = require('fs');
require('dotenv').config({ path: '.env.uat-v4-r7', override: true });

const directUrl = process.env.DIRECT_URL;
const archivePath = 'backups/scheduling-reconstruction-uat-v4-r6-post-gate8d.dump';
const pgRestoreBase = `"C:\\Program Files\\PostgreSQL\\18\\bin\\pg_restore.exe"`;

const pgRestoreCmd = `${pgRestoreBase} -d "${directUrl}" -L filtered_list_sorted.txt --no-owner --no-privileges --single-transaction --exit-on-error "${archivePath}"`;

try {
    // hide URL from output
    execSync(pgRestoreCmd, { stdio: 'pipe' });
    const result = {
        restoreAttempt: 1,
        exitCode: 0,
        missingRelationErrors: 0,
        duplicateKeyErrors: 0,
        foreignKeyErrors: 0
    };
    fs.writeFileSync('artifacts/scheduling/uat-v4-r7-data-restore-result.json', JSON.stringify(result, null, 2));
    console.log('GATE9D_V4_R7_DATA_ONLY_GATE8_RESTORE_COMPLETED');
} catch (err) {
    console.error('Restore failed:', err.message);
    if (err.stdout) console.error('stdout:', err.stdout.toString());
    if (err.stderr) console.error('stderr:', err.stderr.toString());
    process.exit(1);
}
