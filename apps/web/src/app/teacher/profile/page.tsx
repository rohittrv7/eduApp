'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/auth.store';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Mail, Phone, BookOpen, Users, Star, ChevronRight, LogOut } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/../lib/api-client';

export default function TeacherProfilePage() {
  const { user, clearUser } = useAuthStore();

  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ['teacher-stats'],
    queryFn: () =>
      apiClient
        .get('/teachers/me/stats')
        .then((r) => r.data)
        .catch(() => null),
  });

  const displayName = user?.fullName?.trim() || user?.email?.split('@')[0] || 'Teacher';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-lg space-y-4">
        {/* Profile header */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#1a56db] text-xl font-bold text-white shadow">
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
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#1a56db]">
                  Teacher
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

        {/* Stats */}
        {isLoading ? (
          <SkeletonLoader variant="card" count={3} />
        ) : stats ? (
          <div className="grid grid-cols-3 gap-2.5">
            {[
              {
                icon: <BookOpen size={16} className="text-[#1a56db]" />,
                bg: 'bg-blue-50',
                label: 'Batches',
                value: String(stats.batchCount ?? 0),
              },
              {
                icon: <Users size={16} className="text-green-500" />,
                bg: 'bg-green-50',
                label: 'Students',
                value: String(stats.studentCount ?? 0),
              },
              {
                icon: <Star size={16} className="text-yellow-500" />,
                bg: 'bg-yellow-50',
                label: 'Avg Rating',
                value: stats.avgRating ? `${Number(stats.avgRating).toFixed(1)}★` : '—',
              },
            ].map(({ icon, bg, label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${bg}`}>
                  {icon}
                </div>
                <span className="text-[15px] font-extrabold text-gray-900">{value}</span>
                <span className="text-[10px] text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        ) : null}

        {/* Quick links */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
          {[
            {
              href: '/teacher/batches',
              icon: <BookOpen size={16} className="text-[#1a56db]" />,
              label: 'My Batches',
              sub: 'Manage your course batches',
            },
            {
              href: '/teacher/earnings',
              icon: <Star size={16} className="text-green-500" />,
              label: 'Earnings',
              sub: 'Revenue & payout history',
            },
            {
              href: '/teacher/settings',
              icon: <Mail size={16} className="text-purple-500" />,
              label: 'Settings',
              sub: 'Account & notifications',
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
