'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getRolesAndModules() {
  const roles = await prisma.role.findMany({ orderBy: { roleName: 'asc' } });
  const modules = await prisma.module.findMany({ orderBy: { moduleName: 'asc' } });
  const rolePermissions = await prisma.rolePermission.findMany();

  return { roles, modules, rolePermissions };
}

export async function saveRolePermission(roleId: string, moduleId: string, field: string, value: boolean) {
  const moduleInfo = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!moduleInfo) throw new Error("Module not found");

  await prisma.rolePermission.upsert({
    where: {
      roleId_moduleId: {
        roleId,
        moduleId,
      }
    },
    update: {
      [field]: value
    },
    create: {
      roleId,
      moduleId,
      moduleName: moduleInfo.moduleName,
      [field]: value
    }
  });

  revalidatePath('/admin/permissions');
  return { success: true };
}
