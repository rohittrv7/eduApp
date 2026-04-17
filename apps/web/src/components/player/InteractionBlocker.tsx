'use client';

interface InteractionBlockerProps {
  /** Optional double-click handler (e.g. play/pause toggle) */
  onDoubleClick?: () => void;
}

/**
 * Transparent full-coverage layer above the YouTube iframe (z-index: 2).
 * pointer-events: all intercepts every native YouTube click, preventing
 * navigation to youtube.com or any external URL.
 * Requirements: 2.3, 2.4
 */
export function InteractionBlocker({ onDoubleClick }: InteractionBlockerProps) {
  return (
    <div
      className="absolute inset-0"
      style={{ zIndex: 2, pointerEvents: 'all' }}
      onDoubleClick={onDoubleClick}
      aria-hidden="true"
    />
  );
}
