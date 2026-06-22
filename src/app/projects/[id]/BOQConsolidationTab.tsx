import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import AutoConsolidateButton from './AutoConsolidateButton';
import ConsolidatedBOQViewer from './ConsolidatedBOQViewer';

export default async function BOQConsolidationTab({ 
  projectId, 
  isBenchmarkLocked 
}: { 
  projectId: string;
  isBenchmarkLocked: boolean;
}) {
  if (!isBenchmarkLocked) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <h3 style={{ color: '#ef4444' }}>Procurement Benchmark Not Locked</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          You must upload and lock the Procurement Benchmark (Forecast BOQ) before you can generate the Master Materials List.
        </p>
      </div>
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { consolidatedBOQLocked: true }
  });
  const isConsolidatedLocked = project ? project.consolidatedBOQLocked : false;

  const consolidatedItems = await prisma.consolidatedBOQItem.findMany({
    where: { 
      projectId,
      OR: [
        { totalCost: { gt: 0 } },
        { isVariationItem: true }
      ]
    },
    orderBy: [
      { isVariationItem: 'asc' },
      { category: 'asc' },
      { description: 'asc' }
    ]
  });

  const cookieStore = await cookies();
  const email = cookieStore.get('demo_user_email')?.value || 'jburns@demo.com';
  const currentUser = await prisma.user.findFirst({
    where: { email },
    include: { userRoles: { include: { role: true } } }
  });
  const isPurchasingOfficer = currentUser?.userRoles.some(ur => ur.role.roleCode === 'PURCHASING_OFFICER');

  if (consolidatedItems.length === 0) {
    if (isPurchasingOfficer) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <h3 style={{ color: '#ef4444' }}>Master Materials List Not Generated</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            The Master Materials List has not been generated yet. Only a Project Manager or Project Director can generate it from the Procurement Benchmark.
          </p>
        </div>
      );
    }
    return <AutoConsolidateButton projectId={projectId} />;
  }

  // Calculate totals
  const totalItems = consolidatedItems.length;
  const totalAmount = consolidatedItems.reduce((sum, item) => sum + item.totalCost, 0);

  const users = await prisma.user.findMany({ select: { id: true, name: true } });

  return (
    <div>
      <ConsolidatedBOQViewer 
        projectId={projectId}
        isLocked={isConsolidatedLocked}
        consolidatedItems={consolidatedItems} 
        totalItems={totalItems} 
        totalAmount={totalAmount}
        users={users}
        canCreateMRF={!isPurchasingOfficer}
        canLock={!isPurchasingOfficer}
      />
    </div>
  );
}
