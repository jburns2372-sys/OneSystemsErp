'use client';

import React, { useState, useEffect } from 'react';
import styles from '../../page.module.css';
import { getLiveFleetLocations } from '@/app/actions/fleetTelemetryService';

export default function FleetMapClient() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);

  useEffect(() => {
    loadData();
    // Refresh every 10 seconds to simulate real-time
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const data = await getLiveFleetLocations();
      setVehicles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.dashboardContainer} style={{ maxWidth: '1600px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
      <header className={styles.header} style={{ marginBottom: '20px' }}>
        <div className={styles.headerTitle}>
          <h1>Live Fleet Map</h1>
          <p>Real-time GPS tracking and Hikvision device status monitor.</p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Active Vehicles</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--success-color)' }}>{vehicles.length}</div>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>
        
        {/* SIDEBAR: Vehicle List */}
        <div style={{ width: '350px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '15px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-primary)' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Fleet Status</h3>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {isLoading && vehicles.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Fleet...</div>
            ) : vehicles.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No active vehicles found.</div>
            ) : (
              vehicles.map(v => (
                <div 
                  key={v.deviceId}
                  onClick={() => setSelectedVehicle(v)}
                  style={{ 
                    padding: '15px', 
                    background: selectedVehicle?.deviceId === v.deviceId ? 'var(--bg-primary)' : 'transparent',
                    border: '1px solid',
                    borderColor: selectedVehicle?.deviceId === v.deviceId ? 'var(--accent-color)' : 'var(--glass-border)',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{v.equipmentCode}</strong>
                    <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '10px', background: v.telemetry?.engineState === 'MOVING' ? 'rgba(0,255,0,0.1)' : 'rgba(255,255,255,0.05)', color: v.telemetry?.engineState === 'MOVING' ? 'var(--success-color)' : 'var(--text-secondary)' }}>
                      {v.telemetry?.engineState || 'OFFLINE'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{v.equipmentName}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                    {v.telemetry ? `${v.telemetry.speed || 0} km/h` : 'No GPS Data'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MAIN: Map Area Placeholder */}
        <div style={{ flex: 1, background: '#111', borderRadius: '12px', border: '1px solid var(--glass-border)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          {/* MOCK MAP GRID BACKGROUND */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
          
          <div style={{ zIndex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🗺️</div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>Global Fleet Map Tracker</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
              Advanced map integration requires a map provider API key (e.g., Google Maps, Mapbox). For now, vehicles are tracked via the telemetry sidebar.
            </p>
          </div>

          {/* MOCK MARKER IF SELECTED */}
          {selectedVehicle && selectedVehicle.telemetry && (
            <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ background: 'var(--accent-color)', color: '#fff', padding: '5px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                {selectedVehicle.equipmentCode} - {selectedVehicle.telemetry.speed || 0} km/h
              </div>
              <div style={{ width: '20px', height: '20px', background: 'var(--accent-color)', borderRadius: '50%', border: '3px solid #fff', boxShadow: '0 0 10px rgba(0,255,255,0.5)' }} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
