'use client';

import { useChat } from 'ai/react';
import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { Send, User, Bot, Loader2 } from 'lucide-react';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>AI Data Center Assistant</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>
            Query the ERP database and read uploaded files.
          </p>
        </div>
        <Link href="/knowledge-center" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', textDecoration: 'none' }}>
          Back
        </Link>
      </header>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Bot size={48} style={{ opacity: 0.5, marginBottom: '15px' }} />
            <h3>How can I help you today?</h3>
            <p>Try asking about projects, workers, expenses, or uploaded documents.</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} style={{
              display: 'flex',
              gap: '15px',
              flexDirection: m.role === 'user' ? 'row-reverse' : 'row'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: m.role === 'user' ? 'var(--accent-color)' : 'rgba(52, 152, 219, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: m.role === 'user' ? '#000' : '#3498db',
                flexShrink: 0
              }}>
                {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div style={{
                background: m.role === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)',
                padding: '15px 20px',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                maxWidth: '80%',
                lineHeight: '1.6'
              }}>
                {/* Basic markdown rendering can be added later if needed */}
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>

                {/* Show tool calls if any exist in the message */}
                {m.toolInvocations?.map((toolInvocation) => {
                  const { toolCallId, toolName } = toolInvocation;
                  return (
                    <div key={toolCallId} style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '5px 10px', borderRadius: '4px', borderLeft: '3px solid #3498db' }}>
                      <i>🛠️ Using tool: <b>{toolName}</b></i>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(52, 152, 219, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3498db' }}>
              <Loader2 size={20} className="animate-spin" />
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about your ERP data..."
          style={{
            flex: 1,
            padding: '15px 20px',
            borderRadius: '12px',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--glass-border)',
            color: '#fff',
            fontSize: '1rem',
            outline: 'none'
          }}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: '0 25px',
            borderRadius: '12px',
            background: isLoading || !input.trim() ? 'rgba(255,255,255,0.1)' : 'var(--accent-color)',
            color: isLoading || !input.trim() ? 'var(--text-secondary)' : '#000',
            border: 'none',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
