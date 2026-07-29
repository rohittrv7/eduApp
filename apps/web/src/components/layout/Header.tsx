'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, Search, Bell, LogOut, UserCircle, Settings } from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import apiClient, { tokenStorage } from '@/../lib/api-client';

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
      tokenStorage.clear();
      clearUser();
      window.location.href = '/login';
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-4 shadow-sm">
      {/* Hamburger */}
      <button
        onClick={toggleSidebar}
        className="text-gray-500 hover:text-gray-700 lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu size={22} />
      </button>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search batches, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-3">
        {/* Notification bell */}
        <Link href="/student/notifications" className="relative text-gray-500 hover:text-gray-700">
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full focus:outline-none"
            aria-label="User menu"
          >
            {user?.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photo}
                alt={user.fullName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a56db] text-white text-sm font-semibold">
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
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border bg-white py-1 shadow-lg">
                <div className="border-b px-4 py-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <Link
                  href={`/${user?.role ?? 'student'}/profile`}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <UserCircle size={16} />
                  Profile
                </Link>
                <Link
                  href={`/${user?.role ?? 'student'}/settings`}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings size={16} />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
