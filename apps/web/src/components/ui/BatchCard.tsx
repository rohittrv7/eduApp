'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { cn, formatINR } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';

/** Shows thumbnail image with graceful fallback to gradient + initial on error */
function ThumbnailImage({ thumbnail, title }: { thumbnail: string; title: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white text-xl">
        {(title ?? '?').charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={thumbnail}
      alt={title}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      onError={() => setFailed(true)}
    />
  );
}

export interface BatchCardProps {
  id: string;
  slug?: string;
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
  slug,
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
  const router = useRouter();
  const { user } = useAuthStore();
  const clampedRating = Math.min(5, Math.max(0, Math.round(rating)));

  function handleEnrollClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      // User is NOT logged in — redirect to login page first
      const targetSlug = slug || id;
      router.push(`/login?returnUrl=/batches/${targetSlug}`);
      return;
    }

    if (onEnroll) {
      onEnroll(id);
    } else {
      const targetSlug = slug || id;
      router.push(`/batches/${targetSlug}`);
    }
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-blue-300">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        {thumbnail && thumbnail.trim() !== '' ? (
          <ThumbnailImage thumbnail={thumbnail} title={title} />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white text-xl">
            {(title ?? '?').charAt(0).toUpperCase()}
          </div>
        )}
        {isEnrolled && (
          <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-md">
            Enrolled
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h3>
        <p className="mt-1 text-xs text-slate-500 font-medium">{teacherName}</p>

        {/* Rating */}
        <div className="mt-3 flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={14}
              className={cn(
                i < clampedRating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
              )}
            />
          ))}
          {ratingCount !== undefined && (
            <span className="ml-1 text-xs font-medium text-slate-400">({ratingCount})</span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-lg font-black text-slate-900">
            {isFree || price === 0 ? 'Free' : formatINR(price)}
          </span>
          {!isEnrolled && (
            <button
              onClick={handleEnrollClick}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-blue-500/20 active:scale-95"
            >
              {isFree || price === 0 ? 'Enroll' : 'Buy Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
