const { PrismaClient } = require('@prisma/client');
async function main() {
  const prisma = new PrismaClient();
  try {
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: true,
        userRoles: {
          include: {
            user: {
              include: {
                projectAssignments: true
              }
            }
          }
        }
      }
    });

    for (const role of roles) {
      if (role.userRoles.length > 0) {
        console.log(`Role: ${role.name}`);
        console.log(`  Permissions: ${role.rolePermissions.map(p => p.permissionCode).join(', ')}`);
        for (const ru of role.userRoles) {
          const u = ru.user;
          console.log(`  User: ${u.id} | Email: ${u.email} | Status: ${u.status}`);
          console.log(`    ProjectScope: ${u.projectAssignments.map(pa => pa.projectId).join(', ')}`);
        }
        console.log('---');
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}
main();
