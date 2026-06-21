import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import OfflineSyncProvider from "@/components/layout/OfflineSyncProvider";
import DatePickerEnforcer from "@/components/layout/DatePickerEnforcer";
import { cookies } from 'next/headers';
import { getUserPermissions } from '@/lib/permissions';

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://onesystemserp.com'),
  title: "OneSystemsErp | Project Management System",
  description: "Comprehensive construction Project Management and Monitoring System",
  appleWebApp: {
    capable: true,
    title: "OneSystemsErp",
    statusBarStyle: "default",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('session')?.value || '';
  let user: any = null;
  let permissions = await getUserPermissions(userId);

  if (userId) {
    user = await import('@/lib/prisma').then(m => m.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, role: true }
    }));
  }

  // Simulation logic for admins
  if (user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PROJECT_DIRECTOR' || user.role === 'DIRECTORS')) {
    const simulatedRole = cookieStore.get('simulatedRole')?.value;
    if (simulatedRole && simulatedRole !== user.role) {
      const { getPermissionsForRole } = await import('@/lib/permissions');
      permissions = await getPermissionsForRole(simulatedRole);
    }
  }

  // Hide the main sidebar strictly for Directors
  const isDirector = user?.role === 'PROJECT_DIRECTOR' || user?.role === 'DIRECTORS';
  const sidebarWidthVar = isDirector ? '0px' : 'var(--sidebar-width)';

  return (
    <html lang="en">
      <body className={inter.className}>
        <OfflineSyncProvider>
          <DatePickerEnforcer />
          {!isDirector && <Sidebar permissions={permissions} user={user} />}
          <div style={{ marginLeft: sidebarWidthVar, display: 'flex', flexDirection: 'column', minHeight: '100vh', transition: 'margin-left 0.3s ease' }}>
            <main style={{ padding: '30px', flex: 1, backgroundColor: 'var(--bg-primary)' }}>
              {children}
            </main>
          </div>
        </OfflineSyncProvider>
      </body>
    </html>
  );
}
