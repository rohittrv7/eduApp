'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { CustomChat } from './CustomChat';
import { LivePollOverlay } from './LivePollOverlay';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { WatermarkOverlay } from '@/components/player/WatermarkOverlay';
import { WhiteLabelPlayer } from '@/components/player/WhiteLabelPlayer';
import { PersonalNotes } from '@/components/player/PersonalNotes';

export interface LiveClassData {
  id: string;
  title: string;
  batchTitle: string;
  status: 'scheduled' | 'approved' | 'active' | 'ended';
  scheduledAt: string;
  youtubeVideoId?: string;
}

interface LiveClassLayoutProps {
  liveClass: LiveClassData;
  user: { id: string; mobile: string };
}

function pad(n: number) {
  return String(Math.floor(n)).padStart(2, '0');
}
function formatTime(s: number) {
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = Math.floor(s % 60);
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

const QUALITY_LABELS: Record<string, string> = {
  hd1080: '1080p',
  hd720: '720p',
  large: '480p',
  medium: '360p',
  small: '240p',
  tiny: '144p',
  auto: 'Auto',
};
const FALLBACK_QUALITIES = ['hd1080', 'hd720', 'large', 'medium', 'small'];
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function ytCmd(iframe: HTMLIFrameElement | null, func: string, args: any[] = []) {
  iframe?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
}

/* ── SVG icon components (modern, crisp) ── */
function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  );
}
function IconPause() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}
function IconVolumeMute() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
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
}

function IconVolumeOn() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
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
}
function IconFullscreen() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
    </svg>
  );
}
function IconExitFullscreen() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
    </svg>
  );
}
function IconGauge() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

export function LiveClassLayout({ liveClass, user }: LiveClassLayoutProps) {
  const [viewerCount, setViewerCount] = useState(0);
  const [isActive, setIsActive] = useState(liveClass.status === 'active');
  const [isEnded, setIsEnded] = useState(liveClass.status === 'ended');
  const [videoEnded, setVideoEnded] = useState(false);

  const [playing, setPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [availableQualities] = useState<string[]>(FALLBACK_QUALITIES);
  const [speed, setSpeed] = useState(1);
  const [iframeReady, setIframeReady] = useState(false);

  const currentTimeRef = useRef(0);
  const playStartRef = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  // YouTube postMessage listener
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.data) return;
      let data: any;
      try {
        data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (data.event === 'onReady') {
        setIframeReady(true);
        ytCmd(iframeRef.current, 'mute');
        ytCmd(iframeRef.current, 'playVideo');
        setPlaying(true);
      }
      if (data.event === 'onStateChange') {
        const s = data.info;
        if (s === 1) {
          setPlaying(true);
          setVideoEnded(false);
          ytCmd(iframeRef.current, 'getDuration');
        }
        if (s === 2) setPlaying(false);
        if (s === 0) {
          setPlaying(false);
          setVideoEnded(true);
        }
      }
      if (data.event === 'infoDelivery' && data.info) {
        const { currentTime: ct, duration: dur, playbackQuality: pq } = data.info;
        if (typeof ct === 'number' && ct >= 0) {
          currentTimeRef.current = ct;
          playStartRef.current = Date.now() - ct * 1000;
          setCurrentTime(ct);
        }
        if (typeof dur === 'number' && dur > 0) setDuration(dur);
        if (pq && pq !== 'unknown') setCurrentQuality(pq);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Poll iframe for time updates
  useEffect(() => {
    if (!iframeReady) return;
    timeIntervalRef.current = setInterval(() => {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening' }), '*');
      ytCmd(iframeRef.current, 'getDuration');
    }, 500);
    return () => {
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    };
  }, [iframeReady]);

  // Local tick when playing
  useEffect(() => {
    if (!playing) {
      playStartRef.current = null;
      return;
    }
    if (!playStartRef.current) playStartRef.current = Date.now() - currentTimeRef.current * 1000;
    const tick = setInterval(() => {
      const elapsed = (Date.now() - (playStartRef.current ?? Date.now())) / 1000;
      currentTimeRef.current = elapsed;
      setCurrentTime(elapsed);
    }, 1000);
    return () => clearInterval(tick);
  }, [playing]);

  // Socket.io
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3001';
    const socket = io(base, { withCredentials: true, transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('live:join', { classId: liveClass.id }));
    socket.on('viewer:count', (d: { count: number }) => setViewerCount(d.count));
    socket.on('class:activated', (d: { classId: string }) => {
      if (d.classId === liveClass.id) setIsActive(true);
    });
    socket.on('class:ended', (d: { classId: string }) => {
      if (d.classId === liveClass.id) {
        setIsActive(false);
        setIsEnded(true);
      }
    });
    return () => {
      socket.emit('live:leave', { classId: liveClass.id });
      socket.disconnect();
    };
  }, [liveClass.id]);

  // Fullscreen state tracking
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // F key for fullscreen (desktop)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleFullscreen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUnmute = useCallback(() => {
    ytCmd(iframeRef.current, 'unMute');
    ytCmd(iframeRef.current, 'setVolume', [100]);
    setIsMuted(false);
  }, []);

  // Play/Pause — only via button, NOT via video click
  const togglePlay = useCallback(() => {
    if (isMuted) handleUnmute();
    if (playing) {
      ytCmd(iframeRef.current, 'pauseVideo');
      setPlaying(false);
    } else {
      ytCmd(iframeRef.current, 'playVideo');
      setPlaying(true);
    }
  }, [playing, isMuted, handleUnmute]);

  const handleSeek = (v: number) => {
    ytCmd(iframeRef.current, 'seekTo', [v, true]);
    setCurrentTime(v);
  };
  const handleQuality = (q: string) => {
    ytCmd(iframeRef.current, 'setPlaybackQuality', [q]);
    setCurrentQuality(q);
    setShowQuality(false);
  };
  const handleSpeed = (s: number) => {
    ytCmd(iframeRef.current, 'setPlaybackRate', [s]);
    setSpeed(s);
    setShowSpeed(false);
  };

  const handleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
      // Request landscape on mobile
      try {
        (screen.orientation as any)?.lock?.('landscape');
      } catch {
        /* unsupported */
      }
    } else {
      document.exitFullscreen?.();
      try {
        (screen.orientation as any)?.unlock?.();
      } catch {
        /* unsupported */
      }
    }
  };

  const showPlayer = (isActive || isEnded) && liveClass.youtubeVideoId;
  const scheduledDateValid =
    liveClass.scheduledAt && !isNaN(new Date(liveClass.scheduledAt).getTime());
  const iframeSrc = liveClass.youtubeVideoId
    ? `https://www.youtube-nocookie.com/embed/${liveClass.youtubeVideoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1&playsinline=1&showinfo=0&color=white&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`
    : '';

  return (
    <div className="flex h-[100dvh] flex-col bg-gray-900 lg:flex-row">
      {/* Video column */}
      <div className="flex flex-col lg:h-full lg:w-[70%]">
        {/* Top bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-700 bg-gray-900 px-4 py-2.5">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-white">{liveClass.title}</h1>
            <p className="text-xs text-gray-400">{liveClass.batchTitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-xs text-gray-300">
            {isActive && (
              <>
                <div className="flex items-center gap-1 text-gray-400">
                  <IconUsers />
                  <span>{viewerCount}</span>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 font-bold text-white">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  LIVE
                </span>
              </>
            )}
            {isEnded && (
              <span className="rounded-full bg-gray-600 px-2.5 py-1 text-xs font-medium text-gray-200">
                Recording
              </span>
            )}
          </div>
        </div>

        {/* Video wrapper */}
        <div className="w-full bg-black lg:flex lg:flex-1 lg:items-center lg:justify-center">
          {isEnded && liveClass.youtubeVideoId ? (
            <div className="w-full">
              <WhiteLabelPlayer youtubeVideoId={liveClass.youtubeVideoId} user={user} />
            </div>
          ) : showPlayer ? (
            <div
              ref={containerRef}
              className="relative w-full select-none"
              style={{ aspectRatio: '16/9', background: '#000' }}
              onMouseMove={resetControlsTimer}
              onMouseLeave={() => setShowControls(false)}
              onTouchStart={resetControlsTimer}
            >
              {/* YouTube iframe */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <iframe
                  ref={iframeRef}
                  src={iframeSrc}
                  className="absolute left-0 right-0 w-full"
                  style={{
                    top: '-60px',
                    bottom: '-120px',
                    height: 'calc(100% + 180px)',
                    border: 'none',
                  }}
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                  title={liveClass.title}
                />
              </div>

              {/* Paused overlay */}
              {!playing && !videoEnded && <div className="absolute inset-0 z-10 bg-black/60" />}

              <WatermarkOverlay mobile={user.mobile} userId={user.id} />
              <LivePollOverlay classId={liveClass.id} />

              {/* Unmute banner */}
              {isMuted && (
                <button
                  onClick={() => {
                    handleUnmute();
                    resetControlsTimer();
                  }}
                  className="absolute left-3 top-3 z-40 flex items-center gap-2 rounded-full border border-white/20 bg-black/80 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/95"
                >
                  <IconVolumeMute />
                  Tap to unmute
                </button>
              )}

              {/* End screen */}
              {videoEnded && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/90 text-white">
                  <div className="text-4xl">✅</div>
                  <p className="text-lg font-semibold">Class completed</p>
                  <button
                    onClick={() => {
                      setVideoEnded(false);
                      ytCmd(iframeRef.current, 'seekTo', [0, true]);
                      ytCmd(iframeRef.current, 'playVideo');
                      setPlaying(true);
                    }}
                    className="mt-2 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
                  >
                    Watch again
                  </button>
                </div>
              )}

              {/* ── Controls bar ── */}
              <div
                className="absolute inset-x-0 bottom-0 z-30 transition-opacity duration-300"
                style={{
                  opacity: showControls ? 1 : 0,
                  pointerEvents: showControls ? 'auto' : 'none',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent pointer-events-none" />
                <div className="relative px-3 pb-3 pt-8">
                  {/* Seek bar */}
                  <div className="mb-2.5 flex items-center gap-2">
                    <span className="w-10 text-right text-xs tabular-nums text-white/80">
                      {formatTime(currentTime)}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={duration || Math.max(currentTime, 1)}
                      step={0.5}
                      value={currentTime}
                      onChange={(e) => duration && handleSeek(Number(e.target.value))}
                      className="h-1 flex-1 cursor-pointer accent-red-500"
                      style={{ cursor: duration ? 'pointer' : 'default' }}
                    />
                    <span className="w-10 text-xs tabular-nums text-white/80">
                      {duration ? formatTime(duration) : 'LIVE'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Play/Pause — ONLY button triggers toggle, NOT video overlay */}
                    <button
                      onClick={togglePlay}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/25 active:scale-90"
                      aria-label={playing ? 'Pause' : 'Play'}
                    >
                      {playing ? <IconPause /> : <IconPlay />}
                    </button>

                    {/* Volume */}
                    <button
                      onClick={() => {
                        if (isMuted) handleUnmute();
                        else {
                          ytCmd(iframeRef.current, 'mute');
                          setIsMuted(true);
                        }
                      }}
                      className="text-white/80 transition-colors hover:text-white"
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <IconVolumeMute /> : <IconVolumeOn />}
                    </button>

                    {/* LIVE badge */}
                    {isActive && (
                      <div className="flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                        <span className="text-xs font-bold text-white">LIVE</span>
                      </div>
                    )}

                    <div className="flex-1" />

                    {/* Speed */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowSpeed((v) => !v);
                          setShowQuality(false);
                        }}
                        className="flex items-center gap-1 text-white/80 transition-colors hover:text-white"
                      >
                        <IconGauge />
                        <span className="text-xs">{speed}x</span>
                      </button>
                      {showSpeed && (
                        <div className="absolute bottom-9 right-0 z-50 min-w-[70px] rounded-xl border border-gray-700 bg-gray-900/98 py-1 shadow-2xl">
                          {SPEEDS.map((s) => (
                            <button
                              key={s}
                              onClick={() => handleSpeed(s)}
                              className={`block w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/10 ${speed === s ? 'font-bold text-red-400' : 'text-white'}`}
                            >
                              {s}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quality */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowQuality((v) => !v);
                          setShowSpeed(false);
                        }}
                        className="flex items-center gap-1 text-white/80 transition-colors hover:text-white"
                      >
                        <IconSettings />
                        <span className="text-xs">
                          {QUALITY_LABELS[currentQuality] ?? currentQuality}
                        </span>
                      </button>
                      {showQuality && (
                        <div className="absolute bottom-9 right-0 z-50 min-w-[80px] rounded-xl border border-gray-700 bg-gray-900/98 py-1 shadow-2xl">
                          {availableQualities.map((q) => (
                            <button
                              key={q}
                              onClick={() => handleQuality(q)}
                              className={`block w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/10 ${currentQuality === q ? 'font-bold text-red-400' : 'text-white'}`}
                            >
                              {QUALITY_LABELS[q] ?? q}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Fullscreen — F key or button, rotates on mobile */}
                    <button
                      onClick={handleFullscreen}
                      className="text-white/80 transition-colors hover:text-white"
                      aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen (F)'}
                      title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen (F)'}
                    >
                      {isFullscreen ? <IconExitFullscreen /> : <IconFullscreen />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Transparent overlay — shows controls on tap/hover but does NOT toggle play */}
              <div className="absolute inset-0 z-10 cursor-pointer" onClick={resetControlsTimer} />
            </div>
          ) : (
            /* Waiting / countdown */
            <div
              className="flex w-full items-center justify-center bg-black px-4 py-10 text-center text-white"
              style={{ aspectRatio: '16/9' }}
            >
              <div>
                <div className="mb-4 text-4xl">📡</div>
                <p className="mb-3 text-lg font-semibold">Class starts in</p>
                {scheduledDateValid ? (
                  <>
                    <CountdownTimer
                      targetDate={new Date(liveClass.scheduledAt)}
                      onExpire={() => {}}
                      className="text-4xl text-white"
                    />
                    <p className="mt-3 text-sm text-gray-400">
                      {new Date(liveClass.scheduledAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-400">Starting soon...</p>
                )}
                <p className="mt-4 text-xs text-gray-500">
                  Jab teacher Go Live press karega, video automatically start ho jayega
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right column — Chat / Notes */}
      <div className="flex min-h-0 flex-1 flex-col border-t border-gray-700 lg:h-full lg:w-[30%] lg:border-l lg:border-t-0">
        {isEnded ? <PersonalNotes videoId={liveClass.id} /> : <CustomChat classId={liveClass.id} />}
      </div>
    </div>
  );
}
