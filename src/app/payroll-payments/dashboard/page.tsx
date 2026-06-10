'use client';
import React from 'react';
import Link from 'next/link';

export default function PayrollPaymentDashboard() {
  return (
    <div style={{ padding: '20px', color: '#fff', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', textShadow: '0 0 10px var(--accent-glow)' }}>
          Payroll Payment Automation
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/payroll-payments/queue" style={{ 
            background: 'var(--accent-color)', color: '#000', padding: '10px 20px', 
            borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', 
            boxShadow: '0 4px 12px rgba(0, 255, 163, 0.2)', transition: 'all 0.2s' 
          }}>
            Payment Queue
          </Link>
          <Link href="/payroll-payments/providers" style={{ 
            background: 'transparent', border: '1px solid var(--glass-border)', color: '#fff', 
            padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none',
            transition: 'all 0.2s' 
          }}>
            Provider Setup
          </Link>
        </div>
      </div>

      {/* High-Level Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Payroll Bank Balance</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>₱1,250,000.00</p>
          <p style={{ fontSize: '0.8rem', color: '#00ffa3', marginTop: '5px' }}>Sufficient for pending batches</p>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Approved Payslips</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3498db', marginTop: '10px', textShadow: '0 0 10px rgba(52, 152, 219, 0.5)' }}>142</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '5px' }}>Pending Payment</p>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Processing Batches</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f39c12', marginTop: '10px', textShadow: '0 0 10px rgba(243, 156, 18, 0.5)' }}>3</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '5px' }}>Awaiting Settlement</p>
        </div>
        <div style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1px solid rgba(231, 76, 60, 0.3)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 8px 32px rgba(231, 76, 60, 0.1)' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#e74c3c', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Payment Exceptions</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff6b6b', marginTop: '10px', textShadow: '0 0 10px rgba(255, 107, 107, 0.5)' }}>5</p>
          <Link href="/payroll-payments/exceptions" style={{ fontSize: '0.8rem', color: '#ff6b6b', marginTop: '5px', textDecoration: 'underline' }}>
            Requires Attention
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Recent Batches */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>Recent API Batches</h2>
            <Link href="/payroll-payments/batches" style={{ fontSize: '0.9rem', color: '#3498db', textDecoration: 'none', fontWeight: 'bold' }}>View All</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '15px 20px' }}>Batch ID</th>
                  <th style={{ padding: '15px 20px' }}>Rail</th>
                  <th style={{ padding: '15px 20px' }}>Amount</th>
                  <th style={{ padding: '15px 20px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>
                    <Link href="/payroll-payments/batches/batch-001" style={{ color: '#3498db', textDecoration: 'none' }}>PAY-2026-06-W1</Link>
                  </td>
                  <td style={{ padding: '15px 20px', color: 'var(--text-secondary)' }}>InstaPay</td>
                  <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>₱450,000.00</td>
                  <td style={{ padding: '15px 20px' }}>
                    <span style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(0,255,163,0.2)', color: '#00ffa3', border: '1px solid rgba(0,255,163,0.4)' }}>SUCCESSFUL</span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>
                    <Link href="/payroll-payments/batches/batch-002" style={{ color: '#3498db', textDecoration: 'none' }}>PAY-2026-06-W2</Link>
                  </td>
                  <td style={{ padding: '15px 20px', color: 'var(--text-secondary)' }}>PESONet</td>
                  <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>₱1,200,000.00</td>
                  <td style={{ padding: '15px 20px' }}>
                    <span style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(243,156,18,0.2)', color: '#f39c12', border: '1px solid rgba(243,156,18,0.4)' }}>PROCESSING</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Risk Alerts */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>🤖</span>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>AI Validation Alerts</h2>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ background: 'rgba(243, 156, 18, 0.1)', borderLeft: '4px solid #f39c12', padding: '15px', borderRadius: '0 8px 8px 0' }}>
              <p style={{ fontSize: '0.9rem', color: '#f39c12', fontWeight: 'bold' }}>Medium Risk: Fallback Recommendation</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '5px' }}>3 payslips exceeded InstaPay limits and are recommended for PESONet routing.</p>
            </div>
            <div style={{ background: 'rgba(231, 76, 60, 0.1)', borderLeft: '4px solid #e74c3c', padding: '15px', borderRadius: '0 8px 8px 0' }}>
              <p style={{ fontSize: '0.9rem', color: '#e74c3c', fontWeight: 'bold' }}>Payment Blocked</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '5px' }}>Duplicate GCash number detected for Worker ID 0045 & 0046.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
