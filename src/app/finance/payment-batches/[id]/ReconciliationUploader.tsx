'use client';

import { useState } from 'react';
import { reconcileBatch } from '@/app/actions/reconciliationActions';
import { useRouter } from 'next/navigation';

export default function ReconciliationUploader({ batchId, disabled }: { batchId: string, disabled: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        // Basic parser: Expects Payslip ID, Status, Reference
        // e.g. "clxwaa123,SUCCESSFUL,REF-001"
        const results = [];
        
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const columns = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          // In the export, Payslip ID is column 0. We'll assume Status is the last column, or we can just expect a specific format:
          // Format expected: Payslip ID, Status, Reference
          if (columns.length >= 2) {
            results.push({
              payslipId: columns[0], // Column 0 is payslip ID
              status: columns[columns.length - 2].toUpperCase().includes('SUCCESS') ? 'SUCCESSFUL' : 'FAILED',
              reference: columns[columns.length - 1] || '' // Reference might be last
            });
          }
        }

        if (results.length === 0) throw new Error("No valid rows found in CSV.");

        setLoading(true);
        const res = await reconcileBatch(batchId, results, 'admin-user');
        setLoading(false);

        if (res.success) {
          alert('Reconciliation successful!');
          router.refresh();
        } else {
          setError(res.error);
        }
      } catch (err: any) {
        setError("Failed to parse CSV. Please ensure the format is correct.");
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--glass-border)', marginTop: '20px' }}>
      <h3 style={{ marginTop: 0 }}>Reconciliation Upload (Phase 6)</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px' }}>
        Upload the result CSV from GCash/Bank. Expected columns (in any order but must exist): <strong>Payslip ID, Status, Reference</strong>.
      </p>
      
      <input 
        type="file" 
        accept=".csv"
        onChange={handleFileUpload}
        disabled={disabled || loading}
        style={{ display: 'block', marginBottom: '10px' }}
      />
      
      {loading && <span style={{ color: '#3498db' }}>Processing reconciliation...</span>}
      {error && <span style={{ color: '#e74c3c' }}>{error}</span>}
    </div>
  );
}
