'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal/auth';
import { validatePasswordPolicy } from '@/lib/passwordPolicy';

export async function updateProfile(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  message?: string;
  passwordChanged?: boolean;
}> {
  const actorSession = await verifySession();
  if (!actorSession?.id) {
    return { success: false, error: 'Unauthorized: Active session required.' };
  }

  const name = ((formData.get('name') as string) || '').trim();
  const emailRaw = ((formData.get('email') as string) || '').trim();
  const currentPassword = (formData.get('currentPassword') as string) || '';
  const password = (formData.get('password') as string) || '';
  const confirmPassword = (formData.get('confirmPassword') as string) || '';

  if (!name || !emailRaw) {
    return { success: false, error: 'Name and email are required.' };
  }

  const normalizedEmail = emailRaw.toLowerCase();

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: actorSession.id },
    });

    if (!dbUser || dbUser.status !== 'ACTIVE') {
      return { success: false, error: 'Account not found or inactive.' };
    }

    const emailConflict = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
        id: { not: dbUser.id },
      },
      select: { id: true },
    });

    if (emailConflict) {
      return { success: false, error: 'Email is already in use by another account.' };
    }

    const wantsPasswordChange = password.length > 0 || confirmPassword.length > 0;

    if (wantsPasswordChange) {
      if (!currentPassword) {
        return { success: false, error: 'Current password is required to change your password.' };
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, dbUser.passwordHash || '');
      if (!isCurrentValid) {
        return { success: false, error: 'Current password is incorrect.' };
      }

      if (password !== confirmPassword) {
        return { success: false, error: 'New password and confirmation do not match.' };
      }

      const policyResult = validatePasswordPolicy(password, normalizedEmail);
      if (!policyResult.valid) {
        return { success: false, error: policyResult.error };
      }

      const isSameAsOld = await bcrypt.compare(password, dbUser.passwordHash || '');
      if (isSameAsOld) {
        return { success: false, error: 'New password cannot be the same as the current password.' };
      }

      const newPasswordHash = await bcrypt.hash(password, 10);
      const now = new Date();

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: dbUser.id },
          data: {
            name,
            email: dbUser.email?.toLowerCase() === normalizedEmail ? dbUser.email : normalizedEmail,
            passwordHash: newPasswordHash,
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
            remarks: 'User updated personal password via My Profile.',
          },
        });

        await tx.auditLog.create({
          data: {
            userId: dbUser.id,
            userRole: dbUser.role,
            moduleName: 'SECURITY',
            actionType: 'USER_SESSIONS_REVOKED',
            remarks: 'All existing sessions revoked via sessionVersion increment after profile password change.',
          },
        });
      });

      // Revoke any active recovery tokens if the recovery schema migration is present
      await prisma.passwordRecoveryToken
        .updateMany({
          where: {
            userId: dbUser.id,
            consumedAt: null,
            revokedAt: null,
          },
          data: { revokedAt: now },
        })
        .catch((err: any) => {
          if (err?.code !== 'P2021') {
            console.warn('Warning revoking open recovery tokens after profile password change:', err);
          }
        });

      revalidatePath('/profile');
      try {
        const cookieStore = await cookies();
        cookieStore.delete('authjs.session-token');
        cookieStore.delete('__Secure-authjs.session-token');
        cookieStore.delete('next-auth.session-token');
        cookieStore.delete('__Secure-next-auth.session-token');
      } catch {
        // Safe no-op when invoked outside an HTTP request scope (e.g., isolated CLI verification)
      }
      return {
        success: true,
        passwordChanged: true,
        message: 'Password updated successfully. Please sign in again.',
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: dbUser.id },
        data: {
          name,
          email: dbUser.email?.toLowerCase() === normalizedEmail ? dbUser.email : normalizedEmail,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: dbUser.id,
          userRole: dbUser.role,
          moduleName: 'USER_MANAGEMENT',
          actionType: 'PROFILE_UPDATED',
          remarks: 'User updated personal profile details.',
        },
      });
    });

    revalidatePath('/profile');
    revalidatePath('/');
    return {
      success: true,
      passwordChanged: false,
      message: 'Profile updated successfully.',
    };
  } catch (error: any) {
    console.error('Profile update error:', error);
    return {
      success: false,
      error: 'Failed to update profile.',
    };
  }
}
