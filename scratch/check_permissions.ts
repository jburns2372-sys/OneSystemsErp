import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany({
    where: {
      roleCode: {
        in: ['PROJECT_DIRECTOR', 'PROJECT_MANAGER', 'PURCHASING_OFFICER', 'FINANCE_OFFICER', 'ACCOUNTING_OFFICER', 'BILLING_OFFICER', 'SITE_ENGINEER', 'SITE_ADMIN']
      }
    },
    include: {
      rolePermissions: {
        include: {
          module: true
        }
      }
    }
  });
  
  for (const role of roles) {
    console.log(`\nRole: ${role.roleCode}`);
    console.log(`Permissions count: ${role.rolePermissions.length}`);
    const summary = role.rolePermissions.map(p => `${p.module.moduleCode}: ${p.canCreate ? 'C' : '-'}${p.canRead ? 'R' : '-'}${p.canUpdate ? 'U' : '-'}${p.canDelete ? 'D' : '-'}${p.canApprove ? 'A' : '-'}`).join(', ');
    console.log(`Permissions: ${summary}`);
  }
}
main().finally(() => prisma.$disconnect());
