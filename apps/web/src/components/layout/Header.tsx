'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, Search, Bell, LogOut, UserCircle, Settings } from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import apiClient from '@/../lib/api-client';

interface HeaderProps {
  unreadCount?: number;
}

export function Header({ unreadCount = 0 }: HeaderProps) {
  const router = useRouter();
  const { toggleSidebar } = useUIStore();
  const { user, clearUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/student/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  async function handleLogout() {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      clearUser();
      router.push('/login');
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200/80 bg-white/70 backdrop-blur-md px-4 sm:px-6 shadow-sm font-sans">
      {/* Hamburger */}
      <button
        onClick={toggleSidebar}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 lg:hidden transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search batches, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-4">
        {/* Notification bell */}
        <Link href="/student/notifications" className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow shadow-rose-500/30">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full focus:outline-none hover:opacity-90 active:scale-95 transition-all"
            aria-label="User menu"
          >
            {user?.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photo}
                alt={user.fullName}
                className="h-8.5 w-8.5 rounded-full object-cover border border-slate-200 shadow-sm"
              />
            ) : (
              <div className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white text-sm font-black shadow-sm">
                {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
              </div>
            )}
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-3.5 w-52 rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-bold text-slate-800 truncate">{user?.fullName}</p>
                  <p className="text-[10px] font-extrabold text-slate-400 capitalize mt-0.5 tracking-wider">{user?.role}</p>
                </div>
                <div className="p-1 space-y-0.5">
                  <Link
                    href={`/${user?.role ?? 'student'}/profile`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <UserCircle size={16} />
                    Profile
                  </Link>
                  <Link
                    href={`/${user?.role ?? 'student'}/settings`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <Settings size={16} />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
