const { execSync } = require('child_process');

try {
  console.log("Restoring v4-r6-clean.sql to local testdb...");
  execSync(`"C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe" -d "postgresql://postgres:postgres@localhost:5434/testdb" -f backups/v4-r6-clean.sql`, { stdio: 'inherit' });
  console.log("Restore completed successfully.");
} catch (e) {
  console.error("Restore failed:", e.message);
  process.exit(1);
}
