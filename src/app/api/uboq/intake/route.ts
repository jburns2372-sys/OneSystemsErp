import { NextRequest, NextResponse } from 'next/server';
import type { UboqSectorType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { withUboqRlsContext } from '@/lib/uboq/project-ownership';
import { assertUboqStageAuthorization } from '@/lib/uboq/security/stage-rbac';
import { redactUboqPayloadForRole } from '@/lib/uboq/security/redact-payload';
import {
  approveOperationalSnapshotAndPrrs,
  ingestAndStageProjectUboqPackage,
  regenerateDraftSnapshotFromVerifiedDocument,
  resolveExtractionCandidateHumanReview,
  type ResourceTakeoffSpecInput,
} from '@/lib/uboq/adapters/snapshot-orchestrator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const actor = await verifyOperationalSession();
  if (!actor) {
    return NextResponse.json({ error: 'UBOQ_UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const projectId = String(formData.get('projectId') || '').trim();
      const file = formData.get('file') as File | null;
      if (!projectId || !file || file.size === 0) {
        return NextResponse.json({ error: 'UBOQ_INVALID_INTAKE_PAYLOAD' }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const sectorType = String(formData.get('sectorType') || 'CORPORATE') as UboqSectorType;
      const taxProfileCode = String(formData.get('taxProfileCode') || 'CORP_PH_VAT_EXCL_12');
      const documentRole = String(formData.get('documentRole') || 'CONTRACT_BOQ');
      const allowDuplicateNewRevision = String(formData.get('allowDuplicateNewRevision') || '') === 'true';

      const staged = await withUboqRlsContext(
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

      return NextResponse.json(redactUboqPayloadForRole(staged, actor.role), {
        status: 201,
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }

    const body = await request.json();
    const action = String(body?.action || '');
    const projectId = String(body?.projectId || '').trim();
    if (!projectId) {
      return NextResponse.json({ error: 'UBOQ_PROJECT_ID_REQUIRED' }, { status: 400 });
    }

    if (action === 'RESOLVE_CANDIDATE') {
      const resolved = await withUboqRlsContext(
        { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId },
        async () =>
          resolveExtractionCandidateHumanReview(prisma as never, {
            projectId,
            candidateId: String(body.candidateId || ''),
            reviewerUserId: actor.userId,
            decision: body.decision === 'HUMAN_EXCLUDED' ? 'HUMAN_EXCLUDED' : 'HUMAN_VERIFIED',
            reviewNotes: String(body.reviewNotes || ''),
            canonicalFieldRemap: body.canonicalFieldRemap,
            correctedMappedFields: body.correctedMappedFields,
          })
      );
      return NextResponse.json(redactUboqPayloadForRole(resolved, actor.role), {
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }

    if (action === 'REGENERATE_DRAFT_SNAPSHOT') {
      const regenerated = await withUboqRlsContext(
        { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId },
        async () =>
          regenerateDraftSnapshotFromVerifiedDocument(prisma as never, {
            projectId,
            sourceDocumentId: String(body.sourceDocumentId || ''),
            preparedByUserId: actor.userId,
            sectorType: body.sectorType as UboqSectorType | undefined,
            clientName: body.clientName,
            contractRef: body.contractRef,
            taxProfileCode: body.taxProfileCode,
            resourceTakeoffs: body.resourceTakeoffs as ResourceTakeoffSpecInput[] | undefined,
          })
      );
      return NextResponse.json(redactUboqPayloadForRole(regenerated, actor.role), {
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }

    if (action === 'APPROVE_SNAPSHOT') {
      const snapshotId = String(body.snapshotId || '').trim();
      const approved = await withUboqRlsContext(
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
            throw new Error('UBOQ_CROSS_PROJECT_SPOOFING_BLOCKED');
          }
          return approveOperationalSnapshotAndPrrs(prisma as never, {
            snapshotId,
            approverUserId: actor.userId,
          });
        }
      );
      return NextResponse.json(redactUboqPayloadForRole(approved, actor.role), {
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }

    return NextResponse.json({ error: 'UBOQ_UNSUPPORTED_INTAKE_ACTION' }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'UBOQ_INTAKE_ERROR';
    const status = /UNAUTHORIZED|FORBIDDEN|SPOOFING|DENIED|RBAC/i.test(msg)
      ? 403
      : /CONFLICT|DUPLICATE|ALREADY|LUMP_SUM|MISMATCH/i.test(msg)
        ? 409
        : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
