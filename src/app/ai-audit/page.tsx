import { getAIAuditLogs, getAIAuditMetrics } from '../actions/aiAuditActions';

export const dynamic = 'force-dynamic';

export default async function AIAuditDashboard({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const filter = searchParams.filter || 'ALL';
  const logs = await getAIAuditLogs(filter);
  const metrics = await getAIAuditMetrics();

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 5px 0' }}>AI Audit Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Monitor all AI interventions, blocked transactions, and warnings across the ERP system.</p>
        </div>
      </header>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px' }}>Total AI Validations</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{metrics.total}</div>
        </div>
        <div style={{ backgroundColor: 'rgba(255,107,107,0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,107,107,0.2)' }}>
          <div style={{ color: '#ff6b6b', fontSize: '0.9rem', marginBottom: '10px' }}>Blocked Transactions</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ff6b6b' }}>{metrics.blocked}</div>
        </div>
        <div style={{ backgroundColor: 'rgba(255,212,59,0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,212,59,0.2)' }}>
          <div style={{ color: '#ffd43b', fontSize: '0.9rem', marginBottom: '10px' }}>Warnings Issued</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ffd43b' }}>{metrics.warnings}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <a href="/ai-audit" style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: filter === 'ALL' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)', color: filter === 'ALL' ? '#000' : '#fff', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>All Logs</a>
        <a href="/ai-audit?filter=BLOCKED" style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: filter === 'BLOCKED' ? '#ff6b6b' : 'rgba(255,255,255,0.05)', color: filter === 'BLOCKED' ? '#fff' : '#fff', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Blocked Only</a>
        <a href="/ai-audit?filter=WARNING" style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: filter === 'WARNING' ? '#ffd43b' : 'rgba(255,255,255,0.05)', color: filter === 'WARNING' ? '#000' : '#fff', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Warnings Only</a>
      </div>

      {/* Logs Table */}
      <div style={{ backgroundColor: 'var(--bg-card, #1a1b1e)', border: '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden' }}>
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>
            <p>No AI audit logs found.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '15px' }}>Date</th>
                <th style={{ padding: '15px' }}>Module</th>
                <th style={{ padding: '15px' }}>User Role</th>
                <th style={{ padding: '15px' }}>Status</th>
                <th style={{ padding: '15px' }}>AI Findings</th>
                <th style={{ padding: '15px' }}>Reference Used</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '15px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '15px', fontWeight: 500 }}>{log.moduleName}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ padding: '4px 8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.8rem' }}>
                      {log.userRole}
                    </span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ 
                      padding: '6px 10px', 
                      borderRadius: '6px', 
                      backgroundColor: log.validationStatus === 'BLOCKING ISSUE' ? 'rgba(255,107,107,0.1)' : log.validationStatus === 'WARNING' ? 'rgba(255,212,59,0.1)' : 'rgba(81,207,102,0.1)',
                      color: log.validationStatus === 'BLOCKING ISSUE' ? '#ff6b6b' : log.validationStatus === 'WARNING' ? '#ffd43b' : '#51cf66',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}>
                      {log.validationStatus}
                    </span>
                  </td>
                  <td style={{ padding: '15px', maxWidth: '400px' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '5px' }}>{log.aiFindings}</div>
                    {log.overrides && log.overrides.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: '#ffd43b', marginTop: '10px', padding: '8px', backgroundColor: 'rgba(255,212,59,0.05)', borderRadius: '6px', border: '1px dashed rgba(255,212,59,0.3)' }}>
                        <strong>Override Request:</strong> {log.overrides[0].overrideReason}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '15px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {log.reference ? log.reference.title : 'None'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
