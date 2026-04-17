'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import apiClient from '@/../lib/api-client';
import { Bookmark, Trash2, Play } from 'lucide-react';

interface BookmarkItem {
  id: string;
  videoId: string;
  videoTitle: string;
  videoThumbnail?: string;
  timestampSecs: number;
  label?: string;
  createdAt: string;
}

interface GroupedBookmarks {
  videoId: string;
  videoTitle: string;
  videoThumbnail?: string;
  items: BookmarkItem[];
}

function formatTimestamp(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function groupByVideo(bookmarks: BookmarkItem[]): GroupedBookmarks[] {
  const map = new Map<string, GroupedBookmarks>();
  for (const b of bookmarks) {
    if (!map.has(b.videoId)) {
      map.set(b.videoId, {
        videoId: b.videoId,
        videoTitle: b.videoTitle,
        videoThumbnail: b.videoThumbnail,
        items: [],
      });
    }
    map.get(b.videoId)!.items.push(b);
  }
  return Array.from(map.values());
}

export default function BookmarksPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: bookmarks, isLoading } = useQuery<BookmarkItem[]>({
    queryKey: ['bookmarks'],
    queryFn: () => apiClient.get('/users/me/bookmarks').then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/me/bookmarks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      setConfirmDeleteId(null);
    },
  });

  function handleNavigate(videoId: string, timestampSecs: number) {
    router.push(`/student/videos/${videoId}?t=${timestampSecs}`);
  }

  const grouped = groupByVideo(bookmarks ?? []);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Bookmark size={20} className="text-[#1a56db]" />
          Bookmarks
        </h1>

        {isLoading && <SkeletonLoader variant="list-item" count={5} />}

        {!isLoading && grouped.length === 0 && (
          <p className="rounded-xl border bg-white p-8 text-center text-sm text-gray-400">
            No bookmarks yet. While watching a video, click the bookmark icon to save a moment.
          </p>
        )}

        {grouped.map((group) => (
          <section key={group.videoId}>
            {/* Video header */}
            <div className="mb-2 flex items-center gap-3">
              {group.videoThumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={group.videoThumbnail}
                  alt={group.videoTitle}
                  className="h-10 w-16 rounded object-cover"
                />
              ) : (
                <div className="h-10 w-16 rounded bg-gray-200" />
              )}
              <h2 className="text-sm font-semibold text-gray-800">{group.videoTitle}</h2>
            </div>

            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              {group.items.map((bm, idx) => (
                <div
                  key={bm.id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    idx < group.items.length - 1 ? 'border-b' : ''
                  }`}
                >
                  {/* Timestamp badge */}
                  <span className="min-w-[48px] rounded bg-[#1a56db] px-2 py-0.5 text-center text-xs font-mono font-semibold text-white">
                    {formatTimestamp(bm.timestampSecs)}
                  </span>

                  {/* Label */}
                  <span className="flex-1 text-sm text-gray-700">
                    {bm.label || 'Bookmarked moment'}
                  </span>

                  {/* Navigate to video at timestamp */}
                  <button
                    onClick={() => handleNavigate(bm.videoId, bm.timestampSecs)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[#1a56db] hover:bg-blue-50"
                    title="Play from here"
                  >
                    <Play size={12} />
                    Play
                  </button>

                  {/* Delete */}
                  {confirmDeleteId === bm.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteMutation.mutate(bm.id)}
                        disabled={deleteMutation.isPending}
                        className="rounded-lg bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(bm.id)}
                      className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      title="Delete bookmark"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </DashboardLayout>
  );
}
