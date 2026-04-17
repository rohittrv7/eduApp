'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Eye, Clock, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardSectionSkeleton } from '@/components/ui/SkeletonLoader';
import { useGetTeacherVideosQuery, useDeleteVideoMutation } from '@/store/teacherApi';
import { toast } from '@/components/ui/Toast';

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function TeacherVideosPage() {
  const { data: videos = [], isLoading } = useGetTeacherVideosQuery();
  const [deleteVideo] = useDeleteVideoMutation();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await deleteVideo(id).unwrap();
      toast.success('Video deleted successfully');
    } catch {
      toast.error('Failed to delete video. Please try again.');
    } finally {
      setDeleting(false);
      setConfirmId(null);
    }
  }

  return (
    <DashboardLayout>
      {/* Confirm delete modal */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Delete Video?</h3>
            <p className="mt-1 text-sm text-gray-500">
              Yeh video permanently delete ho jaayegi. Yeh action undo nahi ho sakta.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 rounded-lg border py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Videos</h1>
          <Link
            href="/teacher/videos/new"
            className="flex items-center gap-1.5 rounded-lg bg-[#1a56db] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            Add Video
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <DashboardSectionSkeleton key={i} />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="rounded-xl border bg-white p-12 text-center text-sm text-gray-500">
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
                  <th className="px-4 py-3 text-left">Video</th>
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
                  <th className="px-4 py-3 text-right">Added</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {videos.map((video) => (
                  <tr key={video.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {video.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={video.thumbnail} alt={video.title}
                            className="h-10 w-16 shrink-0 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-16 shrink-0 rounded bg-gray-200" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{video.title}</p>
                          <p className="text-xs text-gray-500">{video.batchTitle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-700">
                      {(video.viewCount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatDuration(video.avgWatchTimeSecs ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-400">
                      {new Date(video.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setConfirmId(video.id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Delete video"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
