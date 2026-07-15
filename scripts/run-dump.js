const { execSync } = require('child_process');
require('dotenv').config();

try {
  execSync(`pg_dump -Fc -f backups/scheduling-reconstruction-uat-prechange.dump "${process.env.DATABASE_URL}"`, { stdio: 'inherit' });
  console.log('pg_dump completed.');
  
  const ls = execSync('pg_restore -l backups/scheduling-reconstruction-uat-prechange.dump');
  console.log('pg_restore listing length:', ls.length);
  
  const crypto = require('crypto');
  const fs = require('fs');
  const fileBuffer = fs.readFileSync('backups/scheduling-reconstruction-uat-prechange.dump');
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  const hex = hashSum.digest('hex');
  console.log('SHA-256:', hex);
  console.log('File size:', fileBuffer.length);
  
} catch(e) {
  console.error('Error:', e.message);
}
