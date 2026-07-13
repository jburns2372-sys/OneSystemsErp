const { PrismaClient } = require('@prisma/client');
async function run() {
  const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://neondb_owner:npg_brmzcXfH81MG@ep-young-silence-aphvv0r2-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=15' } }});

  const userRoles = await prisma.userRole.count();
  console.log('UserRole assignments:', userRoles);

  const allUserRoles = await prisma.userRole.findMany({ include: { role: { select: { roleName: true } }, user: { select: { name: true, email: true } } } });
  console.log('UserRole details:', JSON.stringify(allUserRoles, null, 2));

  await prisma.$disconnect();
}
run();
