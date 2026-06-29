import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import OfflineSyncProvider from "@/components/layout/OfflineSyncProvider";
import DatePickerEnforcer from "@/components/layout/DatePickerEnforcer";
import { cookies } from 'next/headers';
import { getUserPermissions } from '@/lib/permissions';
import MainContentWrapper from '@/components/layout/MainContentWrapper';
import Topbar from '@/components/layout/Topbar';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL('https://onesystemserp.com'),
  title: "OneSystemsErp | Project Management System",
  description: "Comprehensive construction Project Management and Monitoring System",
  applicationName: "OneSystemsErp",
  appleWebApp: {
    capable: true,
    title: "OneSystemsErp",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
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
  let permissions: any = null;

  if (userId) {
    user = await import('@/lib/prisma').then(m => m.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    }));
  }

  if (!user) {
    // Fallback for demo
    user = await import('@/lib/prisma').then(m => m.prisma.user.findFirst({
      where: { email: 'jburns@demo.com' },
      select: { id: true, name: true, email: true, role: true }
    }));
  }

  // Now fetch permissions for the actual user (or the fallback user)
  if (user && user.id) {
    permissions = await getUserPermissions(user.id);
  } else {
    // Failsafe empty permissions
    permissions = {};
  }

  return (
    <html lang="en">
      <body className={`${inter.className} ${permissions?.IS_GUEST_USER ? 'is-guest-user' : ''}`}>
        <OfflineSyncProvider>
          <DatePickerEnforcer />
          <MainContentWrapper permissions={permissions} user={user} topbar={userId ? <Topbar /> : null}>
            {children}
            <Toaster position="top-right" richColors />
          </MainContentWrapper>
        </OfflineSyncProvider>
      </body>
    </html>
  );
}
