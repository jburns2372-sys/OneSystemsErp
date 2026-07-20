'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PayrollSubNav() {
  const pathname = usePathname();
  
  return (
    <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '20px', width: 'fit-content' }}>
      <Link 
        href="/payroll"
        style={{ 
          background: (pathname || '') === '/payroll' || (pathname || '').startsWith('/payroll/period') ? 'var(--accent-color)' : 'transparent', 
          color: (pathname || '') === '/payroll' || (pathname || '').startsWith('/payroll/period') ? '#000' : 'var(--text-secondary)', 
          padding: '10px 24px', borderRadius: '8px', cursor: 'pointer',
          fontWeight: (pathname || '') === '/payroll' || (pathname || '').startsWith('/payroll/period') ? 'bold' : 'normal',
          textDecoration: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap'
        }}
      >
        Process Payroll
      </Link>
      <Link 
        href="/payroll-payments/dashboard"
        style={{ 
          background: (pathname || '').startsWith('/payroll-payments') ? 'var(--accent-color)' : 'transparent', 
          color: (pathname || '').startsWith('/payroll-payments') ? '#000' : 'var(--text-secondary)', 
          padding: '10px 24px', borderRadius: '8px', cursor: 'pointer',
          fontWeight: (pathname || '').startsWith('/payroll-payments') ? 'bold' : 'normal',
          textDecoration: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap'
        }}
      >
        Payroll Payments
      </Link>
    </div>
  );
}
