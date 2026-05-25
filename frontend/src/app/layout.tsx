import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

export const metadata: Metadata = {
  title: 'VedaAI — AI Assessment Creator',
  description: 'Create AI-powered assessments for your students',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <div className="main-content flex flex-col min-h-screen">
          <TopBar />
          <main className="flex-1 p-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
