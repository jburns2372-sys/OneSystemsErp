import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function ProjectVariationOrdersTab({ projectId }: { projectId: string }) {
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  const variationOrders = await prisma.variationOrder.findMany({
    where: { projectId },
    include: { items: true },
    orderBy: { createdAt: 'desc' }
  });

  const originalContract = project?.contractAmount || 0;

  if (variationOrders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'rgba(0, 240, 255, 0.05)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
        <h3 style={{ color: 'var(--text-primary)' }}>No Variation Orders Yet</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          No change orders, additional works, or BOQ adjustments have been created for this project.
        </p>
        <Link 
          href="/variation-orders" 
          style={{
            backgroundColor: 'var(--accent-color)',
            color: '#000',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 'bold',
            textDecoration: 'none'
          }}
        >
          Go to Variation Orders
        </Link>
      </div>
    );
  }

  // Summary calculations (only approved VOs affect the revised contract)
  const approvedVOs = variationOrders.filter(vo => vo.currentStatus === 'APPROVED');
  const totalAdditive = approvedVOs.reduce((sum, vo) => sum + (vo.additionalAmount || 0), 0);
  const totalDeductive = approvedVOs.reduce((sum, vo) => sum + (vo.deductiveAmount || 0), 0);
  const revisedContract = originalContract + totalAdditive - totalDeductive;
  
  const approvedCount = approvedVOs.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return '#9e9e9e';
      case 'SUBMITTED': return '#2196f3';
      case 'FOR_COSTING': case 'FOR_PM_REVIEW': case 'FOR_FINANCE_REVIEW': case 'FOR_PD_APPROVAL':
        return '#ff9800';
      case 'APPROVED': return '#4caf50';
      case 'REJECTED': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--glass-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Original Contract</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>₱ {originalContract.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{variationOrders.length} Total VOs ({approvedCount} Approved)</div>
        </div>
        <div style={{ background: 'rgba(0,200,83,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0,200,83,0.2)' }}>
          <div style={{ fontSize: '0.8rem', color: '#00c853', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Approved Additive</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#00c853' }}>+ ₱ {totalAdditive.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div style={{ background: 'rgba(255,82,82,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,82,82,0.2)' }}>
          <div style={{ fontSize: '0.8rem', color: '#ff5252', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Approved Deductive</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ff5252' }}>- ₱ {totalDeductive.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div style={{ background: 'rgba(0,176,255,0.08)', padding: '16px', borderRadius: '8px', border: '2px solid rgba(0,176,255,0.3)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revised Contract</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
            ₱ {revisedContract.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* VO List */}
      <div style={{ background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>VO Number</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>Type</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600' }}>Reason</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: '600' }}>Items</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: '600' }}>Net Amount</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: '600' }}>BOQ Applied</th>
            </tr>
          </thead>
          <tbody>
            {variationOrders.map((vo: any) => (
              <tr key={vo.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <Link href={`/variation-orders/${vo.id}`} style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 'bold' }}>
                    {vo.voNumber}
                  </Link>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{vo.variationType}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-primary)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {vo.reasonForVariation}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>{vo.items.length}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    backgroundColor: `${getStatusColor(vo.currentStatus)}22`,
                    color: getStatusColor(vo.currentStatus)
                  }}>
                    {vo.currentStatus.replace(/_/g, ' ')}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: (vo.netVariationAmount || 0) >= 0 ? '#00c853' : '#ff5252' }}>
                  {(vo.netVariationAmount || 0) >= 0 ? '+' : ''} ₱ {(vo.netVariationAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  {vo.currentStatus === 'APPROVED' ? (
                    <span style={{ color: '#4caf50', fontWeight: 'bold', fontSize: '0.8rem' }}>✓ Applied</span>
                  ) : (
                    <span style={{ color: '#9e9e9e', fontSize: '0.8rem' }}>Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
