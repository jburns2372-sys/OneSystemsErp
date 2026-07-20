const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'jburns@demo.com' },
    update: { role: 'SUPER_ADMIN', name: 'J Burns' },
    create: {
      email: 'jburns@demo.com',
      name: 'J Burns',
      password: 'password123',
      role: 'SUPER_ADMIN'
    }
  });

  // Let's also create the basic roles just in case
  const roles = [
    { name: 'SUPER_ADMIN', code: 'SUPER_ADMIN', description: 'Full system control.' },
    { name: 'PROJECT_DIRECTOR', code: 'PROJECT_DIRECTOR', description: 'Executive oversight and final approvals.' },
    { name: 'PROJECT_MANAGER', code: 'PROJECT_MANAGER', description: 'Day-to-day project execution.' },
    { name: 'SYSTEM_ADMIN', code: 'SYSTEM_ADMIN', description: 'System Administrator.' }
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { roleCode: r.code },
      update: { description: r.description, roleName: r.name },
      create: { roleName: r.name, roleCode: r.code, description: r.description }
    });
  }

  console.log('User jburns@demo.com and core roles verified/created successfully!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
