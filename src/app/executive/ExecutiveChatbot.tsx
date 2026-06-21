'use client';
import React, { useState, useRef, useEffect } from 'react';
import { processExecutiveQuery } from '@/app/actions/aiQueryActions';

export default function ExecutiveChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([
    { role: 'assistant', content: 'Hello Director. I am Jburns, your Executive AI Assistant. Ask me anything about project status, financials, risks, or validations.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await processExecutiveQuery(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'An error occurred while querying the database. Ensure you have the required access permissions.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '30px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
          cursor: 'pointer',
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          zIndex: 1000,
          transition: 'transform 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        💬
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '380px',
          height: '600px',
          maxHeight: '80vh',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          overflow: 'hidden',
          border: '1px solid #e5e7eb'
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: '#111827',
            color: 'white',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.25rem' }}>🤖</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Jburns</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>Always online</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.25rem' }}
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            backgroundColor: '#f9fafb'
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: msg.role === 'user' ? '#2563eb' : '#ffffff',
                  color: msg.role === 'user' ? 'white' : '#1f2937',
                  border: msg.role === 'user' ? 'none' : '1px solid #e5e7eb',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center'
                }}>
                  <div style={{ width: '6px', height: '6px', backgroundColor: '#9ca3af', borderRadius: '50%' }}></div>
                  <div style={{ width: '6px', height: '6px', backgroundColor: '#9ca3af', borderRadius: '50%' }}></div>
                  <div style={{ width: '6px', height: '6px', backgroundColor: '#9ca3af', borderRadius: '50%' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '16px', backgroundColor: 'white', borderTop: '1px solid #e5e7eb' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about projects, risks, or financials..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '20px',
                  border: '1px solid #d1d5db',
                  outline: 'none',
                  fontSize: '0.9rem',
                  color: '#000000',
                  backgroundColor: '#ffffff'
                }}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isTyping}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '20px',
                  backgroundColor: input.trim() && !isTyping ? '#2563eb' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ↑
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
