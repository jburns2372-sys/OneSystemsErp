'use server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import { PasswordRecoveryMailer } from '@/lib/services/PasswordRecoveryMailer';
import { validatePasswordPolicy } from '@/lib/passwordPolicy';

// Rate limits: 5 attempts per 15 minutes
const RATE_LIMIT_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export async function requestPasswordReset(email: string) {
  // Normalize email
  const normalizedEmail = (email || '').toLowerCase().trim();
  
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || '127.0.0.1';
  const userAgent = headersList.get('user-agent') || 'unknown';

  // Create privacy-preserving identifiers
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
  const uaHash = crypto.createHash('sha256').update(userAgent).digest('hex');
  const identifierHash = crypto.createHash('sha256').update(`${ipHash}:${normalizedEmail}`).digest('hex');

  const genericResponse = { success: true, message: 'If an eligible account exists, password-recovery instructions have been sent.' };

  if (!normalizedEmail) {
    return genericResponse;
  }

  try {
    // 1. Rate Limiting Check
    const rateLimit = await prisma.passwordRecoveryRateLimit.findFirst({
      where: { identifierHash }
    });

    const now = new Date();
    if (rateLimit) {
      if (rateLimit.blockedUntil && rateLimit.blockedUntil > now) {
        // Still blocked
        return genericResponse;
      }
      
      const timeSinceLast = now.getTime() - rateLimit.lastAttemptAt.getTime();
      if (timeSinceLast > RATE_LIMIT_WINDOW_MS) {
        // Reset window
        await prisma.passwordRecoveryRateLimit.update({
          where: { id: rateLimit.id },
          data: { attempts: 1, lastAttemptAt: now, blockedUntil: null }
        });
      } else {
        const newAttempts = rateLimit.attempts + 1;
        let blockedUntil = null;
        if (newAttempts >= RATE_LIMIT_ATTEMPTS) {
          blockedUntil = new Date(now.getTime() + RATE_LIMIT_WINDOW_MS);
        }
        await prisma.passwordRecoveryRateLimit.update({
          where: { id: rateLimit.id },
          data: { attempts: newAttempts, lastAttemptAt: now, blockedUntil }
        });
        
        if (newAttempts > RATE_LIMIT_ATTEMPTS) {
           return genericResponse;
        }
      }
    } else {
      await prisma.passwordRecoveryRateLimit.create({
        data: {
          identifierHash,
          attempts: 1,
          lastAttemptAt: now
        }
      });
    }

    // 2. Fetch User (case-insensitive to match login lookup in src/auth.ts)
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' }
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      return genericResponse;
    }

    // 3. Verify Email Delivery is Configured
    if (!PasswordRecoveryMailer.isConfigured()) {
      await prisma.auditLog.create({
         data: {
             userId: user.id,
             userRole: user.role,
             moduleName: 'SECURITY',
             actionType: 'PASSWORD_RECOVERY_EMAIL_CONFIGURATION_MISSING',
             remarks: 'Failed to generate token because email provider is not configured.',
         }
      });
      // Never expose account existence through provider configuration status.
      return genericResponse;
    }

    // 4. Revoke existing tokens
    await prisma.passwordRecoveryToken.updateMany({
      where: { userId: user.id, purpose: 'PASSWORD_RESET', consumedAt: null, revokedAt: null },
      data: { revokedAt: now }
    });

    // 5. Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 mins expiry

    const createdToken = await prisma.passwordRecoveryToken.create({
      data: {
        userId: user.id,
        tokenHash,
        purpose: 'PASSWORD_RESET',
        expiresAt,
        requestedIpHash: ipHash,
        requestedUserAgentHash: uaHash
      }
    });

    // 6. Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userRole: user.role,
        moduleName: 'SECURITY',
        actionType: 'PASSWORD_RECOVERY_REQUESTED',
        remarks: `Password recovery requested for ${normalizedEmail}`
      }
    });

    // 7. Send Email
    const delivered = await PasswordRecoveryMailer.sendResetLink(user.email || normalizedEmail, token);
    if (!delivered) {
      await prisma.passwordRecoveryToken.update({
        where: { id: createdToken.id },
        data: { revokedAt: new Date() }
      });
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userRole: user.role,
          moduleName: 'SECURITY',
          actionType: 'PASSWORD_RECOVERY_EMAIL_DISPATCH_FAILED',
          remarks: `Failed to dispatch password recovery email for ${normalizedEmail}; token revoked.`
        }
      });
    }

    return genericResponse;

  } catch (error: any) {
    if (error?.code === 'P2021') {
      console.error('Password recovery schema tables missing (pending migration):', error.meta || error.message);
      return {
        success: false,
        code: 'SUPER_ADMIN_RECOVERY_SCHEMA_MIGRATION_REQUIRED',
        error: 'Password recovery service is unavailable until pending database migrations are applied.',
      };
    }
    console.error('PASSWORD_RECOVERY_REQUEST_FAILED', { code: error?.code || 'UNKNOWN' });
    return genericResponse; // fail closed
  }
}

export async function executePasswordReset(token: string, newPasswordRaw: string) {
  try {
    if (!token || typeof token !== 'string') {
      return { success: false, error: 'Invalid or expired token.' };
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();

    // 1. Transactional reset
    return await prisma.$transaction(async (tx) => {
      // Find token and lock
      const recoveryToken = await tx.passwordRecoveryToken.findUnique({
        where: { tokenHash }
      });

      if (!recoveryToken) {
        return { success: false, error: 'Invalid or expired token.' };
      }

      if (recoveryToken.purpose !== 'PASSWORD_RESET') {
        return { success: false, error: 'Invalid token purpose.' };
      }

      if (recoveryToken.expiresAt < now) {
        return { success: false, error: 'Token has expired.' };
      }

      if (recoveryToken.consumedAt || recoveryToken.revokedAt) {
        return { success: false, error: 'Token is already consumed or revoked.' };
      }

      const user = await tx.user.findUnique({
        where: { id: recoveryToken.userId }
      });

      if (!user || user.status !== 'ACTIVE') {
        return { success: false, error: 'Account is not active.' };
      }

      // Validate Policy
      const policyResult = validatePasswordPolicy(newPasswordRaw, user.email || '');
      if (!policyResult.valid) {
        return { success: false, error: policyResult.error };
      }

      const newPasswordHash = await bcrypt.hash(newPasswordRaw, 10);

      // Update User
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          password: null, // ensure plain text password is gone
          passwordChangedAt: now,
          mustChangePassword: false,
          sessionVersion: { increment: 1 },
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      });

      // Consume Token (atomic check that consumedAt is still null)
      const consumed = await tx.passwordRecoveryToken.updateMany({
        where: { id: recoveryToken.id, consumedAt: null, revokedAt: null },
        data: { consumedAt: now }
      });
      if (consumed.count !== 1) {
        throw new Error('TOKEN_ALREADY_CONSUMED');
      }

      // Revoke other active tokens
      await tx.passwordRecoveryToken.updateMany({
        where: {
          userId: user.id,
          id: { not: recoveryToken.id },
          consumedAt: null,
          revokedAt: null
        },
        data: { revokedAt: now }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userRole: user.role,
          moduleName: 'SECURITY',
          actionType: 'PASSWORD_RECOVERY_COMPLETED',
          remarks: `Password recovery completed using secure token for ${user.email}`
        }
      });

      return { success: true };
    });
  } catch (error: any) {
    if (error instanceof Error && error.message === 'TOKEN_ALREADY_CONSUMED') {
      return { success: false, error: 'Token is already consumed or revoked.' };
    }
    if (error?.code === 'P2021') {
      return {
        success: false,
        code: 'SUPER_ADMIN_RECOVERY_SCHEMA_MIGRATION_REQUIRED',
        error: 'Password recovery service is unavailable until pending database migrations are applied.',
      };
    }
    console.error('PASSWORD_RECOVERY_RESET_FAILED', { code: error?.code || 'UNKNOWN' });
    return { success: false, error: 'An error occurred during password reset.' };
  }
}
