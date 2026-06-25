'use client';

import { useState } from 'react';

export default function RagTestClient() {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/rag-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      
      {/* Input Panel */}
      <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
        <h3>Test Query</h3>
        <form onSubmit={handleTest} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <textarea 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type a test user question here..."
            style={{ width: '100%', height: '100px', padding: '15px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
          />
          <button 
            type="submit" 
            disabled={isLoading}
            style={{ padding: '12px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isLoading ? 'Analyzing Pipeline...' : 'Run RAG Diagnostic'}
          </button>
        </form>

        <div style={{ marginTop: '30px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            This will dry-run the backend RAG intent detector and keyword expander without actually generating a full AI text response.
          </p>
        </div>
      </div>

      {/* Results Panel */}
      <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)', overflowY: 'auto', maxHeight: '70vh' }}>
        <h3>Diagnostic Results</h3>
        
        {!results && !isLoading && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '50px' }}>
            Enter a question and run the diagnostic to see the breakdown.
          </div>
        )}

        {isLoading && (
          <div style={{ textAlign: 'center', color: 'var(--accent-primary)', marginTop: '50px' }}>
            Processing RAG Pipeline...
          </div>
        )}

        {results && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: 'var(--accent-primary)' }}>1. Detected Intents</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {results.intents?.map((i: string) => (
                  <span key={i} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}>{i}</span>
                ))}
                {results.intents?.length === 0 && <span style={{ color: 'var(--text-secondary)' }}>None detected</span>}
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: 'var(--accent-primary)' }}>2. Expanded Keywords</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {results.expansion?.matchedKeywords?.map((k: any) => (
                  <span key={k.id} style={{ padding: '4px 10px', background: 'rgba(100,255,100,0.1)', color: '#69db7c', borderRadius: '12px', fontSize: '12px' }}>
                    {k.normalizedKeyword} ({k.keywordType})
                  </span>
                ))}
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: 'var(--accent-primary)' }}>3. Search Vectors</h4>
              <p style={{ margin: '5px 0', fontSize: '13px' }}><strong>Modules to Query:</strong> {results.expansion?.modulesToSearch?.join(', ') || 'None'}</p>
              <p style={{ margin: '5px 0', fontSize: '13px' }}><strong>Tables to Query:</strong> {results.expansion?.tablesToSearch?.join(', ') || 'None'}</p>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
