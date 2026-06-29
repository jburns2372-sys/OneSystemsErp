const { PrismaClient } = require('@prisma/client');
const { neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const ws = require('ws');
require('dotenv').config();

neonConfig.webSocketConstructor = ws;
const connectionString = process.env.NEON_BRANCH_URL || process.env.DATABASE_URL;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function checkUser() {
  try {
    let user = await prisma.user.findFirst({ where: { email: 'jburns@demo.com' } });
    if (!user) {
      console.log("User jburns@demo.com not found! Creating one...");
      user = await prisma.user.create({
        data: {
          email: 'jburns@demo.com',
          name: 'Jason Burns',
          role: 'ADMIN'
        }
      });
      console.log("Created user!");
    } else {
      console.log("User exists!");
    }
  } catch (e) {
    console.error("Error checking user:", e);
  }
  process.exit(0);
}

checkUser();
