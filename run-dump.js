require('dotenv').config();
const { execSync } = require('child_process');
try {
  execSync(`"C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe" -Fc --no-owner --clean -f backups/scheduling-reconstruction-uat-v4-clean-r3-final.dump "${process.env.DATABASE_URL}"`, { stdio: 'inherit' });
  console.log('Dump completed');
} catch (err) {
  console.error('Dump failed', err);
  process.exit(1);
}
