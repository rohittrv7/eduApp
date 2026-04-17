import Link from 'next/link';
import Image from 'next/image';
import { Star, Users, BookOpen, Clock } from 'lucide-react';
import { BatchCard } from '@/components/ui/BatchCard';

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

async function getFeaturedBatches(): Promise<Batch[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const res = await fetch(`${apiUrl}/batches?featured=true`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || data).slice(0, 3);
  } catch {
    return [];
  }
}

const TESTIMONIALS = [
  {
    name: 'Rahul Kumar',
    text: 'allEdu helped me crack JEE with amazing live classes and doubt sessions. The teachers are incredibly supportive.',
    rating: 5,
  },
  {
    name: 'Priya Singh',
    text: 'Best platform for NEET preparation. The recorded videos and quizzes made revision so easy. Highly recommend!',
    rating: 5,
  },
  {
    name: 'Amit Verma',
    text: 'Affordable pricing with top-quality content. The live classes feel just like being in a real classroom.',
    rating: 4,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={16}
          className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}
        />
      ))}
    </div>
  );
}

export default async function HomePage() {
  const featuredBatches = await getFeaturedBatches();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="text-xl font-bold text-[#1a56db]">
            allEdu
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/batches" className="text-sm font-medium text-gray-600 hover:text-[#1a56db]">
              Batches
            </Link>
            <Link href="/test-series" className="text-sm font-medium text-gray-600 hover:text-[#1a56db]">
              Test Series
            </Link>
            <Link href="/teachers" className="text-sm font-medium text-gray-600 hover:text-[#1a56db]">
              Teachers
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-[#1a56db]"
            >
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Learn from{' '}
            <span className="text-[#1a56db]">India&apos;s Best Teachers</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Live classes, recorded videos, quizzes, and doubt sessions — everything you need to crack JEE, NEET, UPSC, and more.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="rounded-xl bg-[#1a56db] px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-blue-700 transition-colors"
            >
              Start Learning Free
            </Link>
            <Link
              href="/batches"
              className="rounded-xl border border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Browse Batches
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="border-b bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Users size={24} className="text-[#1a56db]" />
              </div>
              <p className="text-2xl font-bold text-gray-900">50,000+</p>
              <p className="text-sm text-gray-500">Students</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <BookOpen size={24} className="text-[#1a56db]" />
              </div>
              <p className="text-2xl font-bold text-gray-900">1,000+</p>
              <p className="text-sm text-gray-500">Classes</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Clock size={24} className="text-[#1a56db]" />
              </div>
              <p className="text-2xl font-bold text-gray-900">500+</p>
              <p className="text-sm text-gray-500">Hours of Content</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Batches */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Featured Batches</h2>
            <p className="mt-2 text-gray-500">Top-rated courses handpicked for you</p>
          </div>
          {featuredBatches.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredBatches.map((batch) => {
                const thumb = batch.thumbnail && (batch.thumbnail.startsWith('http://') || batch.thumbnail.startsWith('https://') || batch.thumbnail.startsWith('/')) ? batch.thumbnail : null;
                return (
                  <Link key={batch.id} href={`/batches/${batch.slug}`}>
                    <BatchCard
                      id={batch.id}
                      thumbnail={thumb}
                      title={batch.title}
                      teacherName={batch.teacherName}
                      price={batch.price}
                      rating={batch.rating || 4}
                      ratingCount={batch.ratingCount}
                      isFree={batch.isFree || batch.price === 0}
                    />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Placeholder cards when no data */}
              {[
                { id: '1', title: 'JEE Mains 2025 Complete Batch', teacherName: 'Rajesh Sir', price: 2999, rating: 5, ratingCount: 1240 },
                { id: '2', title: 'NEET Biology Masterclass', teacherName: 'Sunita Ma\'am', price: 1999, rating: 5, ratingCount: 890 },
                { id: '3', title: 'UPSC Prelims Foundation', teacherName: 'Vikram Sir', price: 0, rating: 4, ratingCount: 560 },
              ].map((batch) => (
                <Link key={batch.id} href="/batches">
                  <BatchCard
                    id={batch.id}
                    thumbnail="/placeholder-batch.jpg"
                    title={batch.title}
                    teacherName={batch.teacherName}
                    price={batch.price}
                    rating={batch.rating}
                    ratingCount={batch.ratingCount}
                    isFree={batch.price === 0}
                  />
                </Link>
              ))}
            </div>
          )}
          <div className="mt-10 text-center">
            <Link
              href="/batches"
              className="rounded-lg border border-[#1a56db] px-6 py-3 text-sm font-semibold text-[#1a56db] hover:bg-blue-50 transition-colors"
            >
              View All Batches
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-gray-900">What Students Say</h2>
            <p className="mt-2 text-gray-500">Trusted by thousands of students across India</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-xl bg-white p-6 shadow-sm">
                <StarRating rating={t.rating} />
                <p className="mt-4 text-sm text-gray-600">&ldquo;{t.text}&rdquo;</p>
                <p className="mt-4 text-sm font-semibold text-gray-900">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Link href="/" className="text-lg font-bold text-[#1a56db]">
              allEdu
            </Link>
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <Link href="/about" className="hover:text-gray-900">About</Link>
              <Link href="/contact" className="hover:text-gray-900">Contact</Link>
              <Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-gray-900">Terms of Service</Link>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} allEdu. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
