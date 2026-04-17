'use client';

import { useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  useGetAnnouncementsQuery,
  useMarkAnnouncementReadMutation,
} from '@/store/announcementsApi';
import { Bell, AlertCircle } from 'lucide-react';

export default function AnnouncementsPage() {
  const { data: announcements = [], isLoading } = useGetAnnouncementsQuery();
  const [markRead] = useMarkAnnouncementReadMutation();

  // Mark all unread as read on mount (Req 33.3)
  useEffect(() => {
    announcements
      .filter((a) => !a.isRead)
      .forEach((a) => markRead(a.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcements.length]);

  // Sort by date DESC (Req 33.2)
  const sorted = [...announcements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const importantAnnouncements = sorted.filter((a) => a.isImportant);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Bell size={20} className="text-[#1a56db]" />
          Announcements
        </h1>

        {/* Important banner (Req 33.4) */}
        {importantAnnouncements.length > 0 && (
          <div className="space-y-2">
            {importantAnnouncements.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4"
              >
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-orange-500" />
                <div>
                  <p className="font-semibold text-orange-900">{a.title}</p>
                  <p className="mt-0.5 text-sm text-orange-700">{a.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoading && <SkeletonLoader variant="list-item" count={5} />}

        {!isLoading && sorted.length === 0 && (
          <p className="py-12 text-center text-gray-400">No announcements yet</p>
        )}

        {!isLoading && (
          <div className="space-y-3">
            {sorted.map((announcement) => (
              <div
                key={announcement.id}
                className={`rounded-xl border bg-white p-4 shadow-sm transition-colors ${
                  !announcement.isRead ? 'border-l-4 border-l-[#1a56db]' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                  {/* Unread badge (Req 33.3) */}
                  {!announcement.isRead && (
                    <span className="flex-shrink-0 rounded-full bg-[#1a56db] px-2 py-0.5 text-xs font-medium text-white">
                      New
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">{announcement.body}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(announcement.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
