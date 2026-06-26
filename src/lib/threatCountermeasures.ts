import { prisma } from '@/lib/prisma';

export async function executeCountermeasure(threatType: string, userId: string | null, ipAddress: string | null) {
  if (!userId) return;

  try {
    switch (threatType) {
      case 'PROMPT_INJECTION_ATTEMPT':
        // Action: Temporarily lock user's AI access or alert SOC
        await prisma.user.update({
          where: { id: userId },
          data: { status: 'REVIEW_REQUIRED' }
        });
        break;

      case 'CROSS_PROJECT_ACCESS_ATTEMPT':
        // Action: Revoke active session (requires session model enforcement)
        await prisma.userSession.updateMany({
          where: { userId, status: 'ACTIVE' },
          data: { status: 'REVOKED', revokedAt: new Date(), revokedBy: 'SYSTEM_COUNTERMEASURE' }
        });
        break;

      case 'GUEST_WRITE_ATTEMPT':
        // Action: Log and ignore, no drastic countermeasure needed for guests
        break;

      default:
        console.log(`No automated countermeasure defined for ${threatType}`);
    }
  } catch (error) {
    console.error('Failed to execute countermeasure:', error);
  }
}
