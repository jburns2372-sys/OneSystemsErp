import { prisma } from '@/lib/prisma';
import React from 'react';
import { 
  Wallet, DollarSign, Activity, AlertCircle, FileText, Briefcase, Truck, HardHat, Calendar, Clock, BarChart3, Receipt
} from 'lucide-react';

export default async function ProjectSummaryTab({ projectId }: { projectId: string }) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      variationOrders: { where: { currentStatus: 'APPROVED' } },
      billings: { where: { status: { in: ['APPROVED', 'SUBMITTED', 'PAID'] } }, include: { payments: true } },
      expenses: { where: { status: 'APPROVED' } },
      subcontractBillings: true,
      materialRequests: true,
      workers: { where: { employmentStatus: 'ACTIVE' } }
    }
  });

  if (!project) return null;

  // Calculate Financials
  const originalContract = project.contractAmount || 0;
  let approvedAdditive = 0;
  let approvedDeductive = 0;
  project.variationOrders.forEach(vo => {
    approvedAdditive += (vo.additionalAmount || 0);
    approvedDeductive += (vo.deductiveAmount || 0);
  });
  const revisedContract = originalContract + approvedAdditive - approvedDeductive;

  const totalBilled = project.billings.reduce((sum, b) => sum + b.currentBillingAmount, 0);
  const totalCollected = project.billings.reduce((sum, b) => {
    return sum + b.payments.reduce((psum, p) => psum + p.amountPaid, 0);
  }, 0);
  const financialProgress = revisedContract > 0 ? (totalBilled / revisedContract) * 100 : 0;

  // Calculate Costs
  const totalExpenses = project.expenses.reduce((sum, e) => sum + e.netAmount, 0);
  const totalSubcontract = project.subcontractBillings.reduce((sum, sb) => sum + sb.currentGross, 0);
  const totalCostToDate = totalExpenses + totalSubcontract;
  
  // Profitability Projection
  const estimatedProfit = revisedContract - totalCostToDate;
  const margin = revisedContract > 0 ? (estimatedProfit / revisedContract) * 100 : 0;

  // Queries for other stats
  const activePOs = await prisma.purchaseOrder.count({
    where: {
      status: { in: ['APPROVED', 'PARTIAL_DELIVERY'] },
      mr: { projectId }
    }
  });

  const pendingMRs = project.materialRequests.filter(mr => mr.status === 'PENDING').length;
  const approvedMRs = project.materialRequests.filter(mr => mr.status === 'APPROVED').length;
  const activeWorkers = project.workers.length;

  // Timeline Calculations
  const startDate = project.startDate ? new Date(project.startDate) : null;
  const endDate = project.revisedCompletionDate ? new Date(project.revisedCompletionDate) : (project.originalCompletionDate ? new Date(project.originalCompletionDate) : null);
  
  let daysElapsed = 0;
  let totalDays = 0;
  let timeProgress = 0;

  if (startDate && endDate) {
    const now = new Date();
    totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)));
    daysElapsed = Math.max(0, Math.ceil((Math.min(now.getTime(), endDate.getTime()) - startDate.getTime()) / (1000 * 3600 * 24)));
    timeProgress = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
  }

  const formatCurrency = (amount: number) => `₱ ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* Contract & Financial Progress */}
        <div style={{ 
          background: 'var(--glass-bg)', 
          border: '1px solid var(--glass-border)', 
          borderRadius: '12px', 
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', background: 'rgba(0, 240, 255, 0.1)', borderRadius: '8px' }}>
              <Wallet size={24} color="var(--accent-color)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)' }}>Revised Contract Value</h3>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{formatCurrency(revisedContract)}</p>
            </div>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Financial Progress (Billed)</span>
              <span style={{ fontWeight: 'bold' }}>{financialProgress.toFixed(1)}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${financialProgress}%`, height: '100%', background: 'var(--accent-color)', borderRadius: '4px', transition: 'width 1s ease-in-out' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '8px', color: 'var(--text-secondary)' }}>
              <span>Billed: {formatCurrency(totalBilled)}</span>
              <span>Remaining: {formatCurrency(Math.max(0, revisedContract - totalBilled))}</span>
            </div>
          </div>
        </div>

        {/* Cost & Profitability */}
        <div style={{ 
          background: 'var(--glass-bg)', 
          border: '1px solid var(--glass-border)', 
          borderRadius: '12px', 
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', background: 'rgba(255, 100, 100, 0.1)', borderRadius: '8px' }}>
              <Activity size={24} color="#ff6b6b" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)' }}>Actual Cost to Date</h3>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#ff6b6b' }}>{formatCurrency(totalCostToDate)}</p>
            </div>
          </div>
          
          <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Estimated Gross Margin</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: margin > 15 ? '#4ade80' : margin > 5 ? '#fbbf24' : '#ef4444' }}>
                {margin.toFixed(1)}%
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Projected Profit: {formatCurrency(estimatedProfit)}
            </div>
          </div>
        </div>

        {/* Timeline Status */}
        <div style={{ 
          background: 'var(--glass-bg)', 
          border: '1px solid var(--glass-border)', 
          borderRadius: '12px', 
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', background: 'rgba(167, 139, 250, 0.1)', borderRadius: '8px' }}>
              <Calendar size={24} color="#a855f7" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)' }}>Project Timeline</h3>
              <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#a855f7' }}>
                {daysElapsed} / {totalDays} Days
              </p>
            </div>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Time Elapsed</span>
              <span style={{ fontWeight: 'bold' }}>{timeProgress.toFixed(1)}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${timeProgress}%`, height: '100%', background: '#a855f7', borderRadius: '4px', transition: 'width 1s ease-in-out' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '8px', color: 'var(--text-secondary)' }}>
              <span>Start: {startDate ? startDate.toLocaleDateString() : 'N/A'}</span>
              <span>Target: {endDate ? endDate.toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Middle Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        
        {/* Collections */}
        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '12px', borderRadius: '50%' }}>
            <DollarSign size={24} color="#4ade80" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Collections</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatCurrency(totalCollected)}</div>
          </div>
        </div>

        {/* Variation Orders */}
        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '12px', borderRadius: '50%' }}>
            <FileText size={24} color="#fbbf24" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Approved VOs</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatCurrency(approvedAdditive - approvedDeductive)}</div>
          </div>
        </div>

        {/* Purchase Orders */}
        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '12px', borderRadius: '50%' }}>
            <Truck size={24} color="#38bdf8" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active Purchase Orders</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{activePOs}</div>
          </div>
        </div>

        {/* Workforce */}
        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', transition: 'transform 0.2s', cursor: 'pointer' }}>
          <div style={{ background: 'rgba(244, 114, 182, 0.1)', padding: '12px', borderRadius: '50%' }}>
            <HardHat size={24} color="#f472b6" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active Site Workers</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{activeWorkers}</div>
          </div>
        </div>

      </div>

      {/* Bottom Layout - Charts & Logs placeholder */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} color="var(--accent-color)" /> Material Requests Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Pending Requests</span>
              <span style={{ fontWeight: 'bold', color: '#fbbf24' }}>{pendingMRs}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Approved Requests</span>
              <span style={{ fontWeight: 'bold', color: '#4ade80' }}>{approvedMRs}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Logged</span>
              <span style={{ fontWeight: 'bold' }}>{project.materialRequests.length}</span>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={20} color="#a855f7" /> Ledger Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Direct Expenses (Petty Cash/Misc)</span>
              <span style={{ fontWeight: 'bold' }}>{formatCurrency(totalExpenses)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subcontractor Billings</span>
              <span style={{ fontWeight: 'bold' }}>{formatCurrency(totalSubcontract)}</span>
            </div>
            <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '10px' }}>
              Detailed breakdowns are available in their respective tabs.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
