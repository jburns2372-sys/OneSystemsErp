'use client';

import React, { useState } from 'react';
import { Bot, Send, X, AlertCircle } from 'lucide-react';
import { askVariationOrderAssistant } from '@/app/actions/aiVariationValidationActions';
import styles from '@/app/knowledge-center/chat/page.module.css'; // Reusing chat styles

export default function AIVariationAssistant({ voId }: { voId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatLog, setChatLog] = useState<{role: 'user'|'ai', msg: string}[]>([
    { role: 'ai', msg: 'Hi! I am your Variation Order Assistant. How can I help you draft, validate, or summarize this VO?' }
  ]);

  const handleSend = async () => {
    if (!query.trim() || !voId) return;
    const userMsg = query;
    setChatLog(prev => [...prev, { role: 'user', msg: userMsg }]);
    setQuery('');
    setLoading(true);
    
    try {
      const response = await askVariationOrderAssistant(voId, userMsg);
      setChatLog(prev => [...prev, { role: 'ai', msg: response }]);
    } catch (e: any) {
      setChatLog(prev => [...prev, { role: 'ai', msg: 'Error: ' + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'var(--primary)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer', zIndex: 1000,
          border: 'none'
        }}
      >
        <Bot size={28} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: '2rem', right: '2rem',
      width: '400px', height: '600px', backgroundColor: 'var(--surface)',
      borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      display: 'flex', flexDirection: 'column', zIndex: 1000,
      border: '1px solid var(--border)'
    }}>
      <div style={{
        padding: '1rem', background: 'var(--primary)', color: '#fff', 
        borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <Bot size={20} /> <strong>VO Assistant</strong>
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', background: 'var(--bg)', padding: '0.5rem', borderRadius: '8px' }}>
          <AlertCircle size={14} /> AI outputs are recommendations only and cannot approve the VO.
        </div>
        {chatLog.map((c, i) => (
          <div key={i} style={{
            alignSelf: c.role === 'user' ? 'flex-end' : 'flex-start',
            background: c.role === 'user' ? 'var(--primary)' : 'var(--bg)',
            color: c.role === 'user' ? '#fff' : 'var(--text)',
            padding: '0.75rem 1rem', borderRadius: '12px', maxWidth: '85%'
          }}>
            {c.msg}
          </div>
        ))}
        {loading && <div style={{ alignSelf: 'flex-start', color: 'var(--text-secondary)' }}>Typing...</div>}
      </div>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" 
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything about this VO..."
          style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        />
        <button 
          onClick={handleSend}
          disabled={loading || !query.trim()}
          style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 1rem', cursor: 'pointer' }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
