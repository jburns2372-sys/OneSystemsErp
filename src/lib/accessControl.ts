import { prisma } from "@/lib/prisma";
import { getUserPermissions } from "@/lib/permissions";
import { isSystemAdminRole, resolveAuthorizationAction } from './authorizationActions';

export type AccessCheckResult = {
  allowed: boolean;
  denialReason?: string;
  userRole?: string;
  projectRole?: string;
  accessLevel?: string;
  projectId?: string;
  auditReference?: string;
};

export async function checkUserAccess(
  userId: string,
  projectId: string | null,
  moduleName: string,
  action: string,
  transactionId: string | null = null,
  requestIp: string = "unknown",
  deviceInfo: string = "unknown"
): Promise<AccessCheckResult> {
  try {
    const actionKey = resolveAuthorizationAction(action);
    if (!actionKey) return { allowed: false, denialReason: 'Unsupported authorization action' };
    // 1. Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true, name: true, lockedUntil: true }
    });

    if (!user) {
      return logAndReturnDenial(userId, "System", projectId, moduleName, action, "User does not exist", requestIp, deviceInfo);
    }
    if (user.status !== "ACTIVE" || (user.lockedUntil && user.lockedUntil > new Date())) {
      return logAndReturnDenial(userId, user.role, projectId, moduleName, action, "User account is inactive", requestIp, deviceInfo);
    }

    // 2. Check existing RBAC permissions
    const permissions = await getUserPermissions(userId);
    const modulePermissions = Object.hasOwn(permissions, moduleName) ? permissions[moduleName] : null;

    if (!modulePermissions) {
      return logAndReturnDenial(userId, user.role, projectId, moduleName, action, `Access Denied: Your role does not allow access to this module.`, requestIp, deviceInfo);
    }
    
    const hasActionAccess = modulePermissions[actionKey] === true;

    if (!hasActionAccess) {
      return logAndReturnDenial(userId, user.role, projectId, moduleName, action, `Access Denied: Your role does not allow this action.`, requestIp, deviceInfo);
    }

    // The current database is the tenant boundary. Even a system admin cannot
    // authorize a project that is absent from this tenant's database.
    if (projectId && !await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })) {
      return logAndReturnDenial(userId, user.role, projectId, moduleName, action, 'Project does not exist in this tenant', requestIp, deviceInfo);
    }

    // 3. Admin / Executive Override Logic (if applicable)
    // If the user is SUPER_ADMIN, they still need a project ID to avoid cross-project pollution, 
    // but they bypass the strict `ProjectUserAssignment` database check.
    const globalModules = ['Projects', 'Users', 'Settings', 'Roles', 'Executive Dashboard',
      'DASHBOARD', 'PROJECT_MANAGEMENT', 'SYSTEM_ROLES', 'SYSTEM_SETTINGS', 'USERS'];
    if (isSystemAdminRole(user.role) && permissions.IS_ADMIN === true) {
      if (!projectId && !globalModules.includes(moduleName)) {
         return logAndReturnDenial(userId, user.role, projectId, moduleName, action, "Access Denied: Admins must select an active project before continuing.", requestIp, deviceInfo);
      }
      await logAccessAllowed(user, null, null, projectId, moduleName, action, transactionId, "Admin Override", requestIp, deviceInfo);
      return {
        allowed: true,
        userRole: user.role,
        projectId: projectId || undefined,
      };
    }

    // 4. Require Project ID for Project Transactions
    if (!projectId) {
      // If the module itself doesn't require a project (e.g. general settings), we can allow it if RBAC passed.
      // But for project modules, it MUST be denied.
      if (globalModules.includes(moduleName)) {
        await logAccessAllowed(user, null, null, null, moduleName, action, transactionId, "Global Module Access", requestIp, deviceInfo);
        return { allowed: true, userRole: user.role };
      }
      return logAndReturnDenial(userId, user.role, projectId, moduleName, action, "Access Denied: Please select an active project before continuing.", requestIp, deviceInfo);
    }

    // 5. Check Project User Assignment
    const assignment = await prisma.projectUserAssignment.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId
        }
      }
    });

    if (!assignment) {
      return logAndReturnDenial(userId, user.role, projectId, moduleName, action, "Access Denied: You are not assigned to this project.", requestIp, deviceInfo);
    }

    if (assignment.assignmentStatus !== "active") {
      return logAndReturnDenial(userId, user.role, projectId, moduleName, action, `Access Denied: Your access to this project is ${assignment.assignmentStatus}.`, requestIp, deviceInfo);
    }

    // 6. Check Access Level constraints
    if (assignment.accessLevel === "view_only" && actionKey !== 'canView') {
      return logAndReturnDenial(userId, user.role, projectId, moduleName, action, "Access Denied: Guest users have view-only access.", requestIp, deviceInfo);
    }

    // 7. Check Approval Workflow (Basic skeleton for now)
    if (action === "APPROVE") {
      // Additional checks would go here based on transaction_id
      // For now, we rely on existing RBAC + Project Assignment
    }

    // 8. Log Allowed Access
    const auditId = await logAccessAllowed(user, assignment.projectRole, assignment.accessLevel, projectId, moduleName, action, transactionId, "Granted", requestIp, deviceInfo);

    return {
      allowed: true,
      userRole: user.role,
      projectRole: assignment.projectRole,
      accessLevel: assignment.accessLevel,
      projectId,
      auditReference: auditId
    };

  } catch (error: any) {
    console.error("Access Control Error:", error);
    return { allowed: false, denialReason: "Internal Access Control Error" };
  }
}

async function logAndReturnDenial(
  userId: string,
  userRole: string,
  projectId: string | null,
  moduleName: string,
  action: string,
  reason: string,
  ipAddress: string,
  deviceInfo: string
): Promise<AccessCheckResult> {
  const auditId = await prisma.auditLog.create({
    data: {
      userId,
      userRole,
      moduleName,
      transactionId: projectId || "NO_PROJECT",
      actionType: "ACCESS_DENIED",
      remarks: JSON.stringify({ requestedAction: action, reason, projectRole: "None", accessLevel: "None" }),
      ipAddress,
    }
  });

  return {
    allowed: false,
    denialReason: reason,
    userRole,
    projectId: projectId || undefined,
    auditReference: auditId.id
  };
}

async function logAccessAllowed(
  user: any,
  projectRole: string | null,
  accessLevel: string | null,
  projectId: string | null,
  moduleName: string,
  action: string,
  transactionId: string | null,
  remarks: string,
  ipAddress: string,
  deviceInfo: string
) {
  // We don't want to flood the audit log with every single READ operation,
  // but we definitely want to log WRITE/DELETE/APPROVE and overrides.
  if (action === "READ" && remarks !== "Admin Override") {
    return "NOT_AUDITED_READ";
  }

  const auditLog = await prisma.auditLog.create({
    data: {
      userId: user.id,
      userRole: user.role,
      moduleName,
      transactionId: transactionId || projectId || "SYSTEM",
      actionType: `${action}_${moduleName.toUpperCase()}`,
      remarks: JSON.stringify({ 
        projectId, 
        projectRole, 
        accessLevel, 
        remarks 
      }),
      ipAddress,
    }
  });

  return auditLog.id;
}
