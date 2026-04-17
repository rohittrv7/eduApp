'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useRef, Suspense } from 'react';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { OfflinePlayer } from '@/components/player/OfflinePlayer';
import { DownloadButton } from '@/components/player/DownloadButton';
import { PersonalNotes } from '@/components/player/PersonalNotes';
import { useAuthStore } from '@/stores/auth.store';
import apiClient from '@/../lib/api-client';
import { ArrowLeft } from 'lucide-react';

interface VideoDetail {
  id: string;
  title: string;
  description?: string;
  youtubeVideoId: string;
  durationSeconds: number;
  batchTitle?: string;
  chapterTitle?: string;
  thumbnailUrl?: string;
  enrollmentExpiresAt?: string | null;
}

interface WatchSession {
  lastPosition: number;
}

export default function VideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isOfflineMode = searchParams.get('offline') === 'true';
  const { user } = useAuthStore();
  const seekRef = useRef<((s: number) => void) | null>(null);

  const { data: video, isLoading } = useQuery<VideoDetail>({
    queryKey: ['video', videoId],
    queryFn: () => apiClient.get(`/videos/${videoId}`).then((r) => {
      const d = r.data;
      return {
        ...d,
        youtubeVideoId: d.youtubeVideoId ?? d.youtube_video_id ?? '',
        durationSeconds: d.durationSeconds ?? d.duration_seconds ?? 0,
        batchTitle: d.batchTitle ?? d.batch?.name,
        chapterTitle: d.chapterTitle ?? d.chapter?.name,
        thumbnailUrl: d.thumbnailUrl ?? d.thumbnail,
      };
    }),
    enabled: !isOfflineMode,
  });

  const { data: session } = useQuery<WatchSession>({
    queryKey: ['watch-session', videoId],
    queryFn: () => apiClient.get(`/videos/${videoId}/watch-session`).then((r) => r.data),
    enabled: !!videoId && !isOfflineMode,
  });

  const offlineToken =
    typeof window !== 'undefined' ? sessionStorage.getItem(`dl-token:${videoId}`) : null;

  if (isOfflineMode && offlineToken) {
    return (
      <div className="flex h-[100dvh] flex-col bg-gray-900">
        <div className="flex shrink-0 items-center gap-3 border-b border-gray-700 px-4 py-2.5">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
            <ArrowLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-white">Offline Playback</span>
        </div>
        <div className="flex-1 bg-black">
          <OfflinePlayer videoId={videoId} downloadToken={offlineToken}
            onExpired={() => sessionStorage.removeItem(`dl-token:${videoId}`)} />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!video || !user) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-gray-900">
        <p className="text-gray-400">Video not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-gray-900">

      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-700 bg-gray-900 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <button onClick={() => router.back()} className="shrink-0 p-1 text-gray-400 hover:text-white">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-white leading-tight">{video.title}</h1>
            {(video.batchTitle || video.chapterTitle) && (
              <p className="truncate text-xs text-gray-400">
                {[video.batchTitle, video.chapterTitle].filter(Boolean).join(' › ')}
              </p>
            )}
          </div>
        </div>
        <DownloadButton
          videoId={video.id} videoTitle={video.title}
          thumbnailUrl={video.thumbnailUrl} durationSeconds={video.durationSeconds}
          enrollmentExpiresAt={video.enrollmentExpiresAt}
        />
      </div>

      {/* Body — on mobile: player on top, notes below (scrollable)
               on desktop: player left 70%, notes right 30% */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row overflow-hidden">

        {/* Player — full width on mobile, 70% on desktop */}
        <div className="w-full shrink-0 bg-black lg:flex lg:flex-1 lg:items-center lg:justify-center">
          {video.youtubeVideoId ? (
            <div className="w-full">
              <VideoPlayer
                youtubeVideoId={video.youtubeVideoId}
                watchSessionVideoId={video.id}
                initialPosition={session?.lastPosition ?? 0}
                user={{ id: user.id, mobile: user.mobile ?? '' }}
                seekRef={seekRef}
              />
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center bg-gray-800 text-gray-400">
              <p className="text-sm">Video not available.</p>
            </div>
          )}
        </div>

        {/* Notes — scrollable below player on mobile, fixed right panel on desktop */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-t border-gray-700 bg-gray-900 lg:w-[30%] lg:flex-none lg:border-l lg:border-t-0 lg:overflow-hidden">
          <PersonalNotes videoId={video.id} onSeek={(s) => seekRef.current?.(s)} />
        </div>
      </div>
    </div>
  );
}
