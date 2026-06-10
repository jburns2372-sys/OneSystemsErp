'use client';

import { useState } from 'react';
import { updateReferenceStatus } from '@/app/actions/notebook';
import UploadReferenceModal from './UploadReferenceModal';

export default function NotebookClient({ initialFiles, currentUser }: any) {
  const [files, setFiles] = useState<any[]>(initialFiles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStatusChange = async (fileId: string, newStatus: string) => {
    setIsProcessing(true);
    try {
      await updateReferenceStatus(fileId, currentUser.id, newStatus, newStatus === 'ACTIVE_REFERENCE');
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: newStatus, isMandatory: newStatus === 'ACTIVE_REFERENCE' } : f));
    } catch (e: any) {
      alert(e.message || "Failed to update status. Check permissions.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'ACTIVE_REFERENCE': return '#10b981'; // green
      case 'PENDING_AI_INDEXING': return '#f59e0b'; // orange
      case 'SUPERSEDED': return '#ef4444'; // red
      case 'APPROVED': return '#3b82f6'; // blue
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div style={{ padding: '20px', color: 'var(--text-primary)' }}>
      <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0' }}>AI Notebook Reference Center</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Master policy hub for AI Validation Engine.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--accent-color)', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + Upload Reference
        </button>
      </header>

      {isModalOpen && <UploadReferenceModal onClose={() => setIsModalOpen(false)} currentUser={currentUser} />}

      <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '15px 10px' }}>File Name</th>
              <th style={{ padding: '15px 10px' }}>Category</th>
              <th style={{ padding: '15px 10px' }}>Target Module</th>
              <th style={{ padding: '15px 10px' }}>Status</th>
              <th style={{ padding: '15px 10px' }}>Uploaded By</th>
              <th style={{ padding: '15px 10px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {files.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No references uploaded yet.</td></tr>
            ) : files.map(file => (
              <tr key={file.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '15px 10px', fontWeight: 'bold' }}>
                  <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>
                    {file.fileName}
                  </a>
                </td>
                <td style={{ padding: '15px 10px', color: 'var(--text-secondary)' }}>{file.referenceCategory}</td>
                <td style={{ padding: '15px 10px', color: 'var(--text-secondary)' }}>{file.moduleAssignment || 'Global'}</td>
                <td style={{ padding: '15px 10px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold',
                    color: getStatusBadgeColor(file.status), backgroundColor: 'rgba(255,255,255,0.05)'
                  }}>
                    {file.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td style={{ padding: '15px 10px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{file.uploadedByRole}</td>
                <td style={{ padding: '15px 10px' }}>
                  <select 
                    value={file.status} 
                    onChange={e => handleStatusChange(file.id, e.target.value)}
                    disabled={isProcessing || file.status === 'SUPERSEDED'}
                    style={{ padding: '6px', borderRadius: '4px', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                  >
                    <option value="PENDING_AI_INDEXING">Pending AI</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="ACTIVE_REFERENCE">Make Active Reference</option>
                    <option value="SUPERSEDED">Superseded</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
