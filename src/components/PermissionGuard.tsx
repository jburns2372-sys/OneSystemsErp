'use client';

import { useEffect, useState } from 'react';
// Ideally, the user's permissions should be fetched once and stored in a React Context
// or Zustand store, but for this implementation we will fetch or pass them as props.
// To keep it clean, we'll assume a global store or passing permissions down.

interface PermissionGuardProps {
  permissions: Record<string, any>; // Passed from parent Server Component for security and speed
  moduleName: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function PermissionGuard({ permissions, moduleName, action, children, fallback = null }: PermissionGuardProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (permissions && permissions[moduleName] && permissions[moduleName][action]) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  }, [permissions, moduleName, action]);

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
