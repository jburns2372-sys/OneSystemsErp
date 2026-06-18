import { PrismaClient } from '@prisma/client';
import { getUserPermissions } from './src/lib/permissions';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: 'j.burns2372@gmail.com' } });
  if (admin) {
    const perms = await getUserPermissions(admin.id);
    console.log(`Perms keys: ${Object.keys(perms).join(', ')}`);
    console.log(`Has PROCUREMENT?`, !!perms['PROCUREMENT']);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
