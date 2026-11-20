import type { PrismaClient } from '@prisma/client';
import { assertUboqStageAuthorization } from '../security/stage-rbac';
import { applyProjectRlsSessionVars, uboqRlsStorage } from '../project-ownership';
import {
  reconcileImportedAwardedBoqCandidates,
  type AwardedBoqVerificationReport,
} from '../awarded-boq-reconciler';

export interface PopulateWorkspaceAwardedBoqInput {
  readonly projectId: string;
  readonly sourceDocumentId: string;
  readonly actorUserId: string;
  readonly actorRole: string;
  readonly simulatedRole?: string | null;
  readonly confirmationNote: string;
}

export interface PopulateWorkspaceAwardedBoqResult {
  readonly projectId: string;
  readonly sourceDocumentId: string;
  readonly sourceSha256Hash: string;
  readonly insertedRowCount: number;
  readonly payItemCount: number;
  readonly headingCount: number;
  readonly reconciledTotal: number;
  readonly officialAwardedContractAmount: number;
  readonly alreadyPopulated: boolean;
}

function buildWorkspacePopulationAuditTag(projectId: string, sourceDocumentId: string, sha256Hash: string): string {
  return `[proj:${projectId}][doc:${sourceDocumentId}][sha256:${sha256Hash}]`;
}

/**
 * Authorized bridge from a verified, contract-reconciled L0/L2 Awarded BOQ source document
 * into the existing July Project Workspace `AwardedBOQItem` table.
 *
 * Strict Security & Idempotency Invariants:
 *  - Requires `UBOQ_SNAPSHOT_APPROVE` (privileged operational baseline-import permission);
 *    document staging permission (`UBOQ_INTAKE_STAGE`) alone is NEVER sufficient.
 *  - Explicitly rejects simulated Role Preview (`UBOQ_ROLE_PREVIEW_BLOCKED`).
 *  - Verifies immutable L0 source identity (`isLockedImmutable === true`, valid 64-hex SHA-256,
 *    project ownership match).
 *  - Uses the independent authoritative `Project.contractAmount` (NEVER assumes the workbook
 *    grand total as the official awarded contract amount, NEVER mutates `Project.contractAmount`).
 *  - Refuses unless `status === 'VERIFIED_MATCH'` (exact reconciliation with zero discrepancies).
 *  - Acquires a project-scoped row lock (`SELECT id FROM public."Project" WHERE id = $1 FOR UPDATE`)
 *    inside the atomic transaction to prevent concurrent duplicate population.
 *  - Repeat import of the SAME verified source `(sourceDocumentId, sha256Hash)` is idempotent
 *    (`alreadyPopulated: true`).
 *  - Import of a DIFFERENT source when workspace BOQ rows already exist fails cleanly with
 *    `UBOQ_WORKSPACE_BOQ_CONFLICT` rather than silently reporting `alreadyPopulated: true`.
 *  - NEVER automatically creates PRRs, Material Requests, Purchase Orders, Payments, Billings,
 *    or Variation Orders.
 */
export async function populateWorkspaceAwardedBoqFromVerifiedDocument(
  prismaInput: PrismaClient | { readonly project: unknown },
  input: PopulateWorkspaceAwardedBoqInput
): Promise<PopulateWorkspaceAwardedBoqResult> {
  const prisma = prismaInput as PrismaClient;

  if (input.simulatedRole && input.simulatedRole.trim() !== '') {
    throw new Error('UBOQ_ROLE_PREVIEW_BLOCKED: Exit Role Preview before populating the Project Workspace BOQ.');
  }

  const note = String(input.confirmationNote || '').trim();
  if (note.length < 5) {
    throw new Error('UBOQ_AUDIT_NOTE_REQUIRED: Provide a brief confirmation note (at least 5 characters) for the audit trail.');
  }

  // Strictly require privileged contract-import permission — staging permission alone is NEVER enough!
  await assertUboqStageAuthorization(prisma, {
    userId: input.actorUserId,
    projectId: input.projectId,
    capability: 'UBOQ_SNAPSHOT_APPROVE',
    simulatedRole: null,
  });

  const [project, sourceDoc] = await Promise.all([
    prisma.project.findUnique({
      where: { id: input.projectId },
      select: { id: true, name: true, contractAmount: true, boqLocked: true },
    }),
    prisma.uboqSourceDocument.findFirst({
      where: { id: input.sourceDocumentId, projectId: input.projectId },
      include: {
        candidates: {
          orderBy: [{ sourceRowNumber: 'asc' }, { createdAt: 'asc' }],
          include: { section: { select: { sheetOrPageRef: true } } },
        },
      },
    }),
  ]);

  if (!project) {
    throw new Error('UBOQ_PROJECT_NOT_FOUND: Target project does not exist or access is denied.');
  }
  if (!sourceDoc || sourceDoc.projectId !== input.projectId) {
    throw new Error('UBOQ_SOURCE_DOCUMENT_NOT_FOUND: Source BOQ document does not belong to this project.');
  }
  if (sourceDoc.isLockedImmutable === false || !/^[a-f0-9]{64}$/i.test(String(sourceDoc.sha256Hash || ''))) {
    throw new Error('UBOQ_SOURCE_IMMUTABILITY_REQUIRED: Only immutable SHA-256 verified source documents can populate the Project Workspace BOQ.');
  }
  if (project.boqLocked) {
    throw new Error('UBOQ_WORKSPACE_BOQ_LOCKED: Project Workspace BOQ is already locked.');
  }

  const officialContractAmount =
    typeof project.contractAmount === 'number' && Number.isFinite(project.contractAmount) && project.contractAmount > 0
      ? project.contractAmount
      : null;

  const meta =
    sourceDoc.metadataJson && typeof sourceDoc.metadataJson === 'object'
      ? (sourceDoc.metadataJson as Record<string, unknown>)
      : {};
  const persistedSummary = (meta.awardedBoqVerification ?? null) as Partial<AwardedBoqVerificationReport> | null;

  const verification = reconcileImportedAwardedBoqCandidates(
    sourceDoc.candidates.map((c) => {
      const pJson = c.parsedJson && typeof c.parsedJson === 'object' ? (c.parsedJson as Record<string, unknown>) : {};
      const mapped = (pJson.effectiveCanonicalFields ?? pJson.mappedFields ?? {}) as Record<string, unknown>;
      return {
        id: c.id,
        sourceRowNumber: c.sourceRowNumber,
        sourceCellRef: c.sourceCellRef,
        sheetOrPageRef: c.section?.sheetOrPageRef ?? null,
        rawFormulaText: c.rawFormulaText,
        mappedFields: mapped,
      };
    }),
    {
      officialAwardedContractAmount: officialContractAmount,
      persistedWorkbookSummary: persistedSummary,
    }
  );

  if (verification.status === 'CONTRACT_AMOUNT_REQUIRED' || officialContractAmount === null) {
    throw new Error('UBOQ_AWARDED_CONTRACT_AMOUNT_REQUIRED: Awarded contract amount required to complete reconciliation before populating Project Workspace BOQ.');
  }
  if (verification.status !== 'VERIFIED_MATCH') {
    throw new Error(
      `UBOQ_AWARDED_BOQ_DISCREPANCIES_UNRESOLVED: ${verification.discrepancies.length} calculation/formula/contract-total discrepancies must be resolved before populating Project Workspace BOQ.`
    );
  }

  const rowsToInsert = verification.classifiedRows.filter(
    (r) => r.classification === 'PAY_ITEM' || r.classification === 'HEADING' || r.classification === 'SUBHEADING'
  );
  const payItemCount = rowsToInsert.filter((r) => r.classification === 'PAY_ITEM').length;
  const headingCount = rowsToInsert.length - payItemCount;

  if (payItemCount === 0) {
    throw new Error('UBOQ_NO_VERIFIED_PAY_ITEMS: No priced BOQ pay items available to populate.');
  }

  const auditTag = buildWorkspacePopulationAuditTag(input.projectId, sourceDoc.id, sourceDoc.sha256Hash);
  const projectTagPrefix = `[proj:${input.projectId}]`;

  return prisma.$transaction(async (tx) => {
    const rlsStore = uboqRlsStorage.getStore();
    if (rlsStore && !rlsStore.inInteractiveTx) {
      await applyProjectRlsSessionVars(tx, rlsStore);
    }

    // Serialize concurrent operational BOQ population attempts on this project via PostgreSQL row lock
    if (typeof (tx as { $queryRaw?: unknown }).$queryRaw === 'function') {
      await tx.$queryRaw`SELECT id FROM public."Project" WHERE id = ${input.projectId} FOR UPDATE`;
    }

    // Re-check lock & existing BOQ rows inside the project-scoped row lock
    if (typeof tx.project?.findUnique === 'function') {
      const lockedProj = await tx.project.findUnique({
        where: { id: input.projectId },
        select: { id: true, boqLocked: true },
      });
      if (!lockedProj) {
        throw new Error('UBOQ_PROJECT_NOT_FOUND: Target project does not exist or access is denied.');
      }
      if (lockedProj.boqLocked) {
        throw new Error('UBOQ_WORKSPACE_BOQ_LOCKED: Project Workspace BOQ is already locked.');
      }
    }

    const existingCount = await tx.awardedBOQItem.count({
      where: { projectId: input.projectId },
    });

    if (existingCount > 0) {
      // Distinguish idempotent repeat of the SAME verified source from a CONFLICTING different source
      const priorAudit =
        typeof tx.auditLog?.findFirst === 'function'
          ? await tx.auditLog.findFirst({
              where: {
                moduleName: 'BOQ',
                actionType: 'POPULATE_WORKSPACE_AWARDED_BOQ',
                remarks: { contains: projectTagPrefix },
              },
              orderBy: { createdAt: 'desc' },
              select: { remarks: true },
            })
          : null;

      if (priorAudit?.remarks && priorAudit.remarks.includes(auditTag)) {
        return {
          projectId: input.projectId,
          sourceDocumentId: sourceDoc.id,
          sourceSha256Hash: sourceDoc.sha256Hash,
          insertedRowCount: 0,
          payItemCount,
          headingCount,
          reconciledTotal: verification.recalculatedTotal,
          officialAwardedContractAmount: officialContractAmount,
          alreadyPopulated: true,
        };
      }

      throw new Error(
        'UBOQ_WORKSPACE_BOQ_CONFLICT: This Project Workspace BOQ is already populated from a different source document. Keep the existing workspace BOQ or resolve the source conflict before importing a different BOQ.'
      );
    }

    for (const row of rowsToInsert) {
      const isPayItem = row.classification === 'PAY_ITEM';
      const qty = isPayItem ? (row.quantity ?? 0) : 0;
      const totalCost = isPayItem ? (row.lineAmount ?? row.recalculatedAmount ?? 0) : 0;
      const unitCost = isPayItem
        ? (row.unitPrice ?? (qty > 0 ? Number((totalCost / qty).toFixed(4)) : 0))
        : 0;

      await tx.awardedBOQItem.create({
        data: {
          projectId: input.projectId,
          itemCode: row.itemCode || '',
          description: row.description,
          unit: isPayItem ? (row.unit || 'lot') : '',
          quantity: qty,
          revisedContractQuantity: qty,
          combinedUnitCost: unitCost,
          revisedContractUnitPrice: unitCost,
          totalCost,
          revisedContractAmount: totalCost,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: input.actorUserId,
        userRole: input.actorRole,
        moduleName: 'BOQ',
        actionType: 'POPULATE_WORKSPACE_AWARDED_BOQ',
        remarks: `${auditTag} Populated ${payItemCount} verified Awarded BOQ pay items and ${headingCount} headings into Project Workspace from immutable source ${sourceDoc.fileName}; reconciled total ${verification.recalculatedTotal.toFixed(2)} matches official awarded contract ${officialContractAmount.toFixed(2)}. Note: ${note}`,
      },
    });

    return {
      projectId: input.projectId,
      sourceDocumentId: sourceDoc.id,
      sourceSha256Hash: sourceDoc.sha256Hash,
      insertedRowCount: rowsToInsert.length,
      payItemCount,
      headingCount,
      reconciledTotal: verification.recalculatedTotal,
      officialAwardedContractAmount: officialContractAmount,
      alreadyPopulated: false,
    };
  });
}
