'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LiveClassLayout, type LiveClassData } from '@/components/live/LiveClassLayout';
import { useAppSelector } from '@/store/store';
import apiClient from '@/../lib/api-client';

export default function StudentLiveClassPage() {
  const { classId } = useParams<{ classId: string }>();
  const user = useAppSelector((s) => s.auth.user);

  const [liveClass, setLiveClass] = useState<LiveClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!classId) return;
    let cancelled = false;
    let isInitialLoad = true;

    async function load() {
      try {
        // 1. Fetch class metadata (youtube_url stripped by API for students)
        const res = await apiClient.get(`/live-classes/${classId}`);
        if (cancelled) return;
        const raw = res.data;

        // 2. Get play token → resolve to youtubeVideoId (secure, server-verified)
        let youtubeVideoId: string | undefined = liveClass?.youtubeVideoId;
        const status = raw.status;
        if (!youtubeVideoId && (status === 'active' || status === 'ended')) {
          try {
            const tokenRes = await apiClient.post(`/live-classes/${classId}/play-token`);
            const resolveRes = await apiClient.post(`/live-classes/${classId}/resolve-token`, {
              token: tokenRes.data.token,
            });
            youtubeVideoId = resolveRes.data.youtubeVideoId;
          } catch {
            // Not enrolled or class not active — player will show waiting screen
          }
        }

        const data: LiveClassData = {
          id: raw.id,
          title: raw.title,
          batchTitle: raw.batch?.name ?? raw.batchTitle ?? '',
          status: raw.status,
          scheduledAt: raw.scheduled_at ?? raw.scheduledAt ?? '',
          youtubeVideoId,
        };
        setLiveClass((prev) => ({
          ...data,
          youtubeVideoId: youtubeVideoId ?? prev?.youtubeVideoId,
        }));
      } catch {
        // Only show full error screen on initial load failure, not on periodic poll glitch
        if (!cancelled && isInitialLoad) {
          setError(true);
        }
      } finally {
        if (!cancelled && isInitialLoad) {
          setLoading(false);
          isInitialLoad = false;
        }
      }
    }

    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [classId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="animate-pulse text-gray-400">Loading live class...</div>
      </div>
    );
  }

  if (error || !liveClass || !user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-900">
        <p className="text-gray-400">Live class not found or you are not enrolled.</p>
        <button
          onClick={() => window.history.back()}
          className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <LiveClassLayout
      liveClass={liveClass}
      user={{ id: user.id, mobile: (user as any).mobile ?? '' }}
    />
  );
}
