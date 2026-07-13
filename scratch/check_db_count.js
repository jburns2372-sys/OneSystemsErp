const { PrismaClient } = require('@prisma/client');
async function run() {
  const p1 = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_brmzcXfH81MG@ep-young-silence-aphvv0r2-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=15' } }});
  const p2 = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_brmzcXfH81MG@ep-red-mountain-ap48rfat-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&connect_timeout=15&sslmode=require' } }});
  
  console.log('Young Silence Projects:', await p1.project.count());
  console.log('Red Mountain Projects:', await p2.project.count());
  
  await p1.$disconnect();
  await p2.$disconnect();
}
run();
