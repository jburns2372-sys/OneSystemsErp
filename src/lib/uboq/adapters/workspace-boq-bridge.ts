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
  readonly insertedRowCount: number;
  readonly payItemCount: number;
  readonly headingCount: number;
  readonly reconciledTotal: number;
  readonly officialAwardedContractAmount: number;
  readonly alreadyPopulated: boolean;
}

/**
 * Authorized bridge from a verified, contract-reconciled L0/L2 Awarded BOQ source document
 * into the existing July Project Workspace `AwardedBOQItem` table.
 *
 * Strict Governance Invariants:
 *  - Requires active RBAC/PBAC authorization (`UBOQ_INTAKE_STAGE` or `UBOQ_SNAPSHOT_APPROVE`)
 *    and blocks simulated role preview.
 *  - Uses the independent authoritative `Project.contractAmount` (NEVER assumes the workbook
 *    grand total as the official awarded contract amount, NEVER mutates `Project.contractAmount`).
 *  - Refuses if `status !== 'VERIFIED_MATCH'` (i.e. missing official contract amount or any
 *    unresolved arithmetic/formula/contract-total discrepancy).
 *  - Preserves original quantities, unit prices, total costs, hierarchy headings, and audit trail.
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

  // Enforce authorized contract-import permission under RBAC/PBAC
  try {
    await assertUboqStageAuthorization(prisma, {
      userId: input.actorUserId,
      projectId: input.projectId,
      capability: 'UBOQ_SNAPSHOT_APPROVE',
      simulatedRole: null,
    });
  } catch {
    await assertUboqStageAuthorization(prisma, {
      userId: input.actorUserId,
      projectId: input.projectId,
      capability: 'UBOQ_INTAKE_STAGE',
      simulatedRole: null,
    });
  }

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
  if (!sourceDoc) {
    throw new Error('UBOQ_SOURCE_DOCUMENT_NOT_FOUND: Source BOQ document does not belong to this project.');
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

  return prisma.$transaction(async (tx) => {
    const rlsStore = uboqRlsStorage.getStore();
    if (rlsStore && !rlsStore.inInteractiveTx) {
      await applyProjectRlsSessionVars(tx, rlsStore);
    }

    const existingCount = await tx.awardedBOQItem.count({
      where: { projectId: input.projectId },
    });
    if (existingCount > 0) {
      return {
        projectId: input.projectId,
        sourceDocumentId: sourceDoc.id,
        insertedRowCount: 0,
        payItemCount,
        headingCount,
        reconciledTotal: verification.recalculatedTotal,
        officialAwardedContractAmount: officialContractAmount,
        alreadyPopulated: true,
      };
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
        remarks: `[doc:${sourceDoc.id}] Populated ${payItemCount} verified Awarded BOQ pay items and ${headingCount} headings into Project Workspace from immutable source ${sourceDoc.fileName} (SHA-256 ${sourceDoc.sha256Hash.slice(0, 16)}...); reconciled total ${verification.recalculatedTotal.toFixed(2)} matches official awarded contract ${officialContractAmount.toFixed(2)}. Note: ${note}`,
      },
    });

    return {
      projectId: input.projectId,
      sourceDocumentId: sourceDoc.id,
      insertedRowCount: rowsToInsert.length,
      payItemCount,
      headingCount,
      reconciledTotal: verification.recalculatedTotal,
      officialAwardedContractAmount: officialContractAmount,
      alreadyPopulated: false,
    };
  });
}
