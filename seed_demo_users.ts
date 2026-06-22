// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('Fetching all roles...');
  const allRoles = await prisma.role.findMany();

  console.log('Fetching existing users to identify roles to skip...');
  // Find current active users and what roles they occupy
  const currentUsers = await prisma.user.findMany({
    where: {
      NOT: {
        email: { endsWith: '@demo.com' }
      }
    },
    include: {
      userRoles: true
    }
  });

  const occupiedRoleIds = new Set<string>();
  currentUsers.forEach(user => {
    user.userRoles.forEach(ur => occupiedRoleIds.add(ur.roleId));
  });

  console.log(`Found ${currentUsers.length} current users occupying ${occupiedRoleIds.size} roles.`);

  let createdCount = 0;

  for (const role of allRoles) {
    if (occupiedRoleIds.has(role.id)) {
      console.log(`Skipping role ${role.roleCode} - already occupied.`);
      continue;
    }

    const email = `${role.roleCode.toLowerCase()}@demo.com`;
    const name = `DEMO ${role.roleName.replace(/_/g, ' ')}`;

    // Check if demo user already exists
    let existingDemo = await prisma.user.findFirst({ where: { email } });

    if (!existingDemo) {
      console.log(`Creating demo user for role ${role.roleCode}...`);
      existingDemo = await prisma.user.create({
        data: {
          name,
          email,
          password: 'admin001',
          role: role.roleCode, // store string code in legacy role field
          status: 'ACTIVE'
        }
      });
      
      // Link the UserRole
      await prisma.userRole.create({
        data: {
          userId: existingDemo.id,
          roleId: role.id
        }
      });
      createdCount++;
    } else {
      console.log(`Demo user ${email} already exists. Skipping creation.`);
    }
  }

  console.log(`Seed complete! Created ${createdCount} demo users with password 'admin001'.`);
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
