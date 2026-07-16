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
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 font-sans">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        {thumbnail && thumbnail.trim() !== '' ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 group-hover:scale-110 transition-transform duration-300">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
        )}
        {isEnrolled && (
          <span className="absolute left-3 top-3 rounded-lg bg-emerald-500/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-black text-white uppercase tracking-wider shadow-sm">
            Enrolled
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-[14px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-snug">{title}</h3>
        <p className="mt-1 text-xs font-semibold text-slate-400">{teacherName}</p>

        {/* Rating */}
        <div className="mt-2.5 flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={12}
              className={cn(
                i < clampedRating ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-200 text-slate-200'
              )}
            />
          ))}
          {ratingCount !== undefined && (
            <span className="ml-1 text-[10px] font-bold text-slate-400">({ratingCount})</span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100/80">
          <span className="text-base font-black text-slate-900">
            {isFree || price === 0 ? <span className="text-emerald-600">Free</span> : formatINR(price)}
          </span>
          {!isEnrolled && (
            <button
              onClick={() => onEnroll?.(id)}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-500/10 active:scale-[0.97]"
            >
              {isFree || price === 0 ? 'Enroll' : 'Buy Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
