'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function KnowledgeCenterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Dashboard', href: '/knowledge-center' },
    { name: 'Notebooks', href: '/knowledge-center/notebooks' },
    { name: 'Business Rules', href: '/knowledge-center/business-rules' },
    { name: 'SOPs', href: '/knowledge-center/sops' },
    { name: 'Training', href: '/knowledge-center/training' },
    { name: 'Access Control', href: '/knowledge-center/rbac' },
    { name: 'AI Validation Rules', href: '/knowledge-center/ai-validation-rules' }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', color: '#fff', display: 'flex', gap: '20px', minHeight: '80vh' }}>
      <aside style={{ width: '250px', flexShrink: 0, background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '20px', border: '1px solid var(--glass-border)' }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.2rem', color: 'var(--accent-color)' }}>Knowledge Center</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                style={{
                  padding: '10px 15px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: isActive ? '#000' : '#fff',
                  background: isActive ? 'var(--accent-color)' : 'transparent',
                  fontWeight: isActive ? 'bold' : 'normal',
                  transition: 'background 0.2s ease',
                  border: isActive ? 'none' : '1px solid transparent'
                }}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </aside>
      
      <main style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '30px', border: '1px solid var(--glass-border)' }}>
        {children}
      </main>
    </div>
  );
}
