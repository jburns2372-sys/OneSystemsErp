import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// We'll export a generic function that takes the user email or ID, since auth might be custom.
export async function getUserPermissions(userId: string) {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          rolePermissions: true
        }
      }
    }
  });

  // Aggregate permissions across all assigned roles
  // If a user has multiple roles, we grant them the union of permissions (OR logic).
  const aggregatedPermissions: Record<string, any> = {};

  userRoles.forEach(ur => {
    if (!ur.role.isActive) return;

    ur.role.rolePermissions.forEach(rp => {
      if (!aggregatedPermissions[rp.moduleName]) {
        aggregatedPermissions[rp.moduleName] = { ...rp };
      } else {
        // Apply OR logic for boolean permissions
        Object.keys(rp).forEach(key => {
          if (typeof (rp as any)[key] === 'boolean') {
            aggregatedPermissions[rp.moduleName][key] = aggregatedPermissions[rp.moduleName][key] || (rp as any)[key];
          }
        });
      }
    });
  });

  return aggregatedPermissions;
}

export async function hasPermission(userId: string, moduleName: string, action: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  const modulePerms = permissions[moduleName];
  if (!modulePerms) return false;
  
  return !!modulePerms[action];
}

// Security Helper to run inside Server Actions
export async function requirePermission(userId: string, moduleName: string, action: string) {
  const authorized = await hasPermission(userId, moduleName, action);
  if (!authorized) {
    throw new Error(`Unauthorized Action: You do not have permission to ${action.replace('can', '')} in the ${moduleName} module.`);
  }
}
