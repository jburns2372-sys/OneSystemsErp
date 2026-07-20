require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Client } = require('pg');
const fs = require('fs');

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
  // Get all models in Prisma
  const models = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$') && typeof prisma[k].count === 'function');
  
  const counts = {};
  for (const m of models) {
    try {
      const c = await prisma[m].count();
      counts[m] = c;
    } catch (e) {
      console.log(`${m}: Error counting`);
    }
  }
  console.log(JSON.stringify(counts, null, 2));

  console.log('\n--- Checking specific required models ---');
  const requiredModels = [
    'project', 'user', 'projectUserAssignment', 'projectBOQVersion', 'awardedBOQItem',
    'projectSchedule', 'scheduleWBS', 'scheduleActivity', 'scheduleDependency',
    'scheduleBOQAllocation', 'scheduleApproval', 'scheduleReviewComment', 'baselineActivation',
    'auditLog', 'idempotencyRecord'
  ];
  for(const r of requiredModels) {
    if(counts[r] !== undefined) {
      console.log(`${r}: ${counts[r]}`);
    } else {
      console.log(`${r}: MISSING`);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
