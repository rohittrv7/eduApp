'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ClipboardList,
  Clock,
  Star,
  ChevronDown,
  ChevronUp,
  Play,
  ChevronRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import apiClient from '@/../lib/api-client';

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

function SeriesCard({ series }: { series: TestSeries }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const enrollMut = useMutation({
    mutationFn: () => apiClient.post(`/test-series/${series.id}/enroll`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-series'] }),
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Card body */}
      <div className="p-4">
        {/* Subject tag */}
        {series.subject && (
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#1a56db]">
            {series.subject}
          </p>
        )}

        <div className="flex items-start justify-between gap-3">
          <h3 className="flex-1 text-[14px] font-bold text-gray-900 leading-snug">
            {series.title}
          </h3>
          <span
            className={`flex-shrink-0 rounded-xl px-2.5 py-1 text-[12px] font-extrabold ${
              series.is_free ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {series.is_free ? 'Free' : `₹${series.price}`}
          </span>
        </div>

        <p className="mt-1 text-[11px] text-gray-400">
          {series.tests.length} test{series.tests.length !== 1 ? 's' : ''}
        </p>

        {/* Actions */}
        <div className="mt-3.5 flex items-center gap-2">
          {series.is_enrolled ? (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1a56db] py-2 text-[13px] font-bold text-white hover:bg-blue-700 transition-colors"
            >
              View Tests
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          ) : (
            <button
              onClick={() => {
                if (series.is_free) {
                  enrollMut.mutate();
                } else {
                  window.location.href = `/student/payment?type=test-series&id=${series.id}`;
                }
              }}
              disabled={enrollMut.isPending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1a56db] py-2 text-[13px] font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {enrollMut.isPending ? 'Enrolling…' : series.is_free ? 'Enroll Free' : 'Buy Now'}
            </button>
          )}
        </div>
        {enrollMut.isError && (
          <p className="mt-1.5 text-center text-[11px] text-red-500">
            Failed to enroll. Try again.
          </p>
        )}
      </div>

      {/* Expanded test list */}
      {series.is_enrolled && expanded && series.tests.length > 0 && (
        <div className="divide-y divide-gray-50 border-t border-gray-100 bg-gray-50/60">
          {series.tests.map((test) => (
            <div key={test.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="truncate text-[13px] font-semibold text-gray-900">{test.title}</p>
                <div className="mt-0.5 flex items-center gap-3 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {test.duration_mins} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Star size={10} />
                    {test.total_marks} marks
                  </span>
                </div>
              </div>
              <Link
                href={`/student/tests/${test.id}`}
                className="flex flex-shrink-0 items-center gap-1 rounded-xl border border-[#1a56db] px-3 py-1.5 text-[11px] font-bold text-[#1a56db] hover:bg-blue-50 transition-colors"
              >
                <Play size={11} /> Start
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TestSeriesPage() {
  const { data: seriesList, isLoading } = useQuery<TestSeries[]>({
    queryKey: ['test-series'],
    queryFn: () => apiClient.get('/test-series').then((r) => r.data),
  });

  const enrolled = seriesList?.filter((s) => s.is_enrolled) ?? [];
  const unenrolled = seriesList?.filter((s) => !s.is_enrolled) ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <ClipboardList size={20} className="text-[#1a56db]" />
          <h1 className="text-[18px] font-bold text-gray-900">Test Series</h1>
        </div>

        {/* Summary */}
        {!isLoading && seriesList && seriesList.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-blue-50 p-3 text-center">
              <p className="text-[20px] font-extrabold text-[#1a56db]">{seriesList.length}</p>
              <p className="text-[10px] font-semibold text-blue-500">Total Series</p>
            </div>
            <div className="rounded-2xl bg-green-50 p-3 text-center">
              <p className="text-[20px] font-extrabold text-green-600">{enrolled.length}</p>
              <p className="text-[10px] font-semibold text-green-500">Enrolled</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        )}

        {!isLoading && (!seriesList || seriesList.length === 0) && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <ClipboardList size={40} className="text-gray-200" />
            <p className="text-sm font-medium text-gray-400">No test series available yet</p>
          </div>
        )}

        {/* Enrolled */}
        {!isLoading && enrolled.length > 0 && (
          <section>
            <div className="mb-2.5 flex items-center gap-1.5">
              <ChevronRight size={14} className="text-green-500" />
              <h2 className="text-[13px] font-bold text-gray-700">My Series</h2>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-600">
                {enrolled.length}
              </span>
            </div>
            <div className="space-y-3">
              {enrolled.map((s) => (
                <SeriesCard key={s.id} series={s} />
              ))}
            </div>
          </section>
        )}

        {/* Explore */}
        {!isLoading && unenrolled.length > 0 && (
          <section>
            <div className="mb-2.5 flex items-center gap-1.5">
              <ChevronRight size={14} className="text-[#1a56db]" />
              <h2 className="text-[13px] font-bold text-gray-700">Explore</h2>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#1a56db]">
                {unenrolled.length}
              </span>
            </div>
            <div className="space-y-3">
              {unenrolled.map((s) => (
                <SeriesCard key={s.id} series={s} />
              ))}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
