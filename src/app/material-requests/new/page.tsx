import { prisma } from '@/lib/prisma';
import NewMRFForm from './NewMRFForm';

export const dynamic = 'force-dynamic';

export default async function NewMRFPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const params = await searchParams;
  const projectId = params?.projectId;

  if (!projectId) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <h2>Invalid Request</h2>
        <p>Please select a project from the Material Requests dashboard first.</p>
      </div>
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <h2>Project Not Found</h2>
      </div>
    );
  }

  const items = await prisma.consolidatedBOQItem.findMany({
    where: { projectId },
    orderBy: [
      { isVariationItem: 'asc' },
      { itemCode: 'asc' }
    ]
  });

  const users = await prisma.user.findMany({
    select: { id: true, name: true }
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px' }}>
        <h1 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>Create Material Request</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Project: <strong>{project.name}</strong></p>
      </header>

      <NewMRFForm projectId={projectId} items={items} users={users} />
    </div>
  );
}
