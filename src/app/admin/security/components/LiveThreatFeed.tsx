'use client';

import React from 'react';
import { format } from 'date-fns';

interface LiveThreatFeedProps {
  feed: any[];
  onRowClick: (id: string) => void;
}

export default function LiveThreatFeed({ feed, onRowClick }: LiveThreatFeedProps) {
  
  const getSeverityBadge = (severity: string) => {
    const baseStyle = { padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid transparent' };
    switch(severity) {
      case 'CRITICAL': return <span style={{ ...baseStyle, backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}>CRITICAL</span>;
      case 'HIGH': return <span style={{ ...baseStyle, backgroundColor: 'rgba(249, 115, 22, 0.2)', color: '#fb923c', borderColor: 'rgba(249, 115, 22, 0.3)' }}>HIGH</span>;
      case 'MEDIUM': return <span style={{ ...baseStyle, backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#facc15', borderColor: 'rgba(234, 179, 8, 0.3)' }}>MEDIUM</span>;
      case 'LOW': return <span style={{ ...baseStyle, backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.3)' }}>LOW</span>;
      default: return <span style={{ ...baseStyle, backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}>INFO</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseStyle = { padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid transparent' };
    if (status === 'BLOCKED') return <span style={{ ...baseStyle, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.2)' }}>BLOCKED</span>;
    if (status === 'ALLOWED') return <span style={{ ...baseStyle, backgroundColor: 'rgba(107, 114, 128, 0.1)', color: '#9ca3af', borderColor: 'rgba(107, 114, 128, 0.2)' }}>ALLOWED</span>;
    return <span style={{ ...baseStyle, backgroundColor: '#1f2937', color: '#d1d5db', borderColor: '#374151' }}>{status}</span>;
  }

  return (
    <div style={{ backgroundColor: '#111', borderRadius: '12px', border: '0', display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#151515', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', position: 'sticky', top: 0, zIndex: 20 }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'white', letterSpacing: '0.025em', margin: 0 }}>Live Threat Feed</h2>
        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Displaying latest {feed.length} events</span>
      </div>
      
      <div style={{ overflow: 'auto', flex: 1, padding: 0 }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: '#151515', borderBottom: '1px solid #1f2937', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', zIndex: 10, fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <tr>
              <th style={{ padding: '12px', fontWeight: 500 }}>Timestamp</th>
              <th style={{ padding: '12px', fontWeight: 500 }}>Severity</th>
              <th style={{ padding: '12px', fontWeight: 500 }}>Threat Type</th>
              <th style={{ padding: '12px', fontWeight: 500 }}>Source IP</th>
              <th style={{ padding: '12px', fontWeight: 500 }}>Location</th>
              <th style={{ padding: '12px', fontWeight: 500 }}>Target</th>
              <th style={{ padding: '12px', fontWeight: 500 }}>Status</th>
            </tr>
          </thead>
          <tbody style={{ borderTop: '1px solid rgba(31, 41, 55, 0.5)' }}>
            {feed.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>No events logged yet.</td>
              </tr>
            ) : feed.map(event => (
              <tr 
                key={event.id} 
                onClick={() => onRowClick(event.id)}
                style={{ cursor: 'pointer', transition: 'background-color 0.2s', fontSize: '0.875rem', color: '#d1d5db' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(31, 41, 55, 0.5)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '12px', whiteSpace: 'nowrap', fontSize: '0.75rem', fontFamily: 'monospace', color: '#9ca3af' }}>
                  {format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                </td>
                <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{getSeverityBadge(event.severity)}</td>
                <td style={{ padding: '12px', fontWeight: 500, color: '#e5e7eb' }}>{event.threatType}</td>
                <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#9ca3af' }}>{event.sourceIp || 'N/A'}</td>
                <td style={{ padding: '12px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {event.city ? `${event.city}, ${event.country}` : (event.country || 'Unknown')}
                </td>
                <td style={{ padding: '12px', color: '#9ca3af', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {event.module || 'System'}
                </td>
                <td style={{ padding: '12px' }}>{getStatusBadge(event.result || event.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
