// @ts-nocheck
import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

const ADMIN_USER_ROLES = new Set(['SUPER_ADMIN', 'SYSTEM_ADMIN', 'PROJECT_DIRECTOR']);

function assertAdmin(req: AuthenticatedRequest, res: Response): boolean {
  if (!req.user?.id) {
    res.status(401).json({ success: false, error: 'Unauthorized: Active session required.' });
    return false;
  }
  if (!ADMIN_USER_ROLES.has(req.user.role)) {
    res.status(403).json({ success: false, error: 'Forbidden: Verified administrative authority required.' });
    return false;
  }
  return true;
}

router.post('/getUsersWithRoles', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!assertAdmin(req, res)) return;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          include: { role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const roles = await prisma.role.findMany({ orderBy: { roleName: 'asc' } });
    
    res.json({ success: true, users, roles });
  } catch (e: any) {
    console.error('Error fetching users with roles:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/assignRoleToUser', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!assertAdmin(req, res)) return;
    const { userId, roleId } = req.body || {};
    if (!userId || !roleId) {
      return res.status(400).json({ success: false, error: 'userId and roleId are required.' });
    }

    const roleRecord = await prisma.role.findUnique({ where: { id: roleId } });
    if (roleRecord && (roleRecord.roleCode === 'SUPER_ADMIN' || roleRecord.roleName === 'SUPER_ADMIN') && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Only a SUPER_ADMIN may assign SUPER_ADMIN.' });
    }

    const existing = await prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } }
    });

    if (!existing) {
      await prisma.userRole.create({
        data: { userId, roleId }
      });
    }
    
    res.json({ success: true });
  } catch (e: any) {
    console.error('Error assigning role to user:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/removeRoleFromUser', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!assertAdmin(req, res)) return;
    const { userId, roleId } = req.body || {};
    if (!userId || !roleId) {
      return res.status(400).json({ success: false, error: 'userId and roleId are required.' });
    }

    await prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } }
    });
    
    res.json({ success: true });
  } catch (e: any) {
    if (e.code === 'P2025') {
       return res.json({ success: true });
    }
    console.error('Error removing role from user:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

const ALLOWED_ACCOUNT_STATUSES = new Set(['ACTIVE', 'INACTIVE', 'LOCKED']);

/**
 * Enable / disable / lock a user account.
 * - Requires verified administrative authority (signed internal auth + ADMIN_USER_ROLES).
 * - Only a SUPER_ADMIN may change the status of a SUPER_ADMIN account.
 * - Administrators cannot change their own account status.
 * - Any transition away from ACTIVE revokes existing sessions (sessionVersion increment).
 * - Reactivation clears lockout counters so the account can authenticate normally.
 * - Writes SECURITY-relevant USER_MANAGEMENT audit records in the same transaction.
 */
router.post('/updateUserStatus', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!assertAdmin(req, res)) return;
    const { userId, status } = req.body || {};
    const normalizedStatus = typeof status === 'string' ? status.trim().toUpperCase() : '';

    if (!userId || typeof userId !== 'string' || !normalizedStatus) {
      return res.status(400).json({ success: false, error: 'userId and status are required.' });
    }
    if (!ALLOWED_ACCOUNT_STATUSES.has(normalizedStatus)) {
      return res.status(400).json({ success: false, error: 'Unsupported account status.' });
    }
    if (userId === req.user.id) {
      return res.status(400).json({ success: false, error: 'You cannot change the status of your own account.' });
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, status: true },
    });
    if (!target) {
      return res.status(404).json({ success: false, error: 'Target user not found.' });
    }
    if (target.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Only a SUPER_ADMIN may change the status of a SUPER_ADMIN account.' });
    }

    if (target.status === normalizedStatus) {
      return res.json({ success: true, status: normalizedStatus, unchanged: true });
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
          userId: req.user.id,
          userRole: req.user.role,
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
            userId: req.user.id,
            userRole: req.user.role,
            moduleName: 'USER_MANAGEMENT',
            transactionId: target.id,
            actionType: 'USER_SESSIONS_REVOKED',
            remarks: `Sessions revoked for user ${target.email} via sessionVersion increment (status ${normalizedStatus})`,
          },
        });
      }
    });

    res.json({ success: true, status: normalizedStatus });
  } catch (e: any) {
    console.error('Error updating user status:', e);
    res.status(500).json({ success: false, error: 'Failed to update user status.' });
  }
});

export default router;
