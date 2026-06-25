'use client';

import { useState } from 'react';

export default function AdminKnowledgeClient() {
  const [activeTab, setActiveTab] = useState<'upload' | 'system'>('upload');
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [allowedRoles, setAllowedRoles] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;
    
    setIsUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    
    // Parse roles (e.g. "PROJECT_MANAGER, FINANCE") into JSON array
    const rolesArray = allowedRoles.split(',').map(r => r.trim()).filter(Boolean);
    if (rolesArray.length > 0) {
      formData.append('allowedRoles', JSON.stringify(rolesArray));
    }

    try {
      const res = await fetch('/api/knowledge/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      setMessage(`Success! Document indexed into ${data.chunksProcessed} chunks.`);
      setFile(null);
      setTitle('');
      setAllowedRoles('');
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSystemIndex = async (actionType: 'schema' | 'routes') => {
    setIsUploading(true);
    setMessage('');
    try {
      const res = await fetch('/api/knowledge/index-system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Indexing failed');
      setMessage(data.message);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', padding: '30px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
        <button 
          onClick={() => setActiveTab('upload')}
          style={{ background: 'none', border: 'none', color: activeTab === 'upload' ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '1.2rem', fontWeight: activeTab === 'upload' ? 'bold' : 'normal', cursor: 'pointer' }}
        >
          Document Upload
        </button>
        <button 
          onClick={() => setActiveTab('system')}
          style={{ background: 'none', border: 'none', color: activeTab === 'system' ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '1.2rem', fontWeight: activeTab === 'system' ? 'bold' : 'normal', cursor: 'pointer' }}
        >
          System Mapping Tools
        </button>
      </div>

      {activeTab === 'upload' && (
        <>
          <h2 style={{ marginBottom: '20px' }}>Upload New Knowledge Document</h2>
          
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '600px' }}>
            <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Document Title</label>
          <input 
            type="text" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            required
            placeholder="e.g. 2026 Procurement SOP"
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: '#fff' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Allowed Roles (Comma separated, leave blank for all)</label>
          <input 
            type="text" 
            value={allowedRoles} 
            onChange={e => setAllowedRoles(e.target.value)} 
            placeholder="e.g. PROJECT_MANAGER, FINANCE, EXECUTIVE"
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: '#fff' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Select File (PDF, TXT)</label>
          <input 
            type="file" 
            accept=".pdf,.txt"
            onChange={e => setFile(e.target.files?.[0] || null)} 
            required
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: '#fff' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={isUploading || !file || !title}
          style={{ 
            padding: '12px', 
            background: isUploading ? 'gray' : 'var(--accent-color)', 
            color: '#000', 
            fontWeight: 'bold', 
            borderRadius: '8px', 
            border: 'none',
            cursor: isUploading ? 'not-allowed' : 'pointer'
          }}
        >
          {isUploading ? 'Parsing & Generating Embeddings...' : 'Upload & Index'}
        </button>

          {message && (
            <div style={{ padding: '15px', borderRadius: '8px', background: message.startsWith('Error') ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)', color: message.startsWith('Error') ? '#ff4444' : '#00cc00' }}>
              {message}
            </div>
          )}
        </form>
        </>
      )}

      {activeTab === 'system' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
          <h2 style={{ marginBottom: '10px' }}>Super Admin Knowledge Triggers</h2>
          <p style={{ color: 'var(--text-secondary)' }}>These tools allow the AI to read the raw application code and database schemas. Because this process is highly intensive, it is currently running in <b>Simulation Mode</b> to conserve API quota.</p>
          
          <button 
            onClick={() => handleSystemIndex('schema')}
            disabled={isUploading}
            style={{ padding: '15px', background: 'var(--bg-dark)', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: isUploading ? 'not-allowed' : 'pointer', textAlign: 'left' }}
          >
            <strong>Index Database Schema</strong>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '5px' }}>Parses prisma/schema.prisma and embeds all table definitions.</div>
          </button>

          <button 
            onClick={() => handleSystemIndex('routes')}
            disabled={isUploading}
            style={{ padding: '15px', background: 'var(--bg-dark)', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: isUploading ? 'not-allowed' : 'pointer', textAlign: 'left' }}
          >
            <strong>Index Application Routes</strong>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '5px' }}>Maps the Next.js App Router directory to teach the AI about all ERP modules.</div>
          </button>

          {message && (
            <div style={{ padding: '15px', borderRadius: '8px', background: message.startsWith('Error') ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)', color: message.startsWith('Error') ? '#ff4444' : '#00cc00', marginTop: '10px' }}>
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
