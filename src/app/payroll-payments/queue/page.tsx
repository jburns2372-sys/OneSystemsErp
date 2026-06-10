'use client';
import React from 'react';
import Link from 'next/link';

export default function ApprovedPayslipQueue() {
  return (
    <div style={{ padding: '20px', color: '#fff', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', textShadow: '0 0 10px var(--accent-glow)' }}>
            Approved Payslips Queue
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
            View and batch payslips that are approved, locked, and funded.
          </p>
        </div>
        <button style={{ 
          background: 'transparent', border: '1px solid var(--glass-border)', color: '#fff', 
          padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
          transition: 'all 0.2s'
        }}>
          Filter
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '20px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Ready for GCash</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3498db', marginTop: '10px' }}>45</p>
          <button style={{ marginTop: '15px', background: 'transparent', border: 'none', color: '#3498db', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>Create GCash Batch →</button>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '20px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Ready for InstaPay</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00ffa3', marginTop: '10px' }}>82</p>
          <button style={{ marginTop: '15px', background: 'transparent', border: 'none', color: '#00ffa3', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>Create InstaPay Batch →</button>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '20px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>PESONet / Manual Review</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f39c12', marginTop: '10px' }}>15</p>
          <button style={{ marginTop: '15px', background: 'transparent', border: 'none', color: '#f39c12', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>Create PESONet Batch →</button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--glass-border)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(0,0,0,0.2)' }}>
              <th style={{ padding: '15px 20px' }}>Payslip No.</th>
              <th style={{ padding: '15px 20px' }}>Worker</th>
              <th style={{ padding: '15px 20px' }}>Category</th>
              <th style={{ padding: '15px 20px' }}>Net Pay</th>
              <th style={{ padding: '15px 20px' }}>Recommended Route</th>
              <th style={{ padding: '15px 20px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>PS-2026-06-101-01</td>
              <td style={{ padding: '15px 20px' }}>Juan Dela Cruz</td>
              <td style={{ padding: '15px 20px', color: 'var(--text-secondary)' }}>Weekly Salaried</td>
              <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>₱8,500.00</td>
              <td style={{ padding: '15px 20px' }}>
                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(52, 152, 219, 0.2)', color: '#3498db', border: '1px solid rgba(52, 152, 219, 0.4)' }}>GCash</span>
              </td>
              <td style={{ padding: '15px 20px' }}>
                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(0, 255, 163, 0.2)', color: '#00ffa3', border: '1px solid rgba(0, 255, 163, 0.4)' }}>Ready</span>
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>PS-2026-06-102-01</td>
              <td style={{ padding: '15px 20px' }}>Maria Clara</td>
              <td style={{ padding: '15px 20px', color: 'var(--text-secondary)' }}>Semi-Monthly</td>
              <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>₱25,000.00</td>
              <td style={{ padding: '15px 20px' }}>
                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(155, 89, 182, 0.2)', color: '#9b59b6', border: '1px solid rgba(155, 89, 182, 0.4)' }}>InstaPay</span>
              </td>
              <td style={{ padding: '15px 20px' }}>
                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(0, 255, 163, 0.2)', color: '#00ffa3', border: '1px solid rgba(0, 255, 163, 0.4)' }}>Ready</span>
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>PS-2026-06-103-01</td>
              <td style={{ padding: '15px 20px' }}>Pedro Penduko</td>
              <td style={{ padding: '15px 20px', color: 'var(--text-secondary)' }}>1-Lot Consultant</td>
              <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>₱150,000.00</td>
              <td style={{ padding: '15px 20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(243, 156, 18, 0.2)', color: '#f39c12', border: '1px solid rgba(243, 156, 18, 0.4)' }}>PESONet</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Exceeds InstaPay Limit</span>
                </div>
              </td>
              <td style={{ padding: '15px 20px' }}>
                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(0, 255, 163, 0.2)', color: '#00ffa3', border: '1px solid rgba(0, 255, 163, 0.4)' }}>Ready</span>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>PS-2026-06-104-01</td>
              <td style={{ padding: '15px 20px' }}>Andres Bonifacio</td>
              <td style={{ padding: '15px 20px', color: 'var(--text-secondary)' }}>Semi-Monthly</td>
              <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>₱22,000.00</td>
              <td style={{ padding: '15px 20px' }}>
                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)' }}>Manual Review</span>
              </td>
              <td style={{ padding: '15px 20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.4)' }}>Payment Hold</span>
                  <span style={{ fontSize: '0.7rem', color: '#e74c3c' }}>Unverified Bank Account</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
