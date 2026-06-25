'use client';

import { useRef, useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

function renderMessageContent(content: string) {
  const chartRegex = /\[CHART_DATA:\s*({.*?})\]/g;
  const match = content.match(chartRegex);

  if (!match) return <>{content}</>;

  // Try to parse the chart data (might fail if still streaming)
  let chartData: any = null;
  try {
    const rawData = match[0].replace('[CHART_DATA: ', '').slice(0, -1);
    chartData = JSON.parse(rawData);
  } catch (e) {
    return <>{content}</>;
  }

  // Format data for Recharts (assuming profitability structure for MVP)
  const data = [
    { name: 'Profit', value: chartData.profit || 0, color: '#69db7c' },
    { name: 'Total Costs', value: chartData.totalCost || 0, color: '#ff6b6b' },
  ];

  return (
    <>
      <div style={{ whiteSpace: 'pre-wrap' }}>
        {content.replace(chartRegex, '')}
      </div>
      <div style={{ width: '100%', height: '300px', marginTop: '20px', background: 'var(--bg-dark)', borderRadius: '12px', padding: '15px', border: '1px solid var(--glass-border)' }}>
        <h4 style={{textAlign: 'center', margin: '0 0 10px 0', color: 'var(--text-secondary)'}}>Project Financial Split</h4>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

export default function CommandCenterClient() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);

  const suggestedQuestions = [
    "What are my pending approvals?",
    "How do I create a Purchase Order?",
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
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
      
      {/* Chat History Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Welcome Message */}
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '10vh', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🧠</div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>AI Knowledge Center</h2>
            <p style={{ maxWidth: '500px', margin: '0 auto', lineHeight: '1.6', marginBottom: '30px' }}>
              I am your official ERP Assistant. I can answer questions about the system, retrieve module guides, and check active project status.
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxWidth: '600px', margin: '0 auto' }}>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(q)}
                  style={{
                    padding: '10px 15px',
                    borderRadius: '20px',
                    border: '1px solid var(--glass-border)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>
            <button 
              onClick={handleClearChat}
              style={{ padding: '5px 15px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', borderRadius: '15px', cursor: 'pointer', fontSize: '0.8rem' }}
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
              {renderMessageContent(m.content)}
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
            disabled={isLoading || !(input || '').trim()}
            style={{ 
              padding: '0 30px', 
              borderRadius: '30px', 
              border: 'none', 
              background: (isLoading || !(input || '').trim()) ? 'rgba(255,212,59,0.3)' : 'var(--accent-color)', 
              color: '#000', 
              fontWeight: 'bold',
              cursor: (isLoading || !(input || '').trim()) ? 'not-allowed' : 'pointer',
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
