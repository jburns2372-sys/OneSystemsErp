const { execSync } = require('child_process');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.test.local', override: true });

try {
    console.log('Deploying migration with DB:', process.env.DATABASE_URL);
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} catch (e) {
    console.error('Migration failed');
    process.exit(1);
}
