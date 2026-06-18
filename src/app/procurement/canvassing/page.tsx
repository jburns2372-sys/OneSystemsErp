import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function CanvassingDashboard() {
  const mrfForCanvass = await prisma.materialRequest.findMany({
    where: { status: 'APPROVED' },
    include: { project: true, items: true }
  });

  // Mock active canvass forms since CanvassForm model doesn't exist in schema yet
  const activeCanvassForms: any[] = [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: 'var(--accent-color)', margin: 0, textShadow: '0 0 10px var(--accent-glow)' }}>
          Canvassing & Supplier Comparison
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* MRFs Awaiting Canvass */}
        <div className="glass-card">
          <h3 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
            📋 Approved MRFs Ready for Canvass
          </h3>
          {mrfForCanvass.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No MRFs awaiting canvass.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '8px' }}>MRF Number</th>
                  <th style={{ padding: '8px' }}>Project</th>
                  <th style={{ padding: '8px' }}>Items</th>
                  <th style={{ padding: '8px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {mrfForCanvass.map((mr: any) => (
                  <tr key={mr.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 8px', color: '#fff' }}>{mr.mrNumber}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{mr.project.name}</td>
                    <td style={{ padding: '12px 8px' }}>{mr.items.length}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <Link href={`/procurement/canvassing/new?mrId=${mr.id}`}>
                        <button style={{
                          background: 'rgba(0, 240, 255, 0.1)',
                          border: '1px solid var(--accent-color)',
                          color: 'var(--accent-color)',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}>Start Canvass</button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Active Canvass Forms */}
        <div className="glass-card">
          <h3 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
            🔍 Active Canvass Forms
          </h3>
          {activeCanvassForms.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No active canvass forms.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '8px' }}>Canvass No.</th>
                  <th style={{ padding: '8px' }}>MRF No.</th>
                  <th style={{ padding: '8px' }}>Quotations</th>
                  <th style={{ padding: '8px' }}>Status</th>
                  <th style={{ padding: '8px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeCanvassForms.map(cf => (
                  <tr key={cf.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 8px', color: '#fff', fontWeight: 'bold' }}>{cf.canvassNumber}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{cf.mr.mrNumber}</td>
                    <td style={{ padding: '12px 8px' }}>{cf.quotations.length}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        backgroundColor: cf.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                        color: cf.status === 'COMPLETED' ? '#4ade80' : '#facc15'
                      }}>
                        {cf.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <Link href={`/procurement/canvassing/${cf.id}`}>
                        <button style={{
                          background: 'transparent',
                          border: '1px solid var(--text-secondary)',
                          color: 'var(--text-primary)',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}>View</button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
