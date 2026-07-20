import { verifySession } from '@/lib/dal/auth';
import React from 'react';
import { prisma } from '@/lib/prisma';
import ValidationDetailClient from './ValidationDetailClient';
import { requirePermission } from '@/lib/permissions';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getProjectBillings } from '@/app/actions/executiveValidationActions';

export const metadata = {
  title: 'Validation Details | Executive Command Center',
};

export default async function ProjectValidationDetailPage(props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params;
  const cookieStore = await cookies();
  const __session = await verifySession();
  const userId = __session?.id || '';
  await requirePermission(userId, 'PROJECT_MANAGEMENT', 'canView');

  // Fetch project details
  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    select: {
      id: true,
      name: true,
      client: true,
      status: true,
      contractAmount: true,
    }
  });

  if (!project) {
    notFound();
  }

  // Fetch validation score
  const validationScore = await prisma.projectValidationScore.findUnique({
    where: { projectId: params.projectId }
  });

  // Fetch all validation records for this project
  const validationRecords = await prisma.aIValidationRecord.findMany({
    where: { projectId: params.projectId },
    orderBy: { createdAt: 'desc' }
  });

  // Fetch actual Billing records
  const billings = await getProjectBillings(params.projectId);

  return (
    <ValidationDetailClient 
      project={project} 
      validationScore={validationScore} 
      validationRecords={validationRecords}
      billings={billings}
    />
  );
}
