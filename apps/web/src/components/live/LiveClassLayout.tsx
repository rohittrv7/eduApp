'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Users, Play, Pause, Maximize, Radio, Settings, Gauge, Volume2,
} from 'lucide-react';
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

function pad(n: number) { return String(Math.floor(n)).padStart(2, '0'); }
function formatTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

const QUALITY_LABELS: Record<string, string> = {
  hd1080: '1080p', hd720: '720p', large: '480p',
  medium: '360p', small: '240p', tiny: '144p', auto: 'Auto',
};
const FALLBACK_QUALITIES = ['hd1080', 'hd720', 'large', 'medium', 'small'];
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

// Send postMessage command to YouTube iframe
function ytCmd(iframe: HTMLIFrameElement | null, func: string, args: any[] = []) {
  if (!iframe) return;
  iframe.contentWindow?.postMessage(
    JSON.stringify({ event: 'command', func, args }),
    '*',
  );
}

export function LiveClassLayout({ liveClass, user }: LiveClassLayoutProps) {
  const [viewerCount, setViewerCount] = useState(0);
  const [isActive, setIsActive] = useState(liveClass.status === 'active');
  const [isEnded, setIsEnded] = useState(liveClass.status === 'ended');
  const [videoEnded, setVideoEnded] = useState(false);

  const [playing, setPlaying] = useState(true); // autoplay=1 so starts playing
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const currentTimeRef = useRef(0);
  const playStartRef = useRef<number | null>(null); // for live elapsed time
  const [showQuality, setShowQuality] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [availableQualities] = useState<string[]>(FALLBACK_QUALITIES);
  const [speed, setSpeed] = useState(1);
  const [iframeReady, setIframeReady] = useState(false);

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

  // Listen to YouTube iframe postMessage events
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.data) return;
      let data: any;
      try { data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; }
      catch { return; }

      if (data.event === 'onReady') {
        setIframeReady(true);
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: 'listening' }), '*',
        );
        ytCmd(iframeRef.current, 'mute');
        ytCmd(iframeRef.current, 'playVideo');
        // Ask for duration immediately
        ytCmd(iframeRef.current, 'getDuration');
        setPlaying(true);
      }
      if (data.event === 'onStateChange') {
        const s = data.info;
        if (s === 1) {
          setPlaying(true);
          setVideoEnded(false);
          // Re-ask duration when playing starts (live streams may not have it on ready)
          ytCmd(iframeRef.current, 'getDuration');
        }
        if (s === 2) setPlaying(false);
        if (s === 0) { setPlaying(false); setVideoEnded(true); }
      }
      if (data.event === 'infoDelivery' && data.info) {
        const ct = data.info.currentTime;
        const dur = data.info.duration;
        const pq = data.info.playbackQuality;
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

  // Poll — send 'listening' so YouTube sends infoDelivery, also ask getDuration
  useEffect(() => {
    if (!iframeReady) return;
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'listening' }), '*',
    );
    timeIntervalRef.current = setInterval(() => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'listening' }), '*',
      );
      // Explicitly request duration every 2s until we have it
      ytCmd(iframeRef.current, 'getDuration');
    }, 500);
    return () => { if (timeIntervalRef.current) clearInterval(timeIntervalRef.current); };
  }, [iframeReady]);

  // Local tick — increments currentTime every second when playing (fallback for live)
  useEffect(() => {
    if (!playing) {
      playStartRef.current = null;
      return;
    }
    if (!playStartRef.current) {
      playStartRef.current = Date.now() - currentTimeRef.current * 1000;
    }
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

    socket.on('connect', () => {
      // Join the live room so viewer count increments
      socket.emit('live:join', { classId: liveClass.id });
    });

    socket.on('viewer:count', (d: { count: number }) => setViewerCount(d.count));
    socket.on('class:activated', (d: { classId: string }) => {
      if (d.classId === liveClass.id) setIsActive(true);
    });
    socket.on('class:ended', (d: { classId: string }) => {
      if (d.classId === liveClass.id) { setIsActive(false); setIsEnded(true); }
    });
    return () => {
      socket.emit('live:leave', { classId: liveClass.id });
      socket.disconnect();
    };
  }, [liveClass.id]);

  // Controls
  const handleUnmute = useCallback(() => {
    ytCmd(iframeRef.current, 'unMute');
    ytCmd(iframeRef.current, 'setVolume', [100]);
    setIsMuted(false);
  }, []);

  const togglePlay = () => {
    // First interaction — unmute automatically
    if (isMuted) handleUnmute();
    if (playing) {
      ytCmd(iframeRef.current, 'pauseVideo');
      setPlaying(false);
    } else {
      ytCmd(iframeRef.current, 'playVideo');
      setPlaying(true);
    }
  };

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
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const showPlayer = (isActive || isEnded) && liveClass.youtubeVideoId;
  const scheduledDateValid = liveClass.scheduledAt && !isNaN(new Date(liveClass.scheduledAt).getTime());

  // Build iframe src — enablejsapi=1 required for postMessage
  const iframeSrc = liveClass.youtubeVideoId
    ? `https://www.youtube-nocookie.com/embed/${liveClass.youtubeVideoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1&playsinline=1&showinfo=0&color=white&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')}`
    : '';

  return (
    <div className="flex h-[100dvh] flex-col bg-gray-900 lg:flex-row">
      {/* Video Column */}
      <div className="flex flex-col lg:h-full lg:w-[70%]">
        {/* Top bar */}
        <div className="flex shrink-0 items-center justify-between bg-gray-900 border-b border-gray-700 px-4 py-2.5">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-white">{liveClass.title}</h1>
            <p className="text-xs text-gray-400">{liveClass.batchTitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-xs text-gray-300">
            {isActive && (
              <>
                <div className="flex items-center gap-1 text-gray-400">
                  <Users size={13} />
                  <span>{viewerCount}</span>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 font-semibold text-white">
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
          {/* Recorded class — use WhiteLabelPlayer (same as recorded videos) */}
          {isEnded && liveClass.youtubeVideoId ? (
            <div className="w-full">
              <WhiteLabelPlayer
                youtubeVideoId={liveClass.youtubeVideoId}
                user={user}
              />
            </div>
          ) : showPlayer ? (
            <div
              ref={containerRef}
              className="relative w-full select-none"
              style={{ aspectRatio: '16/9', background: '#000' }}
              onMouseMove={resetControlsTimer}
              onMouseLeave={() => setShowControls(false)}
            >
              {/* YouTube iframe — extended on all sides to crop YouTube UI completely */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <iframe
                  ref={iframeRef}
                  src={iframeSrc}
                  className="absolute left-0 right-0 w-full"
                  style={{ top: '-60px', bottom: '-120px', height: 'calc(100% + 180px)', border: 'none' }}
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                  title={liveClass.title}
                />
              </div>

              {/* Black overlay when paused — hides YouTube "More videos" panel */}
              {!playing && !videoEnded && (
                <div className="absolute inset-0 z-10 bg-black/60" />
              )}

              {/* Watermark */}
              <WatermarkOverlay mobile={user.mobile} userId={user.id} />

              {/* Poll overlay */}
              <LivePollOverlay classId={liveClass.id} />

              {/* Muted autoplay banner — always visible at top, tap to unmute */}
              {isMuted && (
                <button
                  onClick={() => { handleUnmute(); resetControlsTimer(); }}
                  className="absolute left-3 top-3 z-40 flex items-center gap-2 rounded-full bg-black/80 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm border border-white/20 hover:bg-black/95 transition-colors"
                >
                  <Volume2 size={14} />
                  🔇 Tap to unmute
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

              {/* Custom Controls */}
              <div
                className="absolute inset-x-0 bottom-0 z-30 transition-opacity duration-300"
                style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? 'auto' : 'none' }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                <div className="relative px-3 pb-2 pt-8">
                  {/* Progress bar — always visible */}
                  <div className="mb-2 flex items-center gap-2">
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
                    {/* Play/Pause */}
                    <button onClick={togglePlay} className="text-white transition-colors hover:text-red-400">
                      {playing ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
                    </button>

                    {/* LIVE badge */}
                    {isActive && (
                      <div className="flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5">
                        <Radio size={10} className="text-white" />
                        <span className="text-xs font-bold text-white">LIVE</span>
                      </div>
                    )}

                    <div className="flex-1" />

                    {/* Speed */}
                    <div className="relative">
                      <button
                        onClick={() => { setShowSpeed(v => !v); setShowQuality(false); }}
                        className="flex items-center gap-1 text-white transition-colors hover:text-red-400"
                      >
                        <Gauge size={15} />
                        <span className="text-xs">{speed}x</span>
                      </button>
                      {showSpeed && (
                        <div className="absolute bottom-8 right-0 z-50 min-w-[70px] rounded-lg border border-gray-700 bg-gray-900/95 py-1 shadow-xl">
                          {SPEEDS.map((s) => (
                            <button
                              key={s}
                              onClick={() => handleSpeed(s)}
                              className={`block w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-gray-700 ${speed === s ? 'font-semibold text-red-400' : 'text-white'}`}
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
                        onClick={() => { setShowQuality(v => !v); setShowSpeed(false); }}
                        className="flex items-center gap-1 text-white transition-colors hover:text-red-400"
                      >
                        <Settings size={15} />
                        <span className="text-xs">{QUALITY_LABELS[currentQuality] ?? currentQuality}</span>
                      </button>
                      {showQuality && (
                        <div className="absolute bottom-8 right-0 z-50 min-w-[80px] rounded-lg border border-gray-700 bg-gray-900/95 py-1 shadow-xl">
                          {availableQualities.map((q) => (
                            <button
                              key={q}
                              onClick={() => handleQuality(q)}
                              className={`block w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-gray-700 ${currentQuality === q ? 'font-semibold text-red-400' : 'text-white'}`}
                            >
                              {QUALITY_LABELS[q] ?? q}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Fullscreen */}
                    <button onClick={handleFullscreen} className="text-white transition-colors hover:text-red-400">
                      <Maximize size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Click overlay — play/pause on click, fullscreen on double-click, blocks YT suggestions */}
              <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={() => { togglePlay(); resetControlsTimer(); }}
                onDoubleClick={handleFullscreen}
              />
            </div>
          ) : (
            <div className="flex w-full items-center justify-center bg-black px-4 py-10 text-center text-white" style={{ aspectRatio: '16/9' }}>
              <div>
                <div className="mb-4 text-4xl">📡</div>
                <p className="mb-3 text-lg font-semibold">Class starts in</p>
                {scheduledDateValid ? (
                  <>
                    <CountdownTimer targetDate={new Date(liveClass.scheduledAt)} onExpire={() => {}} className="text-4xl text-white" />
                    <p className="mt-3 text-sm text-gray-400">
                      {new Date(liveClass.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-400">Starting soon...</p>
                )}
                <p className="mt-4 text-xs text-gray-500">Jab teacher Go Live press karega, video automatically start ho jayega</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column — Chat for live, Notes for recording */}
      <div className="flex min-h-0 flex-1 flex-col border-t border-gray-700 lg:h-full lg:w-[30%] lg:border-l lg:border-t-0">
        {isEnded ? (
          <PersonalNotes videoId={liveClass.id} />
        ) : (
          <CustomChat classId={liveClass.id} />
        )}
      </div>
    </div>
  );
}
