import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { withUboqRlsContext } from '@/lib/uboq/project-ownership';
import { assertUboqStageAuthorization } from '@/lib/uboq/security/stage-rbac';
import { resolveUboqVaultStorageProvider } from '@/lib/uboq/storage/vault-storage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const actor = await verifyOperationalSession();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId } = await params;
    const projectId = (req.nextUrl.searchParams.get('projectId') || '').trim();
    if (!projectId || !documentId) {
      return NextResponse.json({ error: 'projectId and documentId are required' }, { status: 400 });
    }

    const payload = await withUboqRlsContext(
      { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId },
      async () => {
        await assertUboqStageAuthorization(prisma, {
          userId: actor.userId,
          projectId,
          capability: 'UBOQ_VIEW',
        });

        const doc = await prisma.uboqSourceDocument.findUnique({
          where: { id: documentId },
        });
        if (!doc || doc.projectId !== projectId) {
          throw new Error('UBOQ_VAULT_OBJECT_NOT_FOUND_OR_DENIED');
        }

        const provider = resolveUboqVaultStorageProvider();
        const verified = await provider.getAndVerify({
          storageUri: doc.storageUri,
          expectedProjectId: projectId,
          expectedSha256Hash: doc.sha256Hash,
        });
        return { doc, verified };
      }
    );

    const safeDownloadName = payload.doc.fileName.replace(/[^\w.\-() ]+/g, '_');
    return new NextResponse(new Uint8Array(payload.verified.buffer), {
      status: 200,
      headers: {
        'Content-Type': payload.doc.mimeType || 'application/octet-stream',
        'Content-Length': String(payload.verified.buffer.length),
        'Content-Disposition': `attachment; filename="${safeDownloadName}"`,
        'X-UBOQ-SHA256': payload.verified.verifiedSha256,
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  } catch (err: unknown) {
    const msg = String((err as Error)?.message || 'Vault retrieval failed');
    const status =
      msg.includes('UBOQ_UNAUTHORIZED')
        ? 401
        : msg.includes('UBOQ_PBAC') || msg.includes('UBOQ_RBAC_FORBIDDEN') || msg.includes('CROSS_PROJECT')
          ? 403
          : msg.includes('NOT_FOUND')
            ? 404
            : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
