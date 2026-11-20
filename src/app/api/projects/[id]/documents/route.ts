import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { assertUboqStageAuthorization } from '@/lib/uboq/security/stage-rbac';
import { withUboqRlsContext, applyProjectRlsSessionVars } from '@/lib/uboq/project-ownership';
import { scanUploadedDocumentSecurity } from '@/lib/uboq/intake/security-guard';
import { extractUniversalDocumentPackage } from '@/lib/uboq/intake/parsers';
import {
  buildSignalsFromContractExtraction,
  classifyDocumentProjectRelevance,
  classifyExtractedFieldRelevance,
  type DocumentRelevanceAssessment,
} from '@/lib/uboq/project-relevance';
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
        const confirmProjectAssociation = String(form.get('confirmProjectAssociation') ?? '').trim().toLowerCase() === 'true';
        const buffer = Buffer.from(await file.arrayBuffer());
        const scan = scanUploadedDocumentSecurity(file.name, buffer, file.type);
        if (!scan.safe || scan.findings.length > 0) {
          return NextResponse.json({ error: 'EVIDENCE_SECURITY_VALIDATION_FAILED' }, { status: 400 });
        }

        // Load selected project identity + existing document references for content-based relevance filtering
        const { existing, projectRecord, priorDocs } = await prisma.$transaction(async (tx) => {
          await applyProjectRlsSessionVars(tx, {
            projectId, userId: actor.userId, sessionVersion: actor.sessionVersion,
          });
          const [existingDoc, proj, docs] = await Promise.all([
            tx.uboqSourceDocument.findUnique({
              where: { projectId_sha256Hash_documentRole: {
                projectId, sha256Hash: scan.sha256Hash, documentRole,
              } },
              select: { id: true, storageUri: true, sha256Hash: true },
            }),
            tx.project.findUnique({
              where: { id: projectId },
              select: { id: true, name: true, contractNumber: true, client: true, location: true },
            }),
            tx.uboqSourceDocument.findMany({
              where: { projectId },
              select: { metadataJson: true },
              take: 25,
            }),
          ]);
          return { existing: existingDoc, projectRecord: proj, priorDocs: docs };
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

        // Extract content metadata for contract & text-readable supporting documents (never filenames alone)
        let contractExtraction: unknown = null;
        let fieldRelevance: unknown = null;
        let projectRelevance: DocumentRelevanceAssessment | null = null;
        const shouldExtractContent =
          documentRole === 'CONTRACT' ||
          ['PDF', 'IMAGE', 'DOCX'].includes(scan.detectedFormat);

        if (shouldExtractContent && projectRecord) {
          try {
            const extracted = await extractUniversalDocumentPackage(file.name, buffer, {
              declaredMimeType: file.type,
            });
            if (extracted.contractExtraction) {
              contractExtraction = extracted.contractExtraction;
              const fullText = (extracted.extractedTextPages ?? []).map((p) => p.text).join('\n');
              fieldRelevance = classifyExtractedFieldRelevance({
                contractDoc: extracted.contractExtraction,
                fullText,
              });

              const knownRefs: string[] = [];
              for (const pd of priorDocs) {
                const m = pd.metadataJson && typeof pd.metadataJson === 'object' ? (pd.metadataJson as Record<string, unknown>) : null;
                const ce = m?.contractExtraction && typeof m.contractExtraction === 'object' ? (m.contractExtraction as Record<string, unknown>) : null;
                const f = ce?.fields && typeof ce.fields === 'object' ? (ce.fields as Record<string, { value?: unknown } | null>) : null;
                for (const key of ['projectReference', 'contractReference', 'noticeOfAwardRef', 'noticeToProceedRef']) {
                  if (typeof f?.[key]?.value === 'string') knownRefs.push(String(f[key]!.value));
                }
              }

              projectRelevance = classifyDocumentProjectRelevance(
                {
                  projectId: projectRecord.id,
                  projectName: projectRecord.name,
                  contractNumber: projectRecord.contractNumber,
                  clientName: projectRecord.client,
                  location: projectRecord.location,
                  knownReferences: knownRefs,
                },
                buildSignalsFromContractExtraction(extracted.contractExtraction, documentRole)
              );

              // Mandatory Project-Relevance Enforcement: an UNRELATED new file MUST NOT attach to this project!
              if (projectRelevance.status === 'UNRELATED' && !confirmProjectAssociation) {
                return NextResponse.json(
                  {
                    error: 'UBOQ_UNRELATED_DOCUMENT_BLOCKED',
                    message: projectRelevance.reason,
                    projectRelevance,
                  },
                  { status: 422, headers: { 'Cache-Control': 'private, no-store' } }
                );
              }
            }
          } catch {
            // Non-blocking fallback: if content extraction fails on an opaque scan/drawing, still preserve safely as evidence
          }
        }

        const stored = await vault.putImmutableAndVerify({
          projectId, sha256Hash: scan.sha256Hash,
          fileName: file.name, mimeType: scan.canonicalMimeType, buffer,
        });

        const reviewState =
          projectRelevance?.status === 'NEEDS_CONFIRMATION' && !confirmProjectAssociation
            ? 'PENDING_PROJECT_RELEVANCE_CONFIRMATION'
            : 'PENDING_CLASSIFICATION_REVIEW';

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
                  reviewState,
                  ...(contractExtraction ? { contractExtraction } : {}),
                  ...(fieldRelevance ? { fieldRelevance } : {}),
                  ...(projectRelevance ? { projectRelevance } : {}),
                } as unknown as Prisma.InputJsonValue,
              },
              select: { id: true },
            });
          });
          return NextResponse.json({
            id: created.id,
            duplicate: false,
            status: reviewState === 'PENDING_PROJECT_RELEVANCE_CONFIRMATION' ? 'NEEDS_CONFIRMATION' : 'PRESERVED_EVIDENCE',
            projectRelevance,
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
