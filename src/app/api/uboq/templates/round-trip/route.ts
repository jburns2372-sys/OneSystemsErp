import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { withUboqRlsContext } from '@/lib/uboq/project-ownership';
import {
  assertSupportedRoundTripTemplateCode,
  issueSignedRoundTripPackage,
  listRoundTripWorkspaceState,
  parseIssueSignedRoundTripRequest,
  persistRoundTripSubmissionRecord,
  resolveActorRoundTripCapabilities,
  type RoundTripConflictMode,
  RoundTripImportError,
  type RoundTripTemplateCode,
  verifyAndStageSignedRoundTripImport,
} from '@/lib/uboq/templates/round-trip-import';

export const runtime = 'nodejs';

const noCache = { 'Cache-Control': 'private, no-store' };
const MAX_JSON_BODY_BYTES = 28 * 1024 * 1024;
const MAX_UPLOAD_FILE_BYTES = 25 * 1024 * 1024;

function failureResponse(error: unknown) {
  if (error instanceof RoundTripImportError) {
    return NextResponse.json(
      {
        error: error.code,
        ...(error.detail ? { detail: error.detail } : {}),
      },
      { status: error.status, headers: noCache }
    );
  }
  const msg = error instanceof Error ? error.message : '';
  const forbidden = /UBOQ_(?:PBAC|RBAC|UNAUTHORIZED|PROJECT_NOT_FOUND)|42501/.test(msg);
  return NextResponse.json(
    { error: forbidden ? 'ROUNDTRIP_ACCESS_DENIED' : 'ROUNDTRIP_REQUEST_FAILED' },
    { status: forbidden ? 403 : 500, headers: noCache }
  );
}

async function readTx<T>(
  actor: { userId: string; sessionVersion: number },
  projectId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return withUboqRlsContext(
    { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId },
    () =>
      prisma.$transaction(
        async (tx) => {
          await tx.$executeRaw`SET TRANSACTION READ ONLY`;
          return fn(tx as unknown as Prisma.TransactionClient);
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
          maxWait: 5000,
          timeout: 15000,
        }
      )
  );
}

async function writeTx<T>(
  actor: { userId: string; sessionVersion: number },
  projectId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return withUboqRlsContext(
    { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId },
    () =>
      prisma.$transaction(
        async (tx) => fn(tx as unknown as Prisma.TransactionClient),
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
          maxWait: 5000,
          timeout: 20000,
        }
      )
  );
}

export async function GET(req: NextRequest) {
  try {
    const actor = await verifyOperationalSession();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noCache });
    }
    const projectId = req.nextUrl.searchParams.get('projectId') || '';
    const templateCodeParam = req.nextUrl.searchParams.get('templateCode');
    if (templateCodeParam !== null && templateCodeParam.trim() !== '') {
      assertSupportedRoundTripTemplateCode(templateCodeParam);
    }
    const data = await readTx(actor, projectId, (tx) =>
      listRoundTripWorkspaceState(tx, actor.userId, projectId)
    );
    return NextResponse.json(data, { headers: noCache });
  } catch (error) {
    return failureResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await verifyOperationalSession();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noCache });
    }

    const contentTypeHeader = (req.headers.get('content-type') || '').toLowerCase();

    if (contentTypeHeader.includes('multipart/form-data')) {
      const form = await req.formData();
      const action = String(form.get('action') || 'verify_import').trim();
      if (action !== 'verify_import') {
        throw new RoundTripImportError('ROUNDTRIP_INVALID_ACTION', 400);
      }
      const projectId = String(form.get('projectId') || '').trim();
      const idempotencyKey = String(form.get('idempotencyKey') || '').trim();
      const conflictModeRaw = String(
        form.get('conflictResolutionMode') || 'STAGE_GOVERNED_CHANGE_PROPOSAL'
      ).trim() as RoundTripConflictMode;
      const allowSuperseded =
        String(form.get('allowSupersededLayoutRevision') || '').trim() === 'true';
      const justification = String(
        form.get('lumpSumOrRoundedOverrideJustification') || ''
      ).trim();
      const changeNote = String(form.get('changeNote') || '').trim();
      const templateHintRaw = String(form.get('templateCode') || 'T1_PHASE_BOQ').trim();

      const fileEntry = form.get('file');
      if (!fileEntry || typeof (fileEntry as Blob).arrayBuffer !== 'function') {
        throw new RoundTripImportError('ROUNDTRIP_FILE_REQUIRED', 400);
      }
      const fileObj = fileEntry as File;
      const ab = await fileObj.arrayBuffer();
      if (ab.byteLength === 0 || ab.byteLength > MAX_UPLOAD_FILE_BYTES) {
        throw new RoundTripImportError('ROUNDTRIP_FILE_SIZE_INVALID', 413);
      }
      const fileBuffer = Buffer.from(ab);
      const fileName = fileObj.name || 'roundtrip-upload.xlsx';

      return await executeVerifyImportWithForensicAudit(actor, {
        projectId,
        idempotencyKey,
        fileName,
        fileBuffer,
        conflictResolutionMode: conflictModeRaw,
        allowSupersededLayoutRevision: allowSuperseded,
        lumpSumOrRoundedOverrideJustification: justification || undefined,
        changeNote: changeNote || undefined,
        templateHint: templateHintRaw,
      });
    }

    const rawText = await req.text();
    if (Buffer.byteLength(rawText, 'utf8') > MAX_JSON_BODY_BYTES) {
      throw new RoundTripImportError('ROUNDTRIP_REQUEST_TOO_LARGE', 413);
    }
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      throw new RoundTripImportError('ROUNDTRIP_INVALID_JSON', 400);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new RoundTripImportError('ROUNDTRIP_INVALID_REQUEST', 400);
    }

    const action = typeof body.action === 'string' ? body.action.trim() : '';
    if (action === 'issue') {
      const parsedIssue = parseIssueSignedRoundTripRequest(body);
      const issued = await writeTx(actor, parsedIssue.projectId, (tx) =>
        issueSignedRoundTripPackage(tx, actor.userId, parsedIssue)
      );
      return new NextResponse(new Uint8Array(issued.deliveredBytes), {
        status: 200,
        headers: {
          ...noCache,
          'Content-Type': issued.contentType,
          'Content-Disposition': `attachment; filename="${issued.fileName}"`,
          'X-OSERP-RoundTrip-Package-Id': issued.packageId,
          'X-OSERP-Output-Sha256': issued.outputSha256,
        },
      });
    }

    if (action === 'verify_import') {
      if (body.templateCode !== undefined) {
        assertSupportedRoundTripTemplateCode(body.templateCode);
      }
      const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
      const idempotencyKey =
        typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : '';
      const fileName =
        typeof body.fileName === 'string' && body.fileName.trim() !== ''
          ? body.fileName.trim()
          : 'roundtrip-upload.xlsx';
      if (typeof body.fileBase64 !== 'string' || body.fileBase64.trim() === '') {
        throw new RoundTripImportError('ROUNDTRIP_FILE_REQUIRED', 400);
      }
      const fileBuffer = Buffer.from(body.fileBase64.trim(), 'base64');
      if (fileBuffer.length === 0 || fileBuffer.length > MAX_UPLOAD_FILE_BYTES) {
        throw new RoundTripImportError('ROUNDTRIP_FILE_SIZE_INVALID', 413);
      }

      return await executeVerifyImportWithForensicAudit(actor, {
        projectId,
        idempotencyKey,
        fileName,
        fileBuffer,
        conflictResolutionMode:
          typeof body.conflictResolutionMode === 'string'
            ? (body.conflictResolutionMode as RoundTripConflictMode)
            : undefined,
        allowSupersededLayoutRevision: body.allowSupersededLayoutRevision === true,
        lumpSumOrRoundedOverrideJustification:
          typeof body.lumpSumOrRoundedOverrideJustification === 'string'
            ? body.lumpSumOrRoundedOverrideJustification
            : undefined,
        changeNote: typeof body.changeNote === 'string' ? body.changeNote : undefined,
        templateHint: typeof body.templateCode === 'string' ? body.templateCode : 'T1_PHASE_BOQ',
      });
    }

    throw new RoundTripImportError('ROUNDTRIP_INVALID_ACTION', 400);
  } catch (error) {
    return failureResponse(error);
  }
}

async function executeVerifyImportWithForensicAudit(
  actor: { userId: string; sessionVersion: number },
  params: {
    projectId: string;
    idempotencyKey: string;
    fileName: string;
    fileBuffer: Buffer;
    conflictResolutionMode?: RoundTripConflictMode;
    allowSupersededLayoutRevision?: boolean;
    lumpSumOrRoundedOverrideJustification?: string;
    changeNote?: string;
    templateHint: string;
  }
): Promise<NextResponse> {
  try {
    const result = await writeTx(actor, params.projectId, (tx) =>
      verifyAndStageSignedRoundTripImport(tx, actor.userId, {
        projectId: params.projectId,
        idempotencyKey: params.idempotencyKey,
        fileName: params.fileName,
        fileBuffer: params.fileBuffer,
        conflictResolutionMode: params.conflictResolutionMode,
        allowSupersededLayoutRevision: params.allowSupersededLayoutRevision,
        lumpSumOrRoundedOverrideJustification: params.lumpSumOrRoundedOverrideJustification,
        changeNote: params.changeNote,
      })
    );
    return NextResponse.json(result, { status: 200, headers: noCache });
  } catch (err) {
    if (
      err instanceof RoundTripImportError &&
      err.code !== 'ROUNDTRIP_IDEMPOTENCY_KEY_CONFLICT' &&
      err.code !== 'ROUNDTRIP_ACCESS_DENIED' &&
      err.code !== 'ROUNDTRIP_PROJECT_REQUIRED' &&
      err.code !== 'ROUNDTRIP_IDEMPOTENCY_KEY_REQUIRED' &&
      /^[a-zA-Z0-9_-]{1,160}$/.test(params.projectId)
    ) {
      const uploadedSha = crypto
        .createHash('sha256')
        .update(params.fileBuffer)
        .digest('hex');
      const fallbackTemplate: RoundTripTemplateCode =
        params.templateHint.trim().toUpperCase() === 'T0_MASTER_CONTRACT'
          ? 'T0_MASTER_CONTRACT'
          : 'T1_PHASE_BOQ';
      const importFormat: 'XLSX' | 'JSON' = params.fileName.toLowerCase().endsWith('.json')
        ? 'JSON'
        : 'XLSX';
      const conflictMode: RoundTripConflictMode =
        params.conflictResolutionMode &&
        ['STAGE_GOVERNED_CHANGE_PROPOSAL', 'VERIFY_ONLY', 'OVERWRITE_APPROVED_IN_PLACE'].includes(
          params.conflictResolutionMode
        )
          ? params.conflictResolutionMode
          : 'STAGE_GOVERNED_CHANGE_PROPOSAL';
      const forensicIdemKey = `rej:${params.idempotencyKey.slice(0, 90)}:${uploadedSha.slice(0, 12)}:${crypto.randomBytes(4).toString('hex')}`;

      try {
        await writeTx(actor, params.projectId, async (tx) => {
          const caps = await resolveActorRoundTripCapabilities(
            tx,
            actor.userId,
            params.projectId
          );
          await persistRoundTripSubmissionRecord(tx, {
            actorId: actor.userId,
            actorRole: caps.effectiveRole,
            projectId: params.projectId,
            packageId:
              typeof err.detail?.packageId === 'string' ? err.detail.packageId : null,
            idempotencyKey: forensicIdemKey,
            uploadedFileSha256: uploadedSha,
            importFormat,
            templateCode: fallbackTemplate,
            sourceId: null,
            sourceVersion: null,
            layoutDefinitionId: null,
            layoutVersionNumber: null,
            layoutDefinitionHash: null,
            conflictResolutionMode: conflictMode,
            verificationStatus: 'REJECTED',
            failureCode: err.code,
            totalRowCount: 0,
            changedRowCount: 0,
            nonFinancialChangeCount: 0,
            financialChangeCount: 0,
            proposedChanges: [],
            diagnostics: {
              originalIdempotencyKey: params.idempotencyKey,
              ...(err.detail ?? {}),
            },
          });
        });
      } catch {
        // Preserve original verification error if caller lacks RLS scope on projectId
      }
    }
    throw err;
  }
}
