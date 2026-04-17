'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search, CheckCircle, Lock } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useGetAllBatchesQuery, useGetEnrolledBatchesQuery, BatchSummary } from '@/store/batchApi';

function BatchCard({ batch, enrolled }: { batch: BatchSummary; enrolled?: boolean }) {
  return (
    <Link
      href={`/student/batches/${batch.slug}`}
      className="group relative overflow-hidden rounded-xl border bg-white shadow-sm hover:border-[#1a56db] hover:shadow-md transition-all"
    >
      {enrolled && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold text-white shadow">
          <CheckCircle size={10} />
          Enrolled
        </div>
      )}
      <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center overflow-hidden">
        {batch.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={batch.thumbnail} alt={batch.name} className="h-full w-full object-cover" />
        ) : (
          <BookOpen size={36} className="text-[#1a56db] opacity-40" />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2">{batch.name}</h3>
        {batch.description && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{batch.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          {batch.target_exam && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {batch.target_exam}
            </span>
          )}
          <span className={`ml-auto text-sm font-bold ${batch.is_free ? 'text-green-600' : 'text-gray-900'}`}>
            {batch.is_free ? 'Free' : `₹${batch.price}`}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function StudentBatchesPage() {
  const [search, setSearch] = useState('');

  const { data: allBatches = [], isLoading: loadingAll } = useGetAllBatchesQuery();
  const { data: enrolledBatches = [], isLoading: loadingEnrolled } = useGetEnrolledBatchesQuery();

  const isLoading = loadingAll || loadingEnrolled;

  const enrolledIds = new Set(enrolledBatches.map((b) => b.id));

  const filteredEnrolled = enrolledBatches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredExplore = allBatches.filter(
    (b) => !enrolledIds.has(b.id) && b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header + Search */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <BookOpen size={22} className="text-[#1a56db]" />
            Batches
          </h1>
          <div className="relative max-w-xs w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search batches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm outline-none focus:border-[#1a56db]"
            />
          </div>
        </div>

        {isLoading && <SkeletonLoader variant="card" count={6} />}

        {!isLoading && (
          <>
            {/* My Batches */}
            {filteredEnrolled.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <h2 className="font-bold text-gray-800">My Batches</h2>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                    {filteredEnrolled.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredEnrolled.map((batch) => (
                    <BatchCard key={batch.id} batch={batch} enrolled />
                  ))}
                </div>
              </section>
            )}

            {/* Explore Batches */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Lock size={16} className="text-[#1a56db]" />
                <h2 className="font-bold text-gray-800">Explore Batches</h2>
                {filteredExplore.length > 0 && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    {filteredExplore.length}
                  </span>
                )}
              </div>

              {filteredExplore.length === 0 ? (
                <div className="rounded-xl border bg-white p-10 text-center">
                  <BookOpen size={36} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    {search ? 'Koi batch nahi mila' : 'Aap sabhi batches mein enrolled hain'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredExplore.map((batch) => (
                    <BatchCard key={batch.id} batch={batch} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
