import React from 'react';
export default function PublicAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-auth-layout">
      {children}
    </div>
  );
}
