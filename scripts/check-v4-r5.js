require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Client } = require('pg');

async function run() {
  const directUrl = process.env.DIRECT_URL;
  const pgClient = new Client({ connectionString: directUrl });
  
  try {
    await pgClient.connect();
    const res = await pgClient.query('SELECT 1 as connected');
    console.log('DIRECT_URL test:', res.rows[0]);
  } catch(e) {
    console.error('DIRECT_URL failed:', e);
  } finally {
    await pgClient.end();
  }

  console.log('\n--- Table Counts ---');
  const models = [
    'project', 'user', 'projectUserAssignment', 'projectBOQVersion', 'awardedBOQItem',
    'projectSchedule', 'scheduleWBS', 'scheduleActivity', 'scheduleDependency',
    'scheduleBOQAllocation', 'scheduleApproval', 'scheduleReviewComment', 'baselineActivation'
  ];

  let anyData = false;
  for (const m of models) {
    if (prisma[m]) {
      const c = await prisma[m].count();
      console.log(`${m}: ${c}`);
      if (c > 0) anyData = true;
    } else {
      console.log(`${m}: Model not found in Prisma Client`);
    }
  }

  console.log('\n--- Audit Records ---');
  const audits = await prisma.auditLog.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log('Audit records count:', await prisma.auditLog.count());
  console.log('Recent Audits:', audits);

  const idempotencyCount = await prisma.idempotencyRecord.count();
  console.log('\nIdempotency records:', idempotencyCount);
  if (idempotencyCount > 0) anyData = true;
  if (audits.length > 0) anyData = true;

  if (anyData) {
    console.log('\nGATE8D_EXISTING_V4_R5_NOT_PRISTINE');
  } else {
    console.log('\nGATE8D_V4_R5_SCHEMA_ONLY_STATE_VERIFIED');
  }

}

run().catch(console.error).finally(() => prisma.$disconnect());
