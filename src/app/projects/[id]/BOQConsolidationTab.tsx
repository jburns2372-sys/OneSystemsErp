import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
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
          <h3 style={{ color: '#ef4444' }}>BOQ Not Consolidated</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            The Bill of Quantities has not been consolidated yet. Only a Project Manager or Project Director can consolidate the BOQ.
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
