'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { PlayCircle, Clock, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import apiClient from '@/../lib/api-client';

interface Video {
  id: string;
  title: string;
  subject: string;
  duration_secs: number;
  thumbnail_url?: string;
  is_watched: boolean;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VideosPage() {
  const [search, setSearch] = useState('');

  const { data: videos = [], isLoading } = useQuery<Video[]>({
    queryKey: ['videos'],
    queryFn: () => apiClient.get('/videos').then((r) => r.data),
  });

  const filtered = videos.filter(
    (v) =>
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.subject.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <PlayCircle size={22} className="text-[#1a56db]" />
            <h1 className="text-xl font-bold text-gray-900">Videos</h1>
          </div>

          {/* Search */}
          <div className="relative max-w-xs w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search videos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm outline-none focus:border-[#1a56db]"
            />
          </div>
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
            {search ? 'No videos match your search.' : 'No videos available yet.'}
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((video) => (
              <Link
                key={video.id}
                href={`/student/videos/${video.id}`}
                className="group overflow-hidden rounded-xl border bg-white shadow-sm hover:border-[#1a56db] transition-colors"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-100">
                  {video.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <PlayCircle size={40} className="text-gray-300 group-hover:text-[#1a56db] transition-colors" />
                    </div>
                  )}
                  {video.is_watched && (
                    <span className="absolute bottom-2 right-2 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Watched
                    </span>
                  )}
                </div>

                <div className="p-3">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{video.title}</h3>
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                    <span>{video.subject}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {formatDuration(video.duration_secs)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
