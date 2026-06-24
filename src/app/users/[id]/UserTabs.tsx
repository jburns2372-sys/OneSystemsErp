'use client';

import React, { useState } from 'react';

export default function UserTabs({ 
  profileContent, 
  projectAccessContent 
}: { 
  profileContent: React.ReactNode, 
  projectAccessContent: React.ReactNode 
}) {
  const [activeTab, setActiveTab] = useState<'profile' | 'projects'>('profile');

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: activeTab === 'profile' ? 'var(--accent-color)' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'profile' ? '2px solid var(--accent-color)' : '2px solid transparent',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s'
          }}
        >
          User Profile
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: activeTab === 'projects' ? 'var(--accent-color)' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'projects' ? '2px solid var(--accent-color)' : '2px solid transparent',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s'
          }}
        >
          Project Access
        </button>
      </div>

      <div>
        {activeTab === 'profile' && profileContent}
        {activeTab === 'projects' && projectAccessContent}
      </div>
    </div>
  );
}
