import { NextRequest, NextResponse } from 'next/server';
import type { UboqSectorType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { withUboqRlsContext } from '@/lib/uboq/project-ownership';
import { assertUboqStageAuthorization } from '@/lib/uboq/security/stage-rbac';
import { redactUboqPayloadForRole } from '@/lib/uboq/security/redact-payload';
import { STANDARD_TAX_PROFILES } from '@/lib/uboq/tax-engine';
import { scanUploadedDocumentSecurity } from '@/lib/uboq/intake/security-guard';
import {
  approveOperationalSnapshotAndPrrs,
  ingestAndStageProjectUboqPackage,
  regenerateDraftSnapshotFromVerifiedDocument,
  resolveExtractionCandidateHumanReview,
  type ResourceTakeoffSpecInput,
} from '@/lib/uboq/adapters/snapshot-orchestrator';
import { tryAutoSyncProjectScheduleLinks } from '@/lib/uboq/adapters/schedule-link-adapter';

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
      const file = formData.get('file');
      if (!projectId || !(file instanceof File) || file.size === 0 || file.size > 25 * 1024 * 1024) {
        return NextResponse.json({ error: 'UBOQ_INVALID_INTAKE_PAYLOAD' }, { status: 400 });
      }
      const sectorType = String(formData.get('sectorType') || '').trim() as UboqSectorType;
      const taxProfileCode = String(formData.get('taxProfileCode') || '').trim();
      const profile = Object.hasOwn(STANDARD_TAX_PROFILES, taxProfileCode)
        ? STANDARD_TAX_PROFILES[taxProfileCode] : undefined;
      if (!['GOVERNMENT', 'CORPORATE', 'PRIVATE'].includes(sectorType) || profile?.sectorType !== sectorType) {
        return NextResponse.json({ error: 'UBOQ_EXPLICIT_COMPATIBLE_TAX_PROFILE_REQUIRED' }, { status: 400 });
      }
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
          const project = await prisma.project.findUnique({
            where: { id: projectId }, select: { projectCategory: true },
          });
          if (!project || project.projectCategory !== sectorType) {
            throw new Error('UBOQ_PROJECT_SECTOR_CONFIRMATION_REQUIRED');
          }
          const buffer = Buffer.from(await file.arrayBuffer());
          const scan = scanUploadedDocumentSecurity(file.name, buffer, file.type);
          if (!scan.safe || scan.findings.length > 0) {
            throw new Error('UBOQ_INTAKE_SECURITY_BLOCKED');
          }
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
        async () => {
          await assertUboqStageAuthorization(prisma, {
            userId: actor.userId, projectId, capability: 'UBOQ_INTAKE_STAGE',
          });
          const source = await prisma.uboqSourceDocument.findFirst({
            where: { id: String(body.sourceDocumentId || ''), projectId },
            select: { metadataJson: true },
          });
          const metadata = source?.metadataJson as { stagedIntakeOptions?: {
            sectorType?: string; taxProfileCode?: string;
          } } | null;
          const sectorType = String(body.sectorType ?? metadata?.stagedIntakeOptions?.sectorType ?? '').trim() as UboqSectorType;
          const taxProfileCode = String(body.taxProfileCode ?? metadata?.stagedIntakeOptions?.taxProfileCode ?? '').trim();
          const profile = Object.hasOwn(STANDARD_TAX_PROFILES, taxProfileCode)
            ? STANDARD_TAX_PROFILES[taxProfileCode] : undefined;
          const project = await prisma.project.findUnique({
            where: { id: projectId }, select: { projectCategory: true },
          });
          if (!source || !profile || profile.sectorType !== sectorType || project?.projectCategory !== sectorType) {
            throw new Error('UBOQ_EXPLICIT_COMPATIBLE_TAX_PROFILE_REQUIRED');
          }
          return regenerateDraftSnapshotFromVerifiedDocument(prisma as never, {
            projectId,
            sourceDocumentId: String(body.sourceDocumentId || ''),
            preparedByUserId: actor.userId,
            sectorType,
            clientName: body.clientName,
            contractRef: body.contractRef,
            taxProfileCode,
            resourceTakeoffs: body.resourceTakeoffs as ResourceTakeoffSpecInput[] | undefined,
          });
        }
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
          const approvedSnapshot = await approveOperationalSnapshotAndPrrs(prisma as never, {
            snapshotId,
            approverUserId: actor.userId,
          });
          // P9-DEF-SYNC-01: same UBOQ-side schedule-link behavior as approveUboqSnapshotAction and the
          // Express approval API. Non-blocking: failures are reported explicitly as synced:false + reason.
          const scheduleLinkSync = await tryAutoSyncProjectScheduleLinks(prisma as never, {
            projectId,
            actorUserId: actor.userId,
          });
          return { ...approvedSnapshot, scheduleLinkSync };
        }
      );
      return NextResponse.json(redactUboqPayloadForRole(approved, actor.role), {
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }

    if (action === 'SYNC_SCHEDULE_LINKS') {
      // Covers the schedule-created-AFTER-approval sequence: re-runs the idempotent UBOQ-side adapter.
      // Authorization (UBOQ_INTAKE_STAGE + project RLS) is enforced inside the adapter; synced:false is
      // returned verbatim with its exact reason and is never reported as a linkage success.
      const synced = await withUboqRlsContext(
        { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId },
        async () => {
          await assertUboqStageAuthorization(prisma, {
            userId: actor.userId,
            projectId,
            capability: 'UBOQ_INTAKE_STAGE',
          });
          return tryAutoSyncProjectScheduleLinks(prisma as never, {
            projectId,
            actorUserId: actor.userId,
          });
        }
      );
      return NextResponse.json(redactUboqPayloadForRole(synced, actor.role), {
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
        : /UBOQ_XLSX_LIMIT_EXCEEDED|UBOQ_XLSX_EMPTY_WORKBOOK/i.test(msg)
          ? 422
          : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
