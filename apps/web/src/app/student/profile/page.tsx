'use client';

import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useAuthStore } from '@/stores/auth.store';
import apiClient from '@/../lib/api-client';
import {
  Flame, Star, Clock, CheckCircle, Award, Share2, BookOpen, BarChart2, User as UserIcon, Mail, Phone, Shield
} from 'lucide-react';
import Link from 'next/link';

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

const BADGE_LABELS: Record<string, string> = {
  seven_day_streak: '7-Day Streak',
  top_10_leaderboard: 'Top 10',
  quiz_master: 'Quiz Master',
  perfect_attendance: 'Perfect Attendance',
};

const BADGE_COLORS: Record<string, string> = {
  seven_day_streak: 'bg-orange-100 text-orange-700',
  top_10_leaderboard: 'bg-yellow-100 text-yellow-700',
  quiz_master: 'bg-purple-100 text-purple-700',
  perfect_attendance: 'bg-green-100 text-green-700',
};

const SKILL_COLORS: Record<string, string> = {
  basic: 'bg-gray-100 text-gray-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced: 'bg-purple-100 text-purple-700',
  pro: 'bg-yellow-100 text-yellow-700',
};

function formatWatchTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function BadgeShareButton({ badge }: { badge: Achievement }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 200;

    // Background
    ctx.fillStyle = '#1a56db';
    ctx.fillRect(0, 0, 400, 200);

    // Badge label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 ' + (BADGE_LABELS[badge.badgeType] ?? badge.badgeType), 200, 90);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#c7d9ff';
    ctx.fillText('allEdu', 200, 130);
    ctx.fillText(new Date(badge.earnedAt).toLocaleDateString(), 200, 155);

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
        className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
        title="Download badge image"
      >
        <Share2 size={12} />
        Share
      </button>
    </>
  );
}

export default function StudentProfilePage() {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery<ProfileStats>({
    queryKey: ['profile-stats'],
    queryFn: () => apiClient.get('/users/me/stats').then((r) => r.data),
  });

  const displayName = user?.fullName?.trim() || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col gap-4 rounded-xl border bg-white p-6 shadow-sm sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a56db] text-2xl font-bold text-white shadow-md">
            {user?.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photo} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
              {user?.role && (
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-blue-700">
                  {user.role}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
              {user?.email && (
                <span className="flex items-center gap-1">
                  <Mail size={13} className="text-gray-400" />
                  {user.email}
                </span>
              )}
              {user?.mobile && (
                <span className="flex items-center gap-1">
                  <Phone size={13} className="text-gray-400" />
                  {user.mobile}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-2 text-orange-600 border border-orange-200">
            <Flame size={20} className="fill-orange-500 text-orange-500" />
            <span className="text-lg font-bold">{user?.streakCount ?? 0}</span>
            <span className="text-xs text-gray-600">day streak</span>
          </div>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <SkeletonLoader variant="card" count={3} />
        ) : stats ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={<BookOpen size={18} className="text-purple-500" />} label="Batches" value={String(stats.enrolledBatchCount ?? 0)} />
            <StatCard icon={<Star size={18} className="text-yellow-500" />} label="Avg Quiz Score" value={`${(stats.quizAvgScore ?? 0).toFixed(0)}%`} />
            <StatCard icon={<CheckCircle size={18} className="text-green-500" />} label="Attendance" value={`${(stats.attendancePercent ?? 0).toFixed(0)}%`} />
          </div>
        ) : null}

        {/* Progress Reports Link */}
        <Link
          href="/student/profile/progress"
          className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm hover:border-[#1a56db]"
        >
          <BarChart2 size={20} className="text-[#1a56db]" />
          <span className="font-medium text-gray-900">Progress Reports</span>
          <span className="ml-auto text-sm text-gray-400">Weekly &amp; Monthly →</span>
        </Link>

        {/* Achievements & Badges Unlock List */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Award size={18} className="text-yellow-500" />
            Achievements &amp; Badges
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {
                type: 'seven_day_streak',
                name: '7-Day Streak',
                criteria: 'Maintain a 7-day daily learning streak',
                icon: '🔥',
                earned: (user?.streakCount ?? 0) >= 7,
              },
              {
                type: 'quiz_master',
                name: 'Quiz Master',
                criteria: 'Score 80%+ on 5 or more quizzes',
                icon: '🎯',
                earned: (stats?.quizzesAttempted ?? 0) >= 5 && (stats?.quizAvgScore ?? 0) >= 80,
              },
              {
                type: 'top_10_leaderboard',
                name: 'Top 10 Scholar',
                criteria: 'Reach the Top 10 on the global student leaderboard',
                icon: '🏆',
                earned: false,
              },
              {
                type: 'perfect_attendance',
                name: 'Perfect Attendance',
                criteria: 'Maintain 100% attendance in live classes',
                icon: '✅',
                earned: (stats?.attendancePercent ?? 0) >= 100,
              },
            ].map((badge) => (
              <div
                key={badge.type}
                className={`flex items-start gap-3 rounded-xl border p-4 shadow-sm transition-all ${
                  badge.earned
                    ? 'border-green-200 bg-green-50/50'
                    : 'border-slate-200 bg-white opacity-80'
                }`}
              >
                <div className="text-2xl">{badge.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">{badge.name}</h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        badge.earned ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {badge.earned ? 'Unlocked' : 'Locked'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{badge.criteria}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border bg-white p-4 shadow-sm">
      {icon}
      <span className="text-lg font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}
