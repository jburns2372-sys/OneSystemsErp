'use client';

import { useState, useRef, useEffect } from 'react';
import { askPayrollAssistant } from '../actions/payrollAiChat';

export default function AIPayrollAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: 'Hello! I am your AI Payroll Assistant. I can help you check worker records, review active cash advances, or summarize pending payroll periods. What do you need?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuestion = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userQuestion }]);
    setIsLoading(true);

    const response = await askPayrollAssistant(userQuestion);
    
    setMessages(prev => [...prev, { role: 'ai', content: response }]);
    setIsLoading(false);
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 999 }}>
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{ 
            background: 'linear-gradient(135deg, #00ffa3, #00b8ff)', 
            color: '#000', 
            border: 'none', 
            width: '60px', 
            height: '60px', 
            borderRadius: '30px', 
            cursor: 'pointer', 
            boxShadow: '0 10px 25px rgba(0, 255, 163, 0.4)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '1.8rem',
            transition: 'transform 0.3s'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          🤖
        </button>
      )}

      {isOpen && (
        <div style={{ 
          width: '350px', 
          height: '500px', 
          background: 'var(--bg-secondary)', 
          borderRadius: '16px', 
          border: '1px solid var(--glass-border)', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #00ffa3, #00b8ff)', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#000', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🤖</span> AI Assistant
            </h3>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#000', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
          </div>

          {/* Chat Area */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{ 
                  background: msg.role === 'user' ? 'rgba(52, 152, 219, 0.2)' : 'rgba(255,255,255,0.05)', 
                  border: `1px solid ${msg.role === 'user' ? 'rgba(52, 152, 219, 0.5)' : 'var(--glass-border)'}`,
                  padding: '12px 16px', 
                  borderRadius: msg.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                  color: '#fff',
                  fontSize: '0.9rem',
                  lineHeight: '1.5'
                }}>
                  {msg.role === 'ai' ? (
                    // Simple bold markdown parsing
                    msg.content.split('**').map((text, i) => i % 2 === 1 ? <strong key={i} style={{ color: '#00ffa3' }}>{text}</strong> : <span key={i}>{text}</span>)
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '12px 16px', borderRadius: '16px 16px 16px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <span style={{ animation: 'pulse 1.5s infinite' }}>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} style={{ padding: '15px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about payroll..." 
              style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', padding: '10px 15px', borderRadius: '20px', color: '#fff', outline: 'none' }}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              style={{ background: 'var(--accent-color)', color: '#000', border: 'none', width: '40px', height: '40px', borderRadius: '20px', cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (isLoading || !input.trim()) ? 0.5 : 1 }}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
