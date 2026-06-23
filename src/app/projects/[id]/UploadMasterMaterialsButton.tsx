'use client';

import { useState } from 'react';
import { uploadMasterMaterialsList } from '@/app/actions/consolidation';

export default function UploadMasterMaterialsButton({ projectId }: { projectId: string }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsPending(true);
    setError('');
    
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('materialsFile', file);

    try {
      await uploadMasterMaterialsList(formData);
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '20px', padding: '40px', border: '1px solid var(--glass-border)', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.2)' }}>
      <h3 style={{ marginBottom: '15px' }}>Option A: Direct Excel Upload</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '600px', margin: '0 auto 20px auto' }}>
        Upload an Excel (.xlsx) file containing your materials list. Ensure it has columns like Item No, Description, Quantity, Unit, and Unit Cost.
      </p>
      
      {error && <p style={{ color: '#ef4444', marginBottom: '15px' }}>{error}</p>}
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="file" 
          accept=".xlsx,.xls" 
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="master-materials-upload"
        />
        <label 
          htmlFor="master-materials-upload"
          className="btn-secondary"
          style={{
            cursor: 'pointer',
            padding: '10px 20px',
            border: '1px solid var(--glass-border)',
            borderRadius: '6px',
            display: 'inline-block',
            marginRight: '10px'
          }}
        >
          {file ? `📁 ${file.name}` : '📄 Select Excel File'}
        </label>

        {file && (
          <button 
            onClick={handleUpload} 
            disabled={isPending}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: isPending ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isPending ? 'Uploading...' : 'Upload List'}
          </button>
        )}
      </div>
    </div>
  );
}
