'use client';

import { useState, useEffect } from 'react';
import { Download, Trash2, CheckCircle, Loader2, WifiOff } from 'lucide-react';
import apiClient from '@/../lib/api-client';
import {
  downloadAndEncrypt,
  deleteOfflineVideo,
  isVideoAvailableOffline,
  type OfflineVideoMeta,
} from '@/lib/offline-storage.service';

interface DownloadButtonProps {
  videoId: string;
  videoTitle: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  enrollmentExpiresAt?: string | null;
}

type DownloadState = 'idle' | 'checking' | 'downloading' | 'downloaded' | 'error';

/**
 * Shown ONLY when NEXT_PUBLIC_VIDEO_PROVIDER !== 'youtube'.
 * Handles the full download flow: token → fetch → AES encrypt → IndexedDB.
 */
export function DownloadButton({
  videoId,
  videoTitle,
  thumbnailUrl = '',
  durationSeconds = 0,
  enrollmentExpiresAt = null,
}: DownloadButtonProps) {
  const provider = process.env.NEXT_PUBLIC_VIDEO_PROVIDER ?? 'youtube';

  const [state, setState] = useState<DownloadState>('checking');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Check if already downloaded on mount
  useEffect(() => {
    if (provider === 'youtube') return;
    isVideoAvailableOffline(videoId).then((available) => {
      setState(available ? 'downloaded' : 'idle');
    });
  }, [videoId, provider]);

  // YouTube phase — render nothing
  if (provider === 'youtube') return null;

  const handleDownload = async () => {
    setError(null);
    setState('downloading');
    setProgress(0);

    try {
      // 1. Get signed download token from backend
      const { data } = await apiClient.post<{
        token: string;
        payload: { enrollmentExpiresAt: string | null };
      }>(`/videos/${videoId}/download-token`);

      // 2. Get the actual video URL (for non-YouTube providers this is a direct URL)
      const { data: videoData } = await apiClient.get<{ streamUrl: string }>(
        `/videos/${videoId}/stream-url`,
      );

      // 3. Download + encrypt into IndexedDB
      const meta: Omit<OfflineVideoMeta, 'videoId' | 'downloadedAt' | 'sizeBytes' | 'chunkCount'> =
        {
          title: videoTitle,
          thumbnailUrl,
          durationSeconds,
          enrollmentExpiresAt: data.payload.enrollmentExpiresAt ?? enrollmentExpiresAt,
        };

      await downloadAndEncrypt(videoId, videoData.streamUrl, data.token, meta, (pct) => {
        setProgress(pct);
      });

      setState('downloaded');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed. Please try again.';
      setError(msg);
      setState('error');
    }
  };

  const handleDelete = async () => {
    await deleteOfflineVideo(videoId);
    setState('idle');
    setProgress(0);
  };

  if (state === 'checking') {
    return (
      <button disabled className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking...
      </button>
    );
  }

  if (state === 'downloaded') {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
          <CheckCircle className="h-4 w-4" />
          Downloaded
        </span>
        <button
          onClick={handleDelete}
          className="flex items-center gap-1 rounded-lg px-2 py-2 text-sm text-red-500 hover:bg-red-50"
          title="Delete offline copy"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (state === 'downloading') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{progress > 0 ? `${progress}%` : 'Starting...'}</span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-95 transition-transform"
      >
        <WifiOff className="h-4 w-4 text-gray-500" />
        <Download className="h-4 w-4" />
        Download for Offline
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
