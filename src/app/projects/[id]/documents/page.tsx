import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { assertUboqStageAuthorization } from '@/lib/uboq/security/stage-rbac';
import { withUboqRlsContext, applyProjectRlsSessionVars } from '@/lib/uboq/project-ownership';
import ProjectDocumentIntakeClient from './ProjectDocumentIntakeClient';

export const dynamic = 'force-dynamic';

export default async function ProjectDocumentsPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const actor = await verifyOperationalSession();
  if (!actor) redirect('/login');

  let data: {
    project: { id: string; name: string; projectCategory: string | null } | null;
    files: Array<{
      id: string; fileName: string; documentRole: string; byteSize: number;
      createdAt: Date; sha256Hash: string;
      snapshots: Array<{ status: string }>;
    }>;
  };

  try {
    data = await withUboqRlsContext(
      { projectId, userId: actor.userId, sessionVersion: actor.sessionVersion },
      async () => {
        await assertUboqStageAuthorization(prisma, {
          userId: actor.userId, projectId, capability: 'UBOQ_VIEW',
        });
        return prisma.$transaction(async (tx) => {
          await applyProjectRlsSessionVars(tx, {
            projectId, userId: actor.userId, sessionVersion: actor.sessionVersion,
          });
          const [project, files] = await Promise.all([
            tx.project.findUnique({
              where: { id: projectId },
              select: { id: true, name: true, projectCategory: true },
            }),
            tx.uboqSourceDocument.findMany({
              where: { projectId },
              select: {
                id: true, fileName: true, documentRole: true,
                byteSize: true, createdAt: true, sha256Hash: true,
                snapshots: { select: { status: true }, take: 1, orderBy: { versionNumber: 'desc' } },
              },
              orderBy: { createdAt: 'desc' },
            }),
          ]);
          return { project, files };
        });
      }
    );
  } catch {
    return (
      <main style={{padding:32}}>
        <h1>Project documents unavailable</h1>
        <p>Project access was denied or the private document register could not be loaded.</p>
        <Link href="/projects">Back to Projects</Link>
      </main>
    );
  }

  if (!data.project) return <main style={{padding:32}}>Project not found.</main>;

  return (
    <main style={{padding:'28px',maxWidth:1400,margin:'0 auto',color:'#f8fafc'}}>
      <div style={{marginBottom:20}}>
        <Link href="/projects" style={{color:'#67e8f9'}}>← Projects</Link>
        <h1 style={{margin:'12px 0 4px'}}>Documents &amp; Universal BOQ Intake</h1>
        <p style={{color:'#94a3b8',margin:0}}>
          {data.project.name} · Sector: {data.project.projectCategory || 'Not confirmed'}
        </p>
      </div>
      {!['GOVERNMENT','CORPORATE','PRIVATE'].includes(data.project.projectCategory || '') && (
        <p style={{border:'1px solid #fbbf24',borderRadius:8,padding:12,color:'#fde68a'}}>
          This legacy project has no verified sector classification. Supporting evidence may be stored,
          but BOQ staging requires an approved sector and tax profile.
        </p>
      )}
      <ProjectDocumentIntakeClient
        projectId={projectId}
        sector={data.project.projectCategory || ''}
        files={data.files.map(f => ({
          id: f.id, fileName: f.fileName, documentRole: f.documentRole,
          byteSize: f.byteSize, createdAt: f.createdAt.toISOString(),
          sha256: f.sha256Hash,
          latestSnapshotStatus: f.snapshots[0]?.status ?? null,
        }))}
      />
    </main>
  );
}
