'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';

const PROJECT_CREATORS = new Set([
  'SUPER_ADMIN', 'SYSTEM_ADMIN', 'ADMIN', 'PROJECT_DIRECTOR',
  'DIRECTORS', 'PROJECT_MANAGER',
]);

export type ProjectCreateResult = { error: string } | { error?: never; projectId: string };

export async function createProjectProfile(formData: FormData): Promise<ProjectCreateResult> {
  const actor = await verifyOperationalSession();
  if (!actor) return { error: 'Please sign in again.' };
  if (!PROJECT_CREATORS.has(actor.role)) return { error: 'Your role cannot create projects.' };

  const name = String(formData.get('name') ?? '').trim();
  const client = String(formData.get('client') ?? '').trim();
  const location = String(formData.get('location') ?? '').trim();
  const contractNumber = String(formData.get('contractNumber') ?? '').trim();
  const sector = String(formData.get('sector') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();

  if (name.length < 3 || name.length > 180) return { error: 'Enter a project name (3–180 characters).' };
  if (!['GOVERNMENT', 'CORPORATE', 'PRIVATE'].includes(sector)) {
    return { error: 'Select government, corporate or private sector.' };
  }
  if ([client, location, contractNumber].some(v => v.length > 250) || description.length > 2000) {
    return { error: 'One or more project details exceed the allowed length.' };
  }

  // Creating the project never writes BOQ, contract-authority, tax, or cost baselines.
  // Sector is captured here; a tax profile must be explicitly selected at BOQ intake.
  const project = await prisma.project.create({
    data: {
      name,
      client: client || null,
      location: location || null,
      contractNumber: contractNumber || null,
      projectCategory: sector,
      description: description || null,
      status: 'PLANNING',
      contractAmount: 0,
      uboqGovernanceEnabled: false,
    },
    select: { id: true },
  });

  // No approval, sample project, or synthetic BOQ is created.
  return { projectId: project.id };
}
