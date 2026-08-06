'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search, CheckCircle, ChevronRight, GraduationCap } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useGetAllBatchesQuery, useGetEnrolledBatchesQuery, BatchSummary } from '@/store/batchApi';

/* ─── batch card ────────────────────────────────────── */
function BatchCard({ batch, enrolled }: { batch: BatchSummary; enrolled?: boolean }) {
  return (
    <Link
      href={`/student/batches/${batch.slug ?? batch.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:border-[#1a56db] hover:shadow-md"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
        {batch.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={batch.thumbnail}
            alt={batch.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <GraduationCap size={36} className="text-[#1a56db] opacity-30" />
          </div>
        )}
        {enrolled && (
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-green-500 px-2.5 py-1 text-[10px] font-bold text-white shadow">
            <CheckCircle size={10} />
            Enrolled
          </div>
        )}
        {batch.target_exam && (
          <div className="absolute bottom-2 left-2.5 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            {batch.target_exam}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-2 text-[13px] font-bold text-gray-900 group-hover:text-[#1a56db] transition-colors">
          {batch.name}
        </h3>
        {batch.description && (
          <p className="mt-1 line-clamp-2 text-[11px] text-gray-500">{batch.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2.5">
          <span
            className={`text-[14px] font-extrabold ${batch.is_free ? 'text-green-600' : 'text-gray-900'}`}
          >
            {batch.is_free || batch.price === 0 ? 'Free' : `₹${batch.price}`}
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50">
            <ChevronRight size={13} className="text-[#1a56db]" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── empty state ───────────────────────────────────── */
function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white py-14 text-center">
      <BookOpen size={36} className="text-gray-200" />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}

/* ─── page ──────────────────────────────────────────── */
export default function StudentBatchesPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'explore' | 'enrolled'>('enrolled');

  const { data: allBatches = [], isLoading: loadingAll } = useGetAllBatchesQuery();
  const { data: enrolledBatches = [], isLoading: loadingEnrolled } = useGetEnrolledBatchesQuery();

  const isLoading = loadingAll || loadingEnrolled;
  const enrolledIds = new Set(enrolledBatches.map((b) => b.id));

  const q = search.toLowerCase();
  const filteredEnrolled = enrolledBatches.filter((b) => b.name.toLowerCase().includes(q));
  const filteredExplore = allBatches.filter(
    (b) => !enrolledIds.has(b.id) && b.name.toLowerCase().includes(q),
  );

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-[#1a56db]" />
          <h1 className="text-[18px] font-bold text-gray-900">Batches</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search batches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#1a56db] focus:bg-white transition-colors"
          />
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl border border-gray-100 bg-gray-50 p-1">
          {(
            [
              ['explore', 'Explore Batches'],
              ['enrolled', 'My Batches'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 rounded-xl py-2 text-[13px] font-semibold transition-all ${
                tab === key ? 'bg-white text-[#1a56db] shadow-sm' : 'text-gray-500'
              }`}
            >
              {label}
              {key === 'enrolled' && enrolledBatches.length > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === key ? 'bg-blue-100 text-[#1a56db]' : 'bg-gray-200 text-gray-500'}`}
                >
                  {enrolledBatches.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading && <SkeletonLoader variant="card" count={6} />}

        {!isLoading &&
          tab === 'explore' &&
          (filteredExplore.length === 0 ? (
            <Empty text={search ? 'No batches match your search' : 'No batches available yet'} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filteredExplore.map((b) => (
                <BatchCard key={b.id} batch={b} enrolled={enrolledIds.has(b.id)} />
              ))}
            </div>
          ))}

        {!isLoading &&
          tab === 'enrolled' &&
          (filteredEnrolled.length === 0 ? (
            <Empty
              text={
                search ? 'No batches match your search' : 'You have not enrolled in any batch yet'
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filteredEnrolled.map((b) => (
                <BatchCard key={b.id} batch={b} enrolled />
              ))}
            </div>
          ))}
      </div>
    </DashboardLayout>
  );
}
