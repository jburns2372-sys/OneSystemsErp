'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function KnowledgeCenterClient({ stats }: { stats: any }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  
  // Document Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBulkScan = async () => {
    setIsScanning(true);
    setScanResult('');
    try {
      const res = await fetch('/api/admin/bulk-scan', { method: 'POST' });
      const data = await res.json();
      setScanResult(data.message);
    } catch (e) {
      setScanResult('Error during scan.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '30px' }}>
      
      {/* Sidebar Navigation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={() => setActiveTab('dashboard')} style={tabStyle(activeTab === 'dashboard')}>Dashboard</button>
        <button onClick={() => window.location.href='/admin/ai-keyword-registry'} style={tabStyle(false)}>Keyword Registry</button>
        <button onClick={() => window.location.href='/admin/ai-rag-test-center'} style={tabStyle(false)}>RAG Test Center</button>
        <button onClick={() => setActiveTab('knowledge')} style={tabStyle(activeTab === 'knowledge')}>Knowledge Map</button>
        <button onClick={() => setActiveTab('comparison')} style={tabStyle(activeTab === 'comparison')}>Comparison Map</button>
        <button onClick={() => setActiveTab('documents')} style={tabStyle(activeTab === 'documents')}>Document Ingestion</button>
      </div>

      {/* Main Content Area */}
      <div style={{ background: 'var(--bg-secondary)', padding: '30px', borderRadius: '12px', border: '1px solid var(--glass-border)', minHeight: '600px' }}>
        
        {activeTab === 'dashboard' && (
          <div>
            <h2>AI Scanner Dashboard</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
              <StatCard title="Knowledge Maps" value={stats.knowledgeMapCount} />
              <StatCard title="Keywords" value={stats.keywordCount} />
              <StatCard title="Comparisons" value={stats.comparisonCount} />
              <StatCard title="Embeddings" value={stats.embeddingCount} />
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '8px' }}>
              <h3>Trigger Auto-Discovery</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Run the AI scanner to analyze the database schema and automatically generate new aliases, synonyms, and ontology mappings.</p>
              <button 
                onClick={handleBulkScan} 
                disabled={isScanning}
                style={{ padding: '12px 24px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {isScanning ? 'Scanning Schema...' : 'Run Bulk Database Scan'}
              </button>
              {scanResult && <p style={{ marginTop: '15px', color: '#69db7c' }}>{scanResult}</p>}
            </div>
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div>
            <h2>Knowledge Map</h2>
            <p style={{ color: 'var(--text-secondary)' }}>A view of all system components automatically discovered by the AI.</p>
            <p>(Run the bulk scan on the dashboard to populate this area).</p>
          </div>
        )}

        {activeTab === 'comparison' && (
          <div>
            <h2>Comparison Map</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Pre-defined formulas for cross-module AI comparisons (e.g. Profitability vs Procurement Variance).</p>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid var(--accent-primary)' }}>
              <strong>Project Profitability</strong><br/>
              Formula: <code>Project.contractAmount - (PO.totalAmount + Subcontract.contractAmount + Expense.amount)</code>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <h2>Document Ingestion Pipeline</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Upload PDFs, Word Documents, or SOPs to be automatically chunked and vectorized for RAG retrieval.</p>
            
            <div 
              style={{
                border: '2px dashed var(--glass-border)',
                borderRadius: '12px',
                padding: '40px',
                textAlign: 'center',
                background: 'rgba(0,0,0,0.2)',
                marginBottom: '20px',
                cursor: 'pointer'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.txt,.md,.csv"
                onChange={(e) => {
                  if (e.target.files?.[0]) setFile(e.target.files[0]);
                }}
              />
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>📄</div>
              {file ? (
                <div style={{ color: '#69db7c', fontWeight: 'bold' }}>Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)</div>
              ) : (
                <div style={{ color: 'var(--text-secondary)' }}>Click or drag a PDF or Text file here</div>
              )}
            </div>

            <button 
              disabled={!file || isUploading}
              onClick={async () => {
                if (!file) return;
                setIsUploading(true);
                setUploadResult('Extracting text and generating vectors...');
                
                const formData = new FormData();
                formData.append('file', file);
                formData.append('confidentiality', 'PUBLIC');

                try {
                  const res = await fetch('/api/admin/document-upload', {
                    method: 'POST',
                    body: formData
                  });
                  const data = await res.json();
                  setUploadResult(data.message || (data.success ? 'Upload complete!' : 'Upload failed.'));
                  if (data.success) setFile(null);
                } catch (e) {
                  setUploadResult('Error uploading document.');
                } finally {
                  setIsUploading(false);
                }
              }}
              style={{ 
                padding: '12px 24px', 
                background: (!file || isUploading) ? 'rgba(255,255,255,0.1)' : 'var(--accent-primary)', 
                color: (!file || isUploading) ? 'var(--text-secondary)' : 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: (!file || isUploading) ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                width: '100%'
              }}
            >
              {isUploading ? 'Vectorizing Document...' : 'Upload and Vectorize'}
            </button>
            
            {uploadResult && (
              <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', color: uploadResult.includes('Error') || uploadResult.includes('failed') ? '#ff6b6b' : '#69db7c' }}>
                {uploadResult}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string, value: number }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--glass-border)' }}>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{value}</div>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '5px' }}>{title}</div>
    </div>
  );
}

function tabStyle(isActive: boolean) {
  return {
    padding: '15px 20px',
    background: isActive ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontWeight: isActive ? 'bold' : 'normal',
    transition: 'background 0.2s'
  };
}
