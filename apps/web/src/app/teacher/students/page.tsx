'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Calendar } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardSectionSkeleton } from '@/components/ui/SkeletonLoader';
import {
  useGetTeacherVideosQuery,
  useGetVideoEngagementQuery,
  useGetTeacherBatchesQuery,
  useGetBatchStudentsQuery,
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

/** Component to render enrolled students for a selected batch */
function EnrolledStudentsSection() {
  const { data: batches = [], isLoading: loadingBatches } = useGetTeacherBatchesQuery();
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  // Set default selected batch when batches load
  const activeBatchId = selectedBatchId || batches[0]?.id || '';

  const { data: students = [], isLoading: loadingStudents } = useGetBatchStudentsQuery(activeBatchId, {
    skip: !activeBatchId,
  });

  if (loadingBatches) {
    return <DashboardSectionSkeleton />;
  }

  if (batches.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center text-sm text-gray-500">
        No batches available yet. Create a batch to see enrolled students.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Batch selector */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border shadow-sm">
        <label className="text-sm font-semibold text-gray-800">Select Batch:</label>
        <select
          value={activeBatchId}
          onChange={(e) => setSelectedBatchId(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1a56db]"
        >
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Students Table */}
      {loadingStudents ? (
        <DashboardSectionSkeleton />
      ) : students.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center text-sm text-gray-500">
          No students enrolled in this batch yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="border-b bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Enrolled Students ({students.length})
          </div>
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Mobile / Email</th>
                <th className="px-4 py-3 text-right">Enrolled Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((st) => (
                <tr key={st.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a56db] font-bold text-white text-xs">
                        {st.full_name?.[0]?.toUpperCase() ?? 'S'}
                      </div>
                      <span className="font-semibold text-gray-900">{st.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <p>{st.mobile || '—'}</p>
                    {st.email && <p className="text-xs text-gray-400">{st.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">
                    {new Date(st.enrolled_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * Teacher student engagement & roster page.
 */
export default function TeacherStudentsPage() {
  const [activeTab, setActiveTab] = useState<'roster' | 'engagement'>('roster');
  const { data: videos = [], isLoading } = useGetTeacherVideosQuery();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Student &amp; Engagement Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            View enrolled students per batch and monitor per-video watch time metrics.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('roster')}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 px-1 ${
              activeTab === 'roster'
                ? 'border-[#1a56db] text-[#1a56db]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Enrolled Students by Batch
          </button>
          <button
            onClick={() => setActiveTab('engagement')}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 px-1 ${
              activeTab === 'engagement'
                ? 'border-[#1a56db] text-[#1a56db]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Video Watch Time Engagement
          </button>
        </div>

        {activeTab === 'roster' ? (
          <EnrolledStudentsSection />
        ) : (
          <div>
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
        )}
      </div>
    </DashboardLayout>
  );
}
