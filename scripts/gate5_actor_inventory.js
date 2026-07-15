const { PrismaClient } = require('@prisma/client');
async function main() {
  const prisma = new PrismaClient();
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { status: 'ACTIVE' } });
    const disabledUsers = await prisma.user.count({ where: { status: { in: ['INACTIVE', 'SUSPENDED', 'LOCKED'] } } });
    
    // Check if emailVerified or similar exists
    let verifiedUsers = 0;
    try {
      verifiedUsers = await prisma.user.count({ where: { emailVerified: { not: null } } });
    } catch(e) {
      // maybe emailVerified doesn't exist
    }

    const totalRoles = await prisma.role.count();
    
    let totalPermissions = 0;
    try {
      totalPermissions = await prisma.rolePermission.count();
    } catch(e) {}
    
    let totalProjectAssignments = 0;
    try {
      totalProjectAssignments = await prisma.projectUserAssignment.count();
    } catch(e) {}
    
    console.log(JSON.stringify({
      totalUsers,
      activeUsers,
      disabledUsers,
      verifiedUsers,
      totalRoles,
      totalPermissions,
      totalProjectAssignments
    }, null, 2));

  } finally {
    await prisma.$disconnect();
  }
}
main();
