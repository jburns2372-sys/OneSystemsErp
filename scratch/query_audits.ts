import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const audits = await prisma.scheduleGenerationAudit.findMany({
    orderBy: { requestTimestamp: 'desc' },
    take: 5
  });
  
  fs.writeFileSync('scratch/audits.json', JSON.stringify(audits, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
