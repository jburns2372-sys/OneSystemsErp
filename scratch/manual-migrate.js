const { PrismaClient } = require('@prisma/client');
const { neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const ws = require('ws');
require('dotenv').config();

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.NEON_BRANCH_URL || process.env.DATABASE_URL;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function migrate() {
  console.log("Checking WebSockets DB schema...");
  
  try {
    const pbCols = await prisma.$queryRawUnsafe(`
      SELECT column_name::text as column_name FROM information_schema.columns WHERE table_name = 'ProcurementBenchmarkItem';
    `);
    console.log("ProcurementBenchmarkItem columns:", pbCols.map(c => c.column_name).join(', '));
  } catch (e) {
    console.error("Error checking columns:", e.message);
  }

  process.exit(0);
}

migrate();
