'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Radio, Calendar, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import apiClient from '@/../lib/api-client';

interface LiveClass {
  id: string;
  title: string;
  batchTitle: string;
  teacherName?: string;
  scheduledAt: string;
  /** API returns: 'active' | 'approved' | 'scheduled' | 'ended' */
  status: string;
  thumbnailUrl?: string;
}

function normalizeClasses(raw: any[]): LiveClass[] {
  return raw.map((c) => ({
    id: c.id,
    title: c.title,
    batchTitle: c.batch?.name ?? c.batchTitle ?? c.batch_id ?? '',
    teacherName: c.teacher?.full_name ?? c.teacherName ?? '',
    scheduledAt: c.scheduled_at ?? c.scheduledAt ?? '',
    status: c.status,
    thumbnailUrl: c.thumbnail ?? c.thumbnailUrl,
  }));
}

export default function StudentLivePage() {
  const router = useRouter();

  const { data: classes = [], isLoading } = useQuery<LiveClass[]>({
    queryKey: ['live-classes-student'],
    queryFn: () =>
      apiClient
        .get('/live-classes/upcoming')
        .then((r) => normalizeClasses(Array.isArray(r.data) ? r.data : []))
        .catch(() => []),
    refetchInterval: 30_000, // poll every 30s for live status
  });

  // 'active' = currently live; 'approved' = starts soon; 'scheduled' = future
  const liveNow = classes.filter((c) => c.status === 'active' || c.status === 'live');
  const upcoming = classes.filter((c) => c.status === 'approved' || c.status === 'scheduled');

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-4">
        <h1 className="flex items-center gap-2 text-[18px] font-bold text-gray-900">
          <Radio size={20} className="text-red-500" />
          Live Classes
        </h1>

        {isLoading ? (
          <SkeletonLoader variant="card" count={4} />
        ) : (
          <>
            {/* ── Live Now ── */}
            {liveNow.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  <h2 className="text-[14px] font-bold text-gray-900">Live Now</h2>
                </div>
                <div className="space-y-3">
                  {liveNow.map((cls) => (
                    <div
                      key={cls.id}
                      className="overflow-hidden rounded-2xl border-2 border-red-200 bg-white shadow-sm"
                    >
                      {cls.thumbnailUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cls.thumbnailUrl}
                          alt={cls.title}
                          className="h-36 w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                            LIVE
                          </span>
                        </div>
                        <p className="font-bold text-gray-900">{cls.title}</p>
                        <p className="mt-0.5 text-[12px] text-gray-500">
                          {cls.batchTitle}
                          {cls.teacherName ? ` · ${cls.teacherName}` : ''}
                        </p>
                        <button
                          onClick={() => router.push(`/student/live/${cls.id}`)}
                          className="mt-3 w-full rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600 transition-colors"
                        >
                          Join Now →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Upcoming ── */}
            {upcoming.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-[#1a56db]" />
                  <h2 className="text-[14px] font-bold text-gray-900">Upcoming</h2>
                </div>
                <div className="space-y-3">
                  {upcoming.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                    >
                      {cls.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cls.thumbnailUrl}
                          alt={cls.title}
                          className="h-14 w-20 flex-shrink-0 rounded-xl object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50">
                          <Radio size={22} className="text-[#1a56db]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-[13px] font-bold text-gray-900">{cls.title}</p>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          {cls.batchTitle}
                          {cls.teacherName ? ` · ${cls.teacherName}` : ''}
                        </p>
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-400">
                          <Clock size={11} />
                          {cls.scheduledAt
                            ? new Date(cls.scheduledAt).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'TBD'}
                        </div>
                      </div>
                      {cls.scheduledAt && (
                        <div className="flex-shrink-0">
                          <CountdownTimer targetDate={new Date(cls.scheduledAt)} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {liveNow.length === 0 && upcoming.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
                <Radio size={40} className="text-gray-200" />
                <p className="text-sm font-medium text-gray-500">No live classes right now</p>
                <p className="text-[12px] text-gray-400">
                  Enroll in a batch to see its live classes here
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
