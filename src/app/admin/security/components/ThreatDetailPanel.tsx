'use client';

import React, { useEffect, useState } from 'react';
import { getEventDetails } from '@/app/actions/socActions';
import { format } from 'date-fns';
import { ShieldAlert } from 'lucide-react';

interface PanelProps {
  eventId: string | null;
}

export default function ThreatDetailPanel({ eventId }: PanelProps) {
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (eventId) {
      setLoading(true);
      getEventDetails(eventId).then(data => {
        setEvent(data);
        setLoading(false);
      });
    } else {
      setEvent(null);
    }
  }, [eventId]);

  if (!eventId) {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)', padding: '24px', textAlign: 'center', boxSizing: 'border-box' }}>
        <ShieldAlert size={48} style={{ marginBottom: '12px', color: 'var(--text-muted)', flexShrink: 0 }} />
        <p style={{ fontSize: '0.875rem', margin: 0 }}>Select a threat from the map or threat feed to view details.</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#111', overflow: 'hidden' }}>
      <div style={{ flex: '0 0 auto', padding: '16px', borderBottom: '1px solid #1f2937', backgroundColor: '#151515', position: 'sticky', top: 0, zIndex: 10 }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>Event Details</h2>
      </div>

      <div style={{ flex: '1 1 auto', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', display: 'flex', justifyContent: 'center', color: '#6b7280', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>Loading forensic data...</div>
        ) : event ? (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '0.875rem' }}>
            
            {/* Header Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(17, 24, 39, 0.5)', padding: '12px', borderRadius: '8px', border: '1px solid #1f2937' }}>
              <div>
                <p style={{ color: '#9ca3af', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', marginTop: 0 }}>Threat Type</p>
                <p style={{ color: 'white', fontWeight: 'bold', fontSize: '0.875rem', margin: 0 }}>{event.threatType}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.625rem', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', backgroundColor: event.status === 'BLOCKED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: event.status === 'BLOCKED' ? '#34d399' : '#f87171', border: event.status === 'BLOCKED' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)' }}>
                  {event.status}
                </span>
              </div>
            </div>

            {/* Context */}
            <div>
              <h3 className="text-white text-xs uppercase tracking-wider font-semibold mb-2 border-b border-gray-800 pb-1">Context & Timeline</h3>
              <div className="grid grid-cols-2 gap-3 text-gray-300 text-xs">
                <div><span className="block text-gray-500 mb-0.5">Timestamp</span>{format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss')}</div>
                <div><span className="block text-gray-500 mb-0.5">Environment</span>{event.environment} {event.simulated && '(Simulated)'}</div>
                <div><span className="block text-gray-500 mb-0.5">Target Module</span>{event.module || 'N/A'}</div>
                <div><span className="block text-gray-500 mb-0.5">Action Attempted</span>{event.actionAttempted || 'N/A'}</div>
                <div className="col-span-2"><span className="block text-gray-500 mb-0.5">API Endpoint</span><span className="font-mono text-[10px]">{event.endpoint || 'N/A'}</span></div>
              </div>
            </div>

            {/* Network Intelligence */}
            <div>
              <h3 className="text-white text-xs uppercase tracking-wider font-semibold mb-2 border-b border-gray-800 pb-1">Network Intelligence</h3>
              <div className="grid grid-cols-2 gap-3 text-gray-300 text-xs">
                <div><span className="block text-gray-500 mb-0.5">Source IP</span><span className="font-mono">{event.sourceIp || 'N/A'}</span></div>
                <div><span className="block text-gray-500 mb-0.5">Location</span>{event.city ? `${event.city}, ${event.country}` : (event.country || 'Unknown')}</div>
                <div><span className="block text-gray-500 mb-0.5">ISP</span>{event.isp || 'N/A'}</div>
                <div><span className="block text-gray-500 mb-0.5">Organization</span>{event.organization || 'N/A'}</div>
              </div>
            </div>

            {/* Identity */}
            <div>
              <h3 className="text-white text-xs uppercase tracking-wider font-semibold mb-2 border-b border-gray-800 pb-1">Identity & Access</h3>
              <div className="grid grid-cols-2 gap-3 text-gray-300 text-xs">
                <div className="col-span-2"><span className="block text-gray-500 mb-0.5">User Account</span>{event.userEmail || event.userId || 'Unauthenticated'}</div>
                <div><span className="block text-gray-500 mb-0.5">Role</span>{event.userRole || 'N/A'}</div>
                <div><span className="block text-gray-500 mb-0.5">Assigned Project</span>{event.projectId || 'N/A'}</div>
              </div>
            </div>

            {/* System Response */}
            <div>
              <h3 className="text-white text-xs uppercase tracking-wider font-semibold mb-2 border-b border-gray-800 pb-1">System Response</h3>
              <div className="space-y-2 text-gray-300 text-xs">
                <div><span className="block text-gray-500 mb-0.5">Countermeasure Applied</span>{event.systemResponse}</div>
                <div><span className="block text-gray-500 mb-0.5">Final Result</span>{event.result}</div>
                <div><span className="block text-gray-500 mb-0.5">Data Exposure</span><span className={event.dataExposure === 'None' ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>{event.dataExposure || 'Unknown'}</span></div>
                {event.message && (
                  <div className="bg-gray-900 p-2 rounded border border-gray-800 text-[10px] font-mono text-red-300">
                    {event.message}
                  </div>
                )}
              </div>
            </div>

            {/* Admin Actions */}
            <div className="pt-3 border-t border-gray-800 space-y-2">
              <button className="w-full py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded font-semibold transition-colors">
                Create Incident Report
              </button>
              <div className="flex gap-2">
                <button className="flex-1 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-white rounded font-medium transition-colors">
                  Block IP
                </button>
                <button className="flex-1 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-white rounded font-medium transition-colors">
                  Revoke Sessions
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="p-10 text-center text-red-500 text-sm">Event not found.</div>
        )}
      </div>
    </div>
  );
}
