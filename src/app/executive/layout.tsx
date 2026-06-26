'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ExecutiveChatbot from './ExecutiveChatbot';
import GlobalProjectSelector from './GlobalProjectSelector';
import { logout } from '@/app/actions/auth';
import { getGlobalProjectsAndContext } from '@/app/actions/executiveContextActions';

export default function ExecutiveLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState('ALL');

  useEffect(() => {
    async function fetchData() {
      const data = await getGlobalProjectsAndContext();
      setProjects(data.projects as any);
      setCurrentProjectId(data.currentProjectId);
    }
    fetchData();
  }, []);

  // Sidebar navigation items for the Executive Command Center
  const navItems = [
    { name: 'Company Overview', path: '/executive/home', icon: '🏢' },
    { name: 'Project Portfolio', path: '/executive/portfolio', icon: '📁' },
    { name: 'AI Validation', path: '/executive/validation', icon: '🛡️' },
    { name: 'AI Reports Library', path: '/executive/reports', icon: '📊' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>

      {/* Sidebar - Desktop */}
      <aside
        style={{
          width: '260px',
          backgroundColor: '#111827',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          height: '100vh',
          zIndex: 50,
          boxShadow: '4px 0 10px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #374151' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#f9fafb', letterSpacing: '0.05em' }}>
            EXECUTIVE
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>
            Command Center
          </p>
        </div>

        <nav style={{ padding: '20px 12px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: isActive ? '#ffffff' : '#d1d5db',
                  backgroundColor: isActive ? '#3b82f6' : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s ease',
                  border: isActive ? '1px solid #60a5fa' : '1px solid transparent',
                  boxShadow: isActive ? '0 4px 6px -1px rgba(59, 130, 246, 0.3)' : 'none'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                <span style={{ fontSize: '0.9rem' }}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid #374151', fontSize: '0.8rem', color: '#9ca3af' }}>
          <p style={{ margin: 0 }}>AI Validation Active: <span style={{ color: '#10b981', fontWeight: 600 }}>Yes</span></p>
          <Link href="/" style={{ color: '#60a5fa', textDecoration: 'none', display: 'block', marginTop: '10px' }}>
            ← Back to Main ERP
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          marginLeft: '260px', // Offset for sidebar
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: '#f9fafb'
        }}
      >
        {/* Top Navbar */}
        <header
          style={{
            height: '64px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 40,
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Left side: Context Selector */}
          <div>
            <GlobalProjectSelector projects={projects} currentProjectId={currentProjectId} />
          </div>

          {/* Right side: User Profile & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>Executive View</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
              EX
            </div>
            <form action={logout} style={{ marginLeft: '8px' }}>
              <button
                type="submit"
                className="allow-guest"
                style={{
                  background: 'none',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
              >
                Sign Off
              </button>
            </form>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          {children}
        </div>

        {/* Global Executive AI Chatbot */}
        <ExecutiveChatbot />
      </main>

    </div>
  );
}
