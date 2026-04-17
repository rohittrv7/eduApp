'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ChangeNumberSection } from '@/components/settings/ChangeNumberSection';
import apiClient from '@/../lib/api-client';
import { Bell, Check } from 'lucide-react';

interface NotificationPreferences {
  liveClassReminders: boolean;
  doubtReplies: boolean;
  newAnnouncements: boolean;
  quizResults: boolean;
  leaderboardUpdates: boolean;
  newBatchLaunches: boolean;
}

const PREF_LABELS: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  {
    key: 'liveClassReminders',
    label: 'Live Class Reminders',
    description: 'Get notified 5 minutes before a live class starts',
  },
  {
    key: 'doubtReplies',
    label: 'Doubt Replies',
    description: 'Notify when a teacher replies to your doubt',
  },
  {
    key: 'newAnnouncements',
    label: 'Announcements',
    description: 'Receive batch and platform announcements',
  },
  {
    key: 'quizResults',
    label: 'Quiz Results',
    description: 'Notify when quiz results are available',
  },
  {
    key: 'leaderboardUpdates',
    label: 'Leaderboard Updates',
    description: 'Get notified about leaderboard rank changes',
  },
  {
    key: 'newBatchLaunches',
    label: 'New Batch Launches',
    description: 'Notify when new batches are available',
  },
];

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:ring-offset-2 disabled:opacity-50 ${
        checked ? 'bg-[#1a56db]' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function ProfileSettingsPage() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);

  const { data: serverPrefs, isLoading } = useQuery<NotificationPreferences>({
    queryKey: ['notification-preferences'],
    queryFn: () =>
      apiClient.get('/users/me/notification-preferences').then((r) => r.data),
  });

  // Sync server data into local state
  useEffect(() => {
    if (serverPrefs) setPrefs(serverPrefs);
  }, [serverPrefs]);

  const saveMutation = useMutation({
    mutationFn: (data: NotificationPreferences) =>
      apiClient.patch('/users/me/notification-preferences', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  function handleToggle(key: keyof NotificationPreferences, value: boolean) {
    if (!prefs) return;
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    saveMutation.mutate(updated);
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>

        {/* Notification Preferences */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <Bell size={16} className="text-[#1a56db]" />
              Notification Preferences
            </h2>
            {saved && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <Check size={12} />
                Saved
              </span>
            )}
          </div>

          {isLoading || !prefs ? (
            <SkeletonLoader variant="list-item" count={6} />
          ) : (
            <div className="space-y-4">
              {PREF_LABELS.map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                  <Toggle
                    checked={prefs[key]}
                    onChange={(v) => handleToggle(key, v)}
                    disabled={saveMutation.isPending}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Account / Change Number */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Account</h2>
          <ChangeNumberSection />
        </section>
      </div>
    </DashboardLayout>
  );
}
