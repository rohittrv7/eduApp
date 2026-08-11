'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Bell, Check, CheckCheck, Megaphone } from 'lucide-react';
import apiClient from '@/../lib/api-client';

interface Notification {
  id: string;
  title: string;
  body: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['all-notifications'],
    queryFn: () =>
      apiClient
        .get('/notifications')
        .then((r) =>
          (Array.isArray(r.data) ? r.data : (r.data?.notifications ?? [])).map((n: any) => ({
            id: n.id,
            title: n.title,
            body: n.body ?? n.message ?? '',
            type: n.type,
            isRead: n.is_read ?? n.isRead ?? false,
            createdAt: n.created_at ?? n.createdAt ?? new Date().toISOString(),
          })),
        )
        .catch(() => []),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => apiClient.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-notifications'] }),
  });

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-[#1a56db]" />
            <h1 className="text-[18px] font-bold text-gray-900">Notifications</h1>
            {unread > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-[12px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <CheckCheck size={13} />
              Mark all read
            </button>
          )}
        </div>

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <Bell size={36} className="text-gray-200" />
            <p className="text-sm font-medium text-gray-500">No notifications yet</p>
            <p className="text-[12px] text-gray-400">You'll see class reminders and updates here</p>
          </div>
        )}

        {!isLoading && notifications.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3.5 transition-colors ${
                  n.isRead ? 'bg-white' : 'bg-blue-50/40'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${
                    n.isRead ? 'bg-gray-100' : 'bg-blue-100'
                  }`}
                >
                  <Megaphone size={15} className={n.isRead ? 'text-gray-400' : 'text-[#1a56db]'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[13px] font-semibold ${n.isRead ? 'text-gray-700' : 'text-gray-900'}`}
                  >
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="mt-0.5 text-[12px] text-gray-500 line-clamp-2">{n.body}</p>
                  )}
                  <p className="mt-1 text-[10px] text-gray-400">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => markRead.mutate(n.id)}
                    className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    title="Mark as read"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
