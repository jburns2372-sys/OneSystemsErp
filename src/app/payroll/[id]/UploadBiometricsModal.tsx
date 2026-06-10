'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { processAIBiometrics } from '@/app/actions/dtrActions';

export default function UploadBiometricsModal({ period, onClose }: { period: any, onClose: () => void }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const currentUserId = 'clxw8xxvj0000vwu4xxw8xxvj'; 
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('periodId', period.id);
    formData.append('userId', currentUserId);

    const res = await processAIBiometrics(formData);
    
    setLoading(false);
    if (res.success) {
      setSuccess('File uploaded successfully! AI has processed the biometrics and flagged any anomalies.');
      setTimeout(() => {
        onClose();
      }, 3000);
    } else {
      setError(res.error || 'Failed to process file');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(10, 15, 26, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '25px 35px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff', fontWeight: '700' }}>Upload Biometrics</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>

        <form onSubmit={handleUpload} style={{ padding: '35px' }}>
          {error && (
            <div style={{ background: 'rgba(255, 107, 107, 0.1)', color: '#ff6b6b', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', border: '1px solid rgba(255, 107, 107, 0.3)' }}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{ background: 'rgba(0, 255, 163, 0.1)', color: '#00ffa3', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', border: '1px solid rgba(0, 255, 163, 0.3)' }}>
              {success}
            </div>
          )}

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Select Biometric Export File</label>
            <div style={{ 
              border: '2px dashed var(--glass-border)', 
              borderRadius: '12px', 
              padding: '40px 20px', 
              textAlign: 'center',
              background: 'rgba(0,0,0,0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <input 
                type="file" 
                accept=".csv, .xlsx, .pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '2.5rem' }}>📄</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>
                  {file ? file.name : 'Click to select or drag & drop'}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Supports CSV, Excel (XLSX), or PDF</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
            <button type="button" onClick={onClose} style={{ padding: '12px 25px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ background: '#3498db', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)' }}>
              {loading ? 'Uploading...' : 'Upload & Process with AI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
