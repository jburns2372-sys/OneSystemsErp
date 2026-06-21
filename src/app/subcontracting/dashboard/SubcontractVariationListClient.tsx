'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FileEdit, AlertTriangle, CheckCircle, Clock, Search, ChevronRight } from 'lucide-react';

export default function SubcontractVariationListClient({ vos }: { vos: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const totalVOs = vos.length;
  const pendingVOs = vos.filter(v => v.currentStatus !== 'APPROVED' && v.currentStatus !== 'REJECTED').length;
  const highRiskVOs = vos.filter(v => v.aiRiskRating === 'HIGH' || v.aiRiskRating === 'CRITICAL').length;
  const approvedVOs = vos.filter(v => v.currentStatus === 'APPROVED').length;

  const metrics = [
    { title: 'Total VOs', value: totalVOs, icon: <FileEdit size={20} color="var(--primary)" /> },
    { title: 'Pending Approval', value: pendingVOs, icon: <Clock size={20} color="var(--warning-color)" /> },
    { title: 'High Risk', value: highRiskVOs, icon: <AlertTriangle size={20} color="#f87171" /> },
    { title: 'Approved', value: approvedVOs, icon: <CheckCircle size={20} color="#34d399" /> },
  ];

  const filteredVos = vos.filter(v => 
    v.voNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.variationType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <style>{`
        .metric-card {
          background: var(--bg-secondary);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .metric-icon-bg {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(59, 130, 246, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .metric-title {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        .metric-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--text-primary);
        }
        .vo-table-container {
          background: var(--bg-secondary);
          border-radius: 12px;
          border: 1px solid var(--glass-border);
          overflow: hidden;
          margin-top: 24px;
        }
        .vo-table-header {
          padding: 20px;
          border-bottom: 1px solid var(--glass-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .search-wrapper {
          position: relative;
          width: 300px;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
        }
        .search-input {
          width: 100%;
          padding: 10px 10px 10px 40px;
          border-radius: 8px;
          border: 1px solid var(--glass-border);
          background: var(--bg-primary);
          color: var(--text-primary);
          outline: none;
        }
        .vo-table {
          width: 100%;
          border-collapse: collapse;
        }
        .vo-table th {
          text-align: left;
          padding: 12px 20px;
          color: var(--text-secondary);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--glass-border);
          background: rgba(0,0,0,0.02);
        }
        .vo-table td {
          padding: 16px 20px;
          border-bottom: 1px solid var(--glass-border);
          color: var(--text-primary);
          font-size: 0.95rem;
        }
        .vo-table tbody tr:hover {
          background: rgba(59, 130, 246, 0.02);
        }
        .risk-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
        }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        {metrics.map((m, i) => (
          <div key={i} className="metric-card">
            <div className="metric-icon-bg">{m.icon}</div>
            <div>
              <div className="metric-title">{m.title}</div>
              <div className="metric-value">{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="vo-table-container">
        <div className="vo-table-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Master List</h2>
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              className="search-input"
              placeholder="Search VOs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <table className="vo-table">
          <thead>
            <tr>
              <th>VO Number</th>
              <th>Type</th>
              <th>Created Date</th>
              <th>Net Amount</th>
              <th>Risk</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredVos.length > 0 ? (
              filteredVos.map((vo) => (
                <tr key={vo.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{vo.voNumber}</td>
                  <td>{vo.variationType}</td>
                  <td>{new Date(vo.createdAt).toLocaleDateString()}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, color: vo.netVariationAmount < 0 ? '#f87171' : 'inherit' }}>
                    {vo.netVariationAmount < 0 ? '-' : ''}₱{Math.abs(vo.netVariationAmount).toLocaleString()}
                  </td>
                  <td>
                    <span className="risk-badge" style={{
                      background: vo.aiRiskRating === 'CRITICAL' || vo.aiRiskRating === 'HIGH' ? 'rgba(239, 68, 68, 0.1)' :
                                  vo.aiRiskRating === 'MEDIUM' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(52, 211, 153, 0.1)',
                      color: vo.aiRiskRating === 'CRITICAL' || vo.aiRiskRating === 'HIGH' ? '#ef4444' :
                             vo.aiRiskRating === 'MEDIUM' ? '#f59e0b' : '#10b981'
                    }}>
                      {vo.aiRiskRating || 'PENDING'}
                    </span>
                  </td>
                  <td>
                    <span className="status-badge" style={{
                      background: vo.currentStatus === 'APPROVED' ? 'rgba(52, 211, 153, 0.1)' :
                                  vo.currentStatus === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      color: vo.currentStatus === 'APPROVED' ? '#10b981' :
                             vo.currentStatus === 'REJECTED' ? '#ef4444' : '#3b82f6'
                    }}>
                      {vo.currentStatus}
                    </span>
                  </td>
                  <td>
                    <Link href={`/variation-orders/${vo.id}`} style={{ textDecoration: 'none', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                      View <ChevronRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No variation orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
