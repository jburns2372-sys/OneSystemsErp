import { execSync } from 'child_process';
import * as fs from 'fs';

function run(cmd: string) {
  try {
    console.log(`Running: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
    return 0;
  } catch (err: any) {
    return err.status || 1;
  }
}

const env = { ...process.env, DATABASE_URL: 'postgresql://neondb_owner:npg_brmzcXfH81MG@ep-steep-mode-apyi853q.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require' };

function runWithEnv(cmd: string) {
  try {
    console.log(`Running: ${cmd}`);
    execSync(cmd, { stdio: 'inherit', env });
    return 0;
  } catch (err: any) {
    return err.status || 1;
  }
}

const results = {
  prismaMigrateStatus: runWithEnv('npx prisma migrate status'),
  prismaValidate: runWithEnv('npx prisma validate'),
  prismaGenerate: runWithEnv('npx prisma generate'),
  tscCheck: run('npx tsc --noEmit'),
  build: run('npm run build'),
  jestBlueprint: runWithEnv('npx jest tests/gate8d-blueprint.test.ts --config=jest.config.js'),
  jestCpm: runWithEnv('npx jest tests/gate8d-cpm.test.ts --config=jest.config.js'),
  jestAllocation: runWithEnv('npx jest tests/gate8d-allocation.test.ts --config=jest.config.js')
};

fs.writeFileSync('artifacts/scheduling/uat-v4-r6-gate8d-final-tests.json', JSON.stringify(results, null, 2));
console.log('Final Tests completed:', results);
