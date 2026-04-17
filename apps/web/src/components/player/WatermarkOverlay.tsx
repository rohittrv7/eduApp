'use client';

import { useEffect, useState } from 'react';

// 9 grid positions (3×3) the watermark cycles through
const GRID_POSITIONS = [
  { top: '10%', left: '10%' },
  { top: '10%', left: '50%' },
  { top: '10%', left: '85%' },
  { top: '45%', left: '10%' },
  { top: '45%', left: '50%' },
  { top: '45%', left: '85%' },
  { top: '80%', left: '10%' },
  { top: '80%', left: '50%' },
  { top: '80%', left: '85%' },
] as const;

interface WatermarkOverlayProps {
  mobile: string;
  userId: string;
  /** Pass true when the session has expired to remove the watermark (Req 3.4) */
  hidden?: boolean;
}

/**
 * Semi-transparent floating watermark showing "{mobile} | {userId.slice(0,8)}".
 * Cycles through 9 grid positions every 15 s with a CSS fade transition.
 * z-index: 3, pointer-events: none — never blocks playback controls.
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export function WatermarkOverlay({ mobile, userId, hidden = false }: WatermarkOverlayProps) {
  const [posIndex, setPosIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out → change position → fade in
      setFadeIn(false);
      const timer = setTimeout(() => {
        setPosIndex((prev) => (prev + 1) % 9);
        setFadeIn(true);
      }, 400);
      return () => clearTimeout(timer);
    }, 15_000);

    return () => clearInterval(interval);
  }, []);

  if (hidden) return null;

  const pos = GRID_POSITIONS[posIndex];

  return (
    <div
      className="pointer-events-none absolute select-none text-xs font-medium text-white"
      style={{
        zIndex: 3,
        opacity: fadeIn ? 0.25 : 0,
        top: pos.top,
        left: pos.left,
        transform: 'translate(-50%, -50%)',
        whiteSpace: 'nowrap',
        transition: 'opacity 0.4s ease',
      }}
      aria-hidden="true"
    >
      {mobile} | {userId.slice(0, 8)}
    </div>
  );
}
