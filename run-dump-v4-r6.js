require('dotenv').config();
const { execSync } = require('child_process');
try {
  execSync(`"C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe" --no-owner --clean -f backups/v4-r6-clean.sql "postgresql://neondb_owner:npg_brmzcXfH81MG@ep-steep-mode-apyi853q.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"`, { stdio: 'inherit' });
  console.log('Dump completed');
} catch (err) {
  console.error('Dump failed', err);
  process.exit(1);
}
