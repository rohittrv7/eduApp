'use client';

interface CustomControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  qualityLevels: string[];
  currentQuality: string;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onQualityChange: (quality: string) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Custom playback controls rendered above all overlays (z-index: 5).
 * All actions delegate to YouTube IFrame API via callbacks from VideoPlayer.
 * Requirements: 2.2
 */
export function CustomControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  qualityLevels,
  currentQuality,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onQualityChange,
}: CustomControlsProps) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8"
      style={{ zIndex: 5 }}
    >
      {/* Seek bar */}
      <input
        type="range"
        min={0}
        max={duration || 100}
        value={currentTime}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="mb-2 w-full cursor-pointer accent-[#1a56db]"
        style={{ height: '4px' }}
        aria-label="Seek"
      />

      <div className="flex items-center gap-3">
        {/* Play / Pause */}
        <button
          onClick={onPlayPause}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Time display */}
        <span className="font-mono text-xs text-white">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div className="flex-1" />

        {/* Quality selector */}
        {qualityLevels.length > 0 && (
          <select
            value={currentQuality}
            onChange={(e) => onQualityChange(e.target.value)}
            className="rounded bg-white/20 px-1 py-0.5 text-xs text-white"
            aria-label="Quality"
          >
            {qualityLevels.map((q) => (
              <option key={q} value={q} className="bg-black text-white">
                {q}
              </option>
            ))}
          </select>
        )}

        {/* Mute toggle */}
        <button
          onClick={onToggleMute}
          className="text-white"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || volume === 0 ? '🔇' : '🔊'}
        </button>

        {/* Volume slider */}
        <input
          type="range"
          min={0}
          max={100}
          value={isMuted ? 0 : volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-20 cursor-pointer accent-[#1a56db]"
          style={{ height: '4px' }}
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
