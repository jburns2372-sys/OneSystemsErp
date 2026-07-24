import { PrismaClient } from '@prisma/client';

async function run() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.SHADOW_DATABASE_URL
      }
    }
  });

  const p = await prisma.project.findUnique({
    where: { id: 'cmriveop10378vcqsma96byxi' }
  });
  console.log('Shadow DB project cmriveop10378vcqsma96byxi:', p ? 'Found' : 'Not found');
  
  await prisma.$disconnect();
}
run().catch(console.error);
