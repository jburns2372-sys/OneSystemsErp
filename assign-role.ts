import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'materials@gmail.com' } });
  if (!user) {
    console.log("User materials@gmail.com not found!");
    return;
  }

  const role = await prisma.role.findFirst({ where: { roleCode: 'MATERIALS_ENGINEER' } });
  if (!role) {
    console.log("Role MATERIALS_ENGINEER not found!");
    return;
  }

  // Assign role
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id
    }
  });

  console.log(`Successfully assigned MATERIALS_ENGINEER to materials@gmail.com`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
