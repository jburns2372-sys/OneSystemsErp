import { ReactNode } from 'react';

export const maxDuration = 60; // Allow Vercel up to 60 seconds

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
