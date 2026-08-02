'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Play, WifiOff, HardDrive, Clock, AlertTriangle, Download, Smartphone } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  getAllOfflineVideos,
  deleteOfflineVideo,
  isExpired,
  getTotalStorageUsed,
  type OfflineVideoMeta,
} from '@/lib/offline-storage.service';

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return 'No expiry';
  const d = new Date(expiresAt);
  const diff = d.getTime() - Date.now();
  if (diff < 0) return 'Expired';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Expires today';
  return `Expires in ${days} day${days !== 1 ? 's' : ''}`;
}

export default function DownloadsPage() {
  const router = useRouter();
  const provider = process.env.NEXT_PUBLIC_VIDEO_PROVIDER ?? 'youtube';

  const [videos, setVideos] = useState<OfflineVideoMeta[]>([]);
  const [totalBytes, setTotalBytes] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadVideos = async () => {
    const all = await getAllOfflineVideos();
    const used = await getTotalStorageUsed();
    setVideos(all);
    setTotalBytes(used);
    setLoading(false);
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleDelete = async (videoId: string) => {
    await deleteOfflineVideo(videoId);
    await loadVideos();
  };

  const handlePlay = (videoId: string) => {
    router.push(`/student/videos/${videoId}?offline=true`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Android Mobile App Download Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Download Official Android App</h2>
              <p className="text-sm text-blue-100">
                Get the latest release APK for live classes, offline video downloads &amp; instant notifications.
              </p>
            </div>
          </div>
          <a
            href="/alledu-mobile.apk"
            download="alledu-mobile.apk"
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-blue-700 shadow-md transition-transform hover:scale-105 hover:bg-blue-50 shrink-0"
          >
            <Download className="h-4 w-4" />
            Download APK (75 MB)
          </a>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Offline Video Downloads</h1>
            <p className="mt-1 text-sm text-gray-500">
              Videos saved for offline viewing — only accessible inside this app
            </p>
          </div>
          {totalBytes > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600">
              <HardDrive className="h-4 w-4" />
              {formatBytes(totalBytes)} used
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl bg-gray-100 p-4">
                <div className="mb-3 aspect-video rounded-lg bg-gray-200" />
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-gray-200 py-20 text-center">
            <WifiOff className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No videos downloaded yet.</p>
            <p className="text-xs text-gray-400">
              Open any video and tap "Download for Offline" to save it here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => {
              const expired = isExpired(video);
              return (
                <div
                  key={video.videoId}
                  className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
                    expired ? 'opacity-60' : ''
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gray-900">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <WifiOff className="h-8 w-8 text-gray-600" />
                      </div>
                    )}
                    {expired && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <div className="flex items-center gap-1 text-yellow-400">
                          <AlertTriangle className="h-5 w-5" />
                          <span className="text-sm font-medium">Expired</span>
                        </div>
                      </div>
                    )}
                    {!expired && (
                      <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
                        {formatDuration(video.durationSeconds)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-medium text-gray-900">{video.title}</p>
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatExpiry(video.enrollmentExpiresAt)}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">{formatBytes(video.sizeBytes)}</p>

                    {/* Actions */}
                    <div className="mt-3 flex gap-2">
                      {!expired && (
                        <button
                          onClick={() => handlePlay(video.videoId)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          <Play className="h-4 w-4" />
                          Play
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(video.videoId)}
                        className="flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                        title="Delete offline copy"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
