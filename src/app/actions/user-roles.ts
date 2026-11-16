'use server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const ADMIN_USER_ROLES = new Set(['SUPER_ADMIN', 'SYSTEM_ADMIN', 'PROJECT_DIRECTOR']);
const ALLOWED_ACCOUNT_STATUSES = new Set(['ACTIVE', 'INACTIVE', 'LOCKED']);

async function requireAdminActor() {
  const actor = await verifySession();
  if (!actor?.id) {
    redirect('/login');
  }
  if (!ADMIN_USER_ROLES.has(actor.role)) {
    throw new Error('Forbidden: Verified administrative authority required.');
  }
  return actor;
}

export async function getUsersWithRoles() {
  await requireAdminActor();

  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          include: { role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.role.findMany({ orderBy: { roleName: 'asc' } }),
  ]);

  return { users, roles };
}

export async function assignRoleToUser(userId: string, roleId: string) {
  const actor = await requireAdminActor();
  if (!userId || !roleId) {
    return { success: false, error: 'userId and roleId are required.' };
  }

  const roleRecord = await prisma.role.findUnique({ where: { id: roleId } });
  if (!roleRecord) {
    return { success: false, error: 'Role not found.' };
  }
  if (
    (roleRecord.roleCode === 'SUPER_ADMIN' || roleRecord.roleName === 'SUPER_ADMIN') &&
    actor.role !== 'SUPER_ADMIN'
  ) {
    return { success: false, error: 'Only a SUPER_ADMIN may assign SUPER_ADMIN.' };
  }

  const existing = await prisma.userRole.findUnique({
    where: { userId_roleId: { userId, roleId } },
  });
  if (!existing) {
    await prisma.userRole.create({
      data: { userId, roleId },
    });
  }

  revalidatePath('/admin/user-roles');
  return { success: true };
}

export async function removeRoleFromUser(userId: string, roleId: string) {
  const actor = await requireAdminActor();
  if (!userId || !roleId) {
    return { success: false, error: 'userId and roleId are required.' };
  }

  const roleRecord = await prisma.role.findUnique({ where: { id: roleId } });
  if (
    roleRecord &&
    (roleRecord.roleCode === 'SUPER_ADMIN' || roleRecord.roleName === 'SUPER_ADMIN') &&
    actor.role !== 'SUPER_ADMIN'
  ) {
    return { success: false, error: 'Only a SUPER_ADMIN may revoke SUPER_ADMIN.' };
  }

  try {
    await prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    });
  } catch (e: any) {
    if (e?.code !== 'P2025') {
      throw e;
    }
  }

  revalidatePath('/admin/user-roles');
  return { success: true };
}

export async function updateUserStatus(userId: string, status: string) {
  const actor = await requireAdminActor();
  const normalizedStatus = typeof status === 'string' ? status.trim().toUpperCase() : '';

  if (!userId || !normalizedStatus || !ALLOWED_ACCOUNT_STATUSES.has(normalizedStatus)) {
    throw new Error('Invalid userId or account status.');
  }
  if (userId === actor.id) {
    throw new Error('You cannot change the status of your own account.');
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, status: true },
  });
  if (!target) {
    throw new Error('Target user not found.');
  }
  if (target.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw new Error('Only a SUPER_ADMIN may change the status of a SUPER_ADMIN account.');
  }
  if (target.status === normalizedStatus) {
    return { success: true, status: normalizedStatus, unchanged: true };
  }

  const revokeSessions = normalizedStatus !== 'ACTIVE';
  const updateData: any = { status: normalizedStatus };
  if (revokeSessions) {
    updateData.sessionVersion = { increment: 1 };
  } else {
    updateData.failedLoginAttempts = 0;
    updateData.lockedUntil = null;
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: target.id }, data: updateData });

    await tx.auditLog.create({
      data: {
        userId: actor.id,
        userRole: actor.role,
        moduleName: 'USER_MANAGEMENT',
        transactionId: target.id,
        actionType: normalizedStatus === 'ACTIVE' ? 'USER_ENABLED' : 'USER_DISABLED',
        oldValue: target.status,
        newValue: normalizedStatus,
        remarks: `Account status changed for ${target.email}: ${target.status} -> ${normalizedStatus}`,
      },
    });

    if (revokeSessions) {
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          userRole: actor.role,
          moduleName: 'USER_MANAGEMENT',
          transactionId: target.id,
          actionType: 'USER_SESSIONS_REVOKED',
          remarks: `Sessions revoked for user ${target.email} via sessionVersion increment (status ${normalizedStatus})`,
        },
      });
    }
  });

  revalidatePath('/admin/user-roles');
  return { success: true, status: normalizedStatus };
}
