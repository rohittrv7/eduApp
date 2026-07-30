'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Calendar } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardSectionSkeleton } from '@/components/ui/SkeletonLoader';
import {
  useGetTeacherVideosQuery,
  useGetVideoEngagementQuery,
  type TeacherVideo,
} from '@/store/teacherApi';

/** Format seconds as "Xh Ym" or "Zm" */
function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Expandable video row showing per-student engagement (Req 20.5) */
function VideoEngagementRow({ video }: { video: TeacherVideo }) {
  const [expanded, setExpanded] = useState(false);

  const { data: engagement = [], isLoading } = useGetVideoEngagementQuery(video.id, {
    skip: !expanded,
  });

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      {/* Video header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronUp size={16} className="shrink-0 text-gray-400" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-gray-400" />
        )}

        {/* Thumbnail */}
        {video.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail}
            alt={video.title}
            className="h-10 w-16 shrink-0 rounded object-cover"
          />
        ) : (
          <div className="h-10 w-16 shrink-0 rounded bg-gray-200" />
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{video.title}</p>
          <p className="text-xs text-gray-500">{video.batchTitle}</p>
        </div>

        <div className="shrink-0 text-right text-xs text-gray-500">
          <p>{(video.viewCount ?? 0).toLocaleString()} views</p>
          <p>Avg {formatDuration(video.avgWatchTimeSecs ?? 0)}</p>
        </div>
      </button>

      {/* Per-student engagement table */}
      {expanded && (
        <div className="border-t">
          {isLoading ? (
            <div className="p-4">
              <p className="text-sm text-gray-400">Loading engagement data...</p>
            </div>
          ) : engagement.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No students have watched this video yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">Student</th>
                  <th className="px-4 py-2 text-right">
                    <span className="flex items-center justify-end gap-1">
                      <Clock size={11} /> Watch Time
                    </span>
                  </th>
                  <th className="px-4 py-2 text-right">
                    <span className="flex items-center justify-end gap-1">
                      <Calendar size={11} /> Last Watched
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {engagement.map((entry) => (
                  <tr key={entry.studentId} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{entry.studentName}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">
                      {formatDuration(entry.watchTimeSecs)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-500">
                      {new Date(entry.lastWatchDate).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Teacher student engagement stats page.
 * - Per-video: list of students who watched, watch-time per student, last watch date (Req 20.5)
 * Requirements: 20.5
 */
export default function TeacherStudentsPage() {
  const { data: videos = [], isLoading } = useGetTeacherVideosQuery();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Student Engagement</h1>
          <p className="mt-1 text-sm text-gray-500">
            Click a video to see per-student watch-time and last activity.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <DashboardSectionSkeleton key={i} />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="rounded-xl border bg-white p-12 text-center text-sm text-gray-500">
            No videos yet. Add videos to see student engagement.
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((video) => (
              <VideoEngagementRow key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
