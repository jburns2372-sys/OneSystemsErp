import React from 'react';
import Link from 'next/link';
import styles from '../../page.module.css';
import { getEquipmentList, getUtilizationSummary, getMaintenanceSummary, getAIDashboardStats } from '@/app/actions/equipmentActions';

const equipmentModules = [
  { name: 'Equipment Registry', href: '/equipment/registry', icon: '🚜', description: 'Master database of all owned and rented equipment.' },
  { name: 'Deployments & Transfers', href: '/equipment/deployments', icon: '🏗️', description: 'Assign equipment to projects and track location history.' },
  { name: 'Utilization & Logs', href: '/equipment/utilization', icon: '⏱️', description: 'Track engine hours, fuel consumption, and daily logs.' },
  { name: 'Fleet Management (FMS)', href: '/equipment/fms-dashboard', icon: '🛰️', description: 'Live Geotab Telemetry & Map Tracking' },
  { name: 'Hikvision Devices', href: '/equipment/hikvision', icon: '📹', description: 'Register and manage onboard security telematics.' },
  { name: 'Live Fleet Map', href: '/equipment/fleet-map', icon: '🗺️', description: 'Real-time GPS tracking of all integrated vehicles.' },
  { name: 'Maintenance & Repairs', href: '/equipment/maintenance', icon: '🔧', description: 'Preventive maintenance scheduling and repair tracking.' },
  { name: 'AI Safety & Diagnostics', href: '/equipment/ai-center', icon: '🧠', description: 'Automated predictive maintenance and fault alerts.' }
];

export default async function EquipmentHub() {
  const [equipment, utilSummary, maintSummary, aiStats] = await Promise.all([
    getEquipmentList().catch(() => []),
    getUtilizationSummary().catch(() => ({ totalHours: 0, totalFuel: 0, totalLogs: 0, totalCost: 0, manualCount: 0, fmsCount: 0, topEquipment: [] })),
    getMaintenanceSummary().catch(() => ({ scheduled: 0, inProgress: 0, completed: 0, overdue: 0, totalCost: 0, preventiveCount: 0, repairCount: 0, totalRecords: 0 })),
    getAIDashboardStats().catch(() => ({ openFindings: 0, resolvedFindings: 0, criticalFindings: 0, highFindings: 0, safetyEvents: 0 }))
  ]);

  const activeEquipment = equipment.filter(e => e.status === 'ACTIVE').length;
  const maintenanceCount = equipment.filter(e => e.status === 'MAINTENANCE').length;
  const fmsConnected = equipment.filter(e => e.fmsDeviceId).length;

  return (
    <div className={styles.dashboardContainer} style={{ maxWidth: '1400px' }}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Equipment & Fleet Hub</h1>
          <p>Centralized management for heavy machinery, fleet tracking, and preventive maintenance.</p>
        </div>
      </header>

      {/* KPI Stats Section */}
      <div className={styles.statsGrid} style={{ marginBottom: '40px' }}>
        <div className={styles.statCard}>
          <h3>Total Assets</h3>
          <div className={styles.statValue}>{equipment.length}</div>
        </div>
        <div className={styles.statCard}>
          <h3>Active Fleet</h3>
          <div className={styles.statValue} style={{ color: '#22c55e' }}>{activeEquipment}</div>
        </div>
        <div className={styles.statCard}>
          <h3>Under Maintenance</h3>
          <div className={styles.statValue} style={{ color: '#f59e0b' }}>{maintenanceCount}</div>
        </div>
        <div className={styles.statCard}>
          <h3>FMS Connected</h3>
          <div className={styles.statValue} style={{ color: '#3b82f6' }}>{fmsConnected}</div>
        </div>
        <div className={styles.statCard}>
          <h3>Hours This Month</h3>
          <div className={styles.statValue} style={{ color: '#8b5cf6' }}>{utilSummary.totalHours.toFixed(1)}</div>
        </div>
        <div className={styles.statCard}>
          <h3>Fuel This Month (L)</h3>
          <div className={styles.statValue} style={{ color: '#f97316' }}>{utilSummary.totalFuel.toFixed(1)}</div>
        </div>
        <div className={styles.statCard}>
          <h3>AI Flags</h3>
          <div className={styles.statValue} style={{ color: aiStats.openFindings > 0 ? '#ef4444' : '#22c55e' }}>{aiStats.openFindings}</div>
        </div>
        <div className={styles.statCard}>
          <h3>Maint. Scheduled</h3>
          <div className={styles.statValue} style={{ color: '#3b82f6' }}>{maintSummary.scheduled}</div>
        </div>
        <div className={styles.statCard}>
          <h3>Maint. Overdue</h3>
          <div className={styles.statValue} style={{ color: maintSummary.overdue > 0 ? '#ef4444' : '#22c55e' }}>{maintSummary.overdue}</div>
        </div>
      </div>

      {/* Modules Grid */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-primary)' }}>
        Equipment Modules
      </h2>
      <style>{`
        .module-card {
          background-color: var(--bg-secondary, #ffffff);
          border-radius: 12px;
          padding: 20px;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          border: 1px solid var(--glass-border, #e5e7eb);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          cursor: pointer;
        }
        .module-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px rgba(0,0,0,0.1);
          border-color: var(--accent-color, #f59e0b);
        }
      `}</style>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '20px' 
      }}>
        {equipmentModules.map((module) => (
          <Link 
            key={module.name} 
            href={module.href}
            style={{ textDecoration: 'none' }}
          >
            <div className="module-card">
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
                {module.icon}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary, #111827)', margin: 0 }}>
                {module.name}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #6b7280)', margin: 0, lineHeight: 1.4 }}>
                {module.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
