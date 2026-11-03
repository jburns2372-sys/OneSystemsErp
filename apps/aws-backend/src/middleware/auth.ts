import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const ADMIN_GLOBAL_ROLES = new Set(['SUPER_ADMIN', 'SYSTEM_ADMIN']);
const PRIVILEGED_SIMULATION_ROLES = new Set([
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
  'ADMIN',
  'PROJECT_DIRECTOR',
  'DIRECTORS',
]);

export interface AuthenticatedRequest extends Request {
  user?: any;
  pbacContext?: {
    activeProjectId?: string;
    simulatedRole?: string;
  };
}

interface InternalAuthClaims {
  uid: string;
  role: string;
  sv: number;
  pid: string | null;
  sim: string | null;
  iat: number;
  exp: number;
}

function verifyInternalAuthHeader(rawHeader: string | undefined): { valid: true; claims: InternalAuthClaims } | { valid: false; error: string } {
  if (!rawHeader || typeof rawHeader !== 'string') {
    return { valid: false, error: 'Unauthorized: Missing signed x-internal-auth header.' };
  }

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return { valid: false, error: 'Server authentication secret is not configured.' };
  }

  const parts = rawHeader.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') {
    return { valid: false, error: 'Unauthorized: Malformed x-internal-auth token.' };
  }

  const [, encodedPayload, providedHex] = parts;
  const expectedHex = crypto
    .createHmac('sha256', secret)
    .update(`v1.${encodedPayload}`)
    .digest('hex');

  const expectedBuf = Buffer.from(expectedHex, 'utf8');
  const providedBuf = Buffer.from(providedHex, 'utf8');

  if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
    return { valid: false, error: 'Unauthorized: Invalid x-internal-auth signature.' };
  }

  let claims: InternalAuthClaims;
  try {
    claims = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    return { valid: false, error: 'Unauthorized: Invalid x-internal-auth payload.' };
  }

  if (
    !claims ||
    typeof claims.uid !== 'string' ||
    !claims.uid ||
    typeof claims.sv !== 'number' ||
    typeof claims.iat !== 'number' ||
    typeof claims.exp !== 'number'
  ) {
    return { valid: false, error: 'Unauthorized: Incomplete x-internal-auth claims.' };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec > claims.exp || claims.iat > nowSec + 30) {
    return { valid: false, error: 'Unauthorized: Expired x-internal-auth token.' };
  }

  return { valid: true, claims };
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const verification = verifyInternalAuthHeader(req.headers['x-internal-auth'] as string | undefined);
    if (!verification.valid) {
      return res.status(401).json({ error: verification.error });
    }

    const { claims } = verification;

    // Reject if caller attempted to spoof a conflicting x-user-session header
    const callerSessionHeader = req.headers['x-user-session'] as string | undefined;
    if (callerSessionHeader && callerSessionHeader !== claims.uid) {
      return res.status(403).json({ error: 'Forbidden: x-user-session mismatch.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: claims.uid },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'Unauthorized: Account inactive or not found.' });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({ error: 'Forbidden: Account is temporarily locked.' });
    }

    if (user.mustChangePassword) {
      return res.status(403).json({ error: 'PASSWORD_CHANGE_REQUIRED' });
    }

    if (user.sessionVersion !== claims.sv) {
      return res.status(401).json({ error: 'Unauthorized: Session has been revoked.' });
    }

    const canSimulate = PRIVILEGED_SIMULATION_ROLES.has(user.role);
    const callerSimulatedHeader = req.headers['x-simulated-role'] as string | undefined;

    if (!canSimulate && (callerSimulatedHeader || claims.sim || req.body?.simulatedRole)) {
      return res.status(403).json({ error: 'Forbidden: Role simulation is not permitted for this user.' });
    }

    // Overwrite downstream headers with cryptographically verified DB values
    req.headers['x-user-session'] = user.id;
    const verifiedSimRole = canSimulate && claims.sim ? String(claims.sim) : undefined;
    if (verifiedSimRole) {
      req.headers['x-simulated-role'] = verifiedSimRole;
    } else {
      delete req.headers['x-simulated-role'];
    }

    // Sanitize body identity fields if present
    if (req.body && typeof req.body === 'object') {
      if (typeof req.body.sessionId === 'string' && req.body.sessionId && req.body.sessionId !== user.id) {
        return res.status(403).json({ error: 'Forbidden: Body sessionId does not match authenticated user.' });
      }
      if (
        !ADMIN_GLOBAL_ROLES.has(user.role) &&
        user.role !== 'PROJECT_DIRECTOR' &&
        typeof req.body.userId === 'string' &&
        req.body.userId &&
        req.body.userId !== user.id
      ) {
        return res.status(403).json({ error: 'Forbidden: Body userId does not match authenticated user.' });
      }
      if ('sessionId' in req.body) {
        req.body.sessionId = user.id;
      }
      if (!canSimulate && 'simulatedRole' in req.body) {
        delete req.body.simulatedRole;
      }
    }

    // Enforce project-based isolation for non-admin users whenever a target projectId is supplied
    const candidateProjects = new Set<string>();
    const rawProjectSources = [
      claims.pid,
      req.headers['x-active-project-id'] as string | undefined,
      req.body?.projectId,
      req.body?.activeProjectId,
      req.query?.projectId as string | undefined,
    ];
    for (const candidate of rawProjectSources) {
      if (typeof candidate === 'string') {
        const trimmed = candidate.trim();
        if (trimmed && trimmed.toUpperCase() !== 'ALL') {
          candidateProjects.add(trimmed);
        }
      }
    }

    if (candidateProjects.size > 0 && !ADMIN_GLOBAL_ROLES.has(user.role)) {
      const targetIds = Array.from(candidateProjects);
      const assignments = await prisma.projectUserAssignment.findMany({
        where: {
          userId: user.id,
          projectId: { in: targetIds },
          assignmentStatus: 'active',
        },
        select: { projectId: true },
      });

      const assignedIds = new Set(assignments.map((a) => a.projectId));
      const unauthorizedProject = targetIds.find((pid) => !assignedIds.has(pid));
      if (unauthorizedProject) {
        return res.status(403).json({
          error: 'Forbidden: You do not have active assignment access to the requested project.',
        });
      }
    }

    const activeProjectId =
      (req.headers['x-active-project-id'] as string | undefined) || claims.pid || undefined;

    req.user = user;
    req.pbacContext = {
      activeProjectId,
      simulatedRole: verifiedSimRole,
    };

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ error: 'Internal Server Error during authentication' });
  }
};
