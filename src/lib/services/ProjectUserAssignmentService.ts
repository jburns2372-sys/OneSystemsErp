import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export type AssignUserOptions = {
  projectId: string;
  userId: string;
  assignmentRoleOrPermission: string;
  accessLevel: string;
  actorContext: {
    userId: string;
    role: string;
  };
};

export async function assignExistingUserToProject({
  projectId,
  userId,
  assignmentRoleOrPermission,
  accessLevel,
  actorContext,
}: AssignUserOptions) {
  // 1. Confirm actor is Super Admin or authorized
  if (actorContext.role !== 'SUPER_ADMIN') {
    throw new Error('UNAUTHORIZED_ROLE');
  }

  return prisma.$transaction(async (tx) => {
    // 2. Confirm project exists
    const project = await tx.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new Error('PROJECT_NOT_FOUND');
    }

    // 3. Confirm target user exists and is ACTIVE
    const targetUser = await tx.user.findUnique({
      where: { id: userId },
    });
    if (!targetUser) {
      throw new Error('USER_NOT_FOUND');
    }
    if (targetUser.status !== 'ACTIVE') {
      throw new Error('USER_INACTIVE');
    }

    // 4. Reject duplicate active assignments
    const existing = await tx.projectUserAssignment.findFirst({
      where: {
        projectId,
        userId,
        assignmentStatus: 'active',
      },
    });
    if (existing) {
      throw new Error('DUPLICATE_ASSIGNMENT');
    }

    // 5. Create assignment and audit record atomically
    const assignment = await tx.projectUserAssignment.create({
      data: {
        projectId,
        userId,
        projectRole: assignmentRoleOrPermission,
        accessLevel,
        assignmentStatus: 'active',
        assignedBy: actorContext.userId,
      },
    });

    // Create exactly one audit record containing no secrets
    await tx.auditLog.create({
      data: {
        userId: actorContext.userId,
        userRole: actorContext.role,
        moduleName: 'PROJECT_USER_ASSIGNMENT',
        actionType: 'ASSIGN_USER',
        transactionId: assignment.id,
        newValue: JSON.stringify({
          targetUserId: userId,
          projectId,
          assignmentType: assignmentRoleOrPermission,
          operationSource: 'UI',
        }),
      },
    });

    return assignment;
  });
}

export type UpdateRoleOptions = {
  assignmentId: string;
  expectedCurrentProjectRole: string;
  newProjectRole: string;
  reason: string;
  actorContext: {
    userId: string;
    role: string;
  };
};

export async function updateProjectUserAssignmentRole({
  assignmentId,
  expectedCurrentProjectRole,
  newProjectRole,
  reason,
  actorContext,
}: UpdateRoleOptions) {
  if (!actorContext || !actorContext.userId) {
    throw new Error('UNAUTHORIZED: Missing session');
  }
  if (actorContext.role !== 'SUPER_ADMIN') {
    throw new Error('UNAUTHORIZED_ROLE');
  }
  
  const VALID_ROLES = ['PROJECT_MANAGER', 'PROJECT_ENGINEER', 'FINANCE_OFFICER', 'PROJECT_DIRECTOR', 'PURCHASING_OFFICER', 'REVIEWER'];
  if (!VALID_ROLES.includes(newProjectRole)) {
    throw new Error('INVALID_NEW_ROLE');
  }
  if (newProjectRole === expectedCurrentProjectRole) {
    throw new Error('UNCHANGED_ROLE');
  }

  return prisma.$transaction(async (tx) => {
    const assignment = await tx.projectUserAssignment.findUnique({
      where: { id: assignmentId },
      include: { user: true, project: true }
    });

    if (!assignment) {
      throw new Error('ASSIGNMENT_NOT_FOUND');
    }
    if (assignment.assignmentStatus?.toLowerCase() !== 'active') {
      throw new Error('ASSIGNMENT_INACTIVE');
    }
    if (assignment.projectRole !== expectedCurrentProjectRole) {
      throw new Error('INCORRECT_CURRENT_ROLE');
    }
    if (assignment.user.status !== 'ACTIVE') {
      throw new Error('USER_INACTIVE');
    }
    if (!assignment.project) {
      throw new Error('PROJECT_NOT_FOUND');
    }

    if (
      newProjectRole === 'FINANCE_OFFICER' && 
      assignment.user.role !== 'FINANCE_OFFICER' && 
      assignment.user.role !== 'SUPER_ADMIN'
    ) {
      throw new Error('INCOMPATIBLE_GLOBAL_ROLE');
    }

    // Since we are just updating the role, there is no duplicate issue for the *same* assignment ID.
    // The requirement says "prevent duplicate active assignments for the same user and project".
    // Since we are mutating the single existing active assignment, it remains the only one.

    const updated = await tx.projectUserAssignment.update({
      where: { id: assignmentId },
      data: { projectRole: newProjectRole }
    });

    await tx.auditLog.create({
      data: {
        userId: actorContext.userId,
        userRole: actorContext.role,
        moduleName: 'PROJECT_USER_ASSIGNMENT',
        actionType: 'UPDATE_ROLE',
        transactionId: assignmentId,
        newValue: JSON.stringify({
          targetUserId: assignment.userId,
          projectId: assignment.projectId,
          previousProjectRole: expectedCurrentProjectRole,
          correctedProjectRole: newProjectRole,
          reason,
          operationSource: 'UI',
          timestamp: new Date().toISOString()
        })
      }
    });

    return updated;
  });
}
