import { prisma } from '@/lib/prisma';
import AutoConsolidateButton from './AutoConsolidateButton';
import ConsolidatedBOQViewer from './ConsolidatedBOQViewer';

export default async function BOQConsolidationTab({ 
  projectId, 
  isLocked 
}: { 
  projectId: string;
  isLocked: boolean;
}) {
  if (!isLocked) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <h3 style={{ color: '#ef4444' }}>BOQ Not Locked</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          You must finalize and lock the Awarded BOQ before you can proceed to consolidation. 
          Please go back to the "Awarded BOQ" tab and click the "Lock BOQ" button.
        </p>
      </div>
    );
  }

  const result = await prisma.$queryRaw<any[]>`SELECT consolidatedBOQLocked FROM Project WHERE id = ${projectId}`;
  const isConsolidatedLocked = result && result[0] ? Boolean(result[0].consolidatedBOQLocked) : false;

  const consolidatedItems = await prisma.consolidatedBOQItem.findMany({
    where: { 
      projectId,
      totalCost: { gt: 0 }
    },
    orderBy: [
      { category: 'asc' },
      { description: 'asc' }
    ]
  });

  if (consolidatedItems.length === 0) {
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
      />
    </div>
  );
}
