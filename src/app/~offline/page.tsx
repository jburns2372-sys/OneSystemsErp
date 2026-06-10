'use client';

import React from 'react';

export default function OfflinePage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 60, 60, 0.1)',
        borderRadius: '50%',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <span style={{ fontSize: '3rem' }}>📶</span>
      </div>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>You are Offline</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: '1.6' }}>
        It looks like you've lost your internet connection. Don't worry, the app will automatically reconnect as soon as your network is back!
      </p>
      <button 
        onClick={() => window.location.reload()}
        style={{
          marginTop: '30px',
          padding: '10px 20px',
          backgroundColor: 'var(--accent-color)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          transition: 'opacity 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
      >
        Try Again
      </button>
    </div>
  );
}
