import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { withUboqRlsContext } from '@/lib/uboq/project-ownership';
import {
  buildFormalExportJsonPayload,
  FormalExportError,
  hashExportPayload,
  listFormalContractCatalog,
  parseFormalExportRequest,
  prepareFormalExportData,
  recordFormalExportProvenance,
  renderFormalExportToCsvString,
  renderFormalExportToXlsxBuffer,
} from '@/lib/uboq/templates/formal-t0-t1';

export const runtime = 'nodejs';
const noCache = { 'Cache-Control': 'private, no-store' };

function mapFormalFailure(error: unknown) {
  if (error instanceof FormalExportError) {
    return NextResponse.json(
      { error: error.code, ...(error.detail ? { detail: error.detail } : {}) },
      { status: error.status, headers: noCache }
    );
  }
  const msg = error instanceof Error ? error.message : '';
  if (/UBOQ_(?:PBAC|RBAC|UNAUTHORIZED|PROJECT_NOT_FOUND)|42501/.test(msg)) {
    return NextResponse.json({ error: 'FORMAL_ACCESS_DENIED' }, { status: 403, headers: noCache });
  }
  if (/UBOQ_VAL19/.test(msg)) {
    return NextResponse.json({ error: 'FORMAL_COMPLIANCE_BLOCKED' }, { status: 409, headers: noCache });
  }
  return NextResponse.json({ error: 'FORMAL_EXPORT_FAILED' }, { status: 500, headers: noCache });
}

async function readOnlyProjectTx<T>(
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

export async function GET(req: NextRequest) {
  try {
    const actor = await verifyOperationalSession();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noCache });
    }
    const projectId = req.nextUrl.searchParams.get('projectId') || '';
    const catalog = await readOnlyProjectTx(actor, projectId, (tx) =>
      listFormalContractCatalog(tx, actor.userId, projectId)
    );
    return NextResponse.json(catalog, { headers: noCache });
  } catch (error) {
    return mapFormalFailure(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await verifyOperationalSession();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noCache });
    }
    const text = await req.text();
    if (Buffer.byteLength(text, 'utf8') > 16384) {
      throw new FormalExportError('FORMAL_REQUEST_TOO_LARGE', 413);
    }
    let rawBody: unknown;
    try {
      rawBody = JSON.parse(text);
    } catch {
      throw new FormalExportError('FORMAL_INVALID_JSON', 400);
    }

    const input = parseFormalExportRequest(rawBody);

    // Phase 1: Strictly read-only canonical snapshot/contract & saved-layout resolution
    const prepared = await readOnlyProjectTx(actor, input.projectId, (tx) =>
      prepareFormalExportData(tx, actor.userId, input)
    );

    // Phase 2: Deterministic output artifact rendering + exact-byte cryptographic digest
    // For JSON, auditEventId is embedded prior to UTF-8 serialization and SHA-256 hashing
    // (avoiding a recursive outputSha256 inside its own hashed bytes), and those exact
    // serialized bytes are delivered in the HTTP response body.
    const auditEventId = `utae_${crypto.randomUUID().replaceAll('-', '')}`;
    let deliveredBytes: Buffer;
    if (input.format === 'json') {
      const jsonPayload = buildFormalExportJsonPayload(prepared, { auditEventId });
      deliveredBytes = Buffer.from(JSON.stringify(jsonPayload), 'utf8');
    } else if (input.format === 'csv') {
      deliveredBytes = Buffer.from(renderFormalExportToCsvString(prepared), 'utf8');
    } else {
      deliveredBytes = await renderFormalExportToXlsxBuffer(prepared);
    }
    const outputSha256 = hashExportPayload(deliveredBytes);

    // Phase 3: Append-only audit & export provenance recording
    const auditEvent = await withUboqRlsContext(
      { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId: input.projectId },
      () =>
        prisma.$transaction(
          async (tx) =>
            recordFormalExportProvenance(
              tx as unknown as Prisma.TransactionClient,
              prepared,
              input.format,
              outputSha256,
              auditEventId
            ),
          {
            isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
            maxWait: 5000,
            timeout: 15000,
          }
        )
    );

    const layoutHeader = prepared.layoutIdentity.layoutDefinitionId
      ? `${prepared.layoutIdentity.layoutGroupId}@v${prepared.layoutIdentity.layoutVersionNumber}(${prepared.layoutIdentity.layoutDefinitionId})`
      : `SYSTEM_FORMAL_PRESET@v1`;

    const provenanceHeaders: Record<string, string> = {
      ...noCache,
      'X-OSERP-Formal-Contract': prepared.contractSpec.contractCode,
      'X-OSERP-Source-Version': `${prepared.sourceIdentity.sourceId}@${prepared.sourceIdentity.sourceVersion}`,
      'X-OSERP-Layout-Identity': layoutHeader,
      'X-OSERP-External-Agency-Spec': prepared.contractSpec.externalAgencySpecStatus,
      'X-OSERP-Output-Sha256': outputSha256,
      'X-OSERP-Audit-Event-Id': auditEvent.id,
    };

    if (input.format === 'json') {
      return new NextResponse(new Uint8Array(deliveredBytes), {
        status: 200,
        headers: {
          ...provenanceHeaders,
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
    }

    const fileBase = `${prepared.contractSpec.contractCode}_${prepared.sourceIdentity.sourceId}_v${prepared.layoutIdentity.layoutVersionNumber}`;
    if (input.format === 'csv') {
      return new NextResponse(new Uint8Array(deliveredBytes), {
        status: 200,
        headers: {
          ...provenanceHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileBase}.csv"`,
        },
      });
    }

    return new NextResponse(new Uint8Array(deliveredBytes), {
      status: 200,
      headers: {
        ...provenanceHeaders,
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileBase}.xlsx"`,
      },
    });
  } catch (error) {
    return mapFormalFailure(error);
  }
}

