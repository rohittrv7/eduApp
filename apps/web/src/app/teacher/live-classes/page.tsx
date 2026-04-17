'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, Clock, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardSectionSkeleton } from '@/components/ui/SkeletonLoader';
import {
  useGetTeacherUpcomingClassesQuery,
  useDeleteLiveClassMutation,
  type TeacherLiveClass,
} from '@/store/teacherApi';

const STATUS_COLORS: Record<TeacherLiveClass['status'], string> = {
  scheduled: 'bg-gray-100 text-gray-600',
  pending_approval: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  active: 'bg-red-100 text-red-600',
  ended: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<TeacherLiveClass['status'], string> = {
  scheduled: 'Scheduled',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  active: 'LIVE',
  ended: 'Ended',
};

export default function TeacherLiveClassesPage() {
  const { data: classes = [], isLoading } = useGetTeacherUpcomingClassesQuery();
  const [deleteLiveClass] = useDeleteLiveClassMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteLiveClass(id).unwrap();
    } catch (e: any) {
      alert(e?.data?.message ?? 'Delete failed');
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Live Classes</h1>
          <Link
            href="/teacher/live-classes/new"
            className="flex items-center gap-1.5 rounded-lg bg-[#1a56db] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            Schedule Class
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <DashboardSectionSkeleton key={i} />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="rounded-xl border bg-white p-12 text-center text-sm text-gray-500">
            No live classes yet.{' '}
            <Link href="/teacher/live-classes/new" className="text-[#1a56db] hover:underline">
              Schedule your first class
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 truncate">{cls.title}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[cls.status]}`}>
                      {STATUS_LABELS[cls.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{cls.batchTitle}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(cls.scheduledAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(cls.scheduledAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {(cls.status === 'approved' || cls.status === 'active' || cls.status === 'scheduled') && (
                    <Link
                      href={`/teacher/live-classes/${cls.id}`}
                      className="rounded-lg bg-[#1a56db] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      {cls.status === 'active' ? '🔴 Manage Live' : 'Manage'}
                    </Link>
                  )}

                  {/* Delete — not allowed for active */}
                  {cls.status !== 'active' && (
                    confirmId === cls.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Delete karo?</span>
                        <button
                          onClick={() => handleDelete(cls.id)}
                          disabled={deletingId === cls.id}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {deletingId === cls.id ? 'Deleting...' : 'Haan'}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          Nahi
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(cls.id)}
                        className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
