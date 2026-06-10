'use client';

import { useState } from 'react';
import { askERPAssistant } from '@/app/actions/aiAssistantActions';

export default function AssistantClient() {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'Hello! I am the ONESYSTEMS ERP Assistant. Ask me anything about project workflows, business rules, payroll rules, or SOPs from the Knowledge Center.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    const res = await askERPAssistant(userMessage);

    if (res.success && res.answer) {
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer }]);
    } else {
      setMessages(prev => [...prev, { role: 'assistant', content: `[Error]: ${res.error}` }]);
    }
    
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)' }}>
        <h2 style={{ margin: 0, color: 'var(--accent-color)' }}>AI ERP Assistant</h2>
        <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Powered by Gemini NotebookLM Knowledge Base</p>
      </div>

      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ 
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            background: msg.role === 'user' ? 'rgba(52, 152, 219, 0.2)' : 'rgba(255,255,255,0.05)',
            border: msg.role === 'user' ? '1px solid rgba(52, 152, 219, 0.4)' : '1px solid var(--glass-border)',
            padding: '15px 20px',
            borderRadius: '12px',
            maxWidth: '75%',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap'
          }}>
            <strong style={{ display: 'block', marginBottom: '5px', color: msg.role === 'user' ? '#3498db' : 'var(--accent-color)' }}>
              {msg.role === 'user' ? 'You' : 'ERP Assistant'}
            </strong>
            {msg.content}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '15px 20px', color: 'var(--text-secondary)' }}>
            Thinking...
          </div>
        )}
      </div>

      <div style={{ padding: '20px', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="E.g. What is the process for materials request?"
            style={{ flex: 1, padding: '15px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff' }}
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            style={{ padding: '0 25px', background: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.5 : 1 }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
