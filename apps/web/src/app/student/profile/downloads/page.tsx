'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { HardDrive, Trash2, AlertTriangle, Download } from 'lucide-react';

interface CachedVideo {
  videoId: string;
  title: string;
  thumbnail?: string;
  sizeMb: number;
  cachedAt: string;
}

const STORAGE_LIMIT_MB = 500;

/** Read cached video metadata from IndexedDB (keyed by videoId) */
async function getCachedVideos(): Promise<CachedVideo[]> {
  if (typeof window === 'undefined') return [];
  try {
    const cache = await caches.open('offline-videos');
    const keys = await cache.keys();
    const videos: CachedVideo[] = [];
    for (const req of keys) {
      const res = await cache.match(req);
      if (!res) continue;
      const meta = res.headers.get('x-video-meta');
      if (meta) {
        try {
          videos.push(JSON.parse(meta));
        } catch {
          // skip malformed entries
        }
      }
    }
    return videos;
  } catch {
    return [];
  }
}

async function deleteFromCache(videoId: string): Promise<void> {
  const cache = await caches.open('offline-videos');
  const keys = await cache.keys();
  for (const req of keys) {
    if (req.url.includes(videoId)) {
      await cache.delete(req);
    }
  }
}

function formatSize(mb: number): string {
  if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`;
  return `${mb.toFixed(0)} MB`;
}

export default function DownloadsPage() {
  const [videos, setVideos] = useState<CachedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    getCachedVideos().then((v) => {
      setVideos(v);
      setLoading(false);
    });
  }, []);

  async function handleDelete(videoId: string) {
    await deleteFromCache(videoId);
    setVideos((prev) => prev.filter((v) => v.videoId !== videoId));
    setConfirmDeleteId(null);
  }

  const totalUsedMb = videos.reduce((sum, v) => sum + v.sizeMb, 0);
  const usagePercent = Math.min((totalUsedMb / STORAGE_LIMIT_MB) * 100, 100);
  const isNearLimit = usagePercent >= 80;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Download size={20} className="text-[#1a56db]" />
          Downloads
        </h1>

        {/* Storage usage */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium text-gray-700">
              <HardDrive size={16} className="text-gray-400" />
              Storage Used
            </span>
            <span className={isNearLimit ? 'font-semibold text-orange-500' : 'text-gray-500'}>
              {formatSize(totalUsedMb)} / {formatSize(STORAGE_LIMIT_MB)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full transition-all ${
                isNearLimit ? 'bg-orange-400' : 'bg-[#1a56db]'
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          {isNearLimit && (
            <p className="mt-2 flex items-center gap-1 text-xs text-orange-500">
              <AlertTriangle size={12} />
              Storage is almost full. Delete some downloads to free up space.
            </p>
          )}
        </div>

        {/* Video list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center">
            <Download size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">No offline videos downloaded yet.</p>
            <p className="mt-1 text-xs text-gray-400">
              Videos saved for offline viewing will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            {videos.map((video, idx) => (
              <div
                key={video.videoId}
                className={`flex items-center gap-3 px-4 py-3 ${
                  idx < videos.length - 1 ? 'border-b' : ''
                }`}
              >
                {/* Thumbnail */}
                {video.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="h-10 w-16 flex-shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="h-10 w-16 flex-shrink-0 rounded bg-gray-200" />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{video.title}</p>
                  <p className="text-xs text-gray-400">
                    {formatSize(video.sizeMb)} ·{' '}
                    {new Date(video.cachedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Delete */}
                {confirmDeleteId === video.videoId ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(video.videoId)}
                      className="rounded-lg bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                    >
                      Delete
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
                    onClick={() => setConfirmDeleteId(video.videoId)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    title="Delete download"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
