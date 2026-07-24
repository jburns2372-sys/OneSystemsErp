const cp = require('child_process');
require('dotenv').config();

const url = process.env.DIRECT_URL;
if (!url) {
  console.error("No DIRECT_URL in .env");
  process.exit(1);
}

// Convert absolute path to a format Docker on Windows understands or just mount relative 
const cwd = process.cwd().replace(/\\/g, '/');

const cmd = `docker run --rm -v "${cwd}/backups:/backups" postgres:17-alpine pg_dump -Fc "${url}" -f /backups/scheduling-reconstruction-uat-v3-post-gate7c.dump`;

console.log('Running pg_dump...');
cp.exec(cmd, (err, stdout, stderr) => {
  if (err) {
    console.error('Error:', err);
    console.error('Stderr:', stderr);
    process.exit(1);
  } else {
    console.log('Done.');
    process.exit(0);
  }
});
