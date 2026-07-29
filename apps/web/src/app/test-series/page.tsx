import Link from 'next/link';
import { Award, CheckCircle2, Clock, BarChart3, Zap, GraduationCap, ArrowRight } from 'lucide-react';

export default function PublicTestSeriesPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-2xl font-black text-slate-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <GraduationCap size={20} />
            </div>
            <span>all<span className="text-blue-600">Edu</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-blue-600">
              Sign In
            </Link>
            <Link href="/login" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50/80 via-white to-slate-50 py-16 text-center">
        <div className="mx-auto max-w-4xl px-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 border border-blue-100">
            <Award size={14} /> NTA & CBSE Pattern Test Series 2026
          </span>
          <h1 className="mt-4 text-4xl font-extrabold text-slate-900 sm:text-5xl">
            All-India Mock Test Series & Rank Analytics
          </h1>
          <p className="mt-4 text-base text-slate-600 max-w-2xl mx-auto">
            Evaluate your exam readiness with authentic NTA/CBSE pattern mock tests, real-time percentiles, chapter-wise weak area analysis, and video solutions.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700"
            >
              <Zap size={16} className="text-yellow-300 fill-yellow-300" /> Start Free Mock Test
            </Link>
            <Link
              href="/batches"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Test Series Cards */}
      <section className="py-16 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'JEE Mains 2026 Full Syllabus Test Series',
              tests: '25 Full Tests + 50 Chapter Tests',
              price: '₹999',
              badge: 'JEE Pattern',
              features: ['Exact NTA Test Interface', 'Detailed Step-by-Step Solutions', 'All India Rank Predictor'],
            },
            {
              title: 'NEET UG 2026 Medical Test Series',
              tests: '30 Full Tests + 60 Unit Tests',
              price: '₹899',
              badge: 'NEET Pattern',
              features: ['NCERT Based Questions', 'Speed vs Accuracy Analytics', 'Video Solutions by Top Faculties'],
            },
            {
              title: 'Class 10th & 12th Board Sample Papers',
              tests: '15 Full Length Sample Papers',
              price: 'Free',
              badge: 'Board Exam',
              features: ['CBSE Official Pattern', 'Marking Scheme Detailed Answer Keys', 'PDF Downloads Included'],
            },
          ].map((ts, i) => (
            <div key={i} className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md transition-all">
              <div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 border border-blue-100">
                  {ts.badge}
                </span>
                <h3 className="mt-4 text-xl font-bold text-slate-900">{ts.title}</h3>
                <p className="mt-1 text-xs text-slate-500 font-medium">{ts.tests}</p>

                <ul className="mt-6 space-y-2 text-xs text-slate-600">
                  {ts.features.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" /> {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xl font-extrabold text-slate-900">{ts.price}</span>
                <Link
                  href="/login"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Enroll Test Series
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
