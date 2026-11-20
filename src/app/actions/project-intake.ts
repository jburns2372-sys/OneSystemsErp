'use server';

import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { createHmac, randomUUID } from 'node:crypto';
import { applyProjectRlsSessionVars } from '@/lib/uboq/project-ownership';
import {
  buildCanonicalContractIdentityKey,
  evaluateProjectCreationIdentity,
} from '@/lib/uboq/document-ownership-guard';

export type ProjectCreateResult =
  | {
      error: string;
      code?: 'PROJECT_ALREADY_EXISTS';
      existingProjectId?: string | null;
      canOpenExistingProject?: boolean;
    }
  | {
      warning: string;
      code: 'POSSIBLE_EXISTING_PROJECT';
      similarProjectCount: number;
    }
  | { error?: never; warning?: never; projectId: string };

const SUBMISSION_DEDUP_TTL_MS = 60_000;
const recentSubmissions = new Map<string, { createdAt: number; promise: Promise<ProjectCreateResult> }>();

function pruneExpiredSubmissions(now: number) {
  for (const [key, entry] of recentSubmissions.entries()) {
    if (now - entry.createdAt > SUBMISSION_DEDUP_TTL_MS) {
      recentSubmissions.delete(key);
    }
  }
}

/**
 * Derives a server-owned deterministic RFC-4122 UUID bound to the authenticated user and
 * client submissionToken so PostgreSQL's Project_pkey enforces durable idempotency across
 * all serverless function instances (not just one instance's memory).
 */
function deriveServerBoundProjectId(userId: string, submissionToken: string): string {
  const token = submissionToken.trim();
  if (token.length < 16 || typeof createHmac !== 'function') {
    return randomUUID();
  }
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'oserp-p9-idempotency-fallback';
  const digest = createHmac('sha256', secret)
    .update(`phase9-project-create:${userId}:${token}`)
    .digest();
  // Format first 16 bytes as RFC-4122 v5-shaped UUID
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const hex = digest.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function isUniqueConstraintViolation(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; meta?: { code?: string }; message?: string };
  if (e.code === 'P2002' || e.code === '23505' || e.meta?.code === '23505') return true;
  const msg = String(e.message || '');
  return msg.includes('23505') || msg.includes('duplicate key value violates unique constraint');
}

export async function createProjectProfile(formData: FormData): Promise<ProjectCreateResult> {
  const actor = await verifyOperationalSession();
  if (!actor) return { error: 'Please sign in again.' };
  // Enforce the restored DB permission matrix instead of a new hardcoded role list.
  const mayCreate = await prisma.rolePermission.findFirst({
    where: {
      moduleName: 'PROJECT_MANAGEMENT',
      canCreate: true,
      role: { roleCode: actor.role, isActive: true },
    },
    select: { id: true },
  });
  if (!mayCreate) return { error: 'Your role cannot create projects.' };

  const name = String(formData.get('name') ?? '').trim();
  const client = String(formData.get('client') ?? '').trim();
  const location = String(formData.get('location') ?? '').trim();
  const contractNumber = String(formData.get('contractNumber') ?? '').trim();
  const sector = String(formData.get('sector') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const submissionToken = String(formData.get('submissionToken') ?? '').trim();
  const confirmSimilarName = String(formData.get('confirmSimilarName') ?? '').trim().toLowerCase() === 'true';

  if (name.length < 3 || name.length > 180) return { error: 'Enter a project name (3–180 characters).' };
  if (!['GOVERNMENT', 'CORPORATE', 'PRIVATE'].includes(sector)) {
    return { error: 'Select government, corporate or private sector.' };
  }
  if ([client, location, contractNumber].some(v => v.length > 250) || description.length > 2000) {
    return { error: 'One or more project details exceed the allowed length.' };
  }

  const dedupKey = submissionToken.length >= 16 ? `${actor.userId}:${submissionToken}` : null;
  if (dedupKey) {
    const now = Date.now();
    pruneExpiredSubmissions(now);
    const existing = recentSubmissions.get(dedupKey);
    if (existing) {
      return existing.promise;
    }
  }

  const canonicalContractKey = buildCanonicalContractIdentityKey({
    sector,
    client: client || null,
    contractNumber: contractNumber || null,
  });

  // Phase 2 & 3: Project identity uniqueness check (similar names warn, confirmed duplicate contracts hard-block).
  if (typeof prisma.project?.findMany === 'function') {
    const existingProjects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        projectCategory: true,
        client: true,
        contractNumber: true,
        contractAmount: true,
        boqLocked: true,
        managerId: true,
        userAssignments: {
          where: { userId: actor.userId, assignmentStatus: { in: ['active', 'ACTIVE'] } },
          select: { id: true },
          take: 1,
        },
      },
      take: 500,
    });

    const isGlobalReader = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'EXECUTIVE', 'PRESIDENT', 'VP_OPERATIONS'].includes(
      actor.role.toUpperCase()
    );
    const decision = evaluateProjectCreationIdentity(
      { name, sector, client: client || null, contractNumber: contractNumber || null },
      existingProjects.map((p) => ({
        id: p.id,
        name: p.name,
        projectCategory: p.projectCategory,
        client: p.client,
        contractNumber: p.contractNumber,
        contractAmount: p.contractAmount,
        boqLocked: p.boqLocked,
        actorCanAccess: isGlobalReader || p.managerId === actor.userId || p.userAssignments.length > 0,
      }))
    );

    if (decision.decision === 'BLOCK_CONFIRMED_DUPLICATE_CONTRACT') {
      return {
        error: decision.message,
        code: 'PROJECT_ALREADY_EXISTS',
        existingProjectId: decision.existingProjectId,
        canOpenExistingProject: decision.canOpenExistingProject,
      };
    }

    if (decision.decision === 'WARN_SIMILAR_NAME' && !confirmSimilarName) {
      return {
        warning: decision.message,
        code: 'POSSIBLE_EXISTING_PROJECT',
        similarProjectCount: decision.similarProjectCount,
      };
    }
  }

  // Creating the project never writes BOQ, contract-authority, tax, or cost baselines.
  // Sector is captured here; a tax profile must be explicitly selected at BOQ intake.
  const projectId = submissionToken.length >= 16
    ? deriveServerBoundProjectId(actor.userId, submissionToken)
    : randomUUID();

  const work = (async (): Promise<ProjectCreateResult> => {
    try {
      await prisma.$transaction(async tx => {
        await applyProjectRlsSessionVars(tx, {
          projectId, userId: actor.userId, sessionVersion: actor.sessionVersion,
        });
        // Phase 3 Case E: Transaction-scoped advisory lock serializes concurrent creations of the same verified contract identity.
        if (canonicalContractKey && typeof tx.$executeRaw === 'function') {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${canonicalContractKey}))`;
        }
        // The bounded command rechecks the DB actor/session/RBAC and creates only
        // this new project + its creator. Runtime PUA write privileges stay denied.
        await tx.$queryRaw`SELECT public.phase9_create_project_profile(
          ${projectId}, ${name}, ${client || null}, ${location || null},
          ${contractNumber || null}, ${sector}, ${description || null})`;
      });
      // No approval, sample project, or synthetic BOQ is created.
      return { projectId };
    } catch (err) {
      // Durable cross-instance idempotency: if another serverless instance already committed
      // this exact server-derived projectId for the same authenticated creator, replay it
      // ONLY after verifying this actor owns an active creator assignment on that project.
      if (dedupKey && isUniqueConstraintViolation(err) && typeof prisma.project?.findFirst === 'function') {
        const owned = await prisma.project.findFirst({
          where: {
            id: projectId,
            userAssignments: {
              some: {
                userId: actor.userId,
                assignmentStatus: { in: ['active', 'ACTIVE'] },
              },
            },
          },
          select: { id: true },
        });
        if (owned) {
          return { projectId: owned.id };
        }
      }
      throw err;
    }
  })();

  if (dedupKey) {
    recentSubmissions.set(dedupKey, { createdAt: Date.now(), promise: work });
    work.catch(() => {
      recentSubmissions.delete(dedupKey);
    });
  }

  return work;
}
