import Link from 'next/link';
import Image from 'next/image';
import { Star, Users, BookOpen, Clock } from 'lucide-react';
import { BatchCard } from '@/components/ui/BatchCard';
export const dynamic = 'force-dynamic';

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
      cache: 'no-store',
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/70 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-blue-600 hover:opacity-90 transition-opacity">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-base shadow-md shadow-blue-500/20">
              æ
            </div>
            allEdu
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/batches" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
              Batches
            </Link>
            <Link href="/test-series" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
              Test Series
            </Link>
            <Link href="/teachers" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
              Teachers
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-indigo-50/40 to-slate-50 py-24 sm:py-32">
        {/* Glow ambient effects */}
        <div className="absolute top-1/4 left-1/10 -z-10 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl animate-pulse duration-[8000ms]" />
        <div className="absolute top-1/3 right-1/10 -z-10 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl animate-pulse duration-[12000ms]" />

        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
            🚀 India's Premier Online Learning Platform
          </span>
          <h1 className="mt-8 text-4xl font-black tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
            Learn from{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              India&apos;s Best Teachers
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 leading-relaxed">
            Experience high-definition live classes, interactive doubt clearing, adaptive practice quizzes, and full-length test series designed to help you ace JEE, NEET, UPSC, and board exams.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.03] active:scale-[0.98] transition-all"
            >
              Start Learning Free
            </Link>
            <Link
              href="/batches"
              className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-all"
            >
              Browse Batches
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="relative -mt-8 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200/80 bg-white/80 p-8 shadow-xl backdrop-blur-md">
          <div className="grid grid-cols-1 gap-8 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-y-0 sm:divide-x sm:divide-slate-200">
            <div className="flex flex-col items-center gap-3 pb-6 sm:pb-0 sm:px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users size={24} />
              </div>
              <div className="text-center">
                <p className="text-3xl font-black tracking-tight text-slate-900">50,000+</p>
                <p className="text-sm font-medium text-slate-500 mt-0.5">Enrolled Students</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 pt-6 sm:pt-0 sm:px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <BookOpen size={24} />
              </div>
              <div className="text-center">
                <p className="text-3xl font-black tracking-tight text-slate-900">1,000+</p>
                <p className="text-sm font-medium text-slate-500 mt-0.5">Live & Recorded Classes</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 pt-6 sm:pt-0 sm:px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Clock size={24} />
              </div>
              <div className="text-center">
                <p className="text-3xl font-black tracking-tight text-slate-900">500+</p>
                <p className="text-sm font-medium text-slate-500 mt-0.5">Hours of Premium Content</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Batches */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Our Courses</span>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Featured Batches</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-500">Premium comprehensive courses designed by subject experts</p>
          </div>
          {featuredBatches.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {featuredBatches.map((batch) => {
                const thumb = batch.thumbnail && (batch.thumbnail.startsWith('http://') || batch.thumbnail.startsWith('https://') || batch.thumbnail.startsWith('/')) ? batch.thumbnail : null;
                return (
                  <Link key={batch.id} href={`/batches/${batch.slug}`} className="transition-transform duration-200 hover:-translate-y-1">
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
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Placeholder cards when no data */}
              {[
                { id: '1', title: 'JEE Mains & Advanced 2025: Complete Course', teacherName: 'Rajesh Sir (IIT Bombay)', price: 2999, rating: 5, ratingCount: 1240 },
                { id: '2', title: 'NEET Biology Masterclass: Target 360', teacherName: 'Dr. Sunita Ma\'am', price: 1999, rating: 5, ratingCount: 890 },
                { id: '3', title: 'UPSC Prelims Foundation Batch 2025', teacherName: 'Vikram Sir (IAS Retd.)', price: 0, rating: 4, ratingCount: 560 },
              ].map((batch) => (
                <Link key={batch.id} href="/batches" className="transition-all duration-300 hover:-translate-y-1">
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
          <div className="mt-14 text-center">
            <Link
              href="/batches"
              className="inline-flex items-center justify-center rounded-xl border border-blue-600 bg-white px-6 py-3.5 text-sm font-bold text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors shadow-sm"
            >
              View All Batches
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-100/60 py-24 border-y border-slate-200/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Success Stories</span>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">What Our Students Say</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-500">Transforming goals into achievements across India</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="flex flex-col justify-between rounded-2xl border border-slate-200/60 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <StarRating rating={t.rating} />
                  <p className="mt-5 text-[15px] leading-relaxed text-slate-600 italic">&ldquo;{t.text}&rdquo;</p>
                </div>
                <div className="mt-6 flex items-center gap-3 pt-5 border-t border-slate-100">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Link href="/" className="flex items-center gap-1.5 text-xl font-black text-blue-600">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-extrabold text-xs">
                æ
              </div>
              allEdu
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm font-semibold text-slate-500">
              <Link href="/about" className="hover:text-blue-600 transition-colors">About</Link>
              <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link>
            </div>
          </div>
          <p className="mt-8 pt-8 border-t border-slate-100 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} allEdu. All rights reserved. Made with ❤️ for Indian students.
          </p>
        </div>
      </footer>
    </div>
  );
}
