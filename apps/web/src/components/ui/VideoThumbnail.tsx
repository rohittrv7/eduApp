'use client';

import Image from 'next/image';

export interface VideoThumbnailProps {
  src?: string | null;
  alt: string;
  progress?: number;
  duration?: string;
  onClick?: () => void;
}

export function VideoThumbnail({ src, alt, progress = 0, duration, onClick }: VideoThumbnailProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div
      className="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg bg-gray-900"
      onClick={onClick}
    >
      {src && src.trim() !== '' ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-opacity duration-200 group-hover:opacity-90"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-800">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
      )}

      {/* Duration badge */}
      {duration && (
        <span className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
          {duration}
        </span>
      )}

      {/* Progress bar */}
      {clampedProgress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
          <div
            className="h-full bg-[#1a56db] transition-all duration-300"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}
