'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface DashboardLayoutProps {
  children: React.ReactNode;
  unreadCount?: number;
}

export function DashboardLayout({ children, unreadCount }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar — hidden on mobile, always visible on desktop */}
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header — only on desktop (lg+). Mobile uses BottomNav only */}
        <div className="hidden lg:block">
          <Header unreadCount={unreadCount} />
        </div>

        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:pb-4">{children}</main>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  );
}
