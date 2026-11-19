'use server';

import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { randomUUID } from 'node:crypto';
import { applyProjectRlsSessionVars } from '@/lib/uboq/project-ownership';

export type ProjectCreateResult = { error: string } | { error?: never; projectId: string };

const SUBMISSION_DEDUP_TTL_MS = 60_000;
const recentSubmissions = new Map<string, { createdAt: number; promise: Promise<ProjectCreateResult> }>();

function pruneExpiredSubmissions(now: number) {
  for (const [key, entry] of recentSubmissions.entries()) {
    if (now - entry.createdAt > SUBMISSION_DEDUP_TTL_MS) {
      recentSubmissions.delete(key);
    }
  }
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

  if (name.length < 3 || name.length > 180) return { error: 'Enter a project name (3–180 characters).' };
  if (!['GOVERNMENT', 'CORPORATE', 'PRIVATE'].includes(sector)) {
    return { error: 'Select government, corporate or private sector.' };
  }
  if ([client, location, contractNumber].some(v => v.length > 250) || description.length > 2000) {
    return { error: 'One or more project details exceed the allowed length.' };
  }

  const dedupKey = submissionToken ? `${actor.userId}:${submissionToken}` : null;
  if (dedupKey) {
    const now = Date.now();
    pruneExpiredSubmissions(now);
    const existing = recentSubmissions.get(dedupKey);
    if (existing) {
      return existing.promise;
    }
  }

  // Creating the project never writes BOQ, contract-authority, tax, or cost baselines.
  // Sector is captured here; a tax profile must be explicitly selected at BOQ intake.
  const work = (async (): Promise<ProjectCreateResult> => {
    const projectId = randomUUID();
    await prisma.$transaction(async tx => {
      await applyProjectRlsSessionVars(tx, {
        projectId, userId: actor.userId, sessionVersion: actor.sessionVersion,
      });
      // The bounded command rechecks the DB actor/session/RBAC and creates only
      // this new project + its creator. Runtime PUA write privileges stay denied.
      await tx.$queryRaw`SELECT public.phase9_create_project_profile(
        ${projectId}, ${name}, ${client || null}, ${location || null},
        ${contractNumber || null}, ${sector}, ${description || null})`;
    });
    // No approval, sample project, or synthetic BOQ is created.
    return { projectId };
  })();

  if (dedupKey) {
    recentSubmissions.set(dedupKey, { createdAt: Date.now(), promise: work });
    work.catch(() => {
      recentSubmissions.delete(dedupKey);
    });
  }

  return work;
}
