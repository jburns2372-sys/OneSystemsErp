// @ts-nocheck
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const roles = [
    'SUPER_ADMIN', 'MATERIALS_ENGINEER', 'PURCHASING_OFFICER', 'PROJECT_DIRECTOR',
    'PROJECT_MANAGER', 'FINANCE_OFFICER', 'STOCKMAN', 'PROJECT_ACCOUNTANT', 'COST_OFFICER', 'GUEST_USER'
  ];
  for (const r of roles) {
    const existing = await prisma.systemRole.findUnique({ where: { name: r } });
    if (!existing) {
      await prisma.systemRole.create({ data: { name: r }});
      console.log(`Created SystemRole: ${r}`);
    } else {
      console.log(`SystemRole ${r} already exists.`);
    }
  }
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
