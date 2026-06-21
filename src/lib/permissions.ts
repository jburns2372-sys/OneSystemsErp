import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

const MASTER_ADMIN_MODULES = [
  // Sidebar module keys
  'DASHBOARD', 'PROJECT_MANAGEMENT', 'AI_COMMAND_CENTER', 'PROCUREMENT', 'INVENTORY',
  'MATERIAL_ISSUANCE', 'FINANCE', 'SUBCONTRACTING', 'ACCOMPLISHMENTS', 'PAYROLL',
  'EQUIPMENT', 'VARIATION_ORDERS', 'REPORTS', 'DOCUMENTS', 'KNOWLEDGE_CENTER',
  'SYSTEM_ROLES', 'SYSTEM_SETTINGS',
  // Functional modules
  'WORKER_DATABASE', 'DELIVERY_RECEIVING', 'PURCHASE_ORDER',
];

export async function getUserPermissions(userId: string) {
  const cookieStore = await cookies();
  const simulatedRole = cookieStore.get('simulatedRole')?.value;
  
  if (simulatedRole) {
    return getPermissionsForRole(simulatedRole);
  }

  const [user, userRoles] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: true
          }
        }
      }
    })
  ]);

  // Aggregate permissions across all assigned roles
  // If a user has multiple roles, we grant them the union of permissions (OR logic).
  const aggregatedPermissions: Record<string, any> = {};

  // First, get permissions from the primary string role
  if (user?.role) {
    const primaryRole = await prisma.role.findFirst({
      where: {
        OR: [
          { roleName: user.role },
          { roleCode: user.role }
        ]
      },
      include: { rolePermissions: true }
    });

    if (primaryRole) {
      primaryRole.rolePermissions.forEach(rp => {
        aggregatedPermissions[rp.moduleName] = { ...rp };
      });
    }
  }

  // Then aggregate from userRoles relationship if it exists
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

  if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'PROJECT_DIRECTOR') {
    aggregatedPermissions['IS_ADMIN'] = true;

    // Auto-populate commonly checked modules to bypass manual checks in frontend
    MASTER_ADMIN_MODULES.forEach(mod => {
      if (!aggregatedPermissions[mod]) aggregatedPermissions[mod] = {};
      const actions = ['canView', 'canCreate', 'canEdit', 'canDelete', 'canApprove', 'canSubmit', 'canLock', 'canExport', 'canEditDraft'];
      actions.forEach(action => {
        aggregatedPermissions[mod][action] = true;
      });
    });
  }

  return aggregatedPermissions;
}

export async function getPermissionsForRole(roleCode: string) {
  const aggregatedPermissions: Record<string, any> = {};

  // Handle legacy SYSTEM_ADMIN cookie mapped to SUPER_ADMIN
  const effectiveRoleCode = roleCode === 'SYSTEM_ADMIN' ? 'SUPER_ADMIN' : roleCode;

  const roleRecord = await prisma.role.findFirst({
    where: { OR: [{ roleName: effectiveRoleCode }, { roleCode: effectiveRoleCode }] },
    include: { rolePermissions: true }
  });

  if (roleRecord) {
    roleRecord.rolePermissions.forEach(rp => {
      aggregatedPermissions[rp.moduleName] = { ...rp };
    });
  }

  if (effectiveRoleCode === 'SUPER_ADMIN' || effectiveRoleCode === 'ADMIN' || effectiveRoleCode === 'PROJECT_DIRECTOR') {
    aggregatedPermissions['IS_ADMIN'] = true;
    MASTER_ADMIN_MODULES.forEach(mod => {
      if (!aggregatedPermissions[mod]) aggregatedPermissions[mod] = {};
      const actions = ['canView', 'canCreate', 'canEdit', 'canDelete', 'canApprove', 'canSubmit', 'canLock', 'canExport', 'canEditDraft'];
      actions.forEach(action => {
        aggregatedPermissions[mod][action] = true;
      });
    });
  }

  return aggregatedPermissions;
}

export async function hasPermission(userId: string, moduleName: string, action: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  if (permissions.IS_ADMIN) return true;
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
