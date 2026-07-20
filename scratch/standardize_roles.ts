// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalize(name: string) {
  return name.toUpperCase().replace(/\s+/g, '_').trim();
}

async function main() {
  console.log("Standardizing roles to use UNDERSCORES...");

  // 1. Update Users
  const users = await prisma.user.findMany();
  for (const user of users) {
    if (user.role) {
      const norm = normalize(user.role);
      if (user.role !== norm) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: norm }
        });
        console.log(`Updated user ${user.email} role to ${norm}`);
      }
    }
  }

  // 2. Deduplicate SystemRoles
  const sysRoles = await prisma.systemRole.findMany();
  const sysRoleMap = new Map();
  
  for (const sr of sysRoles) {
    const norm = normalize(sr.name);
    if (!sysRoleMap.has(norm)) {
      sysRoleMap.set(norm, []);
    }
    sysRoleMap.get(norm).push(sr);
  }

  for (const [norm, roles] of sysRoleMap.entries()) {
    if (roles.length > 1) {
      // Keep the one that already has the underscore, or the first one
      const target = roles.find((r: any) => r.name === norm) || roles[0];
      const others = roles.filter((r: any) => r.id !== target.id);
      
      // Update target if it doesn't have the correct name
      if (target.name !== norm) {
        await prisma.systemRole.update({ where: { id: target.id }, data: { name: norm } });
      }
      
      // Delete others
      for (const other of others) {
        await prisma.systemRole.delete({ where: { id: other.id } });
        console.log(`Deleted duplicate SystemRole: ${other.name}`);
      }
    } else {
      const target = roles[0];
      if (target.name !== norm) {
        await prisma.systemRole.update({ where: { id: target.id }, data: { name: norm } });
        console.log(`Renamed SystemRole ${target.name} to ${norm}`);
      }
    }
  }

  // 3. Deduplicate RBAC Roles
  const rbacRoles = await prisma.role.findMany({ include: { rolePermissions: true } });
  const rbacRoleMap = new Map();

  for (const r of rbacRoles) {
    const norm = normalize(r.roleName);
    if (!rbacRoleMap.has(norm)) {
      rbacRoleMap.set(norm, []);
    }
    rbacRoleMap.get(norm).push(r);
  }

  for (const [norm, roles] of rbacRoleMap.entries()) {
    if (roles.length > 1) {
      const target = roles.find((r: any) => r.roleName === norm) || roles[0];
      const others = roles.filter((r: any) => r.id !== target.id);

      if (target.roleName !== norm) {
        await prisma.role.update({ where: { id: target.id }, data: { roleName: norm, roleCode: norm } });
      }

      for (const other of others) {
        // Move permissions from other to target
        for (const perm of other.rolePermissions) {
          const existingPerm = await prisma.rolePermission.findUnique({
            where: { roleId_moduleId: { roleId: target.id, moduleId: perm.moduleId } }
          });
          if (!existingPerm) {
             await prisma.rolePermission.update({
               where: { id: perm.id },
               data: { roleId: target.id }
             });
          } else {
             await prisma.rolePermission.delete({ where: { id: perm.id } });
          }
        }
        await prisma.role.delete({ where: { id: other.id } });
        console.log(`Deleted duplicate RBAC Role: ${other.roleName}`);
      }
    } else {
      const target = roles[0];
      if (target.roleName !== norm) {
        await prisma.role.update({ where: { id: target.id }, data: { roleName: norm, roleCode: norm } });
        console.log(`Renamed RBAC Role ${target.roleName} to ${norm}`);
      }
    }
  }

  console.log("Done standardizing roles.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
