import { POST } from './src/app/api/projects/[id]/scheduling/[scheduleId]/review/start/route';
import { prisma } from './src/lib/prisma';
import { transactionContext } from './src/lib/prisma';

// Mock cookies and authUtils
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue({ value: 'mock-session-id' })
  })
}));

jest.mock('@/lib/dal/auth', () => ({
  verifySession: jest.fn().mockResolvedValue({ id: 'cmrinimix001avchckwzmfxsu' }) // manager's ID
}));

jest.mock('@/lib/permissions', () => ({
  hasPermission: jest.fn().mockResolvedValue(true),
  getPermissionsForRole: jest.fn().mockResolvedValue({
    PROJECT_MANAGEMENT: { canReview: true }
  })
}));

async function main() {
  // Let's not use Jest since we aren't running in a Jest environment. We're running in Node with tsx.
  // We can't easily mock next/headers in a raw node script.
}

main();
