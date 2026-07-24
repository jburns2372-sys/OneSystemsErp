const { execSync } = require('child_process');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.uat-v4-r7', override: true });

try {
    console.log('Deploying migration with:', process.env.DATABASE_URL);
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} catch (e) {
    console.error('Migration failed');
}
