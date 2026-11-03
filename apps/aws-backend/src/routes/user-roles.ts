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

export default router;
