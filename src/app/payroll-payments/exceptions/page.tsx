'use client';
import React from 'react';
import Link from 'next/link';

export default function PaymentExceptionsQueue() {
  return (
    <div style={{ padding: '20px', color: '#fff', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', textShadow: '0 0 10px var(--accent-glow)' }}>
            Payment Exceptions
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
            Manage and resolve failed payments or validation errors.
          </p>
        </div>
      </div>

      {/* Exception Categories */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1px solid rgba(231, 76, 60, 0.3)', padding: '20px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(231, 76, 60, 0.1)' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#e74c3c', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Invalid Bank Details</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff6b6b', marginTop: '10px' }}>3</p>
        </div>
        <div style={{ background: 'rgba(243, 156, 18, 0.1)', border: '1px solid rgba(243, 156, 18, 0.3)', padding: '20px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(243, 156, 18, 0.1)' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#f39c12', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>API Timeouts</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f1c40f', marginTop: '10px' }}>1</p>
        </div>
        <div style={{ background: 'rgba(241, 196, 15, 0.1)', border: '1px solid rgba(241, 196, 15, 0.3)', padding: '20px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(241, 196, 15, 0.1)' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#f1c40f', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Limit Exceeded</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f1c40f', marginTop: '10px' }}>1</p>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '20px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Total Resolved</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>12</p>
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--glass-border)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(0,0,0,0.2)' }}>
              <th style={{ padding: '15px 20px' }}>Worker / Batch</th>
              <th style={{ padding: '15px 20px' }}>Error Details</th>
              <th style={{ padding: '15px 20px' }}>Amount</th>
              <th style={{ padding: '15px 20px' }}>Status</th>
              <th style={{ padding: '15px 20px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <td style={{ padding: '15px 20px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>Apolinario Mabini</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PAY-2026-06-W1</div>
              </td>
              <td style={{ padding: '15px 20px' }}>
                <div style={{ fontSize: '0.9rem', color: '#ff6b6b', fontWeight: 'bold' }}>UBP-ERR-004: Invalid Account Number</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Bank returned "Account Does Not Exist"</div>
              </td>
              <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>₱12,000.00</td>
              <td style={{ padding: '15px 20px' }}>
                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.4)' }}>OPEN</span>
              </td>
              <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                <button style={{ background: 'transparent', border: '1px solid #3498db', color: '#3498db', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Update Bank Profile</button>
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <td style={{ padding: '15px 20px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>Gabriela Silang</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PAY-2026-06-W2</div>
              </td>
              <td style={{ padding: '15px 20px' }}>
                <div style={{ fontSize: '0.9rem', color: '#f39c12', fontWeight: 'bold' }}>API Timeout (504)</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Did not receive confirmation from PESONet</div>
              </td>
              <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>₱35,000.00</td>
              <td style={{ padding: '15px 20px' }}>
                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(243, 156, 18, 0.2)', color: '#f39c12', border: '1px solid rgba(243, 156, 18, 0.4)' }}>OPEN</span>
              </td>
              <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button style={{ background: 'transparent', border: '1px solid #3498db', color: '#3498db', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Check Status</button>
                  <button style={{ background: 'transparent', border: '1px solid var(--text-secondary)', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Retry</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
