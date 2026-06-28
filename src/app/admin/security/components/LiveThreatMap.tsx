'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamic import for leaflet components because they require the window object
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

interface ThreatMapProps {
  data: any[];
  onMarkerClick: (id: string) => void;
}

export default function LiveThreatMap({ data, onMarkerClick }: ThreatMapProps) {
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    import('leaflet').then((leaflet) => {
      // Leaflet needs to be imported dynamically on the client
      setL(leaflet.default || leaflet);
    });
  }, []);

  if (!mounted || !L) {
    return <div style={{ width: '100%', height: '100%', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '0.875rem' }}>Loading Threat Map Engine...</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>No active security threats detected for the selected time range.</p>
        <p style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: '8px', margin: 0 }}>The map will automatically update when events occur.</p>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch(severity?.toUpperCase()) {
      case 'CRITICAL': return '#ef4444'; // red-500
      case 'HIGH': return '#f97316'; // orange-500
      case 'MEDIUM': return '#eab308'; // yellow-500
      case 'LOW': return '#3b82f6'; // blue-500
      default: return '#10b981'; // emerald-500
    }
  };

  const create3DIcon = (severity: string) => {
    const color = getSeverityColor(severity);
    const size = severity === 'CRITICAL' ? 24 : severity === 'HIGH' ? 20 : 16;
    
    return L.divIcon({
      className: 'custom-3d-marker',
      html: `
        <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <!-- 3D Core Dot -->
          <div style="
            position: absolute; 
            width: 100%; 
            height: 100%; 
            border-radius: 50%; 
            background: radial-gradient(circle at 30% 30%, ${color}, #000); 
            box-shadow: 0 0 10px ${color}, inset 0 0 4px rgba(255,255,255,0.5); 
            z-index: 2;
            transition: transform 0.2s ease;
          " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'"></div>
          
          <!-- Radar Pulse -->
          <div style="
            position: absolute; 
            width: 100%; 
            height: 100%; 
            border-radius: 50%; 
            background-color: ${color}; 
            animation: radar-pulse 1.5s infinite ease-out; 
            z-index: 1;
          "></div>
          
          <!-- Drop Shadow (3D depth) -->
          <div style="
            position: absolute; 
            bottom: -${size/3}px; 
            width: 70%; 
            height: ${size/4}px; 
            background: rgba(0,0,0,0.8); 
            border-radius: 50%; 
            filter: blur(2px);
            z-index: 0;
          "></div>
        </div>
        <style>
          @keyframes radar-pulse {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(2.5); opacity: 0; }
          }
        </style>
      `,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
      popupAnchor: [0, -size/2]
    });
  };

  return (
    <MapContainer 
      center={[20, 0]} 
      zoom={2} 
      style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
      />
      
      {data.map((event, idx) => {
        if (!event.latitude || !event.longitude) return null;
        
        return (
          <Marker
            key={event.id || idx}
            position={[event.latitude, event.longitude]}
            icon={create3DIcon(event.severity)}
            eventHandlers={{
              click: () => onMarkerClick(event.id)
            }}
          >
            <Popup className="soc-popup">
              <div style={{ fontSize: '0.875rem', backgroundColor: '#111', padding: '12px', color: '#e5e7eb', borderRadius: '8px', minWidth: '180px' }}>
                <p style={{ fontWeight: 'bold', color: 'white', borderBottom: '1px solid #374151', paddingBottom: '4px', marginBottom: '8px', marginTop: 0 }}>
                  {event.sourceIp}
                  {event.simulated && <span style={{ marginLeft: '8px', fontSize: '0.6rem', backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '2px 4px', borderRadius: '4px' }}>SIMULATED</span>}
                </p>
                <p style={{ fontSize: '0.75rem', margin: '4px 0' }}><span style={{ color: '#9ca3af' }}>Loc:</span> {event.city}, {event.country}</p>
                <p style={{ fontSize: '0.75rem', margin: '4px 0' }}><span style={{ color: '#9ca3af' }}>Threat:</span> <span style={{ color: getSeverityColor(event.severity), fontWeight: 'bold' }}>{event.threatType}</span></p>
                <button 
                  onClick={(e) => { e.stopPropagation(); onMarkerClick(event.id); }}
                  style={{ marginTop: '12px', width: '100%', textAlign: 'center', fontSize: '0.75rem', backgroundColor: '#374151', padding: '6px 0', borderRadius: '4px', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
