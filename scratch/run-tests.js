const { execSync } = require('child_process');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.test.local', override: true });

try {
    console.log('Running tests with DB:', process.env.DATABASE_URL);
    execSync('npx jest --config jest.config.js tests/integration/super-admin-recovery.test.ts', { stdio: 'inherit' });
} catch (e) {
    console.error('Test failed');
    process.exit(1);
}
