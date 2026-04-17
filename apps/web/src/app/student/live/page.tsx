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
  teacherName: string;
  scheduledAt: string;
  status: 'scheduled' | 'live' | 'ended';
  thumbnailUrl?: string;
}

export default function StudentLivePage() {
  const router = useRouter();

  const { data: classes, isLoading } = useQuery<LiveClass[]>({
    queryKey: ['live-classes'],
    queryFn: () => apiClient.get('/live-classes/upcoming').then((r) => r.data),
  });

  const liveNow = (classes ?? []).filter((c) => c.status === 'live');
  const upcoming = (classes ?? []).filter((c) => c.status === 'scheduled');

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Radio size={24} className="text-red-500" />
          Live Classes
        </h1>

        {isLoading ? (
          <SkeletonLoader variant="card" count={4} />
        ) : (
          <>
            {/* Live Now */}
            {liveNow.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  Live Now
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {liveNow.map((cls) => (
                    <div key={cls.id} className="rounded-xl border-2 border-red-200 bg-white p-4 shadow-sm">
                      <p className="font-semibold text-gray-900">{cls.title}</p>
                      <p className="mt-1 text-xs text-gray-500">{cls.batchTitle} · {cls.teacherName}</p>
                      <button
                        onClick={() => router.push(`/student/live/${cls.id}`)}
                        className="mt-3 w-full rounded-lg bg-red-500 py-2 text-sm font-semibold text-white hover:bg-red-600"
                      >
                        Join Now →
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Calendar size={18} className="text-[#1a56db]" />
                  Upcoming
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((cls) => (
                    <div key={cls.id} className="rounded-xl border bg-white p-4 shadow-sm">
                      <p className="font-semibold text-gray-900">{cls.title}</p>
                      <p className="mt-1 text-xs text-gray-500">{cls.batchTitle} · {cls.teacherName}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} />
                          {new Date(cls.scheduledAt).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                        <CountdownTimer targetDate={new Date(cls.scheduledAt)} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {liveNow.length === 0 && upcoming.length === 0 && (
              <div className="rounded-xl border bg-white p-12 text-center">
                <Radio size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No live classes scheduled right now</p>
                <p className="mt-1 text-xs text-gray-400">Check back later or enroll in a batch</p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
