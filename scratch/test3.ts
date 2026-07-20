// @ts-nocheck
import { cookies } from 'next/headers';
import { prisma } from './src/lib/prisma';

async function testPermissions() {
  const user = await prisma.user.findUnique({ where: { id: 'cmqn5zlim0000vckg4hzn5u7o' }, select: { role: true } });
  console.log("User Role:", user?.role);
  
  let aggregatedPermissions = {};
  if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'PROJECT_DIRECTOR') {
    aggregatedPermissions['IS_ADMIN'] = true;
  }
  console.log("IS_ADMIN:", aggregatedPermissions['IS_ADMIN']);
  
  return aggregatedPermissions;
}

testPermissions()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
