const { Client } = require('pg'); 
const fs = require('fs'); 
const env = require('dotenv').parse(fs.readFileSync('.env')); 
const client = new Client({ connectionString: env.DIRECT_URL }); 
async function run() { 
  await client.connect(); 
  await client.query(`ALTER TABLE "ProjectBOQVersion" ADD COLUMN IF NOT EXISTS "checksum" TEXT, ADD COLUMN IF NOT EXISTS "checksumAlgorithm" TEXT, ADD COLUMN IF NOT EXISTS "checksumVersion" TEXT, ADD COLUMN IF NOT EXISTS "lockedAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "lockedById" TEXT, ADD COLUMN IF NOT EXISTS "sourceProvenance" TEXT;`); 
  console.log('Added columns'); 
  await client.end(); 
} 
run().catch(console.error);
