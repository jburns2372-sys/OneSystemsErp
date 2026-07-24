import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.uat-v4-r7' });

import { prismaBase } from './src/lib/prisma-base';

async function main() {
  const role = await prismaBase.role.findFirst({ where: { roleCode: 'DIRECTORS' } });
  if (!role) {
    console.log('Role not found');
    return;
  }
  
  await prismaBase.rolePermission.updateMany({
    where: { roleId: role.id, moduleName: 'PROJECT_MANAGEMENT' },
    data: { canSubmit: true }
  });
  console.log('Granted canSubmit to DIRECTORS in PROJECT_MANAGEMENT');
}

main().then(() => prismaBase.$disconnect()).catch(console.error);
