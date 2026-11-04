'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { assertProjectGraphOwnership } from '@/lib/uboq/project-ownership';
import { redactUboqPayloadForRole } from '@/lib/uboq/security/redact-payload';
import {
  approveOperationalSnapshotAndPrrs,
  ingestAndStageProjectUboqPackage,
} from '@/lib/uboq/adapters/snapshot-orchestrator';
import { allocateVerifiedOpeningStockAtomically } from '@/lib/uboq/resource-ledger';
import type { UboqSectorType } from '@prisma/client';

export async function getProjectUboqDashboardAction(projectId: string) {
  const actor = await verifyOperationalSession();
  if (!actor) {
    throw new Error('UBOQ_UNAUTHORIZED: Active operational session required');
  }

  await assertProjectGraphOwnership(prisma, {
    userId: actor.userId,
    userRole: actor.role,
    projectId,
  });

  const [project, contract, snapshots, phaseLines, consolidatedGroups, resourceAccounts, exceptions, templates] =
    await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, name: true, contractNumber: true, contractAmount: true, uboqGovernanceEnabled: true },
      }),
      prisma.uboqContractAuthority.findFirst({
        where: { projectId },
        include: { taxProfile: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.uboqOperationalSnapshot.findMany({
        where: { projectId },
        orderBy: { versionNumber: 'desc' },
      }),
      prisma.uboqAwardedPhaseLine.findMany({
        where: { projectId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.uboqConsolidationGroup.findMany({
        where: { projectId },
        orderBy: { groupCode: 'asc' },
      }),
      prisma.uboqCanonicalResourceAccount.findMany({
        where: { projectId },
        include: { activeApprovedPr: true, stockLots: true },
        orderBy: { resourceCode: 'asc' },
      }),
      prisma.uboqValidationException.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.uboqTemplateDefinition.findMany({
        where: { OR: [{ projectId }, { projectId: null }] },
        orderBy: { templateCode: 'asc' },
      }),
    ]);

  return redactUboqPayloadForRole(
    {
      project,
      contract,
      snapshots,
      phaseLines,
      consolidatedGroups,
      resourceAccounts,
      exceptions,
      templates,
    },
    actor.role
  );
}

export async function ingestProjectUboqDocumentAction(formData: FormData) {
  const actor = await verifyOperationalSession();
  if (!actor) {
    throw new Error('UBOQ_UNAUTHORIZED: Active operational session required');
  }

  const projectId = String(formData.get('projectId') || '');
  await assertProjectGraphOwnership(prisma, {
    userId: actor.userId,
    userRole: actor.role,
    projectId,
  });

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) {
    throw new Error('UBOQ_EMPTY_UPLOAD: Valid document file is required');
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const sectorType = (String(formData.get('sectorType') || 'CORPORATE') as UboqSectorType);
  const taxProfileCode = String(formData.get('taxProfileCode') || 'CORP_PH_VAT_EXCL_12');
  const documentRole = String(formData.get('documentRole') || 'CONTRACT_BOQ');

  const res = await ingestAndStageProjectUboqPackage(prisma as any, {
    projectId,
    uploadedByUserId: actor.userId,
    fileName: file.name,
    buffer,
    documentRole,
    sectorType,
    taxProfileCode,
  });

  revalidatePath(`/projects/${projectId}/uboq`);
  revalidatePath(`/projects/${projectId}`);
  return redactUboqPayloadForRole(res, actor.role);
}

export async function approveUboqSnapshotAction(projectId: string, snapshotId: string) {
  const actor = await verifyOperationalSession();
  if (!actor) {
    throw new Error('UBOQ_UNAUTHORIZED: Active operational session required');
  }

  await assertProjectGraphOwnership(prisma, {
    userId: actor.userId,
    userRole: actor.role,
    projectId,
  });

  const snap = await prisma.uboqOperationalSnapshot.findUnique({
    where: { id: snapshotId },
    select: { id: true, projectId: true },
  });
  if (!snap || snap.projectId !== projectId) {
    throw new Error('UBOQ_CROSS_PROJECT_SPOOFING_BLOCKED: Snapshot does not belong to project');
  }

  const res = await approveOperationalSnapshotAndPrrs(prisma as any, {
    snapshotId,
    approverUserId: actor.userId,
  });

  revalidatePath(`/projects/${projectId}/uboq`);
  revalidatePath(`/projects/${projectId}`);
  return redactUboqPayloadForRole(res, actor.role);
}

export async function allocateUboqOpeningStockAction(input: {
  projectId: string;
  canonicalResourceId: string;
  warehouseLocationId: string;
  lotNumber: string;
  inspectionRef: string;
  conditionCode: string;
  verifiedQty: number;
  unitCost: number;
  resourceUnit: string;
}) {
  const actor = await verifyOperationalSession();
  if (!actor) {
    throw new Error('UBOQ_UNAUTHORIZED: Active operational session required');
  }

  await assertProjectGraphOwnership(prisma, {
    userId: actor.userId,
    userRole: actor.role,
    projectId: input.projectId,
    canonicalResourceIds: [input.canonicalResourceId],
  });

  const res = await allocateVerifiedOpeningStockAtomically(prisma as any, {
    projectId: input.projectId,
    canonicalResourceId: input.canonicalResourceId,
    warehouseLocationId: input.warehouseLocationId,
    lotNumber: input.lotNumber,
    inspectionRef: input.inspectionRef,
    conditionCode: input.conditionCode,
    verifiedQty: input.verifiedQty,
    allocatedQty: input.verifiedQty,
    unitCost: input.unitCost,
    resourceUnit: input.resourceUnit,
    verifiedByUserId: actor.userId,
  });

  revalidatePath(`/projects/${input.projectId}/uboq`);
  return redactUboqPayloadForRole(res, actor.role);
}
