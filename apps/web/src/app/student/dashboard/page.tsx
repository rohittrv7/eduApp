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
import { useAuthStore } from '@/stores/auth.store';
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
  const { user } = useAuthStore();

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

  const displayName = user?.fullName?.trim() || user?.email?.split('@')[0] || 'Student';
  const firstName = displayName.split(' ')[0] ?? 'Student';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <DashboardLayout unreadCount={unreadCount}>
      <div className="space-y-6">

        {/* Hero greeting */}
        <div className="rounded-2xl bg-gradient-to-r from-[#1a56db] to-[#3b82f6] p-6 text-white">
          <p className="text-sm opacity-80">{greeting},</p>
          <h1 className="mt-1 text-2xl font-bold">{firstName} 👋</h1>
          <p className="mt-1 text-sm opacity-80">
            {streakCount > 0
              ? `You're on a ${streakCount}-day streak! Keep it up.`
              : "Start learning today to build your streak!"}
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/student/batches"
              className="rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/30">
              My Batches
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<Flame size={18} className="text-orange-500" />}
            label="Streak"
            value={`${streakCount} days`}
            color="bg-orange-50"
          />
          <StatCard
            icon={<BookOpen size={18} className="text-blue-500" />}
            label="My Batches"
            value={enrolledBatches.length > 0 ? `${enrolledBatches.length}` : '0'}
            color="bg-blue-50"
          />
          <StatCard
            icon={<Star size={18} className="text-yellow-500" />}
            label="Avg Score"
            value={stats ? `${(stats.quizAvgScore ?? 0).toFixed(0)}%` : '—'}
            color="bg-yellow-50"
          />
          <StatCard
            icon={<Trophy size={18} className="text-purple-500" />}
            label="My Rank"
            value={myRank ? `#${myRank}` : '—'}
            color="bg-purple-50"
          />
        </div>

        {/* Continue Watching */}
        {(isLoading || recentSessions.length > 0) && (
          <section>
            <SectionHeader title="Continue Watching" icon={<Video size={16} className="text-[#1a56db]" />} href="/student/batches" />
            {isLoading ? <SkeletonRow /> : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentSessions.map((session: any) => (
                  <Link key={session.videoId} href={`/student/videos/${session.videoId}`}
                    className="group overflow-hidden rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative aspect-video bg-gray-100">
                      {session.thumbnail && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={session.thumbnail} alt={session.title} className="h-full w-full object-cover" />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                        <div className="h-full bg-[#1a56db]" style={{ width: `${session.progressPercent}%` }} />
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-medium text-gray-900">{session.title}</p>
                      <p className="mt-1 text-xs text-gray-400">{session.progressPercent}% watched</p>
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
            <SectionHeader title="My Batches" icon={<BookOpen size={16} className="text-[#1a56db]" />} href="/student/batches" />
            {isLoading ? <SkeletonRow /> : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {enrolledBatches.map((batch: any) => (
                  <Link key={batch.id} href={`/student/batches/${batch.id}`}>
                    <div className="relative">
                      <BatchCard
                        id={batch.id}
                        thumbnail={batch.thumbnail ?? batch.thumbnail_url}
                        title={batch.title ?? batch.name}
                        teacherName={batch.teacherName ?? batch.teacher?.full_name}
                        price={batch.price ?? 0}
                        rating={batch.rating ?? 5}
                        isEnrolled
                      />
                      <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl bg-gray-200">
                        <div className="h-full rounded-b-xl bg-green-500" style={{ width: `${batch.progressPercent ?? 0}%` }} />
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
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Flame size={18} className="text-orange-500" />
              <h2 className="font-semibold text-gray-900">Daily Streak</h2>
            </div>
            <StreakCalendar streakCount={streakCount} />
          </div>

          {/* Recent Quizzes */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-purple-500" />
                <h2 className="font-semibold text-gray-900">Recent Quizzes</h2>
              </div>
              <Link href="/student/quizzes" className="text-xs text-[#1a56db] hover:underline">View all</Link>
            </div>
            {recentQuizzes.length > 0 ? (
              <div className="space-y-2">
                {recentQuizzes.map((attempt: any) => (
                  <div key={attempt.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{attempt.quizTitle}</p>
                      <p className="text-xs text-gray-400">{new Date(attempt.attemptedAt).toLocaleDateString()}</p>
                    </div>
                    <span className="text-sm font-bold text-[#1a56db]">{attempt.score}/{attempt.totalMarks}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No quizzes attempted yet</p>
            )}
          </div>

          {/* Leaderboard */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-yellow-500" />
                <h2 className="font-semibold text-gray-900">Leaderboard</h2>
                {myRank && (
                  <span className="rounded-full bg-[#1a56db] px-2 py-0.5 text-xs font-bold text-white">#{myRank}</span>
                )}
              </div>
              <Link href="/student/leaderboard" className="text-xs text-[#1a56db] hover:underline">View all</Link>
            </div>
            {leaderboard?.entries?.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.entries.slice(0, 5).map((entry: any) => (
                  <div key={entry.userId ?? entry.id} className="flex items-center gap-2">
                    <span className="w-5 text-center text-xs font-bold text-gray-400">{entry.rank}</span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a56db] text-xs font-bold text-white">
                      {(entry.fullName ?? entry.full_name ?? 'S').charAt(0)}
                    </div>
                    <span className="flex-1 text-sm text-gray-900 truncate">{entry.fullName ?? entry.full_name ?? 'Student'}</span>
                    <span className="text-sm font-bold text-[#1a56db]">{entry.score ?? entry.cumulative_score ?? 0}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: '/student/tests', label: 'Test Series', icon: <BarChart2 size={20} className="text-blue-500" /> },
            { href: '/student/doubts', label: 'Doubts', icon: <TrendingUp size={20} className="text-green-500" /> },
            { href: '/student/leaderboard', label: 'Leaderboard', icon: <Trophy size={20} className="text-yellow-500" /> },
            { href: '/student/profile', label: 'My Profile', icon: <Star size={20} className="text-purple-500" /> },
          ].map(({ href, label, icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm hover:border-[#1a56db] hover:shadow-md transition-all">
              {icon}
              <span className="text-sm font-medium text-gray-700">{label}</span>
              <ChevronRight size={14} className="ml-auto text-gray-400" />
            </Link>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}

function SectionHeader({ title, icon, href }: { title: string; icon: React.ReactNode; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
        {icon}{title}
      </h2>
      <Link href={href} className="flex items-center gap-1 text-xs text-[#1a56db] hover:underline">
        View all <ChevronRight size={12} />
      </Link>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm ${color}`}>
      <div className="rounded-lg bg-white p-2 shadow-sm">{icon}</div>
      <div>
        <p className="text-lg font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
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
