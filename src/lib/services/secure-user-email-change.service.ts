import { PrismaClient } from '@prisma/client';

export interface SecureEmailChangeParams {
  targetUserId: string;
  expectedCurrentEmail: string;
  newEmail: string;
  environment: string;
  reason: string;
  operatorProvenance: string;
  intendedRole?: string;
  dryRun?: boolean;
}

export interface SecureEmailChangeResult {
  success: boolean;
  dryRun: boolean;
  userId: string;
  oldEmailMasked: string;
  newEmailMasked: string;
  tokensRevoked: number;
  sessionInvalidated: boolean;
  auditRecordCreated: boolean;
  error?: string;
}

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 2 ? local.substring(0, 2) + '*'.repeat(local.length - 2) : '*'.repeat(local.length);
  return `${maskedLocal}@${domain}`;
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export class SecureUserEmailChangeService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  async execute(params: SecureEmailChangeParams): Promise<SecureEmailChangeResult> {
    const {
      targetUserId,
      expectedCurrentEmail,
      newEmail,
      environment,
      reason,
      operatorProvenance,
      intendedRole,
      dryRun = true
    } = params;

    const normalizedExpected = normalizeEmail(expectedCurrentEmail);
    const normalizedNew = normalizeEmail(newEmail);

    if (normalizedExpected === normalizedNew) {
      return this.failure('New email must be different from current email.');
    }

    // Wrap in interactive transaction so we can rollback if it's a dry run or if validation fails
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: targetUserId }
        });

        if (!user) {
          throw new Error('Target user not found.');
        }

        if (user.status !== 'ACTIVE') {
          throw new Error('Target account must be ACTIVE.');
        }

        if (!user.email || normalizeEmail(user.email) !== normalizedExpected) {
          throw new Error('Stored current email does not match expected email.');
        }

        if (intendedRole && user.role !== intendedRole) {
          throw new Error(`Role mismatch: expected ${intendedRole}, got ${user.role}.`);
        }

        const duplicateCheck = await tx.user.findUnique({
          where: { email: normalizedNew }
        });

        if (duplicateCheck && duplicateCheck.id !== user.id) {
          throw new Error('New email already belongs to another user.');
        }

        let tokensRevokedCount = 0;
        let sessionInvalidated = false;
        let auditCreated = false;

        if (!dryRun) {
          // 1. Update User Email & Invalidate Sessions
          await tx.user.update({
            where: { id: user.id },
            data: {
              email: normalizedNew,
              sessionVersion: { increment: 1 }
            }
          });
          sessionInvalidated = true;

          // 2. Revoke active recovery tokens
          const now = new Date();
          const revokedResult = await tx.passwordRecoveryToken.updateMany({
            where: {
              userId: user.id,
              consumedAt: null,
              revokedAt: null,
              expiresAt: { gt: now }
            },
            data: { revokedAt: now }
          });
          tokensRevokedCount = revokedResult.count;

          // 3. Create Audit Record
          const remarks = JSON.stringify({
            reason,
            source: operatorProvenance,
            environment,
            sessionInvalidationPerformed: sessionInvalidated,
            tokensRevoked: tokensRevokedCount
          });

          await tx.auditLog.create({
            data: {
              userId: user.id,
              userRole: user.role,
              moduleName: 'SECURITY',
              actionType: 'UAT_USER_EMAIL_CORRECTION',
              oldValue: normalizedExpected,
              newValue: normalizedNew,
              remarks: remarks
            }
          });
          auditCreated = true;
        }

        return {
          success: true,
          dryRun,
          userId: user.id,
          oldEmailMasked: maskEmail(normalizedExpected),
          newEmailMasked: maskEmail(normalizedNew),
          tokensRevoked: tokensRevokedCount,
          sessionInvalidated,
          auditRecordCreated: auditCreated
        };
      });

      return result;
    } catch (error: any) {
      return this.failure(error.message || 'Operation failed');
    }
  }

  private failure(errorMsg: string): SecureEmailChangeResult {
    return {
      success: false,
      dryRun: false,
      userId: '',
      oldEmailMasked: '',
      newEmailMasked: '',
      tokensRevoked: 0,
      sessionInvalidated: false,
      auditRecordCreated: false,
      error: errorMsg
    };
  }
}
