'use client';

import { useState } from 'react';
import { autoConsolidateBOQ } from '@/app/actions/consolidation';

export default function AutoConsolidateButton({ projectId }: { projectId: string }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');

  const handleConsolidate = async () => {
    setIsPending(true);
    setError('');
    try {
      await autoConsolidateBOQ(projectId);
    } catch (err: any) {
      setError(err.message || 'An error occurred during consolidation.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '40px', padding: '40px', border: '1px solid var(--glass-border)', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.2)' }}>
      <h3 style={{ marginBottom: '15px' }}>Master Materials List</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px auto' }}>
        No consolidated items found. Click the button below to use the AI engine to analyze your Procurement Benchmark, group identical items, and generate a synchronized Master Materials List.
      </p>
      
      {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}
      
      <button 
        onClick={handleConsolidate} 
        disabled={isPending}
        style={{
          background: 'linear-gradient(135deg, var(--accent-color) 0%, #0891b2 100%)',
          color: '#fff',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          cursor: isPending ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)',
          transition: 'transform 0.2s',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        {isPending ? (
          <>
            <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
            AI Engine Mapping...
          </>
        ) : (
          <>
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11 2a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3h6zM5 1a4 4 0 0 0-4 4v6a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4V5a4 4 0 0 0-4-4H5zm4.5 4.5a.5.5 0 0 0-1 0v2H6.5a.5.5 0 0 0 0 1h2v2a.5.5 0 0 0 1 0v-2h2a.5.5 0 0 0 0-1h-2v-2z"/>
            </svg>
            Generate Master Materials List
          </>
        )}
      </button>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
