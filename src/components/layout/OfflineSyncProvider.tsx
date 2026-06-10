'use client';

import React, { useEffect, useState } from 'react';

export default function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial state securely without crashing server
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {isOffline && (
        <div style={{
          backgroundColor: 'var(--accent-color, #f39c12)',
          color: '#ffffff',
          padding: '12px 20px',
          textAlign: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 99999,
          fontWeight: '500',
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <span>
            <strong>You are offline.</strong> Any forms you submit will be securely queued and synced to the cloud automatically when Wi-Fi is restored.
          </span>
        </div>
      )}
      {children}
    </>
  );
}
