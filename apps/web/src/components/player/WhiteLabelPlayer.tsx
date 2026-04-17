'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Maximize, Settings, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import { WatermarkOverlay } from './WatermarkOverlay';
import { usePlayerStore } from '@/stores/player.store';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    _ytApiLoading?: boolean;
  }
}

const QUALITY_LABELS: Record<string, string> = {
  hd1080: '1080p', hd720: '720p', large: '480p',
  medium: '360p', small: '240p', tiny: '144p', auto: 'Auto',
};
const FALLBACK_QUALITIES = ['hd1080', 'hd720', 'large', 'medium', 'small'];
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function pad(n: number) { return String(Math.floor(n)).padStart(2, '0'); }
function formatTime(s: number) {
  if (!s || isNaN(s) || s < 0) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

function loadYTApi(cb: () => void) {
  if (typeof window === 'undefined') return;
  if (window.YT?.Player) { cb(); return; }
  const prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => { prev?.(); cb(); };
  if (!window._ytApiLoading) {
    window._ytApiLoading = true;
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  }
}

export interface WhiteLabelPlayerProps {
  youtubeVideoId: string;
  user: { id: string; mobile: string };
  initialPosition?: number;
  onTimeUpdate?: (currentTime: number, duration: number, playing: boolean) => void;
  onSeekRef?: React.MutableRefObject<((seconds: number) => void) | null>;
}

export function WhiteLabelPlayer({ youtubeVideoId, user, initialPosition = 0, onTimeUpdate, onSeekRef }: WhiteLabelPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const playerDivId = useRef(`yt-${Math.random().toString(36).slice(2)}`);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoEndedRef = useRef(false);
  const coverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [duration, setDuration] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
  const [ready, setReady] = useState(false);
  const [showCover, setShowCover] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [speed, setSpeed] = useState(1);

  const coverDivRef = useRef<HTMLDivElement>(null);

  const showCoverNow = useCallback(() => {
    if (coverDivRef.current) coverDivRef.current.style.display = 'block';
  }, []);

  const hideCoverNow = useCallback(() => {
    if (!videoEndedRef.current && coverDivRef.current) {
      coverDivRef.current.style.display = 'none';
    }
  }, []);

  const showCoverBriefly = useCallback(() => {
    showCoverNow();
    if (coverTimerRef.current) clearTimeout(coverTimerRef.current);
    coverTimerRef.current = setTimeout(hideCoverNow, 700);
  }, [showCoverNow, hideCoverNow]);

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
          autoplay: 0, controls: 0, modestbranding: 1, rel: 0,
          iv_load_policy: 3, disablekb: 1, fs: 0, playsinline: 1,
          showinfo: 0, color: 'white',
        },
        events: {
          onReady: (e: any) => {
            if (destroyed) return;
            setReady(true);
            // Make iframe fill container
            const iframe = e.target.getIframe?.() as HTMLIFrameElement | null;
            if (iframe) {
              iframe.style.cssText = 'position:absolute;top:-60px;left:0;width:100%;height:calc(100% + 120px);border:none;';
            }
            const dur = e.target.getDuration();
            if (dur > 0) setDuration(dur);
            if (initialPosition > 0) e.target.seekTo(initialPosition, true);
          },
          onStateChange: (e: any) => {
            if (destroyed) return;
            const s = e.data;
            if (s === 1) {
              setPlaying(true); setVideoEnded(false); videoEndedRef.current = false;
              const dur = playerRef.current?.getDuration?.() ?? 0;
              if (dur > 0) setDuration(dur);
            }
            if (s === 2) setPlaying(false);
            if (s === 0) {
              setPlaying(false);
              videoEndedRef.current = true;
              setVideoEnded(true);
              // Immediately show cover via DOM — no React async delay
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

  // Poll every 500ms — update time, duration, cover near end, and player store
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
        // Cover 5s before end to hide YouTube suggestions
        if (dur > 0 && ct > 0 && dur - ct <= 5 && isPlaying) {
          videoEndedRef.current = true;
          if (coverDivRef.current) coverDivRef.current.style.display = 'block';
        }
      } catch { /* not ready */ }
    }, 500);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTimeUpdate]);

  const handleSeek = useCallback((v: number) => {
    showCoverBriefly();
    playerRef.current?.seekTo?.(v, true);
    setCurrentTime(v);
  }, [showCoverBriefly]);

  useEffect(() => { if (onSeekRef) onSeekRef.current = handleSeek; }, [onSeekRef, handleSeek]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    showCoverBriefly();
    const state = playerRef.current.getPlayerState?.() ?? -1;
    if (state === 1) { playerRef.current.pauseVideo(); setPlaying(false); }
    else { playerRef.current.playVideo(); setPlaying(true); }
  }, [showCoverBriefly]);

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (isMuted) { playerRef.current.unMute(); playerRef.current.setVolume(100); setIsMuted(false); }
    else { playerRef.current.mute(); setIsMuted(true); }
  }, [isMuted]);

  const handleQuality = (q: string) => { playerRef.current?.setPlaybackQuality?.(q); setCurrentQuality(q); setShowQuality(false); };
  const handleSpeed = (s: number) => { playerRef.current?.setPlaybackRate?.(s); setSpeed(s); setShowSpeed(false); };
  const handleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const progressPct = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  return (
    <div ref={containerRef} className="relative w-full aspect-video select-none overflow-hidden bg-black">

      {/* YT Player wrapper */}
      <div id={`yt-wrapper-${playerDivId.current}`} className="absolute inset-0 pointer-events-none" />

      {/* Paused overlay */}
      {!playing && !videoEnded && (
        <div className="absolute inset-0 z-[20] bg-black/95" />
      )}

      {/* Cover overlay — DOM-controlled, instant response */}
      <div
        ref={coverDivRef}
        className="absolute inset-0 z-[25] bg-black"
        style={{ display: 'none' }}
      />

      {/* Center play button */}
      {!playing && !videoEnded && ready && (
        <div className="absolute inset-0 z-[30] flex items-center justify-center pointer-events-none">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 border border-white/30">
            <Play size={24} className="ml-1 text-white" fill="white" />
          </div>
        </div>
      )}

      {/* Watermark */}
      <WatermarkOverlay mobile={user.mobile} userId={user.id} />

      {/* End screen */}
      {videoEnded && (
        <div className="absolute inset-0 z-[50] flex flex-col items-center justify-center gap-3 bg-black text-white">
          <div className="text-3xl">✅</div>
          <p className="font-semibold">Video completed</p>
          <button onClick={() => {
            videoEndedRef.current = false;
            setVideoEnded(false);
            if (coverDivRef.current) coverDivRef.current.style.display = 'none';
            playerRef.current?.seekTo?.(0, true);
            playerRef.current?.playVideo();
            setPlaying(true);
            setCurrentTime(0);
          }} className="mt-1 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
            Watch again
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-0 z-[40] bg-gradient-to-t from-black via-black/60 to-transparent px-3 pb-2 pt-8">
        {/* Progress bar */}
        <div className="mb-1.5 flex items-center gap-2">
          <span className="w-9 text-right text-xs font-mono text-white tabular-nums">{formatTime(currentTime)}</span>
          <div className="relative flex-1 h-4 flex items-center group">
            <div className="absolute inset-x-0 h-1 rounded-full bg-white/25 top-1/2 -translate-y-1/2">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${progressPct}%` }} />
            </div>
            <input type="range" min={0} max={duration > 0 ? Math.floor(duration) : 100}
              step={1} value={Math.floor(currentTime)}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <div className="absolute h-3 w-3 rounded-full bg-white shadow pointer-events-none"
              style={{ left: `calc(${progressPct}% - 6px)` }} />
          </div>
          <span className="w-9 text-xs font-mono text-white/60 tabular-nums">
            {duration > 0 ? formatTime(duration) : '--:--'}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button onClick={() => handleSeek(Math.max(0, currentTime - 10))} className="text-white/80 hover:text-white"><SkipBack size={16} /></button>
          <button onClick={togglePlay} className="text-white hover:text-blue-400">
            {playing ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
          </button>
          <button onClick={() => handleSeek(Math.min(duration || currentTime + 10, currentTime + 10))} className="text-white/80 hover:text-white"><SkipForward size={16} /></button>
          <button onClick={toggleMute} className="text-white/80 hover:text-white">
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <span className="text-xs font-mono text-white/60 tabular-nums ml-1">
            {formatTime(currentTime)}{duration > 0 ? ` / ${formatTime(duration)}` : ''}
          </span>
          <div className="flex-1" />

          <div className="relative">
            <button onClick={() => { setShowSpeed(v => !v); setShowQuality(false); }} className="text-white/80 hover:text-white text-xs">{speed}x</button>
            {showSpeed && (
              <div className="absolute bottom-7 right-0 z-[70] min-w-[60px] rounded-lg border border-gray-700 bg-gray-900 py-1 shadow-xl">
                {SPEEDS.map((s) => (
                  <button key={s} onClick={() => handleSpeed(s)}
                    className={`block w-full px-2 py-1 text-left text-xs hover:bg-gray-700 ${speed === s ? 'text-blue-400 font-semibold' : 'text-white'}`}>{s}x</button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button onClick={() => { setShowQuality(v => !v); setShowSpeed(false); }} className="flex items-center gap-1 text-white/80 hover:text-white">
              <Settings size={14} />
            </button>
            {showQuality && (
              <div className="absolute bottom-7 right-0 z-[70] min-w-[75px] rounded-lg border border-gray-700 bg-gray-900 py-1 shadow-xl">
                {FALLBACK_QUALITIES.map((q) => (
                  <button key={q} onClick={() => handleQuality(q)}
                    className={`block w-full px-2 py-1 text-left text-xs hover:bg-gray-700 ${currentQuality === q ? 'text-blue-400 font-semibold' : 'text-white'}`}>
                    {QUALITY_LABELS[q]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleFullscreen} className="text-white/80 hover:text-white"><Maximize size={16} /></button>
        </div>
      </div>

      {/* Click overlay — video area only */}
      <div className="absolute inset-x-0 top-0 z-[35] cursor-pointer" style={{ bottom: '72px' }}
        onClick={togglePlay} onDoubleClick={handleFullscreen} />
    </div>
  );
}
