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

    async function load() {
      try {
        const res = await apiClient.get(`/live-classes/${classId}`);
        if (cancelled) return;
        const raw = res.data;
        // Normalize fields
        const data: LiveClassData = {
          id: raw.id,
          title: raw.title,
          batchTitle: raw.batch?.name ?? raw.batchTitle ?? '',
          status: raw.status,
          scheduledAt: raw.scheduled_at ?? raw.scheduledAt ?? '',
          youtubeVideoId: raw.youtube_video_id ?? raw.youtubeVideoId,
        };
        setLiveClass(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    // Refresh every 30s to pick up status changes
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
        <button onClick={() => window.history.back()} className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600">
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
