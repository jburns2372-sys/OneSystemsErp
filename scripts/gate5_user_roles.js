const { PrismaClient } = require('@prisma/client');
async function main() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });

    const output = users.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      userRoles: u.userRoles.map(ur => ur.role.roleName || ur.role.roleCode)
    }));

    console.log(JSON.stringify(output, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}
main();
