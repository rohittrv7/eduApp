import Link from 'next/link';
import { BatchCard } from '@/components/ui/BatchCard';
import { BatchFilters } from '@/components/batches/BatchFilters';

interface Batch {
  id: string;
  slug: string;
  title: string;
  thumbnail: string;
  teacherName: string;
  price: number;
  rating: number;
  ratingCount: number;
  isFree: boolean;
}

interface BatchesPageProps {
  searchParams: {
    q?: string;
    examType?: string;
    language?: string;
    price?: string;
    subject?: string;
  };
}

async function getBatches(params: BatchesPageProps['searchParams']): Promise<Batch[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const query = new URLSearchParams();
    if (params.q) query.set('search', params.q);
    if (params.examType) query.set('examType', params.examType);
    if (params.language) query.set('language', params.language);
    if (params.price && params.price !== 'all') query.set('price', params.price);
    if (params.subject) query.set('subject', params.subject);

    const res = await fetch(`${apiUrl}/batches?${query.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || data;
  } catch {
    return [];
  }
}

export default async function BatchesPage({ searchParams }: BatchesPageProps) {
  const batches = await getBatches(searchParams);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="text-xl font-bold text-[#1a56db]">
            allEdu
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-[#1a56db]">
              Login
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-[#1a56db] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">All Batches</h1>

        {/* Search */}
        <form method="GET" className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={searchParams.q}
              placeholder="Search batches, subjects, teachers..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#1a56db] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Filter Sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            <BatchFilters
              examType={searchParams.examType}
              language={searchParams.language}
              price={searchParams.price}
              subject={searchParams.subject}
            />
          </aside>

          {/* Batch Grid */}
          <main className="flex-1">
            {batches.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-20 text-center">
                <p className="text-lg font-semibold text-gray-700">No batches found</p>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {batches.map((batch) => (
                  <Link key={batch.id} href={`/batches/${batch.slug}`}>
                    <BatchCard
                      id={batch.id}
                      thumbnail={batch.thumbnail || '/placeholder-batch.jpg'}
                      title={batch.title}
                      teacherName={batch.teacherName}
                      price={batch.price}
                      rating={batch.rating || 4}
                      ratingCount={batch.ratingCount}
                      isFree={batch.isFree || batch.price === 0}
                    />
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
