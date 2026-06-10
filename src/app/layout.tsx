import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import OfflineSyncProvider from "@/components/layout/OfflineSyncProvider";
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
  title: "PGH-PMS | Project Management System",
  description: "Comprehensive construction Project Management and Monitoring System",
  appleWebApp: {
    capable: true,
    title: "PGH-PMS",
    statusBarStyle: "default",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value || '';
  const permissions = await getUserPermissions(userId);

  return (
    <html lang="en">
      <body className={inter.className}>
        <OfflineSyncProvider>
          <Sidebar permissions={permissions} />
          <div style={{ marginLeft: 'var(--sidebar-width)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <main style={{ padding: '30px', flex: 1, backgroundColor: 'var(--bg-primary)' }}>
              {children}
            </main>
          </div>
        </OfflineSyncProvider>
      </body>
    </html>
  );
}
