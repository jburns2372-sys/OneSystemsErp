'use client';

export default function DeductionLedger({ cashAdvances, loans, allowances, workers }: any) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: '0 0 5px 0', color: '#fff' }}>Deduction Ledger & Allowances</h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Manage cash advances, salary loans, and recurring allowances for workers.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ Cash Advance / Loan</button>
          <button style={{ background: 'transparent', border: '1px solid #3498db', color: '#3498db', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ New Allowance</button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* Loans & Cash Advances */}
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(231, 76, 60, 0.1)' }}>
            <h4 style={{ margin: 0, color: '#e74c3c', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>💸</span> Active Cash Advances & Loans
            </h4>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.3)' }}>
                <th style={{ padding: '12px 15px' }}>Worker</th>
                <th style={{ padding: '12px 15px' }}>Type</th>
                <th style={{ padding: '12px 15px' }}>Per Cutoff</th>
                <th style={{ padding: '12px 15px' }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {(!cashAdvances?.length && !loans?.length) ? (
                <tr>
                  <td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>No active loans or cash advances found.</td>
                </tr>
              ) : (
                // Map over them when available
                null
              )}
            </tbody>
          </table>
        </div>

        {/* Allowances */}
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(52, 152, 219, 0.1)' }}>
            <h4 style={{ margin: 0, color: '#3498db', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🎁</span> Active Allowances & Benefits
            </h4>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.3)' }}>
                <th style={{ padding: '12px 15px' }}>Worker</th>
                <th style={{ padding: '12px 15px' }}>Type</th>
                <th style={{ padding: '12px 15px' }}>Amount</th>
                <th style={{ padding: '12px 15px' }}>Schedule</th>
              </tr>
            </thead>
            <tbody>
              {(!allowances?.length) ? (
                <tr>
                  <td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>No active allowances found.</td>
                </tr>
              ) : (
                // Map over them when available
                null
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
