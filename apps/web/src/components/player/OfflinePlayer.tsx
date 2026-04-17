'use client';

import { useEffect, useRef, useState } from 'react';
import { WifiOff, AlertTriangle, Loader2 } from 'lucide-react';
import { decryptForPlayback, getOfflineVideoMeta, isExpired } from '@/lib/offline-storage.service';

interface OfflinePlayerProps {
  videoId: string;
  downloadToken: string;
  onExpired?: () => void;
}

/**
 * Plays an offline-downloaded encrypted video.
 * Decrypts chunks from IndexedDB on-the-fly using the download token.
 * The raw video is NEVER written to disk — only a revocable blob URL is created
 * and immediately revoked after the component unmounts.
 */
export function OfflinePlayer({ videoId, downloadToken, onExpired }: OfflinePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  const [status, setStatus] = useState<'loading' | 'ready' | 'expired' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // Expiry check before decryption
        const meta = await getOfflineVideoMeta(videoId);
        if (!meta) throw new Error('Video not found in offline storage.');
        if (isExpired(meta)) {
          if (!cancelled) {
            setStatus('expired');
            onExpired?.();
          }
          return;
        }

        const blob = await decryptForPlayback(videoId, downloadToken);
        if (cancelled) return;

        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;

        if (videoRef.current) {
          videoRef.current.src = url;
          videoRef.current.load();
        }
        setStatus('ready');
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to load offline video.';
        if (msg.includes('expired')) {
          setStatus('expired');
          onExpired?.();
        } else {
          setErrorMsg(msg);
          setStatus('error');
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      // Revoke blob URL on unmount — raw video no longer accessible
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [videoId, downloadToken, onExpired]);

  if (status === 'loading') {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-gray-900">
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Decrypting video...</p>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-gray-900">
        <div className="flex flex-col items-center gap-3 text-center text-white">
          <AlertTriangle className="h-10 w-10 text-yellow-400" />
          <p className="text-base font-semibold">Course Access Expired</p>
          <p className="max-w-xs text-sm text-gray-400">
            Your enrollment has ended. This offline video has been removed. Please renew your
            subscription to continue watching.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-gray-900">
        <div className="flex flex-col items-center gap-3 text-center text-white">
          <AlertTriangle className="h-10 w-10 text-red-400" />
          <p className="text-sm text-gray-300">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ aspectRatio: '16/9' }}>
      {/* Offline badge */}
      <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
        <WifiOff className="h-3 w-3" />
        Offline
      </div>

      <video
        ref={videoRef}
        className="h-full w-full"
        controls
        controlsList="nodownload nofullscreen"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()} // disable right-click save
      />
    </div>
  );
}
