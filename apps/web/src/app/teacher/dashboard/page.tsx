'use client';

import Link from 'next/link';
import { Video, BookOpen, ClipboardList, Users, Clock, Eye } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardSectionSkeleton } from '@/components/ui/SkeletonLoader';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import {
  useGetTeacherUpcomingClassesQuery,
  useGetTeacherVideosQuery,
  useGetTeacherQuizScoresQuery,
} from '@/store/teacherApi';
import { formatINR } from '@/lib/utils';

/** Format seconds as "Xh Ym" or "Zm" */
function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/**
 * Teacher Dashboard home page.
 * - Upcoming approved live classes sorted by start time ASC (Req 20.1)
 * - Recorded videos with view count and avg watch-time (Req 20.2)
 * - Per-student quiz scores for teacher's quizzes (Req 20.4)
 * Requirements: 20.1, 20.2, 20.4
 */
export default function TeacherDashboardPage() {
  const { data: liveClasses, isLoading: l1 } = useGetTeacherUpcomingClassesQuery();
  const { data: videos, isLoading: l2 } = useGetTeacherVideosQuery();
  const { data: quizScores, isLoading: l3 } = useGetTeacherQuizScoresQuery();

  const isLoading = l1 || l2 || l3;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <DashboardSectionSkeleton key={i} />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  const upcomingClasses = (liveClasses ?? [])
    .filter((c) => c.status === 'approved')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const recentVideos = (videos ?? []).slice(0, 6);
  const recentScores = (quizScores ?? []).slice(0, 10);

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Schedule Class', href: '/teacher/live-classes/new', icon: <Video size={18} />, color: 'bg-red-50 text-red-600' },
            { label: 'Add Video', href: '/teacher/videos/new', icon: <BookOpen size={18} />, color: 'bg-blue-50 text-blue-600' },
            { label: 'Manage Quizzes', href: '/teacher/quizzes', icon: <ClipboardList size={18} />, color: 'bg-green-50 text-green-600' },
            { label: 'View Students', href: '/teacher/students', icon: <Users size={18} />, color: 'bg-purple-50 text-purple-600' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-xl border bg-white p-4 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <span className={`rounded-lg p-2 ${action.color}`}>{action.icon}</span>
              <span className="text-xs font-medium text-gray-700">{action.label}</span>
            </Link>
          ))}
        </div>

        {/* Upcoming Live Classes (Req 20.1) */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              Upcoming Live Classes
            </h2>
            <Link href="/teacher/live-classes/new" className="text-sm text-[#1a56db] hover:underline">
              + Schedule
            </Link>
          </div>

          {upcomingClasses.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
              No upcoming classes.{' '}
              <Link href="/teacher/live-classes/new" className="text-[#1a56db] hover:underline">
                Schedule one now
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="flex flex-col gap-2 rounded-xl border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900 line-clamp-2">{cls.title}</p>
                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Approved
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{cls.batchTitle}</p>
                  {cls.scheduledAt ? (
                    <CountdownTimer targetDate={new Date(cls.scheduledAt)} />
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                  <Link
                    href={`/teacher/live-classes/${cls.id}`}
                    className="mt-1 rounded-lg bg-[#1a56db] px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Manage Class
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recorded Videos with stats (Req 20.2) */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <BookOpen size={18} className="text-[#1a56db]" />
              My Videos
            </h2>
            <Link href="/teacher/videos/new" className="text-sm text-[#1a56db] hover:underline">
              + Add Video
            </Link>
          </div>

          {recentVideos.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
              No videos yet.{' '}
              <Link href="/teacher/videos/new" className="text-[#1a56db] hover:underline">
                Add your first video
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-right">
                      <span className="flex items-center justify-end gap-1">
                        <Eye size={12} /> Views
                      </span>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <span className="flex items-center justify-end gap-1">
                        <Clock size={12} /> Avg Watch
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentVideos.map((video) => (
                    <tr key={video.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 line-clamp-1">{video.title}</p>
                        <p className="text-xs text-gray-500">{video.batchTitle}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-700">
                        {(video.viewCount ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatDuration(video.avgWatchTimeSecs ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Per-student quiz scores (Req 20.4) */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <ClipboardList size={18} className="text-[#1a56db]" />
              Recent Quiz Scores
            </h2>
            <Link href="/teacher/quizzes" className="text-sm text-[#1a56db] hover:underline">
              Manage Quizzes
            </Link>
          </div>

          {recentScores.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
              No quiz attempts yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">Quiz</th>
                    <th className="px-4 py-3 text-right">Score</th>
                    <th className="px-4 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentScores.map((entry, i) => (
                    <tr key={`${entry.studentId}-${entry.quizId}-${i}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{entry.studentName}</td>
                      <td className="px-4 py-3 text-gray-600 line-clamp-1">{entry.quizTitle}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-semibold ${
                            entry.percentage >= 70
                              ? 'text-green-600'
                              : entry.percentage >= 40
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {entry.score}/{entry.totalMarks}
                        </span>
                        <span className="ml-1 text-xs text-gray-400">({entry.percentage}%)</span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-500">
                        {new Date(entry.attemptedAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </DashboardLayout>
  );
}
