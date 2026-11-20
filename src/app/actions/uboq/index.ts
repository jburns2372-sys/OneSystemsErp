'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { assertProjectGraphOwnership, withUboqRlsContext } from '@/lib/uboq/project-ownership';
import { assertUboqStageAuthorization } from '@/lib/uboq/security/stage-rbac';
import { redactUboqPayloadForRole } from '@/lib/uboq/security/redact-payload';
import { populateWorkspaceAwardedBoqFromVerifiedDocument } from '@/lib/uboq/adapters/workspace-boq-bridge';
import {
  approveOperationalSnapshotAndPrrs,
  ingestAndStageProjectUboqPackage,
  regenerateDraftSnapshotFromVerifiedDocument,
  resolveExtractionCandidateHumanReview,
  resolveUboqValidationException,
  type ResourceTakeoffSpecInput,
} from '@/lib/uboq/adapters/snapshot-orchestrator';
import { validateVisualColumnMapping } from '@/lib/uboq/visual-mapping';
import { allocateVerifiedOpeningStockAtomically } from '@/lib/uboq/resource-ledger';
import {
  syncUboqScheduleActivityLinks,
  tryAutoSyncProjectScheduleLinks,
} from '@/lib/uboq/adapters/schedule-link-adapter';
import type { UboqSectorType } from '@prisma/client';

export async function getProjectUboqDashboardAction(projectId: string) {
  const actor = await verifyOperationalSession();
  if (!actor) {
    throw new Error('UBOQ_UNAUTHORIZED: Active operational session required');
  }

  return withUboqRlsContext(
    { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId },
    async () => {
      await assertUboqStageAuthorization(prisma, {
        userId: actor.userId,
        projectId,
        capability: 'UBOQ_VIEW',
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
  );
}

export async function ingestProjectUboqDocumentAction(formData: FormData) {
  const actor = await verifyOperationalSession();
  if (!actor) {
    throw new Error('UBOQ_UNAUTHORIZED: Active operational session required');
  }

  const projectId = String(formData.get('projectId') || '');
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) {
    throw new Error('UBOQ_EMPTY_UPLOAD: Valid document file is required');
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const sectorType = String(formData.get('sectorType') || 'CORPORATE') as UboqSectorType;
  const taxProfileCode = String(formData.get('taxProfileCode') || 'CORP_PH_VAT_EXCL_12');
  const documentRole = String(formData.get('documentRole') || 'CONTRACT_BOQ');
  const allowDuplicateNewRevision = String(formData.get('allowDuplicateNewRevision') || '') === 'true';

  const res = await withUboqRlsContext(
    { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId },
    async () => {
      await assertUboqStageAuthorization(prisma, {
        userId: actor.userId,
        projectId,
        capability: 'UBOQ_INTAKE_STAGE',
      });
      return ingestAndStageProjectUboqPackage(prisma as never, {
        projectId,
        uploadedByUserId: actor.userId,
        fileName: file.name,
        buffer,
        documentRole,
        sectorType,
        taxProfileCode,
        allowDuplicateNewRevision,
      });
    }
  );

  revalidatePath(`/projects/${projectId}/uboq`);
  revalidatePath(`/projects/${projectId}`);
  return redactUboqPayloadForRole(res, actor.role);
}

export async function resolveUboqExtractionCandidateAction(input: {
  projectId: string;
  candidateId: string;
  decision: 'HUMAN_VERIFIED' | 'HUMAN_EXCLUDED';
  reviewNotes: string;
  canonicalFieldRemap?: Record<string, string>;
  correctedMappedFields?: Record<string, string | number | null>;
}) {
  const actor = await verifyOperationalSession();
  if (!actor) {
    throw new Error('UBOQ_UNAUTHORIZED: Active operational session required');
  }

  const res = await withUboqRlsContext(
    { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId: input.projectId },
    async () =>
      resolveExtractionCandidateHumanReview(prisma as never, {
        projectId: input.projectId,
        candidateId: input.candidateId,
        reviewerUserId: actor.userId,
        decision: input.decision,
        reviewNotes: input.reviewNotes,
        canonicalFieldRemap: input.canonicalFieldRemap,
        correctedMappedFields: input.correctedMappedFields,
      })
  );

  revalidatePath(`/projects/${input.projectId}/uboq`);
  return redactUboqPayloadForRole(res, actor.role);
}

export async function resolveUboqValidationExceptionAction(input: {
  projectId: string;
  exceptionId: string;
  resolutionNote: string;
}) {
  const actor = await verifyOperationalSession();
  if (!actor) {
    throw new Error('UBOQ_UNAUTHORIZED: Active operational session required');
  }
  if (!input.projectId?.trim() || !input.exceptionId?.trim()) {
    throw new Error('UBOQ_INVALID_INPUT: projectId and exceptionId are required');
  }

  const res = await withUboqRlsContext(
    { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId: input.projectId },
    async () =>
      resolveUboqValidationException(prisma as never, {
        projectId: input.projectId,
        exceptionId: input.exceptionId,
        resolverUserId: actor.userId,
        resolutionNote: input.resolutionNote,
      })
  );

  revalidatePath(`/projects/${input.projectId}/uboq`);
  return redactUboqPayloadForRole(res, actor.role);
}

export async function applyVisualColumnMappingAction(input: {
  projectId: string;
  sourceDocumentId: string;
  candidateIds: string[];
  columnMap: Record<string, string | null | undefined>;
  reviewNotes: string;
  decision?: 'HUMAN_VERIFIED' | 'HUMAN_EXCLUDED';
}) {
  const actor = await verifyOperationalSession();
  if (!actor) {
    throw new Error('UBOQ_UNAUTHORIZED: Active operational session required');
  }
  if (!input.projectId?.trim() || !input.sourceDocumentId?.trim()) {
    throw new Error('UBOQ_INVALID_INPUT: projectId and sourceDocumentId are required');
  }
  const decision = input.decision ?? 'HUMAN_VERIFIED';
  if (decision !== 'HUMAN_VERIFIED' && decision !== 'HUMAN_EXCLUDED') {
    throw new Error(`UBOQ_INVALID_REVIEW_DECISION: Unsupported decision "${String(decision)}"`);
  }
  if (!input.reviewNotes?.trim()) {
    throw new Error('UBOQ_REVIEW_NOTES_REQUIRED: Visual column mapping requires explicit audit notes');
  }

  const mappingValidation = validateVisualColumnMapping(input.columnMap);
  if (!mappingValidation.valid) {
    throw new Error(mappingValidation.errors[0] || 'UBOQ_INVALID_COLUMN_MAPPING');
  }

  const rawIds = Array.isArray(input.candidateIds) ? input.candidateIds : [];
  const uniqueIds: string[] = [];
  const seen = new Set<string>();
  let skippedDuplicateCount = 0;
  for (const id of rawIds) {
    const trimmed = String(id || '').trim();
    if (!trimmed) continue;
    if (seen.has(trimmed)) {
      skippedDuplicateCount += 1;
      continue;
    }
    seen.add(trimmed);
    uniqueIds.push(trimmed);
  }
  if (uniqueIds.length === 0) {
    throw new Error('UBOQ_NO_CANDIDATES_SELECTED: Select at least one extraction candidate');
  }

  const result = await withUboqRlsContext(
    { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId: input.projectId },
    async () => {
      await assertUboqStageAuthorization(prisma, {
        userId: actor.userId,
        projectId: input.projectId,
        capability: 'UBOQ_HUMAN_REVIEW_RESOLVE',
      });

      // Verify source document ownership within active project before touching any candidate
      const sourceDoc = await prisma.uboqSourceDocument.findUnique({
        where: { id: input.sourceDocumentId },
        select: { id: true, projectId: true, sha256Hash: true },
      });
      if (!sourceDoc || sourceDoc.projectId !== input.projectId) {
        throw new Error('UBOQ_SOURCE_DOCUMENT_NOT_FOUND_FOR_PROJECT');
      }

      // Verify all targeted candidates belong to BOTH projectId and sourceDocumentId
      const ownedCandidates = await prisma.uboqExtractionCandidate.findMany({
        where: {
          id: { in: uniqueIds },
          sourceDocumentId: input.sourceDocumentId,
          sourceDocument: { projectId: input.projectId },
        },
        select: { id: true },
      });
      if (ownedCandidates.length !== uniqueIds.length) {
        throw new Error('UBOQ_CANDIDATE_NOT_FOUND_FOR_PROJECT: One or more candidates do not belong to this project document');
      }

      const updatedResults = [];
      for (const candidateId of uniqueIds) {
        const updated = await resolveExtractionCandidateHumanReview(prisma as never, {
          projectId: input.projectId,
          candidateId,
          reviewerUserId: actor.userId,
          decision,
          reviewNotes: input.reviewNotes.trim(),
          canonicalFieldRemap:
            Object.keys(mappingValidation.normalizedRemap).length > 0
              ? mappingValidation.normalizedRemap
              : undefined,
        });
        updatedResults.push(updated);
      }

      return {
        sourceDocumentId: sourceDoc.id,
        sourceSha256Hash: sourceDoc.sha256Hash,
        appliedCount: updatedResults.length,
        skippedDuplicateCount,
        decision,
        normalizedRemap: mappingValidation.normalizedRemap,
        autoApproved: false as const,
        results: updatedResults,
      };
    }
  );

  revalidatePath(`/projects/${input.projectId}/uboq`);
  return redactUboqPayloadForRole(result, actor.role);
}

export async function regenerateUboqDraftSnapshotAction(input: {
  projectId: string;
  sourceDocumentId: string;
  sectorType?: UboqSectorType;
  clientName?: string;
  contractRef?: string;
  taxProfileCode?: string;
  resourceTakeoffs?: ResourceTakeoffSpecInput[];
}) {
  const actor = await verifyOperationalSession();
  if (!actor) {
    throw new Error('UBOQ_UNAUTHORIZED: Active operational session required');
  }

  const res = await withUboqRlsContext(
    { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId: input.projectId },
    async () =>
      regenerateDraftSnapshotFromVerifiedDocument(prisma as never, {
        projectId: input.projectId,
        sourceDocumentId: input.sourceDocumentId,
        preparedByUserId: actor.userId,
        sectorType: input.sectorType,
        clientName: input.clientName,
        contractRef: input.contractRef,
        taxProfileCode: input.taxProfileCode,
        resourceTakeoffs: input.resourceTakeoffs,
      })
  );

  revalidatePath(`/projects/${input.projectId}/uboq`);
  revalidatePath(`/projects/${input.projectId}`);
  return redactUboqPayloadForRole(res, actor.role);
}

export async function approveUboqSnapshotAction(projectId: string, snapshotId: string) {
  const actor = await verifyOperationalSession();
  if (!actor) {
    throw new Error('UBOQ_UNAUTHORIZED: Active operational session required');
  }

  const res = await withUboqRlsContext(
    { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId },
    async () => {
      await assertUboqStageAuthorization(prisma, {
        userId: actor.userId,
        projectId,
        capability: 'UBOQ_SNAPSHOT_APPROVE',
      });

      const snap = await prisma.uboqOperationalSnapshot.findUnique({
        where: { id: snapshotId },
        select: { id: true, projectId: true },
      });
      if (!snap || snap.projectId !== projectId) {
        throw new Error('UBOQ_CROSS_PROJECT_SPOOFING_BLOCKED: Snapshot does not belong to project');
      }

      const approved = await approveOperationalSnapshotAndPrrs(prisma as never, {
        snapshotId,
        approverUserId: actor.userId,
      });

      const scheduleLinkSync = await tryAutoSyncProjectScheduleLinks(prisma as never, {
        projectId,
        actorUserId: actor.userId,
      });

      return { ...approved, scheduleLinkSync };
    }
  );

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

  const res = await withUboqRlsContext(
    { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId: input.projectId },
    async () => {
      await assertUboqStageAuthorization(prisma, {
        userId: actor.userId,
        projectId: input.projectId,
        capability: 'UBOQ_STOCK_ALLOCATE',
      });

      await assertProjectGraphOwnership(prisma, {
        userId: actor.userId,
        userRole: actor.role,
        projectId: input.projectId,
        canonicalResourceIds: [input.canonicalResourceId],
      });

      return allocateVerifiedOpeningStockAtomically(prisma as never, {
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
    }
  );

  revalidatePath(`/projects/${input.projectId}/uboq`);
  return redactUboqPayloadForRole(res, actor.role);
}

export async function syncUboqScheduleLinksAction(input: {
  projectId: string;
  scheduleId: string;
  requireCompleteAllocation?: boolean;
}) {
  const actor = await verifyOperationalSession();
  if (!actor) {
    throw new Error('UBOQ_UNAUTHORIZED: Active operational session required');
  }
  if (!input.projectId?.trim() || !input.scheduleId?.trim()) {
    throw new Error('UBOQ_SCHEDULE_INVALID_INPUT: projectId and scheduleId are required');
  }

  const res = await withUboqRlsContext(
    { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId: input.projectId },
    async () =>
      syncUboqScheduleActivityLinks(prisma as never, {
        projectId: input.projectId,
        scheduleId: input.scheduleId,
        actorUserId: actor.userId,
        requireCompleteAllocation: Boolean(input.requireCompleteAllocation),
      })
  );

  revalidatePath(`/projects/${input.projectId}/uboq`);
  return redactUboqPayloadForRole(res, actor.role);
}

export async function populateWorkspaceAwardedBoqAction(input: {
  projectId: string;
  sourceDocumentId: string;
  confirmationNote: string;
}) {
  const actor = await verifyOperationalSession();
  if (!actor) {
    throw new Error('UBOQ_UNAUTHORIZED: Active operational session required');
  }
  if (!input.projectId?.trim() || !input.sourceDocumentId?.trim()) {
    throw new Error('UBOQ_INVALID_INPUT: projectId and sourceDocumentId are required');
  }

  const cookieStore = await cookies();
  const rawSimulatedRole = cookieStore.get('simulatedRole')?.value || null;
  const simulatedRole =
    rawSimulatedRole && rawSimulatedRole.trim().toUpperCase() !== actor.role.toUpperCase()
      ? rawSimulatedRole.trim().toUpperCase()
      : null;

  const res = await withUboqRlsContext(
    { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId: input.projectId },
    async () =>
      populateWorkspaceAwardedBoqFromVerifiedDocument(prisma as never, {
        projectId: input.projectId,
        sourceDocumentId: input.sourceDocumentId,
        actorUserId: actor.userId,
        actorRole: actor.role,
        simulatedRole,
        confirmationNote: input.confirmationNote,
      })
  );

  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath(`/projects/${input.projectId}/uboq`);
  return redactUboqPayloadForRole(res, actor.role);
}
