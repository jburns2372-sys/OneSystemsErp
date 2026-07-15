const { execSync } = require('child_process');
require('dotenv').config();

try {
  const url = process.env.DATABASE_URL;
  const command = `npx prisma migrate diff --from-url "${url}" --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/pending.sql`;
  console.log('Running:', command);
  execSync(command, { stdio: 'inherit' });
  console.log('Done generating diff.');
} catch (error) {
  console.error('Error generating diff:', error);
}
