'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function MainContentWrapper({ 
  children, 
  permissions, 
  user,
  topbar
}: { 
  children: React.ReactNode, 
  permissions: any, 
  user: any,
  topbar?: React.ReactNode
}) {
  const pathname = usePathname();
  const isExecutive = pathname?.startsWith('/executive');
  
  // Show main sidebar everywhere except inside the executive command center
  const showMainSidebar = !isExecutive;
  const sidebarWidthVar = showMainSidebar ? 'var(--sidebar-width)' : '0px';

  return (
    <>
      {showMainSidebar && <Sidebar permissions={permissions} user={user} />}
      <div style={{ marginLeft: sidebarWidthVar, display: 'flex', flexDirection: 'column', minHeight: '100vh', transition: 'margin-left 0.3s ease' }}>
        {showMainSidebar && topbar}
        <main style={{ padding: isExecutive ? '0px' : '30px', flex: 1, backgroundColor: 'var(--bg-primary)' }}>
          {children}
        </main>
      </div>
    </>
  );
}
