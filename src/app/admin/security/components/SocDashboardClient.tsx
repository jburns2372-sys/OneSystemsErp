'use client';

import React, { useState, useEffect } from 'react';
import LiveThreatFeed from './LiveThreatFeed';
import SystemCountermeasures from './SystemCountermeasures';
import LiveThreatMap from './LiveThreatMap';
import ThreatDetailPanel from './ThreatDetailPanel';
import { getLiveThreatFeed, getSocDashboardStats, getThreatMapData, getCountermeasuresData } from '@/app/actions/socActions';
import { 
  ShieldCheck, ShieldAlert, Lock, 
  Map, Server, AlertTriangle, Hand 
} from 'lucide-react';

interface SocDashboardClientProps {
  initialStats: any;
  initialFeed: any[];
  initialMapData: any[];
  initialCountermeasures: any[];
}

export default function SocDashboardClient({ initialStats, initialFeed, initialMapData, initialCountermeasures }: SocDashboardClientProps) {
  const [stats, setStats] = useState(initialStats);
  const [feed, setFeed] = useState(initialFeed);
  const [mapData, setMapData] = useState(initialMapData);
  const [countermeasures, setCountermeasures] = useState(initialCountermeasures);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const [newStats, newFeed, newMap, newCm] = await Promise.all([
        getSocDashboardStats(),
        getLiveThreatFeed(),
        getThreatMapData(),
        getCountermeasuresData()
      ]);
      setStats(newStats);
      setFeed(newFeed);
      setMapData(newMap);
      setCountermeasures(newCm);
    } catch (err) {
      console.error("Failed to refresh SOC data:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isLiveMode) return;
    const interval = setInterval(refreshData, 10000); // 10 seconds refresh
    return () => clearInterval(interval);
  }, [isLiveMode]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', width: '100%', padding: '20px', boxSizing: 'border-box' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid var(--glass-border)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--text-primary)' }}>
            <ShieldCheck size={40} style={{ color: 'var(--accent-color)' }} />
            Security Operations Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.9rem' }}>
            Real-time threat monitoring, attack map, automated countermeasures, and incident response center for OneSystemsERP.
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--glass-panel)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingRight: '15px', borderRight: '1px solid var(--glass-border)' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: isLiveMode ? '#ef4444' : '#64748b' }}></div>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', letterSpacing: '1px' }}>{isLiveMode ? 'LIVE MODE' : 'PAUSED'}</span>
          </div>
          <button 
            onClick={() => setIsLiveMode(!isLiveMode)}
            style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
          >
            {isLiveMode ? 'Pause' : 'Resume'}
          </button>
          <button 
            onClick={refreshData}
            disabled={refreshing}
            style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold', background: 'var(--accent-secondary)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', opacity: refreshing ? 0.5 : 1 }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '20px' }}>
        <KpiCard title="Events Today" count={stats.totalEvents} icon={<Server size={24} color="#3b82f6" />} color="rgba(59, 130, 246, 0.1)" />
        <KpiCard title="Blocked Threats" count={stats.blockedThreats} icon={<Lock size={24} color="#10b981" />} color="rgba(16, 185, 129, 0.1)" />
        <KpiCard title="Critical Threats" count={stats.criticalThreats} icon={<ShieldAlert size={24} color="#ef4444" />} color="rgba(239, 68, 68, 0.1)" />
        <KpiCard title="Failed Logins" count={stats.failedLogins} icon={<Hand size={24} color="#f97316" />} color="rgba(249, 115, 22, 0.1)" />
        <KpiCard title="Active Incidents" count={stats.activeIncidents} icon={<AlertTriangle size={24} color="#f43f5e" />} color="rgba(244, 63, 94, 0.1)" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '20px', minHeight: 0 }}>
        {/* Map and Details Row */}
        <div style={{ display: 'flex', gap: '20px', flex: 3, minHeight: 0 }}>
          <div style={{ flex: 2.5, position: 'relative', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 400, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1px' }}>
                <Map size={16} color="var(--accent-color)" /> LIVE THREAT MAP
              </h2>
            </div>
            <div style={{ height: '100%', width: '100%', zIndex: 0 }}>
              <LiveThreatMap data={mapData} onMarkerClick={(id: string) => setSelectedEventId(id)} />
            </div>
          </div>
          
          <div style={{ flex: 1, minWidth: '320px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
            <ThreatDetailPanel eventId={selectedEventId} />
          </div>
        </div>

        {/* Feed and Countermeasures Row */}
        <div style={{ display: 'flex', gap: '20px', flex: 2, minHeight: 0 }}>
          <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <LiveThreatFeed feed={feed} onRowClick={(id: string) => setSelectedEventId(id)} />
          </div>
          <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <SystemCountermeasures countermeasures={countermeasures} />
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, count, icon, color }: { title: string, count: number, icon: React.ReactNode, color: string }) {
  return (
    <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
      <div>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>{title}</p>
        <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>{count.toLocaleString()}</p>
      </div>
      <div style={{ padding: '10px', backgroundColor: color, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
    </div>
  );
}
