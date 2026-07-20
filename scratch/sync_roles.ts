// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting role synchronization...");
  
  const systemRoles = await prisma.systemRole.findMany();
  
  for (const sr of systemRoles) {
    const existingRbac = await prisma.role.findFirst({
      where: {
        OR: [
          { roleName: sr.name },
          { roleCode: sr.name }
        ]
      }
    });

    if (!existingRbac) {
      console.log(`Creating missing RBAC Role for: ${sr.name}`);
      await prisma.role.create({
        data: {
          roleName: sr.name,
          roleCode: sr.name,
          description: sr.name
        }
      });
    } else {
      console.log(`RBAC Role exists for: ${sr.name}`);
    }
  }

  console.log("Synchronization complete.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
