'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { processExecutiveQuery } from '@/app/actions/aiQueryActions';

export default function ExecutiveAICenterClient() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Good day, Executive. I am your AI Intelligence Assistant. I have access to all validated project progress, billing histories, CCTV logs, and subcontractor data. What would you like to know today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsTyping(true);

    try {
      const response = await processExecutiveQuery(query);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'An error occurred while querying the database. Ensure you have the required access permissions.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', gap: '20px' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 700, color: '#111827' }}>AI Intelligence Center</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280' }}>Query the ERP using natural language. I cross-reference BOQs, evidence packs, and billing logs.</p>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        
        {/* Chat History */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '16px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                backgroundColor: msg.role === 'user' ? '#111827' : '#2563eb', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 600,
                flexShrink: 0
              }}>
                {msg.role === 'user' ? 'EX' : 'AI'}
              </div>
              <div style={{ 
                maxWidth: '75%', 
                backgroundColor: msg.role === 'user' ? '#f3f4f6' : '#eff6ff', 
                padding: '16px', 
                borderRadius: '12px',
                border: msg.role === 'user' ? '1px solid #e5e7eb' : '1px solid #bfdbfe',
                color: '#374151',
                lineHeight: '1.6'
              }}>
                {/* Simple markdown parsing for bold */}
                {msg.content.split('**').map((text, i) => i % 2 === 1 ? <strong key={i}>{text}</strong> : text)}
                
                {msg.role === 'assistant' && idx > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #bfdbfe', display: 'flex', gap: '8px' }}>
                    <button style={{ fontSize: '0.75rem', padding: '4px 8px', backgroundColor: 'white', border: '1px solid #93c5fd', borderRadius: '4px', cursor: 'pointer', color: '#1d4ed8' }}>
                      Generate PDF Report
                    </button>
                    <Link href="/executive/validation" style={{ fontSize: '0.75rem', padding: '4px 8px', backgroundColor: 'white', border: '1px solid #93c5fd', borderRadius: '4px', cursor: 'pointer', color: '#1d4ed8', textDecoration: 'none' }}>
                      View Validation Details
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ display: 'flex', gap: '16px' }}>
               <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>AI</div>
               <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1px solid #bfdbfe', color: '#374151', display: 'flex', alignItems: 'center' }}>
                 <span style={{ fontStyle: 'italic', color: '#60a5fa' }}>Searching ERP databases...</span>
               </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{ padding: '20px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="e.g., Which projects are currently at high risk for overbilling?"
              style={{ 
                flex: 1, 
                padding: '16px', 
                borderRadius: '8px', 
                border: '1px solid #d1d5db',
                fontSize: '1rem',
                color: '#000000',
                backgroundColor: '#ffffff',
                outline: 'none'
              }}
            />
            <button 
              onClick={handleSend}
              disabled={!query.trim() || isTyping}
              style={{ 
                padding: '0 32px', 
                backgroundColor: query.trim() && !isTyping ? '#111827' : '#9ca3af', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: 600, 
                fontSize: '1rem',
                cursor: query.trim() && !isTyping ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s'
              }}
            >
              Ask AI
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>SUGGESTED:</span>
            <button style={{ fontSize: '0.75rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Show delayed projects</button>
            <span style={{ color: '#d1d5db' }}>|</span>
            <button style={{ fontSize: '0.75rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Subcontractor billing exposure</button>
            <span style={{ color: '#d1d5db' }}>|</span>
            <button style={{ fontSize: '0.75rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Analyze safety risks from CCTV</button>
          </div>
        </div>

      </div>

    </div>
  );
}
