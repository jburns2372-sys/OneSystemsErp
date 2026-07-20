// @ts-nocheck
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const roles = [
    'SUPER_ADMIN', 'MATERIALS_ENGINEER', 'PURCHASING_OFFICER', 'PROJECT_DIRECTOR',
    'PROJECT_MANAGER', 'FINANCE_OFFICER', 'STOCKMAN', 'PROJECT_ACCOUNTANT', 'COST_OFFICER', 'GUEST_USER'
  ];
  for (const r of roles) {
    const existing = await prisma.role.findFirst({ where: { roleName: r }});
    if (!existing) {
      await prisma.role.create({
        data: { roleName: r, roleCode: r, description: r }
      });
      console.log(`Created Role: ${r}`);
    } else {
      console.log(`Role ${r} already exists.`);
    }
  }
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
