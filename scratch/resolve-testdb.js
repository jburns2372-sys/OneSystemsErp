const { execSync } = require('child_process');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.test.local', override: true });

try {
    console.log('Resolving migration with DB:', process.env.DATABASE_URL);
    execSync('npx prisma migrate resolve --rolled-back 20260718000000_add_password_recovery', { stdio: 'inherit' });
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} catch (e) {
    console.error('Resolve/Deploy failed');
    process.exit(1);
}
