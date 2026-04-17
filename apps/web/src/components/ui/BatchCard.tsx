'use client';

import Image from 'next/image';
import { Star } from 'lucide-react';
import { cn, formatINR } from '@/lib/utils';

export interface BatchCardProps {
  id: string;
  thumbnail?: string | null;
  title: string;
  teacherName?: string;
  price: number;
  rating?: number; // 1-5
  ratingCount?: number;
  isEnrolled?: boolean;
  isFree?: boolean;
  onEnroll?: (id: string) => void;
}

export function BatchCard({
  id,
  thumbnail,
  title,
  teacherName,
  price,
  rating = 0,
  ratingCount,
  isEnrolled = false,
  isFree = false,
  onEnroll,
}: BatchCardProps) {
  const clampedRating = Math.min(5, Math.max(0, Math.round(rating)));

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        {thumbnail && thumbnail.trim() !== '' ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
        )}
        {isEnrolled && (
          <span className="absolute left-2 top-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold text-white">
            Enrolled
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-xs text-gray-500">{teacherName}</p>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={12}
              className={cn(
                i < clampedRating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
              )}
            />
          ))}
          {ratingCount !== undefined && (
            <span className="ml-1 text-xs text-gray-400">({ratingCount})</span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-base font-bold text-gray-900">
            {isFree || price === 0 ? 'Free' : formatINR(price)}
          </span>
          {!isEnrolled && (
            <button
              onClick={() => onEnroll?.(id)}
              className="rounded-lg bg-[#1a56db] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
            >
              {isFree || price === 0 ? 'Enroll' : 'Buy Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
