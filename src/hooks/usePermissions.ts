'use client';

import { useMemo } from 'react';

// Assuming permissions object is passed from the server or a global state provider.
// This hook simplifies checking permissions on the client side.
export function usePermissions(permissions: Record<string, any> | null) {
  
  const hasPermission = useMemo(() => {
    return (moduleName: string, action: string): boolean => {
      if (!permissions) return false;
      if (permissions.IS_ADMIN) return true;
      const modulePerms = permissions[moduleName];
      if (!modulePerms) return false;
      return !!modulePerms[action];
    };
  }, [permissions]);

  return { hasPermission };
}
