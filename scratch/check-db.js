const { PrismaClient } = require('@prisma/client');
const { neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const ws = require('ws');
require('dotenv').config();

neonConfig.webSocketConstructor = ws;
const connectionString = process.env.NEON_BRANCH_URL || process.env.DATABASE_URL;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function check() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        awardedBoqItems: true,
        boqTemplateUploads: true
      }
    });
    
    for (const p of projects) {
      console.log(`\nProject: ${p.name}`);
      console.log(`Contract Amount: ${p.contractAmount}`);
      console.log(`BOQTemplateUploads count: ${p.boqTemplateUploads.length}`);
      if (p.boqTemplateUploads.length > 0) {
        console.log(`Upload Report: ${p.boqTemplateUploads[0].validationReport ? p.boqTemplateUploads[0].validationReport.substring(0, 200) + '...' : 'none'}`);
        console.log(`Upload Grand Total: ${p.boqTemplateUploads[0].grandTotal}`);
        console.log(`Upload Valid Rows: ${p.boqTemplateUploads[0].validRows}`);
      }
      console.log(`AwardedBOQItem count: ${p.awardedBoqItems.length}`);
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
check();
