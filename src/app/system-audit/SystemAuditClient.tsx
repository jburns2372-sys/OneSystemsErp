'use client';

import { useState } from 'react';

export default function SystemAuditClient({ initialLogs }: { initialLogs: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('ALL');

  const filteredLogs = initialLogs.filter(log => {
    const matchesSearch = 
      log.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesModule = filterModule === 'ALL' || log.moduleName === filterModule;
    
    return matchesSearch && matchesModule;
  });

  const uniqueModules = Array.from(new Set(initialLogs.map(log => log.moduleName))).sort();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
        <input 
          type="text" 
          placeholder="Search logs (user, action, remarks, ID)..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: '#fff', width: '300px' }}
        />
        
        <select 
          value={filterModule} 
          onChange={e => setFilterModule(e.target.value)}
          style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: '#fff', width: '200px' }}
        >
          <option value="ALL">All Modules</option>
          {uniqueModules.map(mod => (
            <option key={mod} value={mod}>{mod}</option>
          ))}
        </select>
        
        <div style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Showing top {filteredLogs.length} immutable records
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--glass-border)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', background: 'rgba(0,0,0,0.2)' }}>
              <th style={{ padding: '15px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Timestamp</th>
              <th style={{ padding: '15px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>User / Role</th>
              <th style={{ padding: '15px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Module</th>
              <th style={{ padding: '15px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Action</th>
              <th style={{ padding: '15px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Transaction Ref</th>
              <th style={{ padding: '15px', color: 'var(--text-secondary)', textTransform: 'uppercase', width: '30%' }}>Details / Remarks</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No logs found matching your filters.
                </td>
              </tr>
            ) : filteredLogs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '15px', color: 'var(--text-secondary)' }}>
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ fontWeight: 'bold' }}>{log.user?.name || log.userId || 'System'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-color)' }}>{log.userRole || log.user?.role}</div>
                </td>
                <td style={{ padding: '15px', fontWeight: 'bold' }}>
                  {log.moduleName}
                </td>
                <td style={{ padding: '15px' }}>
                  <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>
                    {log.actionType}
                  </span>
                </td>
                <td style={{ padding: '15px', color: '#ccc' }}>
                  {log.transactionId || 'N/A'}
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ color: '#aaa', marginBottom: log.remarks ? '5px' : '0' }}>
                    {log.oldValue && log.newValue ? `${log.oldValue} ➔ ${log.newValue}` : log.newValue || ''}
                  </div>
                  {log.remarks && (
                    <div style={{ fontStyle: 'italic', color: '#fff', fontSize: '0.85rem' }}>"{log.remarks}"</div>
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
