'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { DoubtCard } from '@/components/doubts/DoubtCard';
import { DoubtSubmitForm } from '@/components/doubts/DoubtSubmitForm';
import { useGetDoubtsQuery } from '@/store/doubtsApi';
import { MessageCircleQuestion, Plus, X } from 'lucide-react';

export default function DoubtsPage() {
  const [videoId, setVideoId] = useState<string | undefined>();
  const [chapterId, setChapterId] = useState<string | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');

  const { data: doubts = [], isLoading } = useGetDoubtsQuery({ videoId, chapterId });

  const filtered = doubts.filter((d) =>
    statusFilter === 'all' ? true : d.status === statusFilter
  );

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <MessageCircleQuestion size={20} className="text-[#1a56db]" />
            Doubt Forum
          </h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-[#1a56db] px-3 py-2 text-sm font-medium text-white hover:bg-[#1648c0] transition-colors"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'Ask a Doubt'}
          </button>
        </div>

        {/* Submit form */}
        {showForm && (
          <DoubtSubmitForm onSuccess={() => setShowForm(false)} />
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'open', 'resolved'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-sm font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-[#1a56db] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading && <SkeletonLoader variant="list-item" count={4} />}

        {!isLoading && filtered.length === 0 && (
          <p className="py-12 text-center text-gray-400">No doubts found</p>
        )}

        {!isLoading && (
          <div className="space-y-3">
            {filtered.map((doubt) => (
              <DoubtCard key={doubt.id} doubt={doubt} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
