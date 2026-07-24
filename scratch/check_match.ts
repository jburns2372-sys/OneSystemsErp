import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const projectId = 'cmriveop10378vcqsma96byxi';
  const awarded = await prisma.awardedBOQItem.findMany({ where: { projectId } });
  const consolidated = await prisma.consolidatedBOQItem.findMany({ where: { projectId } });
  
  // Find a specific unmapped item
  const testDesc = 'ACCU- Model: RXQ18BYM';
  const raw = awarded.find(a => a.description.includes(testDesc));
  if (raw) {
    console.log('RAW ITEM:');
    console.log(raw);
    
    console.log('\nLOOKING FOR MATCH IN CONSOLIDATED:');
    const match = consolidated.find(c => c.description.includes('RXQ18BYM'));
    console.log(match);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
