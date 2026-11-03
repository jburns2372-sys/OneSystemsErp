// @ts-nocheck
import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

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

router.post('/updateProfile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authenticatedUserId = req.user?.id;
    if (!authenticatedUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Active session required.' });
    }

    const { userId, name, email, currentPassword, password, confirmPassword } = req.body || {};

    // Never trust client-supplied userId as proof of identity
    if (userId && userId !== authenticatedUserId) {
      return res.status(403).json({ success: false, error: 'Forbidden: Cannot modify another user profile.' });
    }

    const trimmedName = (name || '').trim();
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!trimmedName || !normalizedEmail) {
      return res.status(400).json({ success: false, error: 'Name and email are required.' });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: authenticatedUserId } });
    if (!dbUser || dbUser.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, error: 'Account not found or inactive.' });
    }

    const conflict = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
        id: { not: dbUser.id },
      },
      select: { id: true },
    });
    if (conflict) {
      return res.status(409).json({ success: false, error: 'Email is already in use by another account.' });
    }

    const wantsPasswordChange = Boolean(password || confirmPassword);

    if (wantsPasswordChange) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, error: 'Current password is required to change your password.' });
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, dbUser.passwordHash || '');
      if (!isCurrentValid) {
        return res.status(403).json({ success: false, error: 'Current password is incorrect.' });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ success: false, error: 'Passwords do not match.' });
      }

      const policy = validatePasswordPolicy(password, normalizedEmail);
      if (!policy.valid) {
        return res.status(400).json({ success: false, error: policy.error });
      }

      const isSameAsOld = await bcrypt.compare(password, dbUser.passwordHash || '');
      if (isSameAsOld) {
        return res.status(400).json({ success: false, error: 'New password cannot be the same as the current password.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const now = new Date();

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: dbUser.id },
          data: {
            name: trimmedName,
            email: dbUser.email?.toLowerCase() === normalizedEmail ? dbUser.email : normalizedEmail,
            passwordHash,
            password: null,
            mustChangePassword: false,
            passwordChangedAt: now,
            sessionVersion: { increment: 1 },
          },
        });

        await tx.auditLog.create({
          data: {
            userId: dbUser.id,
            userRole: dbUser.role,
            moduleName: 'SECURITY',
            actionType: 'PASSWORD_CHANGED',
            remarks: 'User updated personal password via backend profile route.',
          },
        });

        await tx.auditLog.create({
          data: {
            userId: dbUser.id,
            userRole: dbUser.role,
            moduleName: 'SECURITY',
            actionType: 'USER_SESSIONS_REVOKED',
            remarks: 'All existing sessions revoked via sessionVersion increment.',
          },
        });
      });

      return res.json({ success: true, passwordChanged: true, message: 'Password updated successfully!' });
    }

    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        name: trimmedName,
        email: dbUser.email?.toLowerCase() === normalizedEmail ? dbUser.email : normalizedEmail,
      },
    });

    res.json({ success: true, passwordChanged: false, message: 'Profile updated successfully!' });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Email is already in use by another account.' });
    }
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, error: 'An error occurred while updating the profile.' });
  }
});

export default router;
