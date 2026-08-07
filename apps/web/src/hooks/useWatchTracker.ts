'use client';

import { useEffect, useRef, useCallback } from 'react';
import apiClient from '../../lib/api-client';

const FLUSH_INTERVAL_MS = 30_000; // flush every 30s
const QUEUE_KEY_PREFIX = 'watch:queue:';

interface QueueItem {
  videoId: string;
  watchTimeSecs: number;
  lastPosition: number;
}

interface UseWatchTrackerOptions {
  videoId: string;
  userId: string;
  getPlayerTime: () => number;
  isPlaying: boolean;
}

/**
 * Tracks watch time while the document is visible and the player is playing.
 * Flushes to POST /api/v1/videos/:id/watch-session every 10 s or on unmount.
 * Failed flushes are queued in localStorage and retried on the next flush.
 */
export function useWatchTracker({
  videoId,
  userId,
  getPlayerTime,
  isPlaying,
}: UseWatchTrackerOptions) {
  const watchStartRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);
  const isTrackingRef = useRef<boolean>(false);
  const lastFlushRef = useRef<number>(Date.now());

  const queueKey = `${QUEUE_KEY_PREFIX}${userId}`;

  const enqueueOffline = useCallback(
    (watchTimeSecs: number, lastPosition: number) => {
      if (typeof window === 'undefined') return;
      let queue: QueueItem[] = [];
      try {
        const raw = localStorage.getItem(queueKey);
        if (raw) queue = JSON.parse(raw) as QueueItem[];
      } catch {
        queue = [];
      }
      queue.push({ videoId, watchTimeSecs, lastPosition });
      localStorage.setItem(queueKey, JSON.stringify(queue));
    },
    [queueKey, videoId],
  );

  const drainQueue = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(queueKey);
    if (!raw) return;
    let queue: QueueItem[] = [];
    try {
      queue = JSON.parse(raw) as QueueItem[];
    } catch {
      localStorage.removeItem(queueKey);
      return;
    }
    if (queue.length === 0) return;
    const remaining: QueueItem[] = [];
    for (const item of queue) {
      try {
        await apiClient.post(`/videos/${item.videoId}/watch-session`, {
          watchTimeSecs: item.watchTimeSecs,
          watch_time_secs: item.watchTimeSecs,
          lastPosition: item.lastPosition,
          last_position: item.lastPosition,
        });
      } catch {
        remaining.push(item);
      }
    }
    if (remaining.length === 0) {
      localStorage.removeItem(queueKey);
    } else {
      localStorage.setItem(queueKey, JSON.stringify(remaining));
    }
  }, [queueKey]);

  const flush = useCallback(
    async (watchTimeSecs: number) => {
      if (watchTimeSecs <= 0) return;
      const lastPosition = getPlayerTime();
      try {
        await drainQueue();
        await apiClient.post(`/videos/${videoId}/watch-session`, {
          watchTimeSecs,
          watch_time_secs: watchTimeSecs,
          lastPosition,
          last_position: lastPosition,
        });
        lastFlushRef.current = Date.now();
      } catch {
        enqueueOffline(watchTimeSecs, lastPosition);
      }
    },
    [videoId, getPlayerTime, drainQueue, enqueueOffline],
  );

  const startTracking = useCallback(() => {
    if (!isTrackingRef.current) {
      watchStartRef.current = Date.now();
      isTrackingRef.current = true;
    }
  }, []);

  const pauseTracking = useCallback(() => {
    if (isTrackingRef.current && watchStartRef.current > 0) {
      accumulatedRef.current += Math.floor((Date.now() - watchStartRef.current) / 1000);
      watchStartRef.current = 0;
      isTrackingRef.current = false;
    }
  }, []);

  // React to isPlaying changes
  useEffect(() => {
    if (isPlaying && document.visibilityState === 'visible') {
      startTracking();
    } else {
      pauseTracking();
    }
  }, [isPlaying, startTracking, pauseTracking]);

  // Page Visibility API — pause on hide, resume on show (Req 5.2, 5.3)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        pauseTracking();
      } else if (document.visibilityState === 'visible' && isPlaying) {
        startTracking();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isPlaying, startTracking, pauseTracking]);

  // Periodic flush — check every 10s, flush when 30s of watch time accumulated
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isTrackingRef.current) return;
      const now = Date.now();
      if (now - lastFlushRef.current < FLUSH_INTERVAL_MS) return;
      const elapsed = Math.floor((now - watchStartRef.current) / 1000);
      const total = accumulatedRef.current + elapsed;
      accumulatedRef.current = 0;
      watchStartRef.current = now;
      flush(total);
    }, 10_000); // check every 10s
    return () => clearInterval(interval);
  }, [flush]);

  // Flush on unmount via sendBeacon for reliability
  useEffect(() => {
    return () => {
      let total = accumulatedRef.current;
      if (isTrackingRef.current && watchStartRef.current > 0) {
        total += Math.floor((Date.now() - watchStartRef.current) / 1000);
      }
      if (total <= 0) return;
      const lastPosition = getPlayerTime();
      const payload = JSON.stringify({
        watchTimeSecs: total,
        watch_time_secs: total,
        lastPosition,
        last_position: lastPosition,
      });
      const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
      const url = `${base}/videos/${videoId}/watch-session`;
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
      } else {
        enqueueOffline(total, lastPosition);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);
}
