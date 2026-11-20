import { Router } from 'express';
import { backendPrisma as prisma } from '../lib/prismaRls';
import {
  assertBackendProjectAccess,
  postBackendResourceLedgerDelta,
  normalizeBackendUom,
  withBackendLockedAccountsTx,
} from '../lib/uboq/backendResourceGuard';
import { assertUboqStageAuthorization } from '../../../../src/lib/uboq/security/stage-rbac';
import { withUboqRlsContext } from '../../../../src/lib/uboq/project-ownership';
import { resolveUboqVaultStorageProvider } from '../../../../src/lib/uboq/storage/vault-storage';
import { registerOcrAssetTracingHints } from '../lib/uboq/ocrAssetTracing';
import {
  approveOperationalSnapshotAndPrrs,
  forkApprovedSourceReviewRevision,
  ingestAndStageProjectUboqPackage,
  regenerateDraftSnapshotFromVerifiedDocument,
  resolveExtractionCandidateHumanReview,
  resolveUboqValidationException,
} from '../../../../src/lib/uboq/adapters/snapshot-orchestrator';
import {
  syncUboqScheduleActivityLinks,
  tryAutoSyncProjectScheduleLinks,
} from '../../../../src/lib/uboq/adapters/schedule-link-adapter';

const router = Router();
// Keep OCR worker/WASM/traineddata asset hints live-reachable for Vercel @vercel/nft tracing.
registerOcrAssetTracingHints();

const SENSITIVE_INTERNAL_COST_KEYS = new Set([
  'targetResourceUnitCost',
  'benchmarkUnitCost',
  'procurementBudget',
  'directMaterialCost',
  'directLaborCost',
  'directEquipmentCost',
  'subcontractTargetCost',
  'estimatedDirectCost',
  'ocmAmount',
  'contractorProfitAmt',
]);

const FULL_COST_ROLES = new Set([
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
  'PRESIDENT',
  'VP_OPERATIONS',
  'PROJECT_DIRECTOR',
  'FINANCE_MANAGER',
  'COST_ENGINEER',
  'QS_ENGINEER',
  'ESTIMATOR',
  'PURCHASING_MANAGER',
  'PURCHASING_OFFICER',
]);

function redactBackendObject<T>(val: T, role: string): T {
  const normRole = (role || '').trim().toUpperCase();
  if (FULL_COST_ROLES.has(normRole)) return val;
  if (Array.isArray(val)) {
    return val.map((item) => redactBackendObject(item, normRole)) as unknown as T;
  }
  if (val && typeof val === 'object' && !(val instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (SENSITIVE_INTERNAL_COST_KEYS.has(k)) continue;
      out[k] = redactBackendObject(v, normRole);
    }
    return out as T;
  }
  return val;
}

function mapUboqHttpErrorStatus(msg: string): number {
  if (msg.includes('UBOQ_UNAUTHORIZED')) return 401;
  if (
    msg.includes('UBOQ_PBAC') ||
    msg.includes('UBOQ_RBAC_FORBIDDEN') ||
    msg.includes('UBOQ_SOD_VIOLATION') ||
    msg.includes('CROSS_PROJECT') ||
    msg.includes('CROSS_SCHEDULE')
  ) {
    return 403;
  }
  if (msg.includes('NOT_FOUND')) return 404;
  if (msg.includes('UBOQ_XLSX_LIMIT_EXCEEDED') || msg.includes('UBOQ_XLSX_EMPTY_WORKBOOK')) return 422;
  if (
    msg.includes('CEILING_EXCEEDED') ||
    msg.includes('SUPERSEDED') ||
    msg.includes('UBOQ_APPROVAL_BLOCKED') ||
    msg.includes('UBOQ_DRAFT_REGEN_BLOCKED') ||
    msg.includes('INVALID_STATE') ||
    msg.includes('UBOQ_UNAPPROVED_SNAPSHOT_SOURCE') ||
    msg.includes('UBOQ_INACTIVE_SCHEDULE_DENIED') ||
    msg.includes('UBOQ_ALLOCATION_OVERFLOW') ||
    msg.includes('UBOQ_DUPLICATE_ALLOCATION') ||
    msg.includes('UBOQ_MULTI_SNAPSHOT_OVERLAP') ||
    msg.includes('UBOQ_AMBIGUOUS_PHASE_LINE_MAPPING') ||
    msg.includes('UBOQ_INCOMPATIBLE_UNIT') ||
    msg.includes('UBOQ_INCOMPLETE_ALLOCATION')
  ) {
    return 409;
  }
  return 400;
}

router.get('/project/:projectId/overview', async (req, res) => {
  try {
    const { projectId } = req.params;
    const actorId = (req as any).user?.id;
    const actorRole = (req as any).pbacContext?.simulatedRole || (req as any).user?.role || '';
    const simRole = (req as any).pbacContext?.simulatedRole || null;

    await assertUboqStageAuthorization(prisma, {
      userId: actorId,
      projectId,
      capability: 'UBOQ_VIEW',
      simulatedRole: simRole,
    });
    await assertBackendProjectAccess(prisma, actorId, actorRole, projectId);

    const [contract, snapshots, resourceAccounts, exceptions, cashFlowPeriods] = await Promise.all([
      prisma.uboqContractAuthority.findFirst({
        where: { projectId },
        include: { taxProfile: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.uboqOperationalSnapshot.findMany({
        where: { projectId },
        orderBy: { versionNumber: 'desc' },
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
      prisma.uboqCashFlowPeriod.findMany({
        where: { projectId },
        orderBy: { periodIndex: 'asc' },
      }),
    ]);

    return res.json(
      redactBackendObject(
        {
          projectId,
          contract,
          snapshots,
          resourceAccounts,
          exceptions,
          cashFlowPeriods,
        },
        actorRole
      )
    );
  } catch (err: any) {
    const msg = String(err.message || '');
    return res.status(mapUboqHttpErrorStatus(msg)).json({ error: msg });
  }
});

router.post('/project/:projectId/ingest', async (req, res) => {
  try {
    const { projectId } = req.params;
    const actor = (req as any).user;
    const actorRole = (req as any).pbacContext?.simulatedRole || actor?.role || '';
    const simRole = (req as any).pbacContext?.simulatedRole || null;

    await assertUboqStageAuthorization(prisma, {
      userId: actor?.id,
      projectId,
      capability: 'UBOQ_INTAKE_STAGE',
      simulatedRole: simRole,
    });

    const {
      fileName,
      fileBase64,
      documentRole,
      sectorType,
      clientName,
      contractRef,
      taxProfileCode,
      explicitPhaseLines,
      resourceTakeoffs,
      allowDuplicateNewRevision,
    } = req.body || {};

    if (!fileName || !fileBase64) {
      return res.status(400).json({ error: 'fileName and fileBase64 are required' });
    }
    const buffer = Buffer.from(String(fileBase64), 'base64');

    const staged = await withUboqRlsContext(
      { userId: actor.id, sessionVersion: actor.sessionVersion ?? 0, projectId },
      () =>
        ingestAndStageProjectUboqPackage(prisma, {
          projectId,
          uploadedByUserId: actor.id,
          fileName: String(fileName),
          buffer,
          documentRole,
          sectorType,
          clientName,
          contractRef,
          taxProfileCode,
          explicitPhaseLines,
          resourceTakeoffs,
          allowDuplicateNewRevision: Boolean(allowDuplicateNewRevision),
        })
    );

    return res.status(staged.duplicateIdempotentReplay ? 200 : 201).json(redactBackendObject(staged, actorRole));
  } catch (err: any) {
    const msg = String(err.message || '');
    return res.status(mapUboqHttpErrorStatus(msg)).json({ error: msg });
  }
});

router.get('/project/:projectId/documents/:documentId/download', async (req, res) => {
  try {
    const { projectId, documentId } = req.params;
    const actor = (req as any).user;
    const simRole = (req as any).pbacContext?.simulatedRole || null;

    await assertUboqStageAuthorization(prisma, {
      userId: actor?.id,
      projectId,
      capability: 'UBOQ_VIEW',
      simulatedRole: simRole,
    });

    const doc = await prisma.uboqSourceDocument.findUnique({
      where: { id: documentId },
    });
    if (!doc || doc.projectId !== projectId) {
      return res.status(404).json({ error: 'UBOQ_VAULT_OBJECT_NOT_FOUND_OR_DENIED' });
    }

    const vaultProvider = resolveUboqVaultStorageProvider();
    const verified = await vaultProvider.getAndVerify({
      storageUri: doc.storageUri,
      expectedProjectId: projectId,
      expectedSha256Hash: doc.sha256Hash,
    });
    const safeName = doc.fileName.replace(/[^\w.\-() ]+/g, '_');

    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', String(verified.buffer.length));
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    res.setHeader('X-UBOQ-SHA256', verified.verifiedSha256);
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    return res.status(200).send(verified.buffer);
  } catch (err: any) {
    const msg = String(err.message || '');
    return res.status(mapUboqHttpErrorStatus(msg)).json({ error: msg });
  }
});

router.post('/project/:projectId/candidates/:candidateId/review', async (req, res) => {
  try {
    const { projectId, candidateId } = req.params;
    const actor = (req as any).user;
    const actorRole = (req as any).pbacContext?.simulatedRole || actor?.role || '';
    const simRole = (req as any).pbacContext?.simulatedRole || null;

    await assertUboqStageAuthorization(prisma, {
      userId: actor?.id,
      projectId,
      capability: 'UBOQ_HUMAN_REVIEW_RESOLVE',
      simulatedRole: simRole,
    });

    const { decision, reviewNotes, canonicalFieldRemap, correctedMappedFields } = req.body || {};
    const updated = await withUboqRlsContext(
      { userId: actor.id, sessionVersion: actor.sessionVersion ?? 0, projectId },
      () =>
        resolveExtractionCandidateHumanReview(prisma, {
          projectId,
          candidateId,
          reviewerUserId: actor.id,
          decision,
          reviewNotes,
          canonicalFieldRemap,
          correctedMappedFields,
        })
    );

    return res.json(redactBackendObject(updated, actorRole));
  } catch (err: any) {
    const msg = String(err.message || '');
    return res.status(mapUboqHttpErrorStatus(msg)).json({ error: msg });
  }
});

router.post('/project/:projectId/documents/:documentId/regenerate-draft', async (req, res) => {
  try {
    const { projectId, documentId } = req.params;
    const actor = (req as any).user;
    const actorRole = (req as any).pbacContext?.simulatedRole || actor?.role || '';
    const simRole = (req as any).pbacContext?.simulatedRole || null;

    await assertUboqStageAuthorization(prisma, {
      userId: actor?.id,
      projectId,
      capability: 'UBOQ_INTAKE_STAGE',
      simulatedRole: simRole,
    });

    const { sectorType, clientName, contractRef, taxProfileCode, resourceTakeoffs } = req.body || {};
    const regenerated = await withUboqRlsContext(
      { userId: actor.id, sessionVersion: actor.sessionVersion ?? 0, projectId },
      () =>
        regenerateDraftSnapshotFromVerifiedDocument(prisma, {
          projectId,
          sourceDocumentId: documentId,
          preparedByUserId: actor.id,
          sectorType,
          clientName,
          contractRef,
          taxProfileCode,
          resourceTakeoffs,
        })
    );

    return res.status(201).json(redactBackendObject(regenerated, actorRole));
  } catch (err: any) {
    const msg = String(err.message || '');
    return res.status(mapUboqHttpErrorStatus(msg)).json({ error: msg });
  }
});

router.post('/project/:projectId/exceptions/:exceptionId/resolve', async (req, res) => {
  try {
    const { projectId, exceptionId } = req.params;
    const actor = (req as any).user;
    const actorRole = (req as any).pbacContext?.simulatedRole || actor?.role || '';
    const simRole = (req as any).pbacContext?.simulatedRole || null;

    await assertUboqStageAuthorization(prisma, {
      userId: actor?.id,
      projectId,
      capability: 'UBOQ_HUMAN_REVIEW_RESOLVE',
      simulatedRole: simRole,
    });

    const { resolutionNote } = req.body || {};
    const resolved = await withUboqRlsContext(
      { userId: actor.id, sessionVersion: actor.sessionVersion ?? 0, projectId },
      () =>
        resolveUboqValidationException(prisma, {
          projectId,
          exceptionId,
          resolverUserId: actor.id,
          resolutionNote: String(resolutionNote || ''),
        })
    );

    return res.json(redactBackendObject(resolved, actorRole));
  } catch (err: any) {
    const msg = String(err.message || '');
    return res.status(mapUboqHttpErrorStatus(msg)).json({ error: msg });
  }
});

router.post('/project/:projectId/snapshots/:snapshotId/approve', async (req, res) => {
  try {
    const { projectId, snapshotId } = req.params;
    const actor = (req as any).user;
    const actorRole = (req as any).pbacContext?.simulatedRole || actor?.role || '';
    const simRole = (req as any).pbacContext?.simulatedRole || null;

    await assertUboqStageAuthorization(prisma, {
      userId: actor?.id,
      projectId,
      capability: 'UBOQ_SNAPSHOT_APPROVE',
      simulatedRole: simRole,
    });

    const snap = await prisma.uboqOperationalSnapshot.findUnique({
      where: { id: snapshotId },
      select: { id: true, projectId: true },
    });
    if (!snap || snap.projectId !== projectId) {
      return res.status(404).json({ error: 'UBOQ_SNAPSHOT_NOT_FOUND' });
    }

    const approved = await withUboqRlsContext(
      { userId: actor.id, sessionVersion: actor.sessionVersion ?? 0, projectId },
      async () => {
        const resApproved = await approveOperationalSnapshotAndPrrs(prisma, {
          snapshotId,
          approverUserId: actor.id,
        });
        const scheduleLinkSync = await tryAutoSyncProjectScheduleLinks(prisma, {
          projectId,
          actorUserId: actor.id,
          simulatedRole: simRole,
        });
        return { ...resApproved, scheduleLinkSync };
      }
    );

    return res.json(redactBackendObject(approved, actorRole));
  } catch (err: any) {
    const msg = String(err.message || '');
    return res.status(mapUboqHttpErrorStatus(msg)).json({ error: msg });
  }
});

router.post('/project/:projectId/allocate-opening-stock', async (req, res) => {
  try {
    const { projectId } = req.params;
    const actorId = (req as any).user?.id;
    const actorRole = (req as any).pbacContext?.simulatedRole || (req as any).user?.role || '';
    const simRole = (req as any).pbacContext?.simulatedRole || null;

    await assertUboqStageAuthorization(prisma, {
      userId: actorId,
      projectId,
      capability: 'UBOQ_STOCK_ALLOCATE',
      simulatedRole: simRole,
    });
    await assertBackendProjectAccess(prisma, actorId, actorRole, projectId);

    const {
      canonicalResourceId,
      warehouseCode,
      warehouseLocationId,
      lotReference,
      lotNumber,
      physicalCountRef,
      inspectionRef,
      conditionStatus,
      conditionCode,
      verifiedQty,
      unitCost,
      resourceUnit,
    } = req.body;

    const resolvedWarehouse = String(warehouseLocationId || warehouseCode || '').trim();
    const resolvedLot = String(lotNumber || lotReference || '').trim();
    const resolvedInspection = String(inspectionRef || physicalCountRef || '').trim();
    const normCond = String(conditionCode || conditionStatus || '').trim().toUpperCase();

    if (normCond !== 'GOOD' && normCond !== 'USABLE') {
      return res.status(400).json({
        code: 'UBOQ_INVALID_OPENING_STOCK_CONDITION',
        error: `Opening stock lot must be verified GOOD/USABLE (got ${normCond}); damaged/quarantined stock cannot reduce procurement ceiling.`,
      });
    }
    if (!resolvedWarehouse || !resolvedLot || !resolvedInspection) {
      return res.status(400).json({
        code: 'UBOQ_MISSING_STOCK_LOT_EVIDENCE',
        error: 'warehouseLocationId, lotNumber, and inspectionRef are mandatory for opening-stock allocation.',
      });
    }
    const qty = Number(verifiedQty);
    if (!(qty > 0)) {
      return res.status(400).json({ code: 'UBOQ_INVALID_QTY', error: 'verifiedQty must be > 0' });
    }

    const result = await withBackendLockedAccountsTx(prisma, [canonicalResourceId], async ({ tx, txId, lockedAccounts }) => {
      const acct = lockedAccounts.get(canonicalResourceId);
      if (!acct || acct.projectId !== projectId) {
        throw new Error('UBOQ_INVALID_RESOURCE_ACCOUNT: Account not found for project');
      }
      if (!acct.activeApprovedPrId) {
        throw new Error('UBOQ_NO_ACTIVE_PRR: Cannot allocate opening stock without an active APPROVED PRR');
      }
      const uom = normalizeBackendUom(resourceUnit || acct.resourceUomNormalized);
      if (uom !== acct.resourceUomNormalized) {
        throw new Error(`UBOQ_UOM_MISMATCH: Lot UOM ${uom} != resource account UOM ${acct.resourceUomNormalized}`);
      }
      if (qty > acct.remainingProcurementQty + 0.0001) {
        throw new Error(
          `UBOQ_OPENING_STOCK_EXCEEDS_REMAINING: Lot qty (${qty}) exceeds remainingProcurementQty (${acct.remainingProcurementQty})`
        );
      }

      const lot = await tx.uboqStockLotEvidence.create({
        data: {
          projectId,
          canonicalResourceId: acct.id,
          lotNumber: resolvedLot,
          warehouseLocationId: resolvedWarehouse,
          conditionCode: 'GOOD',
          verifiedQty: qty,
          allocatedQty: qty,
          issuedQty: 0,
          unitCost: Number(unitCost ?? acct.targetResourceUnitCost ?? 0),
          inspectionRef: resolvedInspection,
          verifiedById: actorId,
          status: 'VERIFIED',
        },
      });

      const updatedAcct = await postBackendResourceLedgerDelta(tx, txId, acct, {
        prrSnapshotId: acct.activeApprovedPrId,
        eventType: 'OPENING_STOCK_ALLOCATED',
        sourceModule: 'WAREHOUSE_OPENING_STOCK',
        sourceHeaderId: lot.id,
        sourceLineId: lot.id,
        warehouseLocationId: resolvedWarehouse,
        conditionCode: 'GOOD',
        idempotencyKey: `OPENING_STOCK_ALLOCATED:${lot.id}`,
        qtyDeltaAllocatedStock: qty,
        unitCostSnapshot: Number(unitCost ?? acct.targetResourceUnitCost ?? 0),
        actorUserId: actorId,
        remarks: `Verified opening stock lot ${resolvedLot} (${resolvedWarehouse}) allocated`,
      });

      return { lot, account: updatedAcct };
    });

    return res.status(201).json(result);
  } catch (err: any) {
    const msg = String(err.message || '');
    return res.status(mapUboqHttpErrorStatus(msg)).json({ error: msg });
  }
});

router.post('/mrf/create-governed', async (req, res) => {
  try {
    const actorId = (req as any).user?.id;
    const actorRole = (req as any).pbacContext?.simulatedRole || (req as any).user?.role || '';
    const simRole = (req as any).pbacContext?.simulatedRole || null;
    const { projectId, purpose, priority, locationOfUse, remarks, items } = req.body;

    await assertUboqStageAuthorization(prisma, {
      userId: actorId,
      projectId,
      capability: 'UBOQ_MRF_CREATE',
      simulatedRole: simRole,
    });
    await assertBackendProjectAccess(prisma, actorId, actorRole, projectId);

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'MRF items required' });
    }

    const createPayload: any[] = [];
    for (const ln of items) {
      const acct = await prisma.uboqCanonicalResourceAccount.findUnique({
        where: { id: ln.canonicalResourceId },
        include: { activeApprovedPr: true },
      });
      if (!acct || acct.projectId !== projectId || acct.consolidatedBoqItemId !== ln.consolidatedBoqItemId) {
        return res.status(400).json({ code: 'UBOQ_CROSS_PROJECT_MISMATCH', error: 'Invalid canonicalResourceId / consolidatedBoqItemId for project' });
      }
      const targetPrrId = ln.uboqResourceRequirementId || acct.activeApprovedPrId;
      if (!targetPrrId || !acct.activeApprovedPr || acct.activeApprovedPrId !== targetPrrId || acct.activeApprovedPr.status !== 'APPROVED') {
        return res.status(409).json({
          code: 'UBOQ_INACTIVE_PRR_FOR_NEW_COMMITMENT',
          error: `MRF origination requires active APPROVED PRR on ${acct.resourceCode}`,
        });
      }
      const normUom = normalizeBackendUom(ln.resourceUnit || acct.resourceUomNormalized);
      if (normUom !== acct.resourceUomNormalized) {
        return res.status(400).json({ code: 'UBOQ_UOM_MISMATCH', error: `Expected ${acct.resourceUomNormalized}, got ${normUom}` });
      }
      const qty = Number(ln.quantity);
      if (!(qty > 0) || qty > Number(acct.remainingProcurementQty) + 0.0001) {
        return res.status(409).json({
          code: 'UBOQ_CEILING_EXCEEDED',
          error: `Requested MRF qty (${qty}) exceeds remainingProcurementQty (${acct.remainingProcurementQty})`,
        });
      }
      createPayload.push({
        consolidatedBoqItemId: acct.consolidatedBoqItemId,
        canonicalResourceId: acct.id,
        uboqResourceRequirementId: targetPrrId,
        resourceUnit: acct.resourceUomNormalized,
        quantity: qty,
      });
    }

    const mr = await prisma.materialRequest.create({
      data: {
        mrNumber: `MR-UBOQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        projectId,
        requesterId: actorId,
        status: 'SUBMITTED',
        purpose: purpose || 'UBOQ Governed Resource Request',
        priority: priority || 'NORMAL',
        locationOfUse: locationOfUse || 'Project Site',
        remarks: remarks || null,
        items: { create: createPayload },
      },
      include: { items: true },
    });

    return res.status(201).json(mr);
  } catch (err: any) {
    const msg = String(err.message || '');
    return res.status(mapUboqHttpErrorStatus(msg)).json({ error: msg });
  }
});

router.post('/mrf/:mrId/status', async (req, res) => {
  try {
    const actorId = (req as any).user?.id;
    const actorRole = (req as any).pbacContext?.simulatedRole || (req as any).user?.role || '';
    const simRole = (req as any).pbacContext?.simulatedRole || null;
    const { mrId } = req.params;
    const { newStatus, remarks } = req.body;

    const mrPre = await prisma.materialRequest.findUnique({
      where: { id: mrId },
      include: { items: true },
    });
    if (!mrPre) return res.status(404).json({ error: 'MRF not found' });

    const requiredCapability = ['APPROVED', 'REJECTED', 'CANCELLED', 'VOID'].includes(newStatus)
      ? 'UBOQ_MRF_APPROVE'
      : 'UBOQ_MRF_CREATE';

    await assertUboqStageAuthorization(prisma, {
      userId: actorId,
      projectId: mrPre.projectId,
      capability: requiredCapability,
      simulatedRole: simRole,
    });
    await assertBackendProjectAccess(prisma, actorId, actorRole, mrPre.projectId);

    if (newStatus === 'APPROVED' && mrPre.requesterId === actorId) {
      return res.status(403).json({
        code: 'UBOQ_SOD_VIOLATION',
        error: 'Segregation of Duties violation: MRF requester cannot self-approve MaterialRequest',
      });
    }

    const govResourceIds = mrPre.items.map((i) => i.canonicalResourceId).filter((x): x is string => Boolean(x));

    const updated = await withBackendLockedAccountsTx(prisma, govResourceIds, async ({ tx, txId, lockedAccounts }) => {
      const mr = await tx.materialRequest.findUnique({
        where: { id: mrId },
        include: { items: true },
      });
      if (!mr) throw new Error('MRF not found');
      if (mr.status === newStatus) return mr;

      if (newStatus === 'APPROVED' && mr.status !== 'APPROVED') {
        for (const item of mr.items) {
          if (!item.canonicalResourceId) continue;
          const acct = lockedAccounts.get(item.canonicalResourceId);
          if (!acct) throw new Error('UBOQ_ACCOUNT_NOT_FOUND');
          if (!acct.activeApprovedPrId || item.uboqResourceRequirementId !== acct.activeApprovedPrId) {
            throw new Error(`UBOQ_SUPERSEDED_PRR_APPROVAL_BLOCKED: MRF item references superseded PRR ${item.uboqResourceRequirementId}`);
          }
          const reqQty = item.approvedQuantity ?? item.quantity;
          if (!(reqQty > 0) || reqQty > acct.remainingProcurementQty + 0.0001) {
            throw new Error(
              `UBOQ_MRF_APPROVAL_CEILING_EXCEEDED: Requested ${reqQty} exceeds remainingProcurementQty ${acct.remainingProcurementQty}`
            );
          }
          const nextAcct = await postBackendResourceLedgerDelta(tx, txId, acct, {
            prrSnapshotId: item.uboqResourceRequirementId,
            eventType: 'MRF_RESERVE',
            sourceModule: 'MRF_BACKEND',
            sourceHeaderId: mr.id,
            sourceLineId: item.id,
            idempotencyKey: `MRF_RESERVE:${mr.id}:${item.id}`,
            qtyDeltaOpenMr: reqQty,
            actorUserId: actorId,
            remarks: remarks || `MRF ${mr.mrNumber} approved`,
          });
          lockedAccounts.set(acct.id, nextAcct);
          await tx.materialRequestItem.update({
            where: { id: item.id },
            data: { approvedQuantity: reqQty },
          });
        }
      } else if (mr.status === 'APPROVED' && ['CANCELLED', 'REJECTED', 'VOID'].includes(newStatus)) {
        for (const item of mr.items) {
          if (!item.canonicalResourceId) continue;
          const acct = lockedAccounts.get(item.canonicalResourceId);
          if (!acct) throw new Error('UBOQ_ACCOUNT_NOT_FOUND');
          const unalloc = Math.max(0, Number(((item.approvedQuantity ?? item.quantity) - (item.poAllocatedQty ?? 0)).toFixed(4)));
          if (unalloc > 0) {
            const nextAcct = await postBackendResourceLedgerDelta(tx, txId, acct, {
              prrSnapshotId: item.uboqResourceRequirementId,
              eventType: 'MRF_RELEASE',
              sourceModule: 'MRF_BACKEND',
              sourceHeaderId: mr.id,
              sourceLineId: item.id,
              idempotencyKey: `MRF_RELEASE:${mr.id}:${item.id}:${newStatus}`,
              qtyDeltaOpenMr: -unalloc,
              actorUserId: actorId,
              remarks: remarks || `MRF ${mr.mrNumber} ${newStatus}`,
            });
            lockedAccounts.set(acct.id, nextAcct);
          }
        }
      }

      return tx.materialRequest.update({
        where: { id: mr.id },
        data: {
          status: newStatus,
          ...(newStatus === 'APPROVED' ? { approverId: actorId } : {}),
          ...(remarks ? { remarks } : {}),
        },
        include: { items: true },
      });
    });

    return res.json(updated);
  } catch (err: any) {
    const msg = String(err.message || '');
    return res.status(mapUboqHttpErrorStatus(msg)).json({ error: msg });
  }
});

export default router;

router.post('/project/:projectId/documents/:documentId/review-revision', async (req, res) => {
  try {
    const actor = (req as any).user;
    const { projectId, documentId } = req.params;
    await assertUboqStageAuthorization(prisma, { userId: actor.id, projectId, capability: 'UBOQ_INTAKE_STAGE', simulatedRole: (req as any).pbacContext?.simulatedRole || null });
    const revision = await withUboqRlsContext({ userId: actor.id, sessionVersion: actor.sessionVersion ?? 0, projectId }, () =>
      forkApprovedSourceReviewRevision(prisma, { projectId, sourceDocumentId: documentId, preparedByUserId: actor.id }));
    return res.status(201).json(redactBackendObject(revision, (req as any).pbacContext?.simulatedRole || actor.role));
  } catch (err: any) {
    const message = String(err.message || '');
    return res.status(mapUboqHttpErrorStatus(message)).json({ error: message });
  }
});

router.post('/project/:projectId/sync-schedule-links', async (req, res) => {
  try {
    const actor = (req as any).user;
    const { projectId } = req.params;
    const actorRole = (req as any).pbacContext?.simulatedRole || actor?.role || '';
    const simRole = (req as any).pbacContext?.simulatedRole || null;

    await assertUboqStageAuthorization(prisma, {
      userId: actor?.id,
      projectId,
      capability: 'UBOQ_INTAKE_STAGE',
      simulatedRole: simRole,
    });

    // Schedule-created-AFTER-approval path: idempotent re-run; synced:false returned verbatim with reason.
    const result = await withUboqRlsContext(
      { userId: actor.id, sessionVersion: actor.sessionVersion ?? 0, projectId },
      () =>
        tryAutoSyncProjectScheduleLinks(prisma, {
          projectId,
          actorUserId: actor.id,
          simulatedRole: simRole,
        })
    );
    return res.status(200).json(redactBackendObject(result, actorRole));
  } catch (err: any) {
    const message = String(err.message || '');
    return res.status(mapUboqHttpErrorStatus(message)).json({ error: message });
  }
});

router.post('/project/:projectId/schedules/:scheduleId/sync-links', async (req, res) => {
  try {
    const actor = (req as any).user;
    const { projectId, scheduleId } = req.params;
    const actorRole = (req as any).pbacContext?.simulatedRole || actor?.role || '';
    const simRole = (req as any).pbacContext?.simulatedRole || null;
    const { requireCompleteAllocation } = req.body || {};

    const synced = await withUboqRlsContext(
      { userId: actor.id, sessionVersion: actor.sessionVersion ?? 0, projectId },
      () =>
        syncUboqScheduleActivityLinks(prisma, {
          projectId,
          scheduleId,
          actorUserId: actor.id,
          simulatedRole: simRole,
          requireCompleteAllocation: Boolean(requireCompleteAllocation),
        })
    );

    return res.status(200).json(redactBackendObject(synced, actorRole));
  } catch (err: any) {
    const message = String(err.message || '');
    return res.status(mapUboqHttpErrorStatus(message)).json({ error: message });
  }
});
