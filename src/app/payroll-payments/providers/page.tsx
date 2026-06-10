'use client';
import React from 'react';

export default function UnionBankProviderSetup() {
  return (
    <div style={{ padding: '20px', color: '#fff', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', textShadow: '0 0 10px var(--accent-glow)' }}>
            Payment Provider Setup
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
            Configure and manage secure API connections to UnionBank InstaPay, PESONet, and GCash.
          </p>
        </div>
        <button style={{ 
          background: 'var(--accent-color)', color: '#000', padding: '10px 20px', 
          borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none',
          boxShadow: '0 4px 12px rgba(0, 255, 163, 0.2)', transition: 'all 0.2s'
        }}>
          Add New Provider
        </button>
      </div>

      <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--glass-border)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>UnionBank Philippines</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Corporate API - InstaPay & PESONet Rails</p>
          </div>
          <span style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(0,255,163,0.2)', color: '#00ffa3', border: '1px solid rgba(0,255,163,0.4)' }}>
            Active Production
          </span>
        </div>
        
        <div style={{ padding: '0' }}>
          <dl style={{ margin: 0, padding: 0 }}>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', borderBottom: '1px solid var(--glass-border)' }}>
              <dt style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Client ID</dt>
              <dd style={{ fontSize: '0.9rem', color: '#fff', margin: 0, fontFamily: 'monospace' }}>**************4f8a</dd>
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
              <dt style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Client Secret</dt>
              <dd style={{ fontSize: '0.9rem', color: '#fff', margin: 0, fontFamily: 'monospace' }}>************************</dd>
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', borderBottom: '1px solid var(--glass-border)' }}>
              <dt style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Corporate Account Number</dt>
              <dd style={{ fontSize: '0.9rem', color: '#fff', margin: 0, fontWeight: 'bold' }}>1094 **** **** 3321</dd>
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
              <dt style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>InstaPay Transaction Limit</dt>
              <dd style={{ fontSize: '0.9rem', color: '#fff', margin: 0, fontWeight: 'bold' }}>₱50,000.00</dd>
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', borderBottom: '1px solid var(--glass-border)' }}>
              <dt style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Webhook URL</dt>
              <dd style={{ fontSize: '0.9rem', color: '#3498db', margin: 0 }}>https://pms.jdsoftware.com/api/webhooks/unionbank</dd>
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', background: 'rgba(0,0,0,0.2)' }}>
              <dt style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Actions</dt>
              <dd style={{ margin: 0, display: 'flex', gap: '15px' }}>
                <button style={{ background: 'transparent', border: '1px solid #3498db', color: '#3498db', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Test Connection</button>
                <button style={{ background: 'transparent', border: '1px solid #f39c12', color: '#f39c12', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Sync Receiving Banks</button>
                <button style={{ background: 'transparent', border: '1px solid var(--text-secondary)', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Edit Config</button>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
