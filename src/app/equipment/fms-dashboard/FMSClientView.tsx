'use client';

import React, { useState } from 'react';

export default function FMSClientView({ fleet }: { fleet: any[] }) {
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(fleet[0] || null);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px', minHeight: '600px' }}>
      {/* Map / Visualization Area */}
      <div style={{ 
        background: '#111', 
        border: '1px solid #333', 
        borderRadius: '12px', 
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 50px rgba(0,0,0,0.8)'
      }}>
        {/* Mock Map Background Grid */}
        <div style={{ 
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
          backgroundSize: '40px 40px',
          opacity: 0.3
        }} />

        {/* HUD Overlay */}
        <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(0,0,0,0.7)', padding: '10px 15px', borderRadius: '8px', border: '1px solid #333', color: '#fff' }}>
          <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Live Tracking Active</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }} />
            <span style={{ fontSize: '0.9rem' }}>Receiving Geotab Telemetry...</span>
          </div>
        </div>

        {/* Mock Vehicle Markers */}
        {fleet.map((vehicle, i) => {
          // Calculate arbitrary mock position based on ID if no real GPS
          const top = vehicle.telemetry?.[0]?.latitude ? `${(vehicle.telemetry[0].latitude % 100)}%` : `${20 + (i * 15)}%`;
          const left = vehicle.telemetry?.[0]?.longitude ? `${(vehicle.telemetry[0].longitude % 100)}%` : `${30 + (i * 20)}%`;
          const isSelected = selectedVehicle?.id === vehicle.id;
          
          return (
            <div 
              key={vehicle.id}
              onClick={() => setSelectedVehicle(vehicle)}
              style={{
                position: 'absolute',
                top, left,
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
                zIndex: isSelected ? 10 : 1
              }}
            >
              <div style={{
                background: isSelected ? '#3b82f6' : '#22c55e',
                color: '#fff',
                padding: '5px 10px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                boxShadow: `0 0 15px ${isSelected ? '#3b82f6' : '#22c55e'}`,
                border: '2px solid #fff'
              }}>
                {vehicle.code}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sidebar: Vehicle Details */}
      <div style={{ background: '#111', border: '1px solid #333', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.2rem', borderBottom: '1px solid #333', paddingBottom: '10px', margin: 0 }}>Fleet List</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
          {fleet.length === 0 ? (
            <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No FMS-connected vehicles found.</div>
          ) : fleet.map(vehicle => {
            const isSelected = selectedVehicle?.id === vehicle.id;
            const tele = vehicle.telemetry?.[0] || {};
            const isMoving = tele.engineState === 'MOVING';
            const hasFault = tele.faultCodes && tele.faultCodes.length > 2;

            return (
              <div 
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle)}
                style={{
                  background: isSelected ? '#1a1a1a' : 'transparent',
                  border: `1px solid ${isSelected ? '#3b82f6' : '#333'}`,
                  borderRadius: '8px',
                  padding: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 'bold' }}>{vehicle.code}</div>
                    <div style={{ color: '#888', fontSize: '0.85rem' }}>{vehicle.name}</div>
                  </div>
                  <div style={{ 
                    background: hasFault ? 'rgba(239, 68, 68, 0.2)' : (isMoving ? 'rgba(34, 197, 94, 0.2)' : 'rgba(136, 136, 136, 0.2)'),
                    color: hasFault ? '#ef4444' : (isMoving ? '#22c55e' : '#888'),
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    border: `1px solid ${hasFault ? '#ef4444' : (isMoving ? '#22c55e' : '#555')}`
                  }}>
                    {hasFault ? 'FAULT DETECTED' : (isMoving ? 'MOVING' : 'IDLE/OFF')}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#666' }}>Engine: </span>
                    <span style={{ color: '#ccc' }}>{vehicle.lastEngineHours?.toFixed(1) || '0.0'} hrs</span>
                  </div>
                  <div>
                    <span style={{ color: '#666' }}>Odometer: </span>
                    <span style={{ color: '#ccc' }}>{vehicle.lastOdometer?.toFixed(1) || '0.0'} km</span>
                  </div>
                </div>

                {hasFault && (
                  <div style={{ marginTop: '10px', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '4px', color: '#ef4444', fontSize: '0.8rem' }}>
                    <strong>DTC:</strong> {JSON.parse(tele.faultCodes).join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
