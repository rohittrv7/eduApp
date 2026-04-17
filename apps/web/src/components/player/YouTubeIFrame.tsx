'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

// Augment the global Window with YT API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    _ytApiLoading?: boolean;
  }
}

// Minimal YT namespace — covers everything we need
declare namespace YT {
  class Player {
    constructor(elementId: string | HTMLElement, options: PlayerOptions);
    playVideo(): void;
    pauseVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    getCurrentTime(): number;
    getDuration(): number;
    getPlayerState(): number;
    setVolume(volume: number): void;
    getVolume(): number;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    getAvailableQualityLevels(): string[];
    setPlaybackQuality(quality: string): void;
    getPlaybackQuality(): string;
    destroy(): void;
  }
  interface PlayerOptions {
    videoId: string;
    width?: string | number;
    height?: string | number;
    playerVars?: Record<string, number | string>;
    events?: {
      onReady?: (event: PlayerEvent) => void;
      onStateChange?: (event: PlayerStateEvent) => void;
      onError?: (event: PlayerEvent) => void;
      onAdStart?: () => void;
      onAdEnd?: () => void;
    };
  }
  interface PlayerEvent {
    target: Player;
  }
  interface PlayerStateEvent {
    target: Player;
    data: number;
  }
  const PlayerState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  };
}

export type { YT };

export interface YouTubeIFrameProps {
  videoId: string;
  onReady?: (player: YT.Player) => void;
  onStateChange?: (event: YT.PlayerStateEvent) => void;
  onAdStart?: () => void;
  onAdEnd?: () => void;
}

export interface YouTubeIFrameHandle {
  player: YT.Player | null;
}

/** Singleton loader — appends the script tag only once per page. */
function loadYouTubeApi(onReady: () => void): void {
  if (typeof window === 'undefined') return;

  if (window.YT && window.YT.Player) {
    onReady();
    return;
  }

  // Chain onto any existing callback
  const prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (prev) prev();
    onReady();
  };

  if (!window._ytApiLoading) {
    window._ytApiLoading = true;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    document.head.appendChild(tag);
  }
}

/**
 * Thin wrapper around the YouTube IFrame API.
 * Loads the API script lazily (singleton), initialises YT.Player with
 * white-label params, and exposes the player instance via an imperative ref.
 * Requirements: 2.1
 */
const YouTubeIFrame = forwardRef<YouTubeIFrameHandle, YouTubeIFrameProps>(
  ({ videoId, onReady, onStateChange, onAdStart, onAdEnd }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YT.Player | null>(null);
    // Stable unique ID per mount
    const playerIdRef = useRef(`yt-${Math.random().toString(36).slice(2)}`);

    useImperativeHandle(ref, () => ({
      get player() {
        return playerRef.current;
      },
    }));

    useEffect(() => {
      let destroyed = false;

      function initPlayer() {
        if (destroyed || !containerRef.current) return;

        // Replace container contents with a fresh div for YT to own
        const div = document.createElement('div');
        div.id = playerIdRef.current;
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(div);

        playerRef.current = new window.YT.Player(playerIdRef.current, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            modestbranding: 1,
            rel: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            enablejsapi: 1,
            autoplay: 0,
          },
          events: {
            onReady: (e: any) => { if (!destroyed) onReady?.(e.target); },
            onStateChange: (e: any) => { if (!destroyed) onStateChange?.(e); },
            onAdStart: () => { if (!destroyed) onAdStart?.(); },
            onAdEnd: () => { if (!destroyed) onAdEnd?.(); },
          },
        });
      }

      loadYouTubeApi(initPlayer);

      return () => {
        destroyed = true;
        playerRef.current?.destroy();
        playerRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoId]);

    return (
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        aria-label="YouTube video player"
      />
    );
  }
);

YouTubeIFrame.displayName = 'YouTubeIFrame';

export { YouTubeIFrame };
