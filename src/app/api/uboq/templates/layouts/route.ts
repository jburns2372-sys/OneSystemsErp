import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { withUboqRlsContext } from '@/lib/uboq/project-ownership';
import {
  hasSensitiveProjectedColumns,
  hasSensitiveRequestedFields,
  recordSensitiveTemplateExportAudit,
} from '@/lib/uboq/templates/canonical-source-adapters';
import {
  createSavedLayout,
  duplicateSavedLayout,
  listSavedLayouts,
  loadSavedLayout,
  parseSavedLayoutActionRequest,
  previewSavedLayout,
  SavedLayoutError,
  versionSavedLayout,
} from '@/lib/uboq/templates/saved-layouts';

export const runtime = 'nodejs';
const noCache = { 'Cache-Control': 'private, no-store' };

function mapFailure(error: unknown) {
  if (error instanceof SavedLayoutError) {
    return NextResponse.json({ error: error.code }, { status: error.status, headers: noCache });
  }
  const msg = error instanceof Error ? error.message : '';
  if (/UBOQ_TEMPLATE_SENSITIVE_FIELD_DENIED/.test(msg)) {
    return NextResponse.json({ error: 'LAYOUT_FIELD_FORBIDDEN' }, { status: 403, headers: noCache });
  }
  if (/UBOQ_(?:PBAC|RBAC|UNAUTHORIZED|PROJECT_NOT_FOUND|TEMPLATE_WRITE_DENIED|TEMPLATE_PRIVATE|TEMPLATE_SHARED|TEMPLATE_DUPLICATE_PRIVATE)|42501/.test(msg)) {
    return NextResponse.json({ error: 'LAYOUT_ACCESS_DENIED' }, { status: 403, headers: noCache });
  }
  if (/UBOQ_TEMPLATE_VERSION_CONFLICT|23505/.test(msg)) {
    return NextResponse.json({ error: 'LAYOUT_VERSION_CONFLICT' }, { status: 409, headers: noCache });
  }
  return NextResponse.json({ error: 'LAYOUT_REQUEST_FAILED' }, { status: 500, headers: noCache });
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

async function writeLayoutProjectTx<T>(
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
    const sp = req.nextUrl.searchParams;
    const projectId = sp.get('projectId') || '';
    const layoutRevisionId = sp.get('layoutRevisionId');
    const layoutGroupId = sp.get('layoutGroupId');
    const versionRaw = sp.get('versionNumber');
    const templateCode = sp.get('templateCode');

    if (layoutRevisionId || layoutGroupId) {
      let versionNumber: number | undefined;
      if (versionRaw !== null) {
        const parsed = Number(versionRaw);
        if (!Number.isInteger(parsed) || parsed < 1) {
          throw new SavedLayoutError('LAYOUT_INVALID_VERSION', 400);
        }
        versionNumber = parsed;
      }
      const loaded = await readOnlyProjectTx(actor, projectId, (tx) =>
        loadSavedLayout(tx, actor.userId, {
          projectId,
          layoutRevisionId,
          layoutGroupId,
          versionNumber,
        })
      );
      return NextResponse.json(loaded, { headers: noCache });
    }

    const listed = await readOnlyProjectTx(actor, projectId, (tx) =>
      listSavedLayouts(tx, actor.userId, projectId, templateCode)
    );
    return NextResponse.json(listed, { headers: noCache });
  } catch (error) {
    return mapFailure(error);
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
      throw new SavedLayoutError('LAYOUT_REQUEST_TOO_LARGE', 413);
    }
    let rawBody: unknown;
    try {
      rawBody = JSON.parse(text);
    } catch {
      throw new SavedLayoutError('LAYOUT_INVALID_JSON', 400);
    }

    const actionInput = parseSavedLayoutActionRequest(rawBody);
    const sourceIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;

    if (actionInput.action === 'preview') {
      let preview: Awaited<ReturnType<typeof previewSavedLayout>>;
      try {
        preview = await readOnlyProjectTx(actor, actionInput.projectId, (tx) =>
          previewSavedLayout(tx, actor.userId, actionInput)
        );
      } catch (err) {
        if (err instanceof SavedLayoutError && err.code === 'LAYOUT_FIELD_FORBIDDEN') {
          try {
            await writeLayoutProjectTx(actor, actionInput.projectId, async (tx) => {
              const targetDef = await tx.uboqTemplateDefinition.findFirst({
                where: actionInput.layoutRevisionId
                  ? { id: actionInput.layoutRevisionId, projectId: actionInput.projectId }
                  : { layoutGroupId: actionInput.layoutGroupId ?? '', projectId: actionInput.projectId },
                select: { templateCode: true },
              });
              await recordSensitiveTemplateExportAudit(tx, {
                userId: actor.userId,
                projectId: actionInput.projectId,
                templateCode: targetDef?.templateCode ?? 'T10_EXECUTIVE_MARGIN',
                format: 'JSON',
                sourceId: actionInput.sourceId,
                recordCount: 0,
                sourceIp,
                approved: false,
                blocked: true,
                reason: 'BLOCKED_SENSITIVE_SAVED_LAYOUT_PREVIEW_FIELD_FORBIDDEN',
              });
            });
          } catch {
            // Preserve original 403 response
          }
        }
        throw err;
      }

      const serializedPreview = Buffer.from(JSON.stringify(preview), 'utf8');
      if (hasSensitiveProjectedColumns(preview.projection.visibleColumns)) {
        const previewSha256 = crypto.createHash('sha256').update(serializedPreview).digest('hex');
        await writeLayoutProjectTx(actor, actionInput.projectId, (tx) =>
          recordSensitiveTemplateExportAudit(tx, {
            userId: actor.userId,
            projectId: actionInput.projectId,
            templateCode: preview.templateCode,
            format: 'JSON',
            sourceId: preview.source.id,
            recordCount: preview.rowCount,
            sourceIp,
            approved: true,
            blocked: false,
            reason: `AUTHORIZED_SENSITIVE_SAVED_LAYOUT_PREVIEW:${preview.layout.id}`,
            outputSha256: previewSha256,
          })
        );
      }
      return new NextResponse(new Uint8Array(serializedPreview), {
        headers: { ...noCache, 'Content-Type': 'application/json' },
      });
    }

    if (actionInput.action === 'create') {
      try {
        const revision = await writeLayoutProjectTx(actor, actionInput.projectId, (tx) =>
          createSavedLayout(tx, actor.userId, actionInput)
        );
        return NextResponse.json({ revision }, { status: 201, headers: noCache });
      } catch (err) {
        if (
          err instanceof SavedLayoutError &&
          err.code === 'LAYOUT_FIELD_FORBIDDEN' &&
          hasSensitiveRequestedFields(actionInput.selectedFields)
        ) {
          try {
            await writeLayoutProjectTx(actor, actionInput.projectId, (tx) =>
              recordSensitiveTemplateExportAudit(tx, {
                userId: actor.userId,
                projectId: actionInput.projectId,
                templateCode: actionInput.templateCode,
                format: 'JSON',
                recordCount: 0,
                sourceIp,
                approved: false,
                blocked: true,
                reason: 'BLOCKED_SENSITIVE_FIELD_PERSISTENCE_LAYOUT_CREATE',
              })
            );
          } catch {
            // Preserve original 403 response
          }
        }
        throw err;
      }
    }

    if (actionInput.action === 'version') {
      try {
        const revision = await writeLayoutProjectTx(actor, actionInput.projectId, (tx) =>
          versionSavedLayout(tx, actor.userId, actionInput)
        );
        return NextResponse.json({ revision }, { status: 201, headers: noCache });
      } catch (err) {
        if (
          err instanceof SavedLayoutError &&
          err.code === 'LAYOUT_FIELD_FORBIDDEN' &&
          hasSensitiveRequestedFields(actionInput.selectedFields)
        ) {
          try {
            await writeLayoutProjectTx(actor, actionInput.projectId, async (tx) => {
              const targetGrp = await tx.uboqTemplateDefinition.findFirst({
                where: { layoutGroupId: actionInput.layoutGroupId, projectId: actionInput.projectId },
                select: { templateCode: true },
              });
              await recordSensitiveTemplateExportAudit(tx, {
                userId: actor.userId,
                projectId: actionInput.projectId,
                templateCode: targetGrp?.templateCode ?? 'T10_EXECUTIVE_MARGIN',
                format: 'JSON',
                recordCount: 0,
                sourceIp,
                approved: false,
                blocked: true,
                reason: 'BLOCKED_SENSITIVE_FIELD_PERSISTENCE_LAYOUT_VERSION',
              });
            });
          } catch {
            // Preserve original 403 response
          }
        }
        throw err;
      }
    }

    const revision = await writeLayoutProjectTx(actor, actionInput.projectId, (tx) =>
      duplicateSavedLayout(tx, actor.userId, actionInput)
    );
    return NextResponse.json({ revision }, { status: 201, headers: noCache });
  } catch (error) {
    return mapFailure(error);
  }
}

