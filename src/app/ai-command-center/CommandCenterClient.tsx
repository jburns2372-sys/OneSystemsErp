'use client';

import { useRef, useEffect, useState } from 'react';

export default function CommandCenterClient() {
  const [safeMessages, setSafeMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMsg = { id: Date.now().toString(), role: 'user', content: input };
    const currentMessages = [...safeMessages, userMsg];
    
    setSafeMessages(currentMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages })
      });

      if (!response.body) throw new Error('No stream available');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';

      setSafeMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        // toTextStreamResponse returns raw text chunks. We append directly.
        // We strip Vercel stream prefixes if they exist by accident (e.g. 0:"text")
        let parsedChunk = chunk;
        if (chunk.startsWith('0:')) {
           try {
               const lines = chunk.split('\n').filter(Boolean);
               parsedChunk = lines.map(line => {
                   if (line.startsWith('0:')) return JSON.parse(line.slice(2));
                   return line;
               }).join('');
           } catch(e) {}
        }
        
        aiText += parsedChunk;

        setSafeMessages(prev => {
          const newArr = [...prev];
          newArr[newArr.length - 1] = { ...newArr[newArr.length - 1], content: aiText };
          return newArr;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [safeMessages]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
      
      {/* Chat History Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Welcome Message */}
        {safeMessages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '10vh', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🧠</div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>Welcome to the AI Command Center</h2>
            <p style={{ maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
              I am your ERP assistant. I have real-time access to the system's global statistics and all active company policies. How can I help you manage operations today?
            </p>
          </div>
        )}

        {safeMessages.map((m: any) => (
          <div 
            key={m.id} 
            style={{ 
              display: 'flex', 
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' 
            }}
          >
            <div 
              style={{
                maxWidth: '80%',
                padding: '15px 20px',
                borderRadius: '12px',
                background: m.role === 'user' ? 'var(--accent-color)' : 'rgba(0,0,0,0.3)',
                color: m.role === 'user' ? '#000' : '#fff',
                border: m.role === 'user' ? 'none' : '1px solid var(--glass-border)',
                borderBottomRightRadius: m.role === 'user' ? '2px' : '12px',
                borderBottomLeftRadius: m.role === 'user' ? '12px' : '2px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap' // Very basic markdown handling for now
              }}
            >
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '5px', fontWeight: 'bold' }}>
                {m.role === 'user' ? 'You' : 'AI Assistant'}
              </div>
              {m.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '15px 20px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
              Analyzing database context...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '20px', background: 'var(--bg-dark)', borderTop: '1px solid var(--glass-border)' }}>
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', gap: '10px' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about budgets, active projects, or company policies..."
            style={{ 
              flex: 1, 
              padding: '15px 20px', 
              borderRadius: '30px', 
              border: '1px solid var(--glass-border)', 
              background: 'rgba(255,255,255,0.05)', 
              color: '#fff',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            style={{ 
              padding: '0 30px', 
              borderRadius: '30px', 
              border: 'none', 
              background: (isLoading || !input.trim()) ? 'rgba(255,212,59,0.3)' : 'var(--accent-color)', 
              color: '#000', 
              fontWeight: 'bold',
              cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Send ➔
          </button>
        </form>
      </div>

    </div>
  );
}
