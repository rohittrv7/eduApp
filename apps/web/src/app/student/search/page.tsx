'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BatchCard } from '@/components/ui/BatchCard';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useSearchQuery } from '@/store/searchApi';
import { Search } from 'lucide-react';

type Tab = 'batches' | 'videos' | 'teachers' | 'tests';

const TABS: { key: Tab; label: string }[] = [
  { key: 'batches', label: 'Batches' },
  { key: 'videos', label: 'Videos' },
  { key: 'teachers', label: 'Teachers' },
  { key: 'tests', label: 'Tests' },
];

export default function SearchPage() {
  return (
    <Suspense fallback={<DashboardLayout><div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1a56db] border-t-transparent" /></div></DashboardLayout>}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('batches');

  // RTK Query — skip when no query (Req 30.1, 30.2, 30.3)
  const { data, isLoading } = useSearchQuery(q, { skip: q.length === 0 });

  const tabCounts: Record<Tab, number> = {
    batches: data?.batches?.length ?? 0,
    videos: data?.videos?.length ?? 0,
    teachers: data?.teachers?.length ?? 0,
    tests: data?.tests?.length ?? 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Search size={20} className="text-gray-400" />
          <h1 className="text-lg font-semibold text-gray-900">
            {q ? `Results for "${q}"` : 'Search'}
          </h1>
        </div>

        {/* Filter tabs by result type (Req 30.3) */}
        <div className="flex gap-1 overflow-x-auto border-b">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-[#1a56db] text-[#1a56db]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tabCounts[tab.key] > 0 && (
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs">
                  {tabCounts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {!q && (
          <p className="py-12 text-center text-gray-400">Enter a search term to find content</p>
        )}

        {q && isLoading && <SkeletonLoader variant="card" count={3} />}

        {q && !isLoading && (
          <>
            {/* Batches (Req 30.2) */}
            {activeTab === 'batches' && (
              <div>
                {(data?.batches ?? []).length === 0 ? (
                  <p className="py-8 text-center text-gray-400">No batches found</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {(data?.batches ?? []).map((batch) => (
                      <BatchCard
                        key={batch.id}
                        id={batch.id}
                        thumbnail={batch.thumbnail}
                        title={batch.title}
                        teacherName={batch.teacherName}
                        price={batch.price}
                        rating={batch.rating}
                        ratingCount={batch.ratingCount}
                        isFree={batch.isFree}
                        onEnroll={(id) => router.push(`/batches/${id}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Videos */}
            {activeTab === 'videos' && (
              <div className="space-y-3">
                {(data?.videos ?? []).length === 0 ? (
                  <p className="py-8 text-center text-gray-400">No videos found</p>
                ) : (
                  (data?.videos ?? []).map((video) => (
                    <button
                      key={video.id}
                      onClick={() => router.push(`/student/videos/${video.id}`)}
                      className="flex w-full items-center gap-3 rounded-xl border bg-white p-3 text-left hover:shadow-sm"
                    >
                      <div className="h-14 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {video.thumbnail && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{video.title}</p>
                        <p className="text-xs text-gray-500">{video.batchTitle}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Teachers */}
            {activeTab === 'teachers' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(data?.teachers ?? []).length === 0 ? (
                  <p className="col-span-full py-8 text-center text-gray-400">No teachers found</p>
                ) : (
                  (data?.teachers ?? []).map((teacher) => (
                    <button
                      key={teacher.id}
                      onClick={() => router.push(`/teachers/${teacher.slug}`)}
                      className="flex items-center gap-3 rounded-xl border bg-white p-4 text-left hover:shadow-sm"
                    >
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a56db] text-lg font-bold text-white">
                        {teacher.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={teacher.photo}
                            alt={teacher.fullName}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          (teacher.fullName ?? teacher.email ?? 'T').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{teacher.fullName}</p>
                        <p className="text-xs text-gray-500">{teacher.subject}</p>
                        <p className="text-xs text-gray-400">{teacher.enrolledCount} students</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Tests */}
            {activeTab === 'tests' && (
              <div className="space-y-3">
                {(data?.tests ?? []).length === 0 ? (
                  <p className="py-8 text-center text-gray-400">No tests found</p>
                ) : (
                  (data?.tests ?? []).map((test) => (
                    <button
                      key={test.id}
                      onClick={() => router.push(`/student/tests/${test.id}`)}
                      className="flex w-full items-center justify-between rounded-xl border bg-white p-4 text-left hover:shadow-sm"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{test.title}</p>
                        <p className="text-xs text-gray-500">{test.subject}</p>
                      </div>
                      <div className="text-right text-xs text-gray-400">
                        <p>{test.questionCount} questions</p>
                        <p>{test.durationMins} mins</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
