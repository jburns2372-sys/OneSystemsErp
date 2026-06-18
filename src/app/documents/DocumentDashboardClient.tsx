'use client';

import { useState, useTransition } from 'react';
import { uploadDocument, deleteDocument } from '@/app/actions/documentActions';

export default function DocumentDashboardClient({ initialDocs, projects }: { initialDocs: any[], projects: any[] }) {
  const [docs, setDocs] = useState(initialDocs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('OTHER');
  const [projectId, setProjectId] = useState('');

  const [search, setSearch] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Please select a file to upload.');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (projectId) formData.append('projectId', projectId);

    startTransition(async () => {
      try {
        await uploadDocument(formData);
        setIsModalOpen(false);
        setFile(null);
        // Force a page refresh to get the latest docs
        window.location.reload();
      } catch (err: any) {
        alert(err.message || 'Upload failed');
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      startTransition(async () => {
        try {
          await deleteDocument(id);
          setDocs(docs.filter(d => d.id !== id));
        } catch (err) {
          alert('Failed to delete document');
        }
      });
    }
  };

  const filteredDocs = docs.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) || 
    d.category.toLowerCase().includes(search.toLowerCase())
  );

  const formatSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div style={{ padding: '20px', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Search documents..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', width: '300px' }}
        />
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ padding: '10px 20px', backgroundColor: 'var(--accent-color)', color: '#000', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          + Upload File
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '15px' }}>File Name</th>
              <th style={{ padding: '15px' }}>Category</th>
              <th style={{ padding: '15px' }}>Size</th>
              <th style={{ padding: '15px' }}>Uploaded By</th>
              <th style={{ padding: '15px' }}>Date</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>No documents found.</td>
              </tr>
            ) : filteredDocs.map(doc => (
              <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  📄 <a href={doc.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>{doc.title}</a>
                </td>
                <td style={{ padding: '15px' }}>
                  <span style={{ padding: '4px 8px', backgroundColor: 'rgba(0,240,255,0.1)', color: 'var(--accent-color)', borderRadius: '4px', fontSize: '0.85rem' }}>
                    {doc.category}
                  </span>
                </td>
                <td style={{ padding: '15px', color: 'var(--text-secondary)' }}>{formatSize(doc.fileSize)}</td>
                <td style={{ padding: '15px' }}>{doc.uploader?.name || 'System Generated'}</td>
                <td style={{ padding: '15px', color: 'var(--text-secondary)' }}>{new Date(doc.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <a 
                      href={doc.fileUrl} 
                      target="_blank"
                      rel="noreferrer"
                      style={{ padding: '6px 12px', backgroundColor: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px', textDecoration: 'none', fontSize: '0.85rem' }}
                    >
                      View
                    </a>
                    <button 
                      onClick={() => handleDelete(doc.id)}
                      disabled={isPending}
                      style={{ padding: '6px 12px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', cursor: isPending ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '30px', borderRadius: '16px', border: '1px solid var(--glass-border)', width: '500px', maxWidth: '90vw' }}>
            <h2 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Upload Document</h2>
            <form onSubmit={handleUpload}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Select File</label>
                <input 
                  type="file" 
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px dashed var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Category</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                >
                  <option value="NOA">Notice of Award (NOA)</option>
                  <option value="NTP">Notice to Proceed (NTP)</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="PLAN">Project Plan / Blueprint</option>
                  <option value="INSURANCE">Insurance Policy</option>
                  <option value="REPORT">Report</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Link to Project (Optional)</label>
                <select 
                  value={projectId} 
                  onChange={e => setProjectId(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                >
                  <option value="">-- No Project --</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPending}
                  style={{ padding: '10px 20px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isPending || !file}
                  style={{ padding: '10px 20px', backgroundColor: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: '8px', cursor: (isPending || !file) ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                >
                  {isPending ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
