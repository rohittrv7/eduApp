'use client';

import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Flame,
  Star,
  CheckCircle,
  Award,
  Share2,
  BookOpen,
  BarChart2,
  Mail,
  Phone,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useAuthStore } from '@/stores/auth.store';
import apiClient from '@/../lib/api-client';

interface Achievement {
  id: string;
  badgeType: string;
  earnedAt: string;
}
interface ProfileStats {
  totalWatchTimeSecs: number;
  quizAvgScore: number;
  quizzesAttempted?: number;
  attendancePercent: number;
  enrolledBatchCount: number;
  cumulativeScore: number;
  skillLevel: string;
  streakCount: number;
  achievements: Achievement[];
}

const BADGES = [
  {
    type: 'seven_day_streak',
    icon: '🔥',
    name: '7-Day Streak',
    desc: 'Maintain a 7-day daily learning streak',
  },
  { type: 'quiz_master', icon: '🎯', name: 'Quiz Master', desc: '5+ quizzes with avg score ≥ 80%' },
  {
    type: 'top_10_leaderboard',
    icon: '🏆',
    name: 'Top 10 Scholar',
    desc: 'Reach the Top 10 on the global leaderboard',
  },
  {
    type: 'perfect_attendance',
    icon: '✅',
    name: 'Perfect Attendance',
    desc: '100% attendance in live classes',
  },
];

function BadgeShareButton({ badge }: { badge: Achievement }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 400;
    canvas.height = 200;
    ctx.fillStyle = '#1a56db';
    ctx.fillRect(0, 0, 400, 200);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 ' + badge.badgeType.replace(/_/g, ' '), 200, 90);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#c7d9ff';
    ctx.fillText('allEdu', 200, 130);
    ctx.fillText(new Date(badge.earnedAt).toLocaleDateString(), 200, 152);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `badge-${badge.badgeType}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <button
        onClick={handleShare}
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-gray-400 hover:bg-gray-100"
      >
        <Share2 size={11} /> Share
      </button>
    </>
  );
}

export default function StudentProfilePage() {
  const { user, clearUser } = useAuthStore();

  const { data: stats, isLoading } = useQuery<ProfileStats>({
    queryKey: ['profile-stats'],
    queryFn: () => apiClient.get('/users/me/stats').then((r) => r.data),
  });

  const displayName = user?.fullName?.trim() || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();
  const streakCount = user?.streakCount ?? 0;

  function badgeUnlocked(type: string) {
    if (type === 'seven_day_streak') return streakCount >= 7;
    if (type === 'quiz_master')
      return (stats?.quizzesAttempted ?? 0) >= 5 && (stats?.quizAvgScore ?? 0) >= 80;
    if (type === 'top_10_leaderboard') return false;
    if (type === 'perfect_attendance') return (stats?.attendancePercent ?? 0) >= 100;
    return false;
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-lg space-y-4">
        {/* ── Profile header ───────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#1a56db] text-xl font-bold text-white shadow">
              {user?.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photo} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </div>

            {/* Name + role */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[15px] font-bold text-gray-900 truncate">{displayName}</h1>
                {user?.role && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold capitalize text-[#1a56db]">
                    {user.role}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-col gap-0.5">
                {user?.email && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Mail size={11} /> {user.email}
                  </span>
                )}
                {user?.mobile && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Phone size={11} /> {user.mobile}
                  </span>
                )}
              </div>
            </div>

            {/* Streak badge */}
            <div className="flex flex-shrink-0 flex-col items-center rounded-2xl border border-orange-200 bg-orange-50 px-3 py-2">
              <Flame size={18} className="fill-orange-500 text-orange-500" />
              <span className="text-[16px] font-extrabold text-orange-500">{streakCount}</span>
              <span className="text-[9px] text-orange-400">streak</span>
            </div>
          </div>
        </div>

        {/* ── Stats grid ──────────────────────────── */}
        {isLoading ? (
          <SkeletonLoader variant="card" count={3} />
        ) : stats ? (
          <div className="grid grid-cols-3 gap-2.5">
            {[
              {
                icon: <BookOpen size={16} className="text-[#1a56db]" />,
                bg: 'bg-blue-50',
                label: 'Batches',
                value: String(stats.enrolledBatchCount ?? 0),
              },
              {
                icon: <Star size={16} className="text-yellow-500" />,
                bg: 'bg-yellow-50',
                label: 'Avg Score',
                value: `${(stats.quizAvgScore ?? 0).toFixed(0)}%`,
              },
              {
                icon: <CheckCircle size={16} className="text-green-500" />,
                bg: 'bg-green-50',
                label: 'Attendance',
                value: `${(stats.attendancePercent ?? 0).toFixed(0)}%`,
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

        {/* ── Quick links ─────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
          {[
            {
              href: '/student/profile/progress',
              icon: <BarChart2 size={16} className="text-[#1a56db]" />,
              label: 'Progress Reports',
              sub: 'Weekly & Monthly analytics',
            },
            {
              href: '/student/profile/certificates',
              icon: <Award size={16} className="text-yellow-500" />,
              label: 'Certificates',
              sub: 'Your earned certificates',
            },
            {
              href: '/student/profile/payments',
              icon: <Star size={16} className="text-green-500" />,
              label: 'Payment History',
              sub: 'Transactions & receipts',
            },
            {
              href: '/student/profile/settings',
              icon: <Mail size={16} className="text-purple-500" />,
              label: 'Account Settings',
              sub: 'Edit profile & preferences',
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

        {/* ── Achievements ────────────────────────── */}
        <section>
          <div className="mb-2.5 flex items-center gap-2">
            <Award size={16} className="text-yellow-500" />
            <h2 className="text-[14px] font-bold text-gray-900">Achievements & Badges</h2>
          </div>

          <div className="space-y-2.5">
            {BADGES.map((badge) => {
              const unlocked = badgeUnlocked(badge.type);
              const earned = stats?.achievements?.find((a) => a.badgeType === badge.type);
              return (
                <div
                  key={badge.type}
                  className={`flex items-center gap-3 rounded-2xl border p-3.5 transition-all ${
                    unlocked
                      ? 'border-green-100 bg-green-50/50'
                      : 'border-gray-100 bg-white opacity-75'
                  }`}
                >
                  {/* Badge icon circle */}
                  <div
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-xl ${
                      unlocked
                        ? 'border border-yellow-200 bg-yellow-50'
                        : 'border border-gray-200 bg-gray-50'
                    }`}
                  >
                    {badge.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-[13px] font-bold text-gray-900">{badge.name}</h3>
                      <span
                        className={`flex-shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                          unlocked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {unlocked ? 'Unlocked' : 'Locked'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-gray-500">{badge.desc}</p>
                  </div>

                  {unlocked && earned && <BadgeShareButton badge={earned} />}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Sign out ────────────────────────────── */}
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
