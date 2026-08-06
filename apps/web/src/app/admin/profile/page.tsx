'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/auth.store';
import { Mail, Phone, ChevronRight, LogOut, Shield } from 'lucide-react';
import Link from 'next/link';

export default function AdminProfilePage() {
  const { user, clearUser } = useAuthStore();

  const displayName = user?.fullName?.trim() || user?.email?.split('@')[0] || 'Admin';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-lg space-y-4">
        {/* Profile header */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-violet-600 text-xl font-bold text-white shadow">
              {user?.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photo} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] font-bold text-gray-900 truncate">{displayName}</h1>
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                  👑 Admin
                </span>
              </div>
              {user?.email && (
                <span className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                  <Mail size={11} /> {user.email}
                </span>
              )}
              {user?.mobile && !user.mobile.startsWith('email_') && (
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <Phone size={11} /> {user.mobile}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Admin quick links */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
          {[
            {
              href: '/admin/students',
              icon: <Shield size={16} className="text-violet-600" />,
              label: 'Manage Students',
              sub: 'View & manage all students',
            },
            {
              href: '/admin/teachers',
              icon: <Shield size={16} className="text-blue-600" />,
              label: 'Manage Teachers',
              sub: 'Verify & assign teachers',
            },
            {
              href: '/admin/revenue',
              icon: <Shield size={16} className="text-green-600" />,
              label: 'Revenue & Stats',
              sub: 'Platform analytics',
            },
            {
              href: '/admin/settings',
              icon: <Shield size={16} className="text-orange-500" />,
              label: 'System Settings',
              sub: 'Platform configuration',
            },
          ].map(({ href, icon, label, sub }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50">
                {icon}
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gray-900">{label}</p>
                <p className="text-[11px] text-gray-400">{sub}</p>
              </div>
              <ChevronRight size={14} className="text-gray-300" />
            </Link>
          ))}
        </div>

        {/* Sign out */}
        <button
          onClick={clearUser}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 py-3 text-[13px] font-bold text-red-500 hover:bg-red-100 transition-colors border border-red-100"
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </DashboardLayout>
  );
}
