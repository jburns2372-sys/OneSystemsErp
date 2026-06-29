const { PrismaClient } = require('@prisma/client');
const { neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const ws = require('ws');
require('dotenv').config();

neonConfig.webSocketConstructor = ws;
const connectionString = process.env.NEON_BRANCH_URL || process.env.DATABASE_URL;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function dump() {
  try {
    const project = await prisma.project.findFirst({
      where: { name: 'DESIGN AND BUILD OF TALAKAG GOVERNMENT CENTER' },
      include: {
        awardedBoqItems: {
          orderBy: { sourceRowNumber: 'asc' },
          take: 20
        }
      }
    });
    
    if (project) {
      console.log(`Dumping items for: ${project.name}`);
      for (const item of project.awardedBoqItems) {
        console.log(`Row ${item.sourceRowNumber} | ItemCode: "${item.itemCode}" | Desc: "${item.description.substring(0, 30)}"`);
      }
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
dump();
