import React from 'react';
import Link from 'next/link';
import styles from '../../page.module.css';
import { getFleetStats, getActiveTelemetry } from '@/app/actions/equipmentActions';
import FMSClientView from './FMSClientView';

export default async function FMSDashboard() {
  const stats = await getFleetStats();
  const fleet = await getActiveTelemetry();

  return (
    <div className={styles.dashboardContainer} style={{ maxWidth: '1600px', backgroundColor: '#0a0a0a', padding: '20px', borderRadius: '12px' }}>
      <header className={styles.header} style={{ borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '20px' }}>
        <div className={styles.headerTitle}>
          <h1 style={{ color: '#fff', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🛰️</span> Fleet Management System (FMS)
          </h1>
          <p style={{ color: '#888' }}>Live telemetry, GPS tracking, and predictive maintenance insights via Geotab integration.</p>
        </div>
      </header>

      {/* High-Tech KPIs */}
      <div className={styles.statsGrid} style={{ marginBottom: '40px', gap: '20px' }}>
        <div style={{ background: 'linear-gradient(145deg, #111, #1a1a1a)', border: '1px solid #333', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          <h3 style={{ color: '#aaa', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Connected Fleet</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>{stats.totalVehicles}</div>
        </div>
        <div style={{ background: 'linear-gradient(145deg, #111, #1a1a1a)', border: '1px solid #333', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          <h3 style={{ color: '#aaa', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Now (Moving)</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#22c55e', marginTop: '10px' }}>{stats.activeNow}</div>
        </div>
        <div style={{ background: 'linear-gradient(145deg, #111, #1a1a1a)', border: '1px solid #333', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          <h3 style={{ color: '#aaa', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Engine Hours</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6', marginTop: '10px' }}>{stats.totalEngineHours.toLocaleString()}</div>
        </div>
        <div style={{ background: 'linear-gradient(145deg, #220505, #3a0a0a)', border: '1px solid #5c1616', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(239, 68, 68, 0.2)' }}>
          <h3 style={{ color: '#fca5a5', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Fault Codes</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444', marginTop: '10px' }}>{stats.faultEvents}</div>
        </div>
      </div>

      {/* Interactive Map & Telemetry Client */}
      <FMSClientView fleet={fleet} />
    </div>
  );
}
