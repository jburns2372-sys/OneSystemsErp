// @ts-nocheck
import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
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

function validatePasswordPolicy(password: string, emailOrUsername?: string): { valid: boolean; error?: string } {
  if (!password || password.trim().length === 0) {
    return { valid: false, error: 'Password cannot be empty.' };
  }
  if (password.length < 12) {
    return { valid: false, error: 'Password must be at least 12 characters long.' };
  }
  const lowerPass = password.toLowerCase();
  if (['password123', 'admin123', 'jejors2026', 'onesystemserp'].includes(lowerPass)) {
    return { valid: false, error: 'Password cannot be a known default, placeholder, or bypass value.' };
  }
  if (emailOrUsername && lowerPass === emailOrUsername.toLowerCase()) {
    return { valid: false, error: 'Password cannot be equal to the email address or username.' };
  }
  return { valid: true };
}

async function _internalCreateSystemRole(roleName: string) {
  const normalized = roleName.toUpperCase().replace(/\s+/g, '_').trim();
  const existing = await prisma.systemRole.findUnique({
    where: { name: normalized }
  });
  if (!existing) {
    await prisma.systemRole.create({
      data: { name: normalized }
    });
  }

  const existingRbac = await prisma.role.findFirst({
    where: {
      OR: [
        { roleName: normalized },
        { roleCode: normalized }
      ]
    }
  });
  if (!existingRbac) {
    await prisma.role.create({
      data: {
        roleName: normalized,
        roleCode: normalized,
        description: normalized
      }
    });
  }
  return { success: true, name: normalized };
}

router.post('/getSystemRoles', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
    const roles = await prisma.systemRole.findMany({
      orderBy: { name: 'asc' }
    });

    for (const r of roles) {
      const normalized = r.name.toUpperCase().trim();
      const existingRbac = await prisma.role.findFirst({
        where: {
          OR: [
            { roleName: normalized },
            { roleCode: r.name }
          ]
        }
      });
      if (!existingRbac) {
        await prisma.role.create({
          data: {
            roleName: normalized,
            roleCode: r.name,
            description: normalized
          }
        });
      }
    }
    res.json({ success: true, data: roles.map(r => r.name) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to get system roles.' });
  }
});

router.post('/deleteSystemRole', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!assertAdmin(req, res)) return;
    const { roleName } = req.body;
    if (!roleName) {
      return res.status(400).json({ success: false, error: 'roleName is required.' });
    }

    await prisma.systemRole.delete({
      where: { name: roleName }
    });
    
    const rbac = await prisma.role.findFirst({
      where: {
        OR: [
          { roleName },
          { roleCode: roleName }
        ]
      }
    });
    if (rbac) {
      await prisma.role.delete({ where: { id: rbac.id } });
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to delete role.' });
  }
});

router.post('/updateSystemRole', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!assertAdmin(req, res)) return;
    const { oldName, newName } = req.body;
    if (!oldName || !newName) {
      return res.status(400).json({ success: false, error: 'oldName and newName are required.' });
    }

    const normalizedNew = newName.toUpperCase().trim();
    if (!normalizedNew) return res.status(400).json({ success: false, error: 'Role name cannot be empty' });

    const existing = await prisma.systemRole.findUnique({
      where: { name: normalizedNew }
    });
    if (existing) return res.status(409).json({ success: false, error: 'A role with this name already exists' });

    await prisma.systemRole.update({
      where: { name: oldName },
      data: { name: normalizedNew }
    });
    
    const rbac = await prisma.role.findFirst({
      where: {
        OR: [
          { roleName: oldName },
          { roleCode: oldName }
        ]
      }
    });
    if (rbac) {
      await prisma.role.update({
        where: { id: rbac.id },
        data: { roleName: normalizedNew, roleCode: normalizedNew }
      });
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'An error occurred while updating the role.' });
  }
});

router.post('/createSystemRole', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!assertAdmin(req, res)) return;
    const { roleName } = req.body;
    if (!roleName) {
      return res.status(400).json({ success: false, error: 'roleName is required.' });
    }

    const result = await _internalCreateSystemRole(roleName);
    res.json({ success: result.success, name: result.name });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to create role.' });
  }
});

router.post('/createUser', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!assertAdmin(req, res)) return;
    const data = req.body || {};
    const name = (data.name || '').trim();
    const normalizedEmail = (data.email || '').trim().toLowerCase();
    const role = (data.role || '').trim();
    const initialPassword = data.password || '';

    if (!name || !normalizedEmail || !role || !initialPassword) {
      return res.status(400).json({ success: false, error: 'Name, email, role, and initial password are required.' });
    }

    const policy = validatePasswordPolicy(initialPassword, normalizedEmail);
    if (!policy.valid) {
      return res.status(400).json({ success: false, error: policy.error });
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } }
    });

    if (existingUser) {
      return res.status(409).json({ success: false, error: 'A user with this email already exists.' });
    }

    const finalRole = await _internalCreateSystemRole(role);
    if (!finalRole || !finalRole.success) {
      return res.status(500).json({ success: false, error: 'Failed to resolve system role.' });
    }

    if (finalRole.name === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Only a SUPER_ADMIN may assign the SUPER_ADMIN role.' });
    }

    const passwordHash = await bcrypt.hash(initialPassword, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          role: finalRole.name!,
          status: 'ACTIVE',
          passwordHash,
          password: null,
          mustChangePassword: true,
        }
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          userRole: req.user.role,
          moduleName: 'USER_MANAGEMENT',
          actionType: 'USER_CREATED',
          remarks: `Created user ${normalizedEmail} with role ${finalRole.name}`,
        }
      });
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'An unexpected database error occurred.' });
  }
});

router.post('/updateUser', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!assertAdmin(req, res)) return;
    const { id, data } = req.body || {};
    if (!id || !data || !data.name || !data.email || !data.role) {
      return res.status(400).json({ success: false, error: 'User ID, Name, Email, and Role are required.' });
    }

    const normalizedEmail = data.email.trim().toLowerCase();
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Target user not found.' });
    }
    if (targetUser.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Only a SUPER_ADMIN may modify a SUPER_ADMIN account.' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
        id: { not: id }
      }
    });

    if (existingUser) {
      return res.status(409).json({ success: false, error: 'A different user with this email already exists.' });
    }

    const finalRole = await _internalCreateSystemRole(data.role);
    if (!finalRole || !finalRole.success) {
      return res.status(500).json({ success: false, error: 'Failed to resolve system role.' });
    }
    if (finalRole.name === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Only a SUPER_ADMIN may assign the SUPER_ADMIN role.' });
    }

    const updateData: any = {
      name: data.name.trim(),
      email: targetUser.email?.toLowerCase() === normalizedEmail ? targetUser.email : normalizedEmail,
      role: finalRole.name!,
    };

    const hasPasswordOverride = Boolean(data.password && data.password.trim() !== '');
    if (hasPasswordOverride) {
      const policy = validatePasswordPolicy(data.password, normalizedEmail);
      if (!policy.valid) {
        return res.status(400).json({ success: false, error: policy.error });
      }
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
      updateData.password = null;
      updateData.mustChangePassword = true;
      updateData.passwordChangedAt = new Date();
      updateData.sessionVersion = { increment: 1 };
      updateData.failedLoginAttempts = 0;
      updateData.lockedUntil = null;
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: updateData
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          userRole: req.user.role,
          moduleName: 'USER_MANAGEMENT',
          actionType: hasPasswordOverride ? 'PASSWORD_RESET_COMPLETED' : 'USER_UPDATED',
          remarks: hasPasswordOverride
            ? `Admin updated user and reset password for ${normalizedEmail}`
            : `Admin updated user ${normalizedEmail}`,
        }
      });

      if (hasPasswordOverride) {
        await tx.auditLog.create({
          data: {
            userId: req.user.id,
            userRole: req.user.role,
            moduleName: 'USER_MANAGEMENT',
            actionType: 'USER_SESSIONS_REVOKED',
            remarks: `Sessions revoked for user ${normalizedEmail} via sessionVersion increment`,
          }
        });
      }
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'An unexpected database error occurred.' });
  }
});

router.post('/deleteUser', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!assertAdmin(req, res)) return;
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, error: 'User ID is required' });
    if (id === req.user.id) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own active account.' });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ success: false, error: 'User not found.' });
    if (target.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Only a SUPER_ADMIN may delete a SUPER_ADMIN account.' });
    }
    
    await prisma.$transaction(async (tx) => {
      await tx.user.delete({
        where: { id }
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          userRole: req.user.role,
          moduleName: 'USER_MANAGEMENT',
          actionType: 'USER_DELETED',
          remarks: `Deleted user ${target.email}`,
        }
      });
    });
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'An unexpected database error occurred.' });
  }
});

export default router;
