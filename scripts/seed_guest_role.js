const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking for GUEST USER role...');

  let role = await prisma.role.findFirst({
    where: {
      OR: [
        { roleCode: 'GUEST_USER' },
        { roleName: 'GUEST USER' }
      ]
    }
  });

  if (!role) {
    console.log('GUEST USER role not found. Creating...');
    role = await prisma.role.create({
      data: {
        roleName: 'GUEST USER',
        roleCode: 'GUEST_USER',
        description: 'Universal Read-Only Access',
        isActive: true,
      }
    });
    console.log('Created Role:', role.roleName);
  } else {
    console.log('Role exists:', role.roleName);
  }

  // Check SystemRole
  let sysRole = await prisma.systemRole.findFirst({
    where: {
      name: 'GUEST USER'
    }
  });

  if (!sysRole) {
    console.log('SystemRole GUEST USER not found. Creating...');
    sysRole = await prisma.systemRole.create({
      data: {
        name: 'GUEST USER'
      }
    });
    console.log('Created SystemRole:', sysRole.name);
  } else {
    console.log('SystemRole exists:', sysRole.name);
  }

  console.log('GUEST USER role seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
