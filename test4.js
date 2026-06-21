const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPageLogic() {
  const currentUser = await prisma.user.findUnique({
      where: { id: 'cmqn5zlim0000vckg4hzn5u7o' },
      include: { userRoles: { include: { role: true } } }
    });
  
  let isSystemAdmin = false;
  let primaryRole = 'PROJECT_DIRECTOR';

  if (currentUser) {
    primaryRole = currentUser.role || 'PROJECT_DIRECTOR';
    isSystemAdmin = primaryRole === 'SUPER_ADMIN' || (currentUser.userRoles && currentUser.userRoles.some(ur => ur.role.roleCode === 'SUPER_ADMIN'));
  }
  console.log("primaryRole:", primaryRole);
  console.log("isSystemAdmin:", isSystemAdmin);
}

testPageLogic().finally(() => prisma.$disconnect());
