'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy, BookOpen, Video, Bell, Flame,
  TrendingUp, Clock, Star, Target, ChevronRight, BarChart2
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BatchCard } from '@/components/ui/BatchCard';
import { useAppSelector } from '@/store/store';
import apiClient from '@/../lib/api-client';

function formatWatchTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function StreakCalendar({ streakCount }: { streakCount: number }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-3xl font-bold text-orange-500">{streakCount}</span>
        <span className="text-sm text-gray-500">day streak</span>
      </div>
      <div className="flex gap-1.5">
        {days.map((d, i) => {
          const isActive = i >= 7 - streakCount;
          return (
            <div key={i} title={d.toLocaleDateString()}
              className={`h-7 flex-1 rounded ${isActive ? 'bg-orange-400' : 'bg-gray-100'}`} />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-gray-400">
        {days.map((d, i) => (
          <span key={i}>{d.toLocaleDateString('en-IN', { weekday: 'narrow' })}</span>
        ))}
      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  const { data: watchSessions, isLoading: l1 } = useQuery<any[]>({
    queryKey: ['recent-watch'],
    queryFn: () => apiClient.get('/videos/watch-sessions/recent').then(r => r.data).catch(() => []),
  });
  const { data: batches, isLoading: l3 } = useQuery<any[]>({
    queryKey: ['enrolled-batches'],
    queryFn: () => apiClient.get('/batches/enrolled').then(r => r.data).catch(() => []),
  });
  const { data: quizAttempts } = useQuery<any[]>({
    queryKey: ['recent-quizzes'],
    queryFn: () => apiClient.get('/quizzes/attempts/recent').then(r => r.data).catch(() => []),
  });
  const { data: stats } = useQuery<any>({
    queryKey: ['profile-stats'],
    queryFn: () => apiClient.get('/users/me/stats').then(r => r.data).catch(() => null),
  });
  const { data: leaderboard } = useQuery<any>({
    queryKey: ['leaderboard'],
    queryFn: () => apiClient.get('/leaderboard').then(r => r.data).catch(() => null),
  });
  const { data: notifications } = useQuery<any[]>({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/notifications/unread').then(r => r.data).catch(() => []),
  });

  const isLoading = l1 || l3;
  const recentSessions = watchSessions?.slice(0, 3) ?? [];
  const enrolledBatches = batches?.slice(0, 3) ?? [];
  const recentQuizzes = quizAttempts?.slice(0, 3) ?? [];
  const unreadCount = notifications?.length ?? 0;
  const streakCount = user?.streakCount ?? 0;
  const myRank = leaderboard?.myRank ?? null;

  const firstName = user?.fullName?.split(' ')[0] ?? 'Student';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <DashboardLayout unreadCount={unreadCount}>
      <div className="space-y-8 pb-8 font-sans">

        {/* Hero greeting */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-violet-800 p-8 text-white shadow-xl shadow-indigo-900/10">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 left-1/3 -mb-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-xl" />
          
          <div className="relative">
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold tracking-wide backdrop-blur-sm">
              ✨ Welcome back
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{greeting}, {firstName} 👋</h1>
            <p className="mt-2 text-[15px] font-medium text-indigo-100 max-w-md">
              {streakCount > 0
                ? `🔥 Incredible job! You are currently holding a ${streakCount}-day learning streak. Keep the momentum going!`
                : "🚀 Ready to grow today? Start learning now to build up your daily learning streak!"}
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/student/batches"
                className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 shadow-md hover:bg-indigo-50 hover:scale-[1.02] active:scale-[0.98] transition-all">
                My Enrolled Batches
              </Link>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={<Flame size={20} className="text-orange-500" />}
            label="Daily Streak"
            value={`${streakCount} days`}
            color="border-orange-100 hover:border-orange-300"
            bg="bg-orange-500"
          />
          <StatCard
            icon={<Clock size={20} className="text-blue-500" />}
            label="Watch Time"
            value={stats ? formatWatchTime(stats.totalWatchTimeSecs ?? 0) : '—'}
            color="border-blue-100 hover:border-blue-300"
            bg="bg-blue-500"
          />
          <StatCard
            icon={<Star size={20} className="text-yellow-500" />}
            label="Avg Score"
            value={stats ? `${(stats.quizAvgScore ?? 0).toFixed(0)}%` : '—'}
            color="border-yellow-100 hover:border-yellow-300"
            bg="bg-yellow-500"
          />
          <StatCard
            icon={<Trophy size={20} className="text-violet-500" />}
            label="My Rank"
            value={myRank ? `#${myRank}` : '—'}
            color="border-violet-100 hover:border-violet-300"
            bg="bg-violet-500"
          />
        </div>

        {/* Continue Watching */}
        {(isLoading || recentSessions.length > 0) && (
          <section>
            <SectionHeader title="Continue Watching" icon={<Video size={18} className="text-blue-600" />} href="/student/batches" />
            {isLoading ? <SkeletonRow /> : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recentSessions.map((session: any) => (
                  <Link key={session.videoId} href={`/student/videos/${session.videoId}`}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-blue-500 hover:shadow-md transition-all duration-200">
                    <div className="relative aspect-video bg-slate-100">
                      {session.thumbnail && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={session.thumbnail} alt={session.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-200">
                        <div className="h-full bg-blue-600" style={{ width: `${session.progressPercent}%` }} />
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="line-clamp-2 text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{session.title}</p>
                      <p className="mt-1.5 text-xs font-semibold text-slate-400">{session.progressPercent}% completed</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* My Batches */}
        {(isLoading || enrolledBatches.length > 0) && (
          <section>
            <SectionHeader title="My Batches" icon={<BookOpen size={18} className="text-blue-600" />} href="/student/batches" />
            {isLoading ? <SkeletonRow /> : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {enrolledBatches.map((batch: any) => (
                  <Link key={batch.id} href={`/student/batches/${batch.id}`} className="transition-transform duration-200 hover:-translate-y-1">
                    <div className="relative h-full">
                      <BatchCard id={batch.id} thumbnail={batch.thumbnail} title={batch.title}
                        teacherName={batch.teacherName} price={batch.price} rating={batch.rating} isEnrolled />
                      <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl bg-slate-200">
                        <div className="h-full rounded-b-xl bg-emerald-500" style={{ width: `${batch.progressPercent ?? 0}%` }} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Bottom row: Streak + Quiz + Leaderboard */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Streak */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                <Flame size={18} />
              </div>
              <h2 className="font-bold text-slate-800">Daily Streak Tracker</h2>
            </div>
            <StreakCalendar streakCount={streakCount} />
          </div>

          {/* Recent Quizzes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-500">
                  <Target size={18} />
                </div>
                <h2 className="font-bold text-slate-800">Recent Quizzes</h2>
              </div>
              <Link href="/student/quizzes" className="text-xs font-bold text-blue-600 hover:underline">View all</Link>
            </div>
            {recentQuizzes.length > 0 ? (
              <div className="space-y-3">
                {recentQuizzes.map((attempt: any) => (
                  <div key={attempt.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800 line-clamp-1">{attempt.quizTitle}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(attempt.attemptedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
                      {attempt.score}/{attempt.totalMarks}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <span className="text-2xl mb-1">📝</span>
                <p className="text-sm font-semibold text-slate-400">No quizzes attempted yet</p>
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-50 text-yellow-500">
                  <Trophy size={18} />
                </div>
                <h2 className="font-bold text-slate-800">Top Students</h2>
                {myRank && (
                  <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">Rank #{myRank}</span>
                )}
              </div>
              <Link href="/student/leaderboard" className="text-xs font-bold text-blue-600 hover:underline">View all</Link>
            </div>
            {leaderboard?.entries?.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.entries.slice(0, 5).map((entry: any) => (
                  <div key={entry.userId ?? entry.id} className="flex items-center gap-3 py-1">
                    <span className="w-5 text-center text-xs font-extrabold text-slate-400">{entry.rank}</span>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-xs font-black text-white shadow-sm">
                      {(entry.fullName ?? entry.full_name ?? 'S').charAt(0)}
                    </div>
                    <span className="flex-1 text-sm font-semibold text-slate-700 truncate">{entry.fullName ?? entry.full_name ?? 'Student'}</span>
                    <span className="text-sm font-black text-blue-600">{entry.score ?? entry.cumulative_score ?? 0}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <span className="text-2xl mb-1">🏆</span>
                <p className="text-sm font-semibold text-slate-400">No entries yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { href: '/student/tests', label: 'Test Series', icon: <BarChart2 size={20} className="text-blue-500" />, bg: 'hover:border-blue-200' },
            { href: '/student/doubts', label: 'Doubt Desk', icon: <TrendingUp size={20} className="text-emerald-500" />, bg: 'hover:border-emerald-200' },
            { href: '/student/leaderboard', label: 'Leaderboard', icon: <Trophy size={20} className="text-yellow-500" />, bg: 'hover:border-yellow-200' },
            { href: '/student/profile', label: 'My Profile', icon: <Star size={20} className="text-violet-500" />, bg: 'hover:border-violet-200' },
          ].map(({ href, label, icon, bg }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all ${bg}`}>
              <div className="rounded-xl border border-slate-100 p-2 shadow-sm bg-slate-50">{icon}</div>
              <span className="text-sm font-bold text-slate-700">{label}</span>
              <ChevronRight size={14} className="ml-auto text-slate-400" />
            </Link>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}

function SectionHeader({ title, icon, href }: { title: string; icon: React.ReactNode; href: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
        {icon}{title}
      </h2>
      <Link href={href} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
        View all <ChevronRight size={12} />
      </Link>
    </div>
  );
}

function StatCard({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: string; color: string; bg: string }) {
  return (
    <div className={`group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all ${color}`}>
      <div className={`rounded-xl p-2.5 shadow-sm bg-slate-50 border border-slate-100 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-black text-slate-900 tracking-tight">{value}</p>
        <p className="text-xs font-bold text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100" />
      ))}
    </div>
  );
}
