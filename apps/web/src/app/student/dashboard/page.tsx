'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Flame,
  BookOpen,
  Star,
  Trophy,
  Play,
  Target,
  ChevronRight,
  BarChart2,
  MessageCircle,
  Bell,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/auth.store';
import apiClient from '@/../lib/api-client';

/* ─── helpers ─────────────────────────────────────── */
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function StreakBar({ count }: { count: number }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-2xl font-extrabold text-orange-500">{count}</span>
        <span className="text-sm text-gray-500">day streak</span>
      </div>
      <div className="flex gap-1">
        {days.map((d, i) => (
          <div
            key={i}
            title={d.toLocaleDateString()}
            className={`h-6 flex-1 rounded ${i >= 7 - count ? 'bg-orange-400' : 'bg-gray-100'}`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between">
        {days.map((d, i) => (
          <span key={i} className="flex-1 text-center text-[9px] text-gray-400">
            {d.toLocaleDateString('en-IN', { weekday: 'narrow' })}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>{icon}</div>
      <div>
        <p className="text-[13px] font-extrabold leading-tight text-gray-900">{value}</p>
        <p className="text-[10px] text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  icon,
  href,
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {icon}
        <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
      </div>
      <Link href={href} className="flex items-center gap-0.5 text-xs font-semibold text-[#1a56db]">
        View all <ChevronRight size={13} />
      </Link>
    </div>
  );
}

/* ─── page ────────────────────────────────────────── */
export default function StudentDashboardPage() {
  const { user } = useAuthStore();

  const { data: watchSessions } = useQuery<any[]>({
    queryKey: ['recent-watch'],
    queryFn: () =>
      apiClient
        .get('/videos/watch-sessions/recent')
        .then((r) => r.data)
        .catch(() => []),
  });
  const { data: batches, isLoading: loadingBatches } = useQuery<any[]>({
    queryKey: ['enrolled-batches'],
    queryFn: () =>
      apiClient
        .get('/batches/enrolled')
        .then((r) => r.data)
        .catch(() => []),
  });
  const { data: quizAttempts } = useQuery<any[]>({
    queryKey: ['recent-quizzes'],
    queryFn: () =>
      apiClient
        .get('/quizzes/attempts/recent')
        .then((r) => r.data)
        .catch(() => []),
  });
  const { data: stats } = useQuery<any>({
    queryKey: ['profile-stats'],
    queryFn: () =>
      apiClient
        .get('/users/me/stats')
        .then((r) => r.data)
        .catch(() => null),
  });
  const { data: leaderboard } = useQuery<any>({
    queryKey: ['leaderboard'],
    queryFn: () =>
      apiClient
        .get('/leaderboard')
        .then((r) => r.data)
        .catch(() => null),
  });
  const { data: notifications } = useQuery<any[]>({
    queryKey: ['notifications'],
    queryFn: () =>
      apiClient
        .get('/notifications/unread')
        .then((r) => r.data)
        .catch(() => []),
  });

  const recentSessions = watchSessions?.slice(0, 3) ?? [];
  const enrolledBatches = batches?.slice(0, 3) ?? [];
  const recentQuizzes = quizAttempts?.slice(0, 3) ?? [];
  const unreadCount = notifications?.length ?? 0;
  const streakCount = user?.streakCount ?? 0;
  const myRank = leaderboard?.myRank ?? null;

  const displayName = user?.fullName?.trim() || user?.email?.split('@')[0] || 'Student';
  const firstName = displayName.split(' ')[0];

  return (
    <DashboardLayout unreadCount={unreadCount}>
      <div className="space-y-5 pb-2">
        {/* ── Top bar ───────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#1a56db] text-base font-bold text-white shadow">
              {user?.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photo} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-[11px] text-gray-500">{greeting()},</p>
              <p className="text-[15px] font-bold leading-tight text-gray-900">{displayName}</p>
            </div>
          </div>
          <Link
            href="/student/announcements"
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm"
          >
            <Bell size={18} className="text-gray-500" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            )}
          </Link>
        </div>

        {/* ── Hero card ────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1a56db] to-[#3b82f6] p-5 text-white shadow-lg shadow-blue-500/20">
          <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-6 right-8 h-24 w-24 rounded-full bg-white/10" />
          <p className="text-[13px] font-medium opacity-80">{greeting()},</p>
          <h1 className="mt-0.5 text-[22px] font-extrabold">{firstName} 👋</h1>
          <p className="mt-1 text-[13px] opacity-80">
            {streakCount > 0
              ? `You're on a ${streakCount}-day streak! Keep it up.`
              : 'Start learning today to build your streak!'}
          </p>
          <Link
            href="/student/batches"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-4 py-2 text-[13px] font-bold backdrop-blur-sm hover:bg-white/30"
          >
            My Batches <ChevronRight size={14} />
          </Link>
        </div>

        {/* ── 4 stat pills ─────────────────────────── */}
        <div className="grid grid-cols-2 gap-2.5">
          <StatPill
            icon={<Flame size={16} className="text-orange-500" />}
            label="Streak"
            value={`${streakCount} days`}
            bg="bg-orange-50"
          />
          <StatPill
            icon={<BookOpen size={16} className="text-blue-500" />}
            label="My Batches"
            value={`${enrolledBatches.length || batches?.length || 0}`}
            bg="bg-blue-50"
          />
          <StatPill
            icon={<Star size={16} className="text-yellow-500" />}
            label="Avg Score"
            value={stats ? `${(stats.quizAvgScore ?? 0).toFixed(0)}%` : '—'}
            bg="bg-yellow-50"
          />
          <StatPill
            icon={<Trophy size={16} className="text-purple-500" />}
            label="My Rank"
            value={myRank ? `#${myRank}` : '—'}
            bg="bg-purple-50"
          />
        </div>

        {/* ── Continue Watching ────────────────────── */}
        {recentSessions.length > 0 && (
          <section>
            <SectionHeader
              title="Continue Watching"
              icon={<Play size={15} className="text-[#1a56db]" />}
              href="/student/batches"
            />
            <div className="flex gap-3 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
              {recentSessions.map((s: any) => (
                <Link
                  key={s.videoId}
                  href={`/student/videos/${s.videoId}`}
                  className="w-52 flex-shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="relative aspect-video bg-gray-100">
                    {s.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.thumbnail} alt={s.title} className="h-full w-full object-cover" />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                      <div
                        className="h-full bg-[#1a56db]"
                        style={{ width: `${s.progressPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="line-clamp-1 text-[12px] font-bold text-gray-900">{s.title}</p>
                    <p className="mt-0.5 text-[10px] text-gray-400">{s.progressPercent}% watched</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── My Batches ───────────────────────────── */}
        {(loadingBatches || enrolledBatches.length > 0) && (
          <section>
            <SectionHeader
              title="My Batches"
              icon={<BookOpen size={15} className="text-[#1a56db]" />}
              href="/student/batches"
            />
            {loadingBatches ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {enrolledBatches.map((b: any) => (
                  <Link
                    key={b.id}
                    href={`/student/batches/${b.slug ?? b.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm hover:border-[#1a56db] transition-colors"
                  >
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50">
                      <BookOpen size={18} className="text-[#1a56db]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[13px] font-bold text-gray-900">
                        {b.title ?? b.name}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {b.target_exam ?? b.targetExam ?? 'General'}
                      </p>
                    </div>
                    <ChevronRight size={14} className="flex-shrink-0 text-gray-400" />
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Bottom 3-col grid ────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Streak */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-1.5">
              <Flame size={16} className="text-orange-500" />
              <h3 className="text-[13px] font-bold text-gray-900">Daily Streak</h3>
            </div>
            <StreakBar count={streakCount} />
          </div>

          {/* Recent Quizzes */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Target size={16} className="text-purple-500" />
                <h3 className="text-[13px] font-bold text-gray-900">Recent Quizzes</h3>
              </div>
              <Link href="/student/quizzes" className="text-[11px] font-semibold text-[#1a56db]">
                View all
              </Link>
            </div>
            {recentQuizzes.length > 0 ? (
              <div className="space-y-2">
                {recentQuizzes.map((q: any) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-gray-900">
                        {q.quizTitle}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(q.attemptedAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <span className="ml-2 flex-shrink-0 text-[12px] font-bold text-[#1a56db]">
                      {q.score}/{q.totalMarks}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-[12px] text-gray-400">No quizzes yet</p>
            )}
          </div>

          {/* Leaderboard */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Trophy size={16} className="text-yellow-500" />
                <h3 className="text-[13px] font-bold text-gray-900">Leaderboard</h3>
                {myRank && (
                  <span className="rounded-full bg-[#1a56db] px-2 py-0.5 text-[10px] font-bold text-white">
                    #{myRank}
                  </span>
                )}
              </div>
              <Link
                href="/student/leaderboard"
                className="text-[11px] font-semibold text-[#1a56db]"
              >
                View all
              </Link>
            </div>
            {leaderboard?.entries?.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.entries.slice(0, 5).map((e: any) => (
                  <div key={e.userId ?? e.id} className="flex items-center gap-2">
                    <span className="w-5 text-center text-[10px] font-bold text-gray-400">
                      {e.rank}
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a56db] text-[10px] font-bold text-white">
                      {(e.fullName ?? e.full_name ?? 'S').charAt(0)}
                    </div>
                    <span className="flex-1 truncate text-[12px] text-gray-900">
                      {e.fullName ?? e.full_name}
                    </span>
                    <span className="text-[12px] font-bold text-[#1a56db]">
                      {e.score ?? e.cumulative_score ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-[12px] text-gray-400">No data yet</p>
            )}
          </div>
        </div>

        {/* ── Quick links ──────────────────────────── */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            {
              href: '/student/tests',
              label: 'Test Series',
              icon: <BarChart2 size={18} className="text-blue-500" />,
              bg: 'bg-blue-50',
            },
            {
              href: '/student/doubts',
              label: 'Doubts',
              icon: <MessageCircle size={18} className="text-green-500" />,
              bg: 'bg-green-50',
            },
            {
              href: '/student/leaderboard',
              label: 'Leaderboard',
              icon: <Trophy size={18} className="text-yellow-500" />,
              bg: 'bg-yellow-50',
            },
            {
              href: '/student/profile',
              label: 'My Profile',
              icon: <Star size={18} className="text-purple-500" />,
              bg: 'bg-purple-50',
            },
          ].map(({ href, label, icon, bg }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm hover:border-[#1a56db] transition-colors"
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${bg}`}>
                {icon}
              </div>
              <span className="text-[12px] font-semibold text-gray-800">{label}</span>
              <ChevronRight size={13} className="ml-auto text-gray-400" />
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
