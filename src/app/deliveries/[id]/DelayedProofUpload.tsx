'use client';

import { useState, useTransition } from 'react';
import { uploadDelayedDeliveryProof } from '@/app/actions/deliveryActions';

export default function DelayedProofUpload({ deliveryId }: { deliveryId: string }) {
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError('Please select a file to upload.');

    setError('');
    setSuccess('');

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('deliveryId', deliveryId);
        formData.append('file', file);

        const res = await uploadDelayedDeliveryProof(formData);
        
        if (res.success) {
          setSuccess('Document successfully uploaded and validated by AI!');
          // The page will automatically revalidate to show the document link.
        } else {
          setError(res.error || 'Failed to validate the document.');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred during upload.');
      }
    });
  };

  if (success) {
    return (
      <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '12px', padding: '20px', marginTop: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ✅ Document Verified
        </h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{success}</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)', marginTop: '20px' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
        ⚠️ Missing Proof of Delivery
      </h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
        A physical delivery receipt was not provided during the initial encoding. Please upload it now to satisfy AI compliance requirements. The AI will strictly verify that the receipt matches the previously encoded actual quantities.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="file" 
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={e => setFile(e.target.files?.[0] || null)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px dashed var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
          disabled={isPending}
          required
        />

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '6px', padding: '10px', fontSize: '0.9rem', color: '#ef4444' }}>
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isPending || !file}
          style={{ 
            padding: '12px', 
            borderRadius: '8px', 
            border: 'none', 
            background: isPending ? '#374151' : '#2563eb', 
            color: 'white', 
            fontWeight: 'bold', 
            cursor: isPending ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
        >
          {isPending ? '⏳ AI Engine Validating Document...' : 'Upload & Validate Document'}
        </button>
      </form>
    </div>
  );
}
