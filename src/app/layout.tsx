import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://onesystemserp.com'),
  title: "PGH-PMS | Project Management System",
  description: "Comprehensive construction Project Management and Monitoring System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Sidebar />
        <div style={{ marginLeft: 'var(--sidebar-width)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Topbar />
          <main style={{ padding: '30px', flex: 1, backgroundColor: 'var(--bg-primary)' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
