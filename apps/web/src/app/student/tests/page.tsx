'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ClipboardList, Clock, Star, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import apiClient from '@/../lib/api-client';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TestItem {
  id: string;
  title: string;
  duration_mins: number;
  total_marks: number;
}

interface TestSeries {
  id: string;
  title: string;
  subject: string;
  price: number;
  is_free: boolean;
  is_enrolled?: boolean;
  tests: TestItem[];
}

// ─── SeriesCard ───────────────────────────────────────────────────────────────

function SeriesCard({ series }: { series: TestSeries }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const enrollMutation = useMutation({
    mutationFn: () => apiClient.post(`/test-series/${series.id}/enroll`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-series'] });
    },
  });

  const handleEnroll = () => {
    if (series.is_free) {
      enrollMutation.mutate();
    } else {
      // Redirect to payment flow
      window.location.href = `/student/payment?type=test-series&id=${series.id}`;
    }
  };

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{series.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{series.subject}</p>
            <p className="mt-1 text-xs text-gray-400">{series.tests.length} test{series.tests.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="shrink-0 text-right">
            {series.is_free ? (
              <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                Free
              </span>
            ) : (
              <span className="text-base font-bold text-gray-900">₹{series.price}</span>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          {series.is_enrolled ? (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg bg-[#1a56db] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              View Tests
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={enrollMutation.isPending}
              className="rounded-lg bg-[#1a56db] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {enrollMutation.isPending
                ? 'Enrolling…'
                : series.is_free
                ? 'Enroll Free'
                : 'Buy Now'}
            </button>
          )}
          {enrollMutation.isError && (
            <p className="text-xs text-red-500">Failed to enroll. Try again.</p>
          )}
        </div>
      </div>

      {/* Expanded test list */}
      {series.is_enrolled && expanded && series.tests.length > 0 && (
        <div className="border-t bg-gray-50 divide-y">
          {series.tests.map((test) => (
            <div key={test.id} className="flex items-center justify-between px-5 py-3 gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{test.title}</p>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {test.duration_mins} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Star size={11} /> {test.total_marks} marks
                  </span>
                </div>
              </div>
              <Link
                href={`/student/tests/${test.id}`}
                className="flex items-center gap-1.5 rounded-lg border border-[#1a56db] px-3 py-1.5 text-xs font-semibold text-[#1a56db] hover:bg-blue-50 shrink-0"
              >
                <Play size={12} /> Start Test
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TestSeriesPage() {
  const { data: seriesList, isLoading } = useQuery<TestSeries[]>({
    queryKey: ['test-series'],
    queryFn: () => apiClient.get('/test-series').then((r) => r.data),
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <ClipboardList size={22} className="text-[#1a56db]" />
          <h1 className="text-xl font-bold text-gray-900">Test Series</h1>
        </div>

        {!seriesList || seriesList.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
            No test series available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {seriesList.map((series) => (
              <SeriesCard key={series.id} series={series} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
