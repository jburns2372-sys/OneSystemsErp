import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { PERMISSION_FIELDS, isSystemAdminRole, resolveAuthorizationAction } from './authorizationActions';

type Permissions = Record<string, any>;
const isGuestRole = (role: string) => role === 'GUEST USER' || role === 'GUEST_USER';
const GUEST_BLOCKED_MODULES = new Set(['SYSTEM_ROLES', 'SYSTEM_SETTINGS', 'USERS']);

function mergeRolePermissions(permissions: Permissions, role: {
  isActive: boolean; rolePermissions: Array<{ moduleName: string; [key: string]: any }>;
}) {
  if (!role.isActive) return;
  for (const row of role.rolePermissions) {
    const existing = permissions[row.moduleName];
    permissions[row.moduleName] = {
      ...row,
      ...Object.fromEntries(PERMISSION_FIELDS.map(field => [field,
        existing?.[field] === true || row[field] === true])),
    };
  }
}

function restrictGuestPermissions(permissions: Permissions): Permissions {
  // Only configured rows survive. Missing modules and audit access are never
  // invented. Guest aliases remain separate database identifiers.
  for (const [moduleName, row] of Object.entries(permissions)) {
    if (!row || typeof row !== 'object') continue;
    permissions[moduleName] = {
      ...row,
      ...Object.fromEntries(PERMISSION_FIELDS.map(field => [field,
        field === 'canView' && row.canView === true && !GUEST_BLOCKED_MODULES.has(moduleName)])),
    };
  }
  permissions.IS_ADMIN = false;
  permissions.IS_GUEST_USER = true;
  return permissions;
}

export async function getUserPermissions(userId: string): Promise<Permissions> {
  if (!userId) return {};
  try {
    const [user, userRoles] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { role: true, status: true, lockedUntil: true } }),
      prisma.userRole.findMany({ where: { userId }, include: { role: { include: { rolePermissions: true } } } }),
    ]);
    if (!user || user.status !== 'ACTIVE' || (user.lockedUntil && user.lockedUntil > new Date())) return {};

    const permissions: Permissions = {};
    const primaryRoleCode = user.role === 'SYSTEM_ADMIN' ? 'SUPER_ADMIN' : user.role;
    const primaryRole = await prisma.role.findFirst({
      where: { OR: [{ roleCode: primaryRoleCode }, { roleName: primaryRoleCode }] },
      include: { rolePermissions: true },
    });
    // Only active system-admin roles can simulate; a cookie cannot promote another actor.
    if (isSystemAdminRole(user.role) && primaryRole?.isActive) {
      let simulatedRole: string | undefined;
      try {
        simulatedRole = (await cookies()).get('simulatedRole')?.value;
      } catch { /* CLI/background calls do not have request cookies. */ }
      if (simulatedRole) return await getPermissionsForRole(simulatedRole);
    }
    if (primaryRole) mergeRolePermissions(permissions, primaryRole);
    for (const assignment of userRoles) mergeRolePermissions(permissions, assignment.role);

    // Preserve the admin marker, without synthesizing module permissions.
    if (isSystemAdminRole(user.role) && primaryRole?.isActive) permissions.IS_ADMIN = true;
    const guest = isGuestRole(user.role) || userRoles.some(({ role }) =>
      role.isActive && (isGuestRole(role.roleCode) || isGuestRole(role.roleName)));
    return guest ? restrictGuestPermissions(permissions) : permissions;
  } catch {
    // A partial read or database outage cannot authorize access.
    throw new Error('Authorization data unavailable');
  }
}

export async function getPermissionsForRole(roleCode: string): Promise<Permissions> {
  const effectiveRole = roleCode === 'SYSTEM_ADMIN' ? 'SUPER_ADMIN' : roleCode;
  const role = await prisma.role.findFirst({
    where: { OR: [{ roleCode: effectiveRole }, { roleName: effectiveRole }] },
    include: { rolePermissions: true },
  });
  if (!role?.isActive) return {};
  const permissions: Permissions = {};
  mergeRolePermissions(permissions, role);
  if (isSystemAdminRole(effectiveRole)) permissions.IS_ADMIN = true;
  return isGuestRole(effectiveRole) ? restrictGuestPermissions(permissions) : permissions;
}

export async function hasPermission(userId: string, moduleName: string, action: string): Promise<boolean> {
  const field = resolveAuthorizationAction(action);
  if (!field) return false;
  try {
    const permissions = await getUserPermissions(userId);
    const modulePermissions = Object.hasOwn(permissions, moduleName) ? permissions[moduleName] : null;
    if (!modulePermissions || typeof modulePermissions !== 'object') return false;
    return modulePermissions[field] === true;
  } catch { return false; }
}

export async function requirePermission(userId: string, moduleName: string, action: string) {
  if (!await hasPermission(userId, moduleName, action)) {
    throw new Error(`Unauthorized Action: You do not have permission to ${action} in the ${moduleName} module.`);
  }
}
