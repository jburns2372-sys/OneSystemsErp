'use client';

import { useRef, useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

function renderMessageContent(content: string) {
  const chartRegex = /\[CHART_DATA:\s*({.*?})\]/g;
  const match = content.match(chartRegex);

  if (!match) return <>{content}</>;

  let chartData: any = null;
  try {
    const rawData = match[0].replace('[CHART_DATA: ', '').slice(0, -1);
    chartData = JSON.parse(rawData);
  } catch (e) {
    return <>{content}</>;
  }

  const data = [
    { name: 'Profit', value: chartData.profit || 0, color: '#69db7c' },
    { name: 'Total Costs', value: chartData.totalCost || 0, color: '#ff6b6b' },
  ];

  return (
    <>
      <div style={{ whiteSpace: 'pre-wrap' }}>
        {content.replace(chartRegex, '')}
      </div>
      <div style={{ width: '100%', height: '200px', marginTop: '15px', background: 'var(--bg-dark)', borderRadius: '12px', padding: '10px', border: '1px solid var(--glass-border)' }}>
        <h4 style={{textAlign: 'center', margin: '0 0 10px 0', color: 'var(--text-secondary)', fontSize: '0.85rem'}}>Project Financial Split</h4>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(val: any) => `$${Number(val).toLocaleString()}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

export default function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "What are my pending approvals?",
    "Show me the status of active projects.",
    "Explain the subcontracting billing workflow."
  ];

  const handleClearChat = () => {
    setMessages([]);
    setThreadId(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || !input.trim() || isLoading) return;
    
    const userMsg = { id: Date.now().toString(), role: 'user', content: input };
    const currentMessages = [...messages, userMsg];
    
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages, threadId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: `⚠️ ${errorText || 'An error occurred while fetching the response.'}` }]);
        return;
      }

      if (!response.body) throw new Error('No stream available');
      
      const responseThreadId = response.headers.get('X-Thread-ID');
      if (responseThreadId) setThreadId(responseThreadId);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        aiText += chunk;

        setMessages(prev => {
          const newArr = [...prev];
          newArr[newArr.length - 1] = { ...newArr[newArr.length - 1], content: aiText };
          return newArr;
        });
      }
      
      if (!aiText) {
        setMessages(prev => {
          const newArr = [...prev];
          newArr[newArr.length - 1] = { ...newArr[newArr.length - 1], content: "⚠️ The AI stream was interrupted and returned no content. Please check the server logs." };
          return newArr;
        });
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: "⚠️ A network or processing error occurred while connecting to the AI Knowledge Center." }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      
      {isOpen && (
        <div style={{
          width: '380px',
          height: '550px',
          marginBottom: '15px',
          background: 'var(--bg-secondary)',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Header */}
          <div style={{ padding: '15px', background: 'var(--accent-color)', color: '#000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem' }}>🤖</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>JBurns</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#000', fontSize: '1.2rem', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          {/* Chat History Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: '10px', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '20px' }}>
                  I am JBurns, your official ERP Assistant. I can answer questions about the system, retrieve module guides, and check active project status.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(q)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '20px',
                        border: '1px solid var(--glass-border)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-5px' }}>
                <button 
                  onClick={handleClearChat}
                  style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', borderRadius: '15px', cursor: 'pointer', fontSize: '0.7rem' }}
                >
                  Clear Chat
                </button>
              </div>
            )}

            {messages.map((m: any) => (
              <div 
                key={m.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' 
                }}
              >
                <div 
                  style={{
                    maxWidth: '85%',
                    padding: '10px 15px',
                    borderRadius: '12px',
                    background: m.role === 'user' ? 'var(--accent-color)' : 'rgba(0,0,0,0.3)',
                    color: m.role === 'user' ? '#000' : '#fff',
                    border: m.role === 'user' ? 'none' : '1px solid var(--glass-border)',
                    borderBottomRightRadius: m.role === 'user' ? '2px' : '12px',
                    borderBottomLeftRadius: m.role === 'user' ? '12px' : '2px',
                    lineHeight: '1.4',
                    fontSize: '0.9rem',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '4px', fontWeight: 'bold' }}>
                    {m.role === 'user' ? 'You' : 'JBurns'}
                  </div>
                  {renderMessageContent(m.content)}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 15px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Analyzing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '15px', background: 'var(--bg-dark)', borderTop: '1px solid var(--glass-border)' }}>
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                style={{ 
                  flex: 1, 
                  padding: '10px 15px', 
                  borderRadius: '20px', 
                  border: '1px solid var(--glass-border)', 
                  background: 'rgba(255,255,255,0.05)', 
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  minWidth: 0
                }}
              />
              <button 
                type="submit" 
                disabled={isLoading || !(input || '').trim()}
                style={{ 
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%', 
                  border: 'none', 
                  background: (isLoading || !(input || '').trim()) ? 'rgba(255,212,59,0.3)' : 'var(--accent-color)', 
                  color: '#000', 
                  fontWeight: 'bold',
                  cursor: (isLoading || !(input || '').trim()) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
              >
                ➔
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: isOpen ? 'var(--bg-dark)' : 'var(--accent-color)',
          border: isOpen ? '1px solid var(--glass-border)' : 'none',
          color: isOpen ? 'var(--text-primary)' : '#000',
          boxShadow: isOpen ? 'none' : '0 4px 20px rgba(0, 240, 255, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 10000
        }}
        title="AI Assistant"
      >
        {isOpen ? (
          <span style={{ fontSize: '24px' }}>✕</span>
        ) : (
          <span style={{ fontSize: '32px' }}>🤖</span>
        )}
      </button>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
