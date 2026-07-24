const fs = require('fs');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

function run() {
    const env = dotenv.parse(fs.readFileSync('.env'));
    const directUrl = env.DIRECT_URL;
    if (!directUrl) {
        throw new Error('DIRECT_URL not found in .env');
    }
    
    console.log('Restoring using DIRECT_URL: ' + directUrl.split('@')[1]);
    
    const cmd = `docker run --rm -v "${process.cwd()}:/workspace" postgres:17 pg_restore -d "${directUrl}" --data-only --no-owner --no-privileges --exit-on-error --single-transaction /workspace/backups/scheduling-reconstruction-sanitized-pre-gate7-data-v4-compatible.dump`;
    
    try {
        execSync(cmd, { stdio: 'inherit' });
        console.log('Restore completed successfully.');
    } catch(e) {
        console.error('Restore failed!', e);
        process.exit(1);
    }
}
run();
