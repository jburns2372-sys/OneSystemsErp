import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import OfflineSyncProvider from "@/components/layout/OfflineSyncProvider";
import DatePickerEnforcer from "@/components/layout/DatePickerEnforcer";
import { cookies } from 'next/headers';
import { getUserPermissions } from '@/lib/permissions';
import MainContentWrapper from '@/components/layout/MainContentWrapper';
import Topbar from '@/components/layout/Topbar';

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

  return (
    <html lang="en">
      <body className={`${inter.className} ${permissions?.IS_GUEST_USER ? 'is-guest-user' : ''}`}>
        <OfflineSyncProvider>
          <DatePickerEnforcer />
          <MainContentWrapper permissions={permissions} user={user} topbar={userId ? <Topbar /> : null}>
            {children}
          </MainContentWrapper>
        </OfflineSyncProvider>
      </body>
    </html>
  );
}
