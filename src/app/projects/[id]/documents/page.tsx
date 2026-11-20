import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { assertUboqStageAuthorization, isRolePermittedForUboqStage } from '@/lib/uboq/security/stage-rbac';
import { withUboqRlsContext, applyProjectRlsSessionVars } from '@/lib/uboq/project-ownership';
import ProjectDocumentIntakeClient from './ProjectDocumentIntakeClient';
import { requireProjectDocumentPermission } from '@/lib/uboq/security/document-permissions';

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
        await requireProjectDocumentPermission(actor.role, 'canView');
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
      <main style={{padding:32,maxWidth:720,margin:'0 auto',color:'#f8fafc'}}>
        <h1 style={{color:'#fca5a5'}}>Project documents unavailable</h1>
        <p style={{color:'#cbd5e1'}}>Project access was denied or the private document register could not be loaded.</p>
        <Link href="/projects" style={{color:'#38bdf8',fontWeight:600}}>&larr; Back to Projects</Link>
      </main>
    );
  }

  if (!data.project) return <main style={{padding:32,color:'#fca5a5'}}>Project not found.</main>;

  const uploadGrant = await prisma.rolePermission.findFirst({
    where: { moduleName: 'DOCUMENTS', canUploadAttachment: true, role: { roleCode: actor.role, isActive: true } },
    select: { id: true },
  });

  return (
    <main style={{padding:'20px clamp(14px, 3vw, 28px)',maxWidth:1360,margin:'0 auto',color:'#f8fafc'}}>
      <nav
        aria-label="Project documents workflow navigation"
        style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:16}}
      >
        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',fontSize:'0.84rem',color:'#94a3b8'}}>
          <Link href="/projects" style={{color:'#cbd5e1'}}>Projects</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/projects/${projectId}`} style={{color:'#38bdf8',fontWeight:600}}>{data.project.name}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" style={{color:'#f8fafc',fontWeight:700}}>Upload Documents &amp; BOQ</span>
          <span aria-hidden="true">&rarr;</span>
          <Link href={`/projects/${projectId}/uboq`} style={{color:'#cbd5e1'}}>Review BOQ</Link>
          <span aria-hidden="true">&rarr;</span>
          <Link href={`/projects/${projectId}/scheduling`} style={{color:'#cbd5e1'}}>Scheduling</Link>
        </div>

        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <Link
            href={`/projects/${projectId}`}
            style={{padding:'7px 12px',borderRadius:8,background:'rgba(15,23,42,0.7)',border:'1px solid rgba(148,163,184,0.3)',color:'#e2e8f0',fontSize:'0.82rem',fontWeight:600,textDecoration:'none'}}
          >
            &larr; Back to Project
          </Link>
          <Link
            href={`/projects/${projectId}/uboq`}
            style={{padding:'7px 13px',borderRadius:8,background:'rgba(56,189,248,0.14)',border:'1px solid rgba(56,189,248,0.45)',color:'#38bdf8',fontSize:'0.82rem',fontWeight:700,textDecoration:'none'}}
          >
            Review BOQ &rarr;
          </Link>
          <Link
            href={`/projects/${projectId}/scheduling`}
            style={{padding:'7px 12px',borderRadius:8,background:'rgba(15,23,42,0.7)',border:'1px solid rgba(148,163,184,0.3)',color:'#cbd5e1',fontSize:'0.82rem',fontWeight:600,textDecoration:'none'}}
          >
            Scheduling &rarr;
          </Link>
        </div>
      </nav>

      <div style={{marginBottom:20}}>
        <div style={{fontSize:'0.75rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#38bdf8'}}>
          Step 2 of 4
        </div>
        <h1 style={{margin:'4px 0 6px',fontSize:'clamp(1.3rem, 2.5vw, 1.7rem)'}}>Upload Project Documents &amp; Awarded BOQ</h1>
        <p style={{color:'#94a3b8',margin:0,fontSize:'0.9rem'}}>
          <strong style={{color:'#e2e8f0'}}>{data.project.name}</strong> &middot; Sector: {data.project.projectCategory || 'Not confirmed'}
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
        canStageBoq={isRolePermittedForUboqStage(actor.role, 'UBOQ_INTAKE_STAGE')}
        canUploadEvidence={Boolean(uploadGrant) && isRolePermittedForUboqStage(actor.role, 'UBOQ_INTAKE_STAGE')}
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
