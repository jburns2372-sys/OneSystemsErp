import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { assertUboqStageAuthorization } from '@/lib/uboq/security/stage-rbac';
import { withUboqRlsContext, applyProjectRlsSessionVars } from '@/lib/uboq/project-ownership';
import { resolveUboqVaultStorageProvider } from '@/lib/uboq/storage/vault-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; docId: string }> }
) {
  const actor = await verifyOperationalSession();
  if (!actor) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id: projectId, docId } = await context.params;

  try {
    return await withUboqRlsContext(
      { projectId, userId: actor.userId, sessionVersion: actor.sessionVersion },
      async () => {
        await assertUboqStageAuthorization(prisma, {
          userId: actor.userId, projectId, capability: 'UBOQ_VIEW',
        });
        const doc = await prisma.$transaction(async tx => {
          await applyProjectRlsSessionVars(tx, {
            userId: actor.userId, projectId, sessionVersion: actor.sessionVersion,
          });
          return tx.uboqSourceDocument.findFirst({
            where: { id: docId, projectId },
            select: { id: true, fileName: true, mimeType: true, storageUri: true, sha256Hash: true },
          });
        });
        if (!doc) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

        const object = await resolveUboqVaultStorageProvider().getAndVerify({
          storageUri: doc.storageUri,
          expectedProjectId: projectId,
          expectedSha256Hash: doc.sha256Hash,
        });
        // No raw storage URL is exposed, and filenames cannot inject HTTP headers.
        const safeName = doc.fileName.replace(/[\r\n"\\/]/g, '_').slice(0, 180);
        return new NextResponse(new Uint8Array(object.buffer), {
          headers: {
            'Content-Type': doc.mimeType || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${safeName}"`,
            'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      }
    );
  } catch (err) {
    const code = err instanceof Error ? err.message : '';
    return NextResponse.json({ error: /UNAUTHORIZED|FORBIDDEN|DENIED|PBAC|RBAC/i.test(code) ? 'ACCESS_DENIED' : 'DOCUMENT_UNAVAILABLE' }, {
      status: /UNAUTHORIZED|FORBIDDEN|DENIED|PBAC|RBAC/i.test(code) ? 403 : 404,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }
}
