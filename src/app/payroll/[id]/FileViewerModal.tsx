'use client';

import { useState, useEffect } from 'react';

export default function FileViewerModal({ filename, onClose }: { filename: string, onClose: () => void }) {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isCsv = filename.toLowerCase().endsWith('.csv');

  useEffect(() => {
    if (isCsv) {
      fetch(`/api/uploads/biometrics/${filename}`)
        .then(res => {
          if (!res.ok) throw new Error('File not found');
          return res.text();
        })
        .then(text => {
          setFileContent(text);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [filename, isCsv]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'var(--bg-primary)', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '1000px',
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid var(--glass-border)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Viewing File: {filename}</h2>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '20px', border: '1px solid var(--glass-border)' }}>
          {loading ? (
            <p>Loading file...</p>
          ) : error ? (
            <p style={{ color: '#ff6b6b' }}>{error}</p>
          ) : isCsv ? (
            <div style={{ overflowX: 'auto' }}>
              <pre style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {fileContent}
              </pre>
            </div>
          ) : (
            <iframe 
              src={`/api/uploads/biometrics/${filename}`} 
              style={{ width: '100%', height: '70vh', border: 'none' }}
              title="File Viewer"
            />
          )}
        </div>
      </div>
    </div>
  );
}
