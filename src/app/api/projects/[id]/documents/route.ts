import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { assertUboqStageAuthorization } from '@/lib/uboq/security/stage-rbac';
import { withUboqRlsContext, applyProjectRlsSessionVars } from '@/lib/uboq/project-ownership';
import { scanUploadedDocumentSecurity } from '@/lib/uboq/intake/security-guard';
import { resolveUboqVaultStorageProvider } from '@/lib/uboq/storage/vault-storage';
import { requireProjectDocumentPermission } from '@/lib/uboq/security/document-permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EVIDENCE_ROLES = new Set([
  'CONTRACT', 'AGENCY_ESTIMATE', 'DUPA', 'TECHNICAL_SPEC',
  'DRAWING', 'SCHEDULE', 'PROCUREMENT', 'PROGRESS_EVIDENCE',
  'FINANCIAL_EVIDENCE', 'PERMIT', 'OTHER',
]);

// The Universal BOQ structured intake remains the sole path for CONTRACT_BOQ;
// supporting documents are stored as immutable evidence, never silently parsed
// into an operational or draft financial baseline.
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = await verifyOperationalSession();
  if (!actor) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { id: projectId } = await context.params;
  try {
    const form = await request.formData();
    const documentRole = String(form.get('documentRole') ?? '').trim();
    const file = form.get('file');

    if (!EVIDENCE_ROLES.has(documentRole) || !(file instanceof File) || file.size === 0 || file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'INVALID_EVIDENCE_UPLOAD' }, { status: 400 });
    }

    return await withUboqRlsContext(
      { projectId, userId: actor.userId, sessionVersion: actor.sessionVersion },
      async () => {
        await assertUboqStageAuthorization(prisma, {
          projectId, userId: actor.userId, capability: 'UBOQ_INTAKE_STAGE',
        });

        await requireProjectDocumentPermission(actor.role, 'canUploadAttachment');
        const buffer = Buffer.from(await file.arrayBuffer());
        const scan = scanUploadedDocumentSecurity(file.name, buffer, file.type);
        if (!scan.safe || scan.findings.length > 0) {
          return NextResponse.json({ error: 'EVIDENCE_SECURITY_VALIDATION_FAILED' }, { status: 400 });
        }

        const existing = await prisma.$transaction(async (tx) => {
          await applyProjectRlsSessionVars(tx, {
            projectId, userId: actor.userId, sessionVersion: actor.sessionVersion,
          });
          return tx.uboqSourceDocument.findUnique({
            where: { projectId_sha256Hash_documentRole: {
              projectId, sha256Hash: scan.sha256Hash, documentRole,
            } },
            select: { id: true, storageUri: true, sha256Hash: true },
          });
        });

        const vault = resolveUboqVaultStorageProvider();
        if (existing) {
          await vault.getAndVerify({
            storageUri: existing.storageUri,
            expectedProjectId: projectId,
            expectedSha256Hash: existing.sha256Hash,
          });
          return NextResponse.json({ id: existing.id, duplicate: true, status: 'PRESERVED_EVIDENCE' }, {
            headers: { 'Cache-Control': 'private, no-store' },
          });
        }

        const stored = await vault.putImmutableAndVerify({
          projectId, sha256Hash: scan.sha256Hash,
          fileName: file.name, mimeType: scan.canonicalMimeType, buffer,
        });

        try {
          const created = await prisma.$transaction(async (tx) => {
            await applyProjectRlsSessionVars(tx, {
              projectId, userId: actor.userId, sessionVersion: actor.sessionVersion,
            });
            return tx.uboqSourceDocument.create({
              data: {
                projectId, fileName: file.name, documentRole, byteSize: file.size,
                mimeType: scan.canonicalMimeType, magicSignature: scan.magicSignature,
                sha256Hash: scan.sha256Hash, storageUri: stored.storageUri,
                isLockedImmutable: true, uploadedById: actor.userId,
                metadataJson: {
                  intakeMode: 'EVIDENCE_ONLY',
                  reviewState: 'PENDING_CLASSIFICATION_REVIEW',
                } as Prisma.InputJsonValue,
              },
              select: { id: true },
            });
          });
          return NextResponse.json({
            id: created.id, duplicate: false, status: 'PRESERVED_EVIDENCE',
          }, {
            status: 201,
            headers: { 'Cache-Control': 'private, no-store' },
          });
        } catch (err) {
          // Another request may have committed the same document after our lookup.
          if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
            const winner = await prisma.$transaction(async tx => {
              await applyProjectRlsSessionVars(tx, {
                projectId, userId: actor.userId, sessionVersion: actor.sessionVersion,
              });
              return tx.uboqSourceDocument.findUnique({
                where: { projectId_sha256Hash_documentRole: {
                  projectId, sha256Hash: scan.sha256Hash, documentRole,
                } },
                select: { id: true, storageUri: true, sha256Hash: true },
              });
            });
            if (winner) {
              await vault.getAndVerify({ storageUri: winner.storageUri,
                expectedProjectId: projectId, expectedSha256Hash: winner.sha256Hash });
              return NextResponse.json({ id: winner.id, duplicate: true, status: 'PRESERVED_EVIDENCE' }, {
                headers: { 'Cache-Control': 'private, no-store' },
              });
            }
          }
          // Content-addressed objects can be shared by concurrent requests/categories.
          // Retain failures for reference-aware reconciliation; never delete inline.
          throw err;
        }
      }
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : 'EVIDENCE_UPLOAD_FAILED';
    const forbidden = /UNAUTHORIZED|FORBIDDEN|RBAC|PBAC|SPOOFING|DENIED/i.test(code);
    return NextResponse.json({ error: forbidden ? 'ACCESS_DENIED' : 'UPLOAD_FAILED' }, {
      status: forbidden ? 403 : 400,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }
}
