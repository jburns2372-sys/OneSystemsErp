'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { logout } from '@/app/actions/auth';

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      document.documentElement.style.setProperty('--sidebar-width', '0px');
    } else {
      document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '80px' : '280px');
      setMobileOpen(false);
    }
  }, [isCollapsed, isMobile]);

  interface SidebarLink {
    name: string;
    href: string;
    icon: string;
    subItems?: { name: string; href: string }[];
  }

  const links: SidebarLink[] = [
    { name: 'Dashboard', href: '/', icon: '⌂' },
    { name: 'Projects', href: '/projects', icon: '🏗️' },
    { name: 'AI Command Center', href: '/ai-command-center', icon: '🤖' },
    { name: 'Procurement', href: '/procurement', icon: '🛒' },
    { name: 'Inventory', href: '/inventory', icon: '📦' },
    { name: 'Material Issuance', href: '/material-issuance', icon: '📤' },
    { name: 'Finance', href: '/finance', icon: '💰' },
    { name: 'Subcontracting', href: '/subcontracting', icon: '👷' },
    { name: 'Accomplishments', href: '/accomplishments', icon: '📈' },
    { name: 'Payroll', href: '/payroll', icon: '👥' },
    { name: 'Payroll Payments', href: '/payroll-payments/dashboard', icon: '💸' },
    { name: 'Equipment', href: '/equipment', icon: '🚜' },
    { name: 'Variation Orders', href: '/variation-orders', icon: '🔄' },
    { name: 'Reports', href: '/reports', icon: '📊' },
    { name: 'Documents', href: '/documents', icon: '📂' },
    { name: 'Knowledge Center', href: '/knowledge-center', icon: '🧠' },
    { name: 'AI ERP Assistant', href: '/ai/erp-assistant', icon: '💬' },
    { name: 'Users', href: '/users', icon: '👤' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            position: 'fixed',
            top: '15px',
            left: '15px',
            zIndex: 101,
            backgroundColor: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem'
          }}
        >
          ☰
        </button>
      )}

      {isMobile && mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99, backdropFilter: 'blur(2px)'
          }}
        />
      )}

      <aside style={{
        width: isMobile ? '280px' : (isCollapsed ? '80px' : 'var(--sidebar-width)'),
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--glass-border)',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isMobile && !mobileOpen ? 'translateX(-100%)' : 'translateX(0)',
        zIndex: 100,
        boxShadow: '5px 0 20px rgba(0,0,0,0.5)'
      }}>
      <div style={{ 
        padding: '20px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: isCollapsed ? 'center' : 'space-between',
        borderBottom: '1px solid var(--glass-border)'
      }}>
        {!isCollapsed && (
          <div style={{ color: 'var(--accent-color)', fontWeight: '900', fontSize: '1.2rem', textShadow: '0 0 10px var(--accent-glow)', letterSpacing: '1px' }}>
            PGH-PMS
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '1.2rem',
            padding: '5px',
            borderRadius: '4px',
            transition: 'color 0.2s, background-color 0.2s'
          }}
          className="collapse-btn"
        >
          {isCollapsed ? '»' : '«'}
        </button>
      </div>

      <nav style={{ flex: 1, padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href) && (!link.subItems || link.subItems.every(sub => !pathname.startsWith(sub.href))));
          const hasActiveSub = link.subItems?.some(sub => pathname.startsWith(sub.href));

          return (
            <div key={link.name}>
              <Link 
                href={link.href} 
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '12px 15px', 
                  borderRadius: '8px', 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                  color: (isActive || hasActiveSub) ? '#fff' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontWeight: (isActive || hasActiveSub) ? '600' : '400',
                  backgroundColor: isActive ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                  borderLeft: (isActive || hasActiveSub) ? '3px solid var(--accent-color)' : '3px solid transparent',
                  textShadow: isActive ? '0 0 8px rgba(255,255,255,0.3)' : 'none',
                  justifyContent: isCollapsed ? 'center' : 'flex-start'
                }} 
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                title={isCollapsed ? link.name : ''}
              >
                <span style={{ fontSize: '1.2rem' }}>{link.icon}</span>
                {!isCollapsed && <span>{link.name}</span>}
              </Link>
              
              {!isCollapsed && link.subItems && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', paddingLeft: '45px' }}>
                  {link.subItems.map(sub => {
                    const isSubActive = pathname.startsWith(sub.href);
                    return (
                      <Link 
                        key={sub.name}
                        href={sub.href}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          color: isSubActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                          textDecoration: 'none',
                          fontSize: '0.9rem',
                          backgroundColor: isSubActive ? 'rgba(0, 240, 255, 0.05)' : 'transparent',
                          transition: 'color 0.2s, background-color 0.2s'
                        }}
                        className="sub-link"
                      >
                        {sub.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div style={{
        padding: '15px',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', width: '100%', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
          <div style={{
            width: '35px',
            height: '35px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            fontWeight: 'bold',
            flexShrink: 0
          }}>
            AD
          </div>
          {!isCollapsed && (
            <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>System Admin</span>
              <span style={{ color: 'var(--accent-color)', fontSize: '0.75rem', letterSpacing: '1px' }}>ONLINE</span>
            </div>
          )}
        </div>
        
        <form action={logout} style={{ width: '100%' }}>
          <button 
            type="submit"
            className="collapse-btn"
            style={{
              width: '100%',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              fontWeight: 'bold',
              gap: '6px'
            }}
            title="Sign Out"
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
          >
            🚪 {!isCollapsed && <span style={{ fontSize: '0.8rem' }}>Log Out</span>}
          </button>
        </form>
      </div>

      <style>{`
        .sidebar-link:hover:not(.active) {
          background-color: rgba(255, 255, 255, 0.05);
          color: var(--text-primary) !important;
          transform: translateX(4px);
        }
        .sub-link:hover {
          color: var(--text-primary) !important;
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
        .collapse-btn:hover {
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-primary) !important;
        }
      `}</style>
    </aside>
    </>
  );
}
