import { NextRequest, NextResponse } from 'next/server';
import type { UboqSectorType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { withUboqRlsContext } from '@/lib/uboq/project-ownership';
import { assertUboqStageAuthorization } from '@/lib/uboq/security/stage-rbac';
import { redactUboqPayloadForRole } from '@/lib/uboq/security/redact-payload';
import { STANDARD_TAX_PROFILES } from '@/lib/uboq/tax-engine';
import { scanUploadedDocumentSecurity } from '@/lib/uboq/intake/security-guard';
import { extractUniversalDocumentPackage } from '@/lib/uboq/intake/parsers';
import { streamVerifiedXlsxWorksheets } from '@/lib/uboq/intake/xlsx-streaming-reader';
import {
  buildSignalsFromContractExtraction,
  classifyDocumentProjectRelevance,
  extractWorkbookIdentitySignals,
  type DocumentRelevanceAssessment,
} from '@/lib/uboq/project-relevance';
import {
  computeCanonicalDocumentFingerprint,
  evaluateCrossProjectDocumentOwnership,
  type CanonicalDocumentFingerprint,
  type ExistingDocumentOwnershipRecord,
} from '@/lib/uboq/document-ownership-guard';
import type { ReconcilerWorksheetInput } from '@/lib/uboq/awarded-boq-reconciler';
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
      const confirmProjectAssociation = String(formData.get('confirmProjectAssociation') || '').trim().toLowerCase() === 'true';

      const staged = await withUboqRlsContext(
        { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId },
        async () => {
          await assertUboqStageAuthorization(prisma, {
            userId: actor.userId,
            projectId,
            capability: 'UBOQ_INTAKE_STAGE',
          });
          const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true, name: true, projectCategory: true, contractNumber: true, client: true, location: true },
          });
          if (!project || project.projectCategory !== sectorType) {
            throw new Error('UBOQ_PROJECT_SECTOR_CONFIRMATION_REQUIRED');
          }
          const buffer = Buffer.from(await file.arrayBuffer());
          const scan = scanUploadedDocumentSecurity(file.name, buffer, file.type);
          if (!scan.safe || scan.findings.length > 0) {
            throw new Error('UBOQ_INTAKE_SECURITY_BLOCKED');
          }

          // Rule 6: Preserve all original documents already legitimately stored (idempotent replay bypasses new-upload block)
          const existingStored =
            !allowDuplicateNewRevision &&
            typeof prisma.uboqSourceDocument?.findUnique === 'function' &&
            scan.sha256Hash
              ? await prisma.uboqSourceDocument.findUnique({
                  where: {
                    projectId_sha256Hash_documentRole: {
                      projectId,
                      sha256Hash: scan.sha256Hash,
                      documentRole,
                    },
                  },
                  select: { id: true },
                })
              : null;

          if (!existingStored) {
            const priorDocs =
              typeof prisma.uboqSourceDocument?.findMany === 'function'
                ? await prisma.uboqSourceDocument.findMany({
                    where: { projectId },
                    select: { metadataJson: true },
                    take: 25,
                  })
                : [];
            const knownRefs: string[] = [];
            for (const pd of priorDocs) {
              const m = pd.metadataJson && typeof pd.metadataJson === 'object' ? (pd.metadataJson as Record<string, unknown>) : null;
              const ce = m?.contractExtraction && typeof m.contractExtraction === 'object' ? (m.contractExtraction as Record<string, unknown>) : null;
              const f = ce?.fields && typeof ce.fields === 'object' ? (ce.fields as Record<string, { value?: unknown } | null>) : null;
              for (const key of ['projectReference', 'contractReference', 'noticeOfAwardRef', 'noticeToProceedRef']) {
                if (typeof f?.[key]?.value === 'string') knownRefs.push(String(f[key]!.value));
              }
            }

            const selectedIdentity = {
              projectId: project.id,
              projectName: project.name,
              contractNumber: project.contractNumber,
              clientName: project.client,
              location: project.location,
              knownReferences: knownRefs,
            };

            let relevance: DocumentRelevanceAssessment;
            let extractionVerified = false;
            let incomingFingerprint: CanonicalDocumentFingerprint | null = null;
            try {
              if (scan.detectedFormat === 'XLSX') {
                const previewSheets: ReconcilerWorksheetInput[] = [];
                await streamVerifiedXlsxWorksheets(buffer, ({ sheetName, rows }) => {
                  if (previewSheets.length < 4) {
                    previewSheets.push({ sheetName, rows: rows.slice(0, 15) });
                  }
                });
                const wbSignals = extractWorkbookIdentitySignals(file.name, previewSheets, documentRole);
                relevance = classifyDocumentProjectRelevance(selectedIdentity, wbSignals);
                extractionVerified = true;
                incomingFingerprint = computeCanonicalDocumentFingerprint({
                  workbookSignals: wbSignals,
                  extractionVerified: true,
                });
              } else if (['PDF', 'IMAGE', 'DOCX'].includes(scan.detectedFormat)) {
                const extracted = await extractUniversalDocumentPackage(file.name, buffer, {
                  declaredMimeType: file.type,
                });
                if (extracted.contractExtraction) {
                  relevance = classifyDocumentProjectRelevance(
                    selectedIdentity,
                    buildSignalsFromContractExtraction(extracted.contractExtraction, documentRole)
                  );
                  extractionVerified = true;
                  incomingFingerprint = computeCanonicalDocumentFingerprint({
                    boqVerification: extracted.awardedBoqVerification ?? null,
                    contractExtraction: extracted.contractExtraction,
                    extractedText: (extracted.extractedTextPages ?? []).map((p) => p.text).join('\n'),
                    extractionVerified: true,
                  });
                } else {
                  relevance = classifyDocumentProjectRelevance(selectedIdentity, {
                    fileName: file.name,
                    documentRole,
                  });
                  extractionVerified = false;
                  incomingFingerprint = computeCanonicalDocumentFingerprint({
                    boqVerification: extracted.awardedBoqVerification ?? null,
                    extractionVerified: false,
                  });
                }
              } else {
                // CSV / XLS / JSON lightweight header-text inspection for foreign project refs
                const headText = scan.detectedFormat === 'CSV' ? buffer.subarray(0, 4096).toString('utf8') : '';
                const contractRefMatch = /(?:^|\n)\s*(?:Contract\s*(?:ID|Ref(?:erence)?|No\.?)|Project\s*ID)\s*[,:]\s*([^\r\n,]+)/i.exec(headText);
                const clientMatch = /(?:^|\n)\s*(?:Client|Project\s*Owner|Implementing\s*Office)\s*[,:]\s*([^\r\n,]+)/i.exec(headText);
                const projectNameMatch = /(?:^|\n)\s*(?:Project\s*Name|Contract\s*Name)\s*[,:]\s*([^\r\n,]+)/i.exec(headText);
                const csvSignals = {
                  fileName: file.name,
                  documentRole,
                  contractReference: contractRefMatch ? contractRefMatch[1].trim() : null,
                  projectReference: contractRefMatch ? contractRefMatch[1].trim() : null,
                  clientName: clientMatch ? clientMatch[1].trim() : null,
                  projectName: projectNameMatch ? projectNameMatch[1].trim() : null,
                  rawHeaderText: headText.slice(0, 1000) || null,
                };
                relevance = classifyDocumentProjectRelevance(selectedIdentity, csvSignals);
                extractionVerified = true;
                incomingFingerprint = computeCanonicalDocumentFingerprint({
                  workbookSignals: csvSignals,
                  extractedText: headText || null,
                  extractionVerified: true,
                });
              }
            } catch {
              // Rule 5: Extraction failure MUST NEVER be treated as verified project information.
              extractionVerified = false;
              relevance = {
                status: 'NEEDS_CONFIRMATION',
                disposition: 'HOLD_FOR_USER_CONFIRMATION',
                confidence: 0,
                reason: 'Document contents could not be verified automatically; financial and operational processing is held until project association is confirmed.',
                matchedSignals: [],
                conflictingSignals: [],
                extractedIdentifiers: {
                  projectName: null,
                  projectReference: null,
                  contractReference: null,
                  clientName: null,
                  awardedContractor: null,
                },
              };
              incomingFingerprint = computeCanonicalDocumentFingerprint({ extractionVerified: false });
            }

            // Global Cross-Project Approved-Document Ownership Guard (NEVER overridable by confirmProjectAssociation or allowDuplicateNewRevision!)
            if (typeof prisma.uboqSourceDocument?.findMany === 'function' && scan.sha256Hash && incomingFingerprint) {
              const crossDocs = await prisma.uboqSourceDocument.findMany({
                where: { projectId: { not: projectId } },
                select: {
                  id: true,
                  projectId: true,
                  sha256Hash: true,
                  documentRole: true,
                  metadataJson: true,
                  project: {
                    select: {
                      contractNumber: true,
                      contractAmount: true,
                      boqLocked: true,
                      managerId: true,
                    },
                  },
                },
                take: 200,
              });
              const isGlobalReader = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'EXECUTIVE', 'PRESIDENT', 'VP_OPERATIONS'].includes(
                actor.role.toUpperCase()
              );
              const existingOwnership: ExistingDocumentOwnershipRecord[] = crossDocs
                .filter((cd) => cd && typeof cd.projectId === 'string' && cd.projectId !== projectId)
                .map((cd) => {
                  const m = cd.metadataJson && typeof cd.metadataJson === 'object' ? (cd.metadataJson as Record<string, unknown>) : null;
                  const fp = m?.documentOwnership && typeof m.documentOwnership === 'object'
                    ? (m.documentOwnership as Partial<CanonicalDocumentFingerprint>)
                    : null;
                  const projObj = cd.project as { contractNumber?: string | null; contractAmount?: number | null; boqLocked?: boolean | null; managerId?: string | null } | undefined;
                  const isApproved = Boolean(
                    projObj?.boqLocked ||
                    (typeof projObj?.contractAmount === 'number' && projObj.contractAmount > 0)
                  );
                  return {
                    documentId: cd.id,
                    projectId: cd.projectId,
                    sha256Hash: cd.sha256Hash,
                    documentRole: cd.documentRole,
                    isProjectApprovedOrVerified: isApproved,
                    actorCanAccessOwningProject: isGlobalReader || projObj?.managerId === actor.userId,
                    projectContractRefs: projObj?.contractNumber ? [projObj.contractNumber] : [],
                    fingerprint: fp,
                  };
                });

              const ownershipDecision = evaluateCrossProjectDocumentOwnership({
                selectedProjectId: projectId,
                incomingSha256: scan.sha256Hash,
                incomingRole: documentRole,
                incomingFingerprint,
                allowDuplicateNewRevision,
                existingDocuments: existingOwnership,
              });

              if (
                ownershipDecision.decision === 'HARD_BLOCK_CROSS_PROJECT_DUPLICATE' ||
                ownershipDecision.decision === 'HARD_BLOCK_FOREIGN_CONTRACT_IDENTITY'
              ) {
                throw new Error(`${ownershipDecision.code}: ${ownershipDecision.message}`);
              }
              if (ownershipDecision.decision === 'HOLD_UNCERTAIN_OWNERSHIP') {
                throw new Error(`${ownershipDecision.code}: ${ownershipDecision.message}`);
              }
            }

            // Rule 1: UNRELATED files are ALWAYS rejected HTTP 422 BEFORE any vault or DB write,
            // REGARDLESS of confirmProjectAssociation!
            if (relevance.status === 'UNRELATED') {
              throw new Error(`UBOQ_UNRELATED_DOCUMENT_BLOCKED: ${relevance.reason}`);
            }

            // Rule 2 & Rule 5: NEEDS_CONFIRMATION or unverified extraction holds financial/operational
            // staging until explicitly confirmed by the user (zero vault/DB write while unconfirmed).
            if ((relevance.status === 'NEEDS_CONFIRMATION' || !extractionVerified) && !confirmProjectAssociation) {
              throw new Error(`UBOQ_PROJECT_RELEVANCE_CONFIRMATION_REQUIRED: ${relevance.reason}`);
            }

            // Rule 4: RELEVANT_SUPPORTING_DOCUMENT must not enter CONTRACT_BOQ financial calculations directly
            // when uploaded as a non-BOQ supporting role via intake; preserve safely without inventing contract amounts.
            if (relevance.status === 'RELEVANT_SUPPORTING_DOCUMENT' && documentRole !== 'CONTRACT_BOQ' && !confirmProjectAssociation) {
              throw new Error(
                'UBOQ_SUPPORTING_DOCUMENT_USE_EVIDENCE_REGISTER: Supporting documents must be stored as supporting evidence and are excluded from awarded contract BOQ calculations.'
              );
            }
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
      : /UBOQ_XLSX_LIMIT_EXCEEDED|UBOQ_XLSX_EMPTY_WORKBOOK|UBOQ_UNRELATED_DOCUMENT_BLOCKED|UBOQ_CROSS_PROJECT_DUPLICATE_BLOCKED|UBOQ_SUPPORTING_DOCUMENT_USE_EVIDENCE_REGISTER/i.test(msg)
        ? 422
        : /CONFLICT|DUPLICATE|ALREADY|LUMP_SUM|MISMATCH|UBOQ_PROJECT_RELEVANCE_CONFIRMATION_REQUIRED|UBOQ_OWNERSHIP_VERIFICATION_REQUIRED/i.test(msg)
          ? 409
          : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
