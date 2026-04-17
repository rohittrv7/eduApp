'use client';

interface AdBlockOverlayProps {
  visible: boolean;
}

/**
 * Full-coverage branded overlay shown while a YouTube ad is playing.
 * Shown on IFrame API `onAdStart` event, hidden on `onAdEnd`.
 * z-index: 4 — sits above the watermark but below custom controls.
 * Requirements: 2.5, 2.6
 */
export function AdBlockOverlay({ visible }: AdBlockOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-[#1a56db]"
      style={{ zIndex: 4 }}
      aria-live="polite"
      aria-label="Advertisement playing"
    >
      <div className="text-center text-white">
        <p className="text-lg font-bold">Ad playing…</p>
        <p className="text-sm opacity-75">Please wait</p>
      </div>
    </div>
  );
}
