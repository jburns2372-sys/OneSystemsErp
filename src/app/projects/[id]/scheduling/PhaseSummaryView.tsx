import React from 'react';

export default function PhaseSummaryView({ schedule }: { schedule: any }) {
  const activities = schedule?.activities || [];

  // Group by WBS Phase
  const grouped = activities.reduce((acc: any, act: any) => {
    const groupName = act.wbs?.name || 'Unassigned';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(act);
    return acc;
  }, {});

  const wbsOrderMap: Record<string, number> = {};
  const wbsCodeMap: Record<string, string> = {};
  activities.forEach((act: any) => {
    const name = act.wbs?.name || 'Unassigned';
    if (!(name in wbsOrderMap)) {
      wbsOrderMap[name] = act.wbs?.orderIndex ?? 999;
      wbsCodeMap[name] = act.wbs?.code || 'N/A';
    }
  });

  const sortedGroups = Object.keys(grouped).sort((a, b) => {
    const orderDiff = (wbsOrderMap[a] || 999) - (wbsOrderMap[b] || 999);
    if (orderDiff !== 0) return orderDiff;
    return a.localeCompare(b);
  });

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ color: 'var(--accent-color)', marginBottom: '20px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>📑</span> AI-Generated Construction Phasing Summary
      </h2>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', width: '120px' }}>Phase Code</th>
              <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Phase Name</th>
              <th style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', width: '120px' }}>Duration</th>
              <th style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', width: '120px' }}>Start Date</th>
              <th style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', width: '120px' }}>Finish Date</th>
              <th style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', width: '120px' }}>Progress</th>
              <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary)', width: '150px' }}>Total Cost Allocated</th>
            </tr>
          </thead>
          <tbody>
            {sortedGroups.map((groupName, idx) => {
              const acts = grouped[groupName];
              
              // Compute phase dates
              let phaseStart: Date | null = null;
              let phaseFinish: Date | null = null;
              let phaseProgressSum = 0;
              let phaseTotalCost = 0;

              for (const a of acts) {
                if (a.plannedStartDate) {
                  const d = new Date(a.plannedStartDate);
                  if (!phaseStart || d < phaseStart) phaseStart = d;
                }
                if (a.plannedFinishDate) {
                  const d = new Date(a.plannedFinishDate);
                  if (!phaseFinish || d > phaseFinish) phaseFinish = d;
                }
                phaseProgressSum += (a.actualProgressPercent || 0);

                // Compute cost
                const activityCost = (a.boqMappings || []).reduce((sum: number, mapping: any) => {
                  const item = mapping.awardedBoqItem;
                  if (!item) return sum;
                  const revisedQty = item.revisedContractQuantity || item.quantity || 0;
                  const totalAmount = item.revisedContractAmount || item.totalCost || 0;
                  const proportionalCost = revisedQty > 0 ? totalAmount * (mapping.mappedQuantity / revisedQty) : totalAmount;
                  return sum + proportionalCost;
                }, 0);
                phaseTotalCost += activityCost;
              }

              let phaseDuration = 0;
              if (phaseStart && phaseFinish) {
                const diffTime = Math.abs(phaseFinish.getTime() - phaseStart.getTime());
                phaseDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              }
              const avgProgress = acts.length > 0 ? Math.round(phaseProgressSum / acts.length) : 0;

              return (
                <tr key={groupName} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{wbsCodeMap[groupName]}</td>
                  <td style={{ padding: '12px', color: 'var(--text-primary)', fontWeight: 'bold' }}>{groupName}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-primary)' }}>{phaseDuration}d</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {phaseStart ? phaseStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {phaseFinish ? phaseFinish.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                      <div style={{ width: '50px', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${avgProgress}%`, height: '100%', backgroundColor: 'var(--accent-color)', borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>{avgProgress}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>
                    ₱ {phaseTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderTop: '2px solid var(--glass-border)' }}>
              <td colSpan={6} style={{ padding: '16px 12px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1rem' }}>
                GRAND TOTAL:
              </td>
              <td style={{ padding: '16px 12px', textAlign: 'right', color: '#10b981', fontWeight: 'bold', fontSize: '1rem' }}>
                ₱ {sortedGroups.reduce((total, groupName) => {
                  const acts = grouped[groupName];
                  let phaseCost = 0;
                  acts.forEach((a: any) => {
                    const actCost = (a.boqMappings || []).reduce((sum: number, mapping: any) => {
                      const item = mapping.awardedBoqItem;
                      if (!item) return sum;
                      const revisedQty = item.revisedContractQuantity || item.quantity || 0;
                      const totalAmount = item.revisedContractAmount || item.totalCost || 0;
                      return sum + (revisedQty > 0 ? totalAmount * (mapping.mappedQuantity / revisedQty) : totalAmount);
                    }, 0);
                    phaseCost += actCost;
                  });
                  return total + phaseCost;
                }, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
