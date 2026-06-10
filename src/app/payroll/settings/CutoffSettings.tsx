'use client';

export default function CutoffSettings({ cutoffs }: { cutoffs: any[] }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 20px 0', color: '#fff' }}>Custom Payroll Cutoff Configuration</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Configure exactly when the payroll period starts, ends, and releases across different groups or the entire company.</p>
      
      <div style={{ display: 'grid', gap: '20px' }}>
        {cutoffs?.map((cutoff: any) => (
          <div key={cutoff.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '1.1rem' }}>{cutoff.cutoffName}</h4>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid var(--glass-border)' }}>{cutoff.cutoffType.replace(/_/g, ' ')}</span>
                  {cutoff.isDefault && <span style={{ background: 'rgba(0,255,163,0.1)', color: '#00ffa3', border: '1px solid rgba(0,255,163,0.3)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>DEFAULT</span>}
                  <span style={{ background: 'rgba(52,152,219,0.1)', color: '#3498db', border: '1px solid rgba(52,152,219,0.3)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>Applies to: {cutoff.appliesTo}</span>
                </div>
              </div>
              <button style={{ background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Edit</button>
            </div>
            
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Start Day</div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>{cutoff.startDay || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>End Day</div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>{cutoff.endDay || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Release Day</div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>{cutoff.payrollReleaseDay || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Crosses Month</div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>{cutoff.crossesMonth ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
        ))}

        {!cutoffs || cutoffs.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--glass-border)', borderRadius: '12px' }}>
            No custom cutoffs configured yet.
          </div>
        )}
      </div>

      <button style={{ marginTop: '20px', background: 'var(--accent-color)', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <span>+</span> Create New Cutoff Setting
      </button>
    </div>
  );
}
