const { PrismaClient } = require('@prisma/client');
async function run() {
  const p1 = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_brmzcXfH81MG@ep-young-silence-aphvv0r2-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=15' } }});
  
  const projects = await p1.project.findMany();
  console.dir(projects, { depth: null });
  await p1.$disconnect();
}
run();
