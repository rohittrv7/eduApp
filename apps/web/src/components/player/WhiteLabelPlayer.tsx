'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WatermarkOverlay } from './WatermarkOverlay';
import { usePlayerStore } from '@/stores/player.store';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    _ytApiLoading?: boolean;
  }
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function pad(n: number) {
  return String(Math.floor(n)).padStart(2, '0');
}
function fmt(s: number) {
  if (!s || isNaN(s) || s < 0) return '0:00';
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = Math.floor(s % 60);
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

function loadYTApi(cb: () => void) {
  if (typeof window === 'undefined') return;
  if (window.YT?.Player) {
    cb();
    return;
  }
  const prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    prev?.();
    cb();
  };
  if (!window._ytApiLoading) {
    window._ytApiLoading = true;
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  }
}

/* ── Modern SVG icons ── */
const IPlay = () => (
  <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5 ml-0.5">
    <path d="M8 5.14v14l11-7z" />
  </svg>
);
const IPause = () => (
  <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);
const IVolOn = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 010 14.14" />
    <path d="M15.54 8.46a5 5 0 010 7.07" />
  </svg>
);
const IVolOff = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);
const ISkipB = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <polygon points="19 20 9 12 19 4 19 20" />
    <line x1="5" y1="19" x2="5" y2="5" />
  </svg>
);
const ISkipF = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <polygon points="5 4 15 12 5 20 5 4" />
    <line x1="19" y1="5" x2="19" y2="19" />
  </svg>
);
const IFS = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
  </svg>
);
const IFSExit = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
  </svg>
);
const ISettings = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

export interface WhiteLabelPlayerProps {
  youtubeVideoId: string;
  user: { id: string; mobile: string };
  initialPosition?: number;
  onTimeUpdate?: (currentTime: number, duration: number, playing: boolean) => void;
  onSeekRef?: React.MutableRefObject<((seconds: number) => void) | null>;
}

export function WhiteLabelPlayer({
  youtubeVideoId,
  user,
  initialPosition = 0,
  onTimeUpdate,
  onSeekRef,
}: WhiteLabelPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const playerDivId = useRef(`yt-${Math.random().toString(36).slice(2)}`);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoEndedRef = useRef(false);
  const coverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coverDivRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [duration, setDuration] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
  const [ready, setReady] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);
  const [speed, setSpeed] = useState(1);
  const ctrlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showCoverBriefly = useCallback(() => {
    if (coverDivRef.current) coverDivRef.current.style.display = 'block';
    if (coverTimerRef.current) clearTimeout(coverTimerRef.current);
    coverTimerRef.current = setTimeout(() => {
      if (!videoEndedRef.current && coverDivRef.current) coverDivRef.current.style.display = 'none';
    }, 700);
  }, []);

  const resetControls = useCallback(() => {
    setShowControls(true);
    if (ctrlTimerRef.current) clearTimeout(ctrlTimerRef.current);
    ctrlTimerRef.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  // Init YT.Player
  useEffect(() => {
    let destroyed = false;
    loadYTApi(() => {
      if (destroyed) return;
      const wrapper = document.getElementById(`yt-wrapper-${playerDivId.current}`);
      if (!wrapper) return;
      wrapper.innerHTML = '';
      const div = document.createElement('div');
      div.id = playerDivId.current;
      wrapper.appendChild(div);
      playerRef.current = new window.YT.Player(playerDivId.current, {
        videoId: youtubeVideoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          showinfo: 0,
        },
        events: {
          onReady: (e: any) => {
            if (destroyed) return;
            setReady(true);
            const iframe = e.target.getIframe?.() as HTMLIFrameElement | null;
            if (iframe)
              iframe.style.cssText =
                'position:absolute;top:-60px;left:0;width:100%;height:calc(100% + 120px);border:none;';
            const dur = e.target.getDuration();
            if (dur > 0) setDuration(dur);
            if (initialPosition > 0) e.target.seekTo(initialPosition, true);
          },
          onStateChange: (e: any) => {
            if (destroyed) return;
            if (e.data === 1) {
              setPlaying(true);
              setVideoEnded(false);
              videoEndedRef.current = false;
              const dur = playerRef.current?.getDuration?.() ?? 0;
              if (dur > 0) setDuration(dur);
            }
            if (e.data === 2) setPlaying(false);
            if (e.data === 0) {
              setPlaying(false);
              videoEndedRef.current = true;
              setVideoEnded(true);
              if (coverDivRef.current) coverDivRef.current.style.display = 'block';
            }
          },
        },
      });
    });
    return () => {
      destroyed = true;
      if (coverTimerRef.current) clearTimeout(coverTimerRef.current);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeVideoId]);

  const setPlayerCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const setPlayerIsPlaying = usePlayerStore((s) => s.setIsPlaying);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      if (!playerRef.current) return;
      try {
        const ct = playerRef.current.getCurrentTime?.() ?? 0;
        const dur = playerRef.current.getDuration?.() ?? 0;
        const state = playerRef.current.getPlayerState?.() ?? -1;
        const isPlaying = state === 1;
        setCurrentTime(ct);
        setPlayerCurrentTime(ct);
        setPlayerIsPlaying(isPlaying);
        if (dur > 0) setDuration(dur);
        onTimeUpdate?.(ct, dur, isPlaying);
        if (dur > 0 && ct > 0 && dur - ct <= 5 && isPlaying) {
          videoEndedRef.current = true;
          if (coverDivRef.current) coverDivRef.current.style.display = 'block';
        }
      } catch {
        /* not ready */
      }
    }, 500);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTimeUpdate]);

  // Fullscreen change listener
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const handleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.()
        .then(() => {
          // Lock to landscape after fullscreen granted — must be after promise resolves
          try {
            (screen.orientation as any)?.lock?.('landscape').catch(() => {});
          } catch {
            /* Safari */
          }
        })
        .catch(() => {});
    } else {
      document
        .exitFullscreen?.()
        .then(() => {
          try {
            (screen.orientation as any)?.unlock?.();
          } catch {
            /* Safari */
          }
        })
        .catch(() => {});
    }
  }, []);

  // F key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleFullscreen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleFullscreen]);

  const handleSeek = useCallback(
    (v: number) => {
      showCoverBriefly();
      playerRef.current?.seekTo?.(v, true);
      setCurrentTime(v);
    },
    [showCoverBriefly],
  );
  useEffect(() => {
    if (onSeekRef) onSeekRef.current = handleSeek;
  }, [onSeekRef, handleSeek]);

  // togglePlay — ONLY called from button, never from video area click
  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    showCoverBriefly();
    const state = playerRef.current.getPlayerState?.() ?? -1;
    if (state === 1) {
      playerRef.current.pauseVideo();
      setPlaying(false);
    } else {
      playerRef.current.playVideo();
      setPlaying(true);
    }
  }, [showCoverBriefly]);

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(100);
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  }, [isMuted]);

  const handleSpeed = (s: number) => {
    playerRef.current?.setPlaybackRate?.(s);
    setSpeed(s);
    setShowSpeed(false);
  };

  const progressPct = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video select-none overflow-hidden bg-black"
      onMouseMove={resetControls}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={resetControls}
    >
      {/* YT Player wrapper */}
      <div
        id={`yt-wrapper-${playerDivId.current}`}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Black overlay when paused — hides YouTube UI */}
      {!playing && !videoEnded && <div className="absolute inset-0 z-[20] bg-black/95" />}

      {/* Cover (near end / seeking) */}
      <div
        ref={coverDivRef}
        className="absolute inset-0 z-[25] bg-black"
        style={{ display: 'none' }}
      />

      {/* Center play button — tap this to play (only this, NOT full video area) */}
      {!playing && !videoEnded && ready && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 z-[30] flex items-center justify-center"
          aria-label="Play"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 border border-white/30 backdrop-blur-sm hover:bg-white/30 active:scale-95 transition-all">
            <IPlay />
          </div>
        </button>
      )}

      <WatermarkOverlay mobile={user.mobile} userId={user.id} />

      {/* End screen */}
      {videoEnded && (
        <div className="absolute inset-0 z-[50] flex flex-col items-center justify-center gap-3 bg-black text-white">
          <div className="text-3xl">✅</div>
          <p className="font-semibold">Video completed</p>
          <button
            onClick={() => {
              videoEndedRef.current = false;
              setVideoEnded(false);
              if (coverDivRef.current) coverDivRef.current.style.display = 'none';
              playerRef.current?.seekTo?.(0, true);
              playerRef.current?.playVideo();
              setPlaying(true);
              setCurrentTime(0);
            }}
            className="mt-1 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
          >
            Watch again
          </button>
        </div>
      )}

      {/* Controls bar — fades in/out like YouTube */}
      <div
        className="absolute inset-x-0 bottom-0 z-[40] transition-opacity duration-300"
        style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? 'auto' : 'none' }}
      >
        <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-3 pt-10">
          {/* Progress bar */}
          <div className="mb-2 flex items-center gap-2">
            <span className="w-9 text-right text-xs font-mono text-white/80 tabular-nums">
              {fmt(currentTime)}
            </span>
            <div className="relative flex h-4 flex-1 items-center group">
              <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-blue-500 transition-none"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={duration > 0 ? Math.floor(duration) : 100}
                step={1}
                value={Math.floor(currentTime)}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <div
                className="pointer-events-none absolute h-3 w-3 rounded-full bg-white shadow-md"
                style={{ left: `calc(${progressPct}% - 6px)` }}
              />
            </div>
            <span className="w-9 text-xs font-mono text-white/60 tabular-nums">
              {duration > 0 ? fmt(duration) : '--:--'}
            </span>
          </div>

          {/* Button row */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSeek(Math.max(0, currentTime - 10))}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Back 10s"
            >
              <ISkipB />
            </button>

            {/* Play/Pause button */}
            <button
              onClick={togglePlay}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 active:scale-90 transition-all"
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? <IPause /> : <IPlay />}
            </button>

            <button
              onClick={() => handleSeek(Math.min(duration || currentTime + 10, currentTime + 10))}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Forward 10s"
            >
              <ISkipF />
            </button>
            <button
              onClick={toggleMute}
              className="text-white/80 hover:text-white transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <IVolOff /> : <IVolOn />}
            </button>

            <div className="flex-1" />

            {/* Speed */}
            <div className="relative">
              <button
                onClick={() => setShowSpeed((v) => !v)}
                className="text-xs font-semibold text-white/80 hover:text-white transition-colors"
              >
                {speed}x
              </button>
              {showSpeed && (
                <div className="absolute bottom-8 right-0 z-[70] min-w-[64px] overflow-hidden rounded-xl border border-white/10 bg-black/95 py-1 shadow-2xl backdrop-blur-sm">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSpeed(s)}
                      className={`block w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/10 ${speed === s ? 'font-bold text-blue-400' : 'text-white'}`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Settings placeholder */}
            <button
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Settings"
            >
              <ISettings />
            </button>

            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="text-white/80 hover:text-white transition-colors"
              aria-label={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
            >
              {isFullscreen ? <IFSExit /> : <IFS />}
            </button>
          </div>
        </div>
      </div>

      {/* Transparent overlay — only shows/hides controls, NEVER triggers play/pause */}
      {playing && (
        <div
          className="absolute inset-x-0 top-0 z-[35]"
          style={{ bottom: '72px' }}
          onClick={resetControls}
          onDoubleClick={handleFullscreen}
        />
      )}
    </div>
  );
}
